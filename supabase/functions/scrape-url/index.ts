// @ts-nocheck
/**
 * Supabase Edge Function: scrape-url
 *
 * Extracts metadata from URLs using DOM parsing and meta tags.
 * Supports recipes (JSON-LD + DOM fallback) and general web content.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ScrapedMetadata {
  kind: "generic" | "recipe";
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  author?: string;
  date?: string;
  recipe?: {
    name?: string;
    description?: string;
    ingredients?: string[];
    instructions?: string[];
    prepTime?: string;
    cookTime?: string;
    totalTime?: string;
    servings?: string;
    category?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
      status: 200,
    });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - missing auth header" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        },
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      },
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid token" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        },
      );
    }

    const { url } = await req.json();

    if (!url) {
      throw new Error("URL is required");
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      throw new Error("Invalid URL format");
    }

    // SECURITY: SSRF Protection - Block private IP ranges and localhost
    const hostname = parsedUrl.hostname.toLowerCase();

    // Block localhost variations
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "::1" ||
      hostname.endsWith(".local")
    ) {
      throw new Error("Access to localhost is not allowed");
    }

    // Block private IP ranges (IPv4)
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = hostname.match(ipv4Regex);
    if (ipMatch) {
      const [, a, b, c, d] = ipMatch.map(Number);
      // Check for private IP ranges
      if (
        a === 10 || // 10.0.0.0/8
        (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
        (a === 192 && b === 168) || // 192.168.0.0/16
        (a === 169 && b === 254) || // 169.254.0.0/16 (link-local)
        a === 127 // 127.0.0.0/8 (loopback)
      ) {
        throw new Error("Access to private IP addresses is not allowed");
      }
    }

    // Block cloud metadata endpoints
    const blockedHosts = [
      "169.254.169.254", // AWS, Azure, GCP metadata
      "metadata.google.internal",
      "metadata.azure.internal",
    ];
    if (blockedHosts.includes(hostname)) {
      throw new Error("Access to metadata endpoints is not allowed");
    }

    // Only allow http and https protocols
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("Only HTTP and HTTPS protocols are allowed");
    }

    // Fetch the HTML content with timeout
    // SECURITY: Add 10-second timeout to prevent long-running requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    let html: string;
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; NPCFinder/1.0; +https://npcfinder.com)",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
      }

      html = await response.text();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new Error("Request timeout - URL took too long to respond");
      }
      throw error;
    }

    // Extract metadata using DOM parsing and meta tags
    let metadata: ScrapedMetadata = {
      kind: "generic",
      url,
    };

    // Extract basic metadata from meta tags and title
    metadata = {
      kind: "generic",
      url,
      title: extractMetaTag(html, "og:title") || extractTitle(html),
      description:
        extractMetaTag(html, "og:description") ||
        extractMetaTag(html, "description"),
      image: extractMetaTag(html, "og:image"),
      author: extractMetaTag(html, "author"),
      date: extractMetaTag(html, "article:published_time"),
    };

    // Extract recipe data (JSON-LD schema.org + DOM fallback)
    const recipe = extractRecipe(html);
    const recipeFallback = extractRecipeFallback(html, metadata);
    if (recipe || recipeFallback) {
      metadata.recipe = {
        ...(recipeFallback ?? {}),
        ...(recipe ?? {}),
      };
    }

    // Set the kind discriminant based on what was extracted
    if (metadata.recipe?.name) {
      metadata.kind = "recipe";
    } else {
      metadata.kind = "generic";
    }

    // Ensure minimal baseline is always set
    if (!metadata.title) {
      metadata.title = extractTitle(html) || "Untitled";
    }

    return new Response(JSON.stringify(metadata), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});

// Helper functions
function extractMetaTag(html: string, property: string): string | undefined {
  const patterns = [
    new RegExp(
      `<meta\\s+property=["']${property}["']\\s+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta\\s+name=["']${property}["']\\s+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta\\s+content=["']([^"']+)["']\\s+property=["']${property}["']`,
      "i",
    ),
    new RegExp(
      `<meta\\s+content=["']([^"']+)["']\\s+name=["']${property}["']`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return undefined;
}

function extractTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1]?.trim();
}

function extractRecipe(html: string): ScrapedMetadata["recipe"] | undefined {
  try {
    // Look for JSON-LD script tags with Recipe schema
    const jsonLdMatches = html.matchAll(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    );

    for (const match of jsonLdMatches) {
      try {
        const data = JSON.parse(match[1]);
        const recipeData = Array.isArray(data)
          ? data.find((item) => item["@type"] === "Recipe")
          : data["@type"] === "Recipe"
            ? data
            : null;

        if (recipeData) {
          // Extract category from recipeCategory or recipeCuisine
          let category: string | undefined;
          if (recipeData.recipeCategory) {
            category = Array.isArray(recipeData.recipeCategory)
              ? recipeData.recipeCategory[0]
              : recipeData.recipeCategory;
          } else if (recipeData.recipeCuisine) {
            // Use cuisine as fallback category
            category = Array.isArray(recipeData.recipeCuisine)
              ? recipeData.recipeCuisine[0]
              : recipeData.recipeCuisine;
          }

          return {
            name: recipeData.name || undefined,
            description: recipeData.description || undefined,
            ingredients: Array.isArray(recipeData.recipeIngredient)
              ? recipeData.recipeIngredient
              : undefined,
            instructions: Array.isArray(recipeData.recipeInstructions)
              ? recipeData.recipeInstructions.map((step: any) =>
                  typeof step === "string" ? step : step.text,
                )
              : undefined,
            prepTime: recipeData.prepTime || undefined,
            cookTime: recipeData.cookTime || undefined,
            totalTime: recipeData.totalTime || undefined,
            servings:
              recipeData.recipeYield?.toString() ||
              recipeData.servings?.toString() ||
              undefined,
            category: category,
          };
        }
      } catch {
        // Skip invalid JSON
        continue;
      }
    }
  } catch {
    // No recipe found
  }

  return undefined;
}

function extractRecipeFallback(
  html: string,
  base: Pick<ScrapedMetadata, "title" | "description">,
): ScrapedMetadata["recipe"] | undefined {
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) return undefined;

    const recipe: ScrapedMetadata["recipe"] = {};

    // Name: prefer explicit recipe title nodes; fallback to page title
    const titleEl =
      doc.querySelector(
        '[itemprop="name"], h1[itemprop="headline"], h1.entry-title, h1.recipe-title, h1',
      ) || null;
    const titleText = titleEl?.textContent?.trim();
    recipe.name = titleText || base.title || undefined;

    // Description: common summary containers
    const descEl =
      doc.querySelector(
        '[itemprop="description"], .recipe-summary, .wprm-recipe-summary, .tasty-recipes-description, .entry-content p',
      ) || null;
    const descText = descEl?.textContent?.trim();
    recipe.description = descText || base.description || undefined;

    // Ingredients: Microdata + common plugins
    const ingredientNodes = Array.from(
      doc.querySelectorAll(
        '[itemprop="recipeIngredient"], .wprm-recipe-ingredient, .tasty-recipes-ingredients li, .recipe-ingredients li, .ingredients li',
      ),
    );
    const ingredients = ingredientNodes
      .map((n) => n.textContent?.trim() || "")
      .map((t) => t.replace(/\s+/g, " ").trim())
      .filter((t) => t.length > 0 && t.length < 300);
    if (ingredients.length > 0) recipe.ingredients = ingredients;

    // Instructions: Microdata HowToStep + common plugins
    const instructionNodes = Array.from(
      doc.querySelectorAll(
        '[itemprop="recipeInstructions"] li, [itemprop="recipeInstructions"] [itemprop="text"], [itemprop="step"], .wprm-recipe-instruction-text, .tasty-recipes-instructions li, .recipe-instructions li, .instructions li',
      ),
    );
    const instructions = instructionNodes
      .map((n) => n.textContent?.trim() || "")
      .map((t) => t.replace(/\s+/g, " ").trim())
      .filter((t) => t.length > 0 && t.length < 600);
    if (instructions.length > 0) recipe.instructions = instructions;

    // Basic time/servings: microdata when present
    const prep = doc
      .querySelector('[itemprop="prepTime"]')
      ?.getAttribute("datetime")
      ?.trim();
    const cook = doc
      .querySelector('[itemprop="cookTime"]')
      ?.getAttribute("datetime")
      ?.trim();
    const total = doc
      .querySelector('[itemprop="totalTime"]')
      ?.getAttribute("datetime")
      ?.trim();
    const yieldText = doc
      .querySelector(
        '[itemprop="recipeYield"], [itemprop="yield"], .wprm-recipe-servings',
      )
      ?.textContent?.trim();
    if (prep) recipe.prepTime = prep;
    if (cook) recipe.cookTime = cook;
    if (total) recipe.totalTime = total;
    if (yieldText) recipe.servings = yieldText;

    // Return only if we got something useful
    return Object.values(recipe).some((v) => {
      if (Array.isArray(v)) return v.length > 0;
      return Boolean(v);
    })
      ? recipe
      : undefined;
  } catch (error) {
    console.error("⚠️ Error in recipe fallback extraction:", error);
    return undefined;
  }
}
