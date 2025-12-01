/**
 * Supabase Edge Function: scrape-url
 *
 * Extracts metadata from URLs using metascraper
 * Supports job postings, recipes, and general web content
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ScrapedMetadata {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  author?: string;
  date?: string;
  jobPosting?: {
    company?: string;
    position?: string;
    salary?: string;
    location?: string;
    employmentType?: string;
  };
  recipe?: {
    name?: string;
    description?: string;
    ingredients?: string[];
    instructions?: string[];
    prepTime?: string;
    cookTime?: string;
    totalTime?: string;
    servings?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
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
        }
      );
    }

    const { url } = await req.json();

    if (!url) {
      throw new Error("URL is required");
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      throw new Error("Invalid URL format");
    }

    // Fetch the HTML content
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; NPCFinder/1.0; +https://npcfinder.com)",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();

    // Extract metadata using simple regex patterns for now
    // In production, you'd use a proper HTML parser
    const metadata: ScrapedMetadata = {
      url,
      title: extractMetaTag(html, "og:title") || extractTitle(html),
      description:
        extractMetaTag(html, "og:description") ||
        extractMetaTag(html, "description"),
      image: extractMetaTag(html, "og:image"),
      author: extractMetaTag(html, "author"),
      date: extractMetaTag(html, "article:published_time"),
    };

    // Extract job posting data (JSON-LD schema.org)
    const jobPosting = extractJobPosting(html);
    if (jobPosting) {
      console.log("Found job posting via JSON-LD:", jobPosting);
      metadata.jobPosting = jobPosting;
    } else {
      // Fallback: try to extract from meta tags and common patterns
      const fallbackJob = extractJobPostingFallback(html, metadata);
      if (fallbackJob) {
        console.log("Found job posting via fallback:", fallbackJob);
        metadata.jobPosting = fallbackJob;
      }
    }

    // Extract recipe data (JSON-LD schema.org)
    const recipe = extractRecipe(html);
    if (recipe) {
      metadata.recipe = recipe;
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
      }
    );
  }
});

// Helper functions
function extractMetaTag(html: string, property: string): string | undefined {
  const patterns = [
    new RegExp(
      `<meta\\s+property=["']${property}["']\\s+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta\\s+name=["']${property}["']\\s+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta\\s+content=["']([^"']+)["']\\s+property=["']${property}["']`,
      "i"
    ),
    new RegExp(
      `<meta\\s+content=["']([^"']+)["']\\s+name=["']${property}["']`,
      "i"
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

function extractJobPosting(
  html: string
): ScrapedMetadata["jobPosting"] | undefined {
  try {
    // Look for JSON-LD script tags with JobPosting schema
    const jsonLdMatches = html.matchAll(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    );

    for (const match of jsonLdMatches) {
      try {
        const data = JSON.parse(match[1]);
        const jobData = Array.isArray(data)
          ? data.find((item) => item["@type"] === "JobPosting")
          : data["@type"] === "JobPosting"
          ? data
          : null;

        if (jobData) {
          return {
            company:
              jobData.hiringOrganization?.name ||
              jobData.hiringOrganization ||
              undefined,
            position: jobData.title || undefined,
            salary:
              jobData.baseSalary?.value ||
              (jobData.baseSalary?.minValue && jobData.baseSalary?.maxValue)
                ? `${jobData.baseSalary.minValue} - ${jobData.baseSalary.maxValue}`
                : undefined,
            location:
              jobData.jobLocation?.address?.addressLocality ||
              jobData.jobLocation?.address ||
              jobData.jobLocation ||
              undefined,
            employmentType: jobData.employmentType || undefined,
          };
        }
      } catch {
        // Skip invalid JSON
        continue;
      }
    }
  } catch {
    // No job posting found
  }

  return undefined;
}

function extractJobPostingFallback(
  html: string,
  metadata: ScrapedMetadata
): ScrapedMetadata["jobPosting"] | undefined {
  // Try to extract job info from common patterns
  const jobPosting: ScrapedMetadata["jobPosting"] = {};

  // Extract company from meta tags or title
  const companyPatterns = [
    /at\s+([A-Z][A-Za-z0-9\s&,.]+?)(?:\s*[-|]|\s*$)/,
    /hiring.*?at\s+([A-Z][A-Za-z0-9\s&,.]+)/i,
  ];

  for (const pattern of companyPatterns) {
    const match = metadata.title?.match(pattern);
    if (match?.[1]) {
      jobPosting.company = match[1].trim();
      break;
    }
  }

  // Extract position from title (usually the first part before " at " or " - ")
  const positionMatch = metadata.title?.match(/^([^-|]+?)(?:\s*[-|at])/);
  if (positionMatch?.[1]) {
    jobPosting.position = positionMatch[1].trim();
  }

  // Extract location from description or common patterns
  const locationPatterns = [
    /location[:\s]+([A-Z][A-Za-z\s,]+?)(?:\s*[•|]|\s*$)/i,
    /([A-Z][a-z]+,\s*[A-Z]{2})/, // City, ST format
    /([A-Z][a-z]+\s+[A-Z][a-z]+,\s*[A-Z]{2})/, // City Name, ST
  ];

  for (const pattern of locationPatterns) {
    const match = metadata.description?.match(pattern);
    if (match?.[1]) {
      jobPosting.location = match[1].trim();
      break;
    }
  }

  // Extract salary range
  const salaryPattern = /\$[\d,]+k?\s*[-–to]\s*\$[\d,]+k?/i;
  const salaryMatch = (metadata.description || html).match(salaryPattern);
  if (salaryMatch) {
    jobPosting.salary = salaryMatch[0];
  }

  // Return only if we found at least position or company
  if (jobPosting.position || jobPosting.company) {
    return jobPosting;
  }

  return undefined;
}

function extractRecipe(html: string): ScrapedMetadata["recipe"] | undefined {
  try {
    // Look for JSON-LD script tags with Recipe schema
    const jsonLdMatches = html.matchAll(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
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
          return {
            name: recipeData.name || undefined,
            description: recipeData.description || undefined,
            ingredients: Array.isArray(recipeData.recipeIngredient)
              ? recipeData.recipeIngredient
              : undefined,
            instructions: Array.isArray(recipeData.recipeInstructions)
              ? recipeData.recipeInstructions.map((step: any) =>
                  typeof step === "string" ? step : step.text
                )
              : undefined,
            prepTime: recipeData.prepTime || undefined,
            cookTime: recipeData.cookTime || undefined,
            totalTime: recipeData.totalTime || undefined,
            servings:
              recipeData.recipeYield?.toString() ||
              recipeData.servings?.toString() ||
              undefined,
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
