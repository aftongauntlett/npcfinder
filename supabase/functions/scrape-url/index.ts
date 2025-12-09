/**
 * Supabase Edge Function: scrape-url
 *
 * Extracts metadata from URLs using DOM parsing and meta tags.
 * Supports job postings (JSON-LD + DOM fallback + Greenhouse JSON API),
 * recipes (JSON-LD), and general web content.
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
  kind: "generic" | "job" | "recipe";
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
    description?: string;
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

    console.log("=== SCRAPE-URL v2.0 - Starting extraction ===");
    console.log("Target URL:", url);

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

    // Special handling for Greenhouse URLs - try JSON API first
    let jsonData: any = null;
    const isGreenhouse =
      url.includes("greenhouse.io") ||
      url.includes("gh_jid=") ||
      url.includes("gh_src=");

    if (isGreenhouse) {
      console.log("[DEBUG] Greenhouse URL detected, trying JSON API");
      try {
        // Try adding .json to the URL path
        const jsonUrl = url.replace(/(\?|$)/, ".json$1");
        console.log(`[DEBUG] Attempting JSON fetch: ${jsonUrl}`);

        const jsonResponse = await fetch(jsonUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; URLMetadataBot/1.0)",
          },
        });

        if (jsonResponse.ok) {
          jsonData = await jsonResponse.json();
          console.log("[DEBUG] Successfully fetched Greenhouse JSON data");
          console.log("[DEBUG] JSON keys:", Object.keys(jsonData));
        } else {
          console.log(
            `[DEBUG] JSON API returned ${jsonResponse.status}, falling back to HTML`
          );
        }
      } catch (jsonError) {
        console.log(
          "[DEBUG] JSON API failed, falling back to HTML:",
          jsonError
        );
      }
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

    console.log("=== Extracting base metadata ===");

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

    // Extract job posting data (JSON-LD schema.org)
    const jobPosting = extractJobPosting(html);
    console.log(
      "[DEBUG] JSON-LD extraction result:",
      jobPosting ? "found" : "not found",
      jobPosting
    );

    if (jobPosting) {
      metadata.jobPosting = jobPosting;
    } else {
      console.log(
        "[DEBUG] Attempting fallback extraction for URL:",
        metadata.url
      );
      // Fallback: try to extract from meta tags and common patterns
      const fallbackJob = extractJobPostingFallback(html, metadata, jsonData);
      console.log(
        "[DEBUG] Fallback extraction result:",
        fallbackJob ? "found" : "not found",
        fallbackJob
      );

      if (fallbackJob) {
        metadata.jobPosting = fallbackJob;
      }
    }

    // Extract recipe data (JSON-LD schema.org)
    const recipe = extractRecipe(html);
    if (recipe) {
      metadata.recipe = recipe;
    }

    // Set the kind discriminant based on what was extracted
    console.log("[DEBUG] Classification check - jobPosting:", {
      exists: !!metadata.jobPosting,
      company: metadata.jobPosting?.company,
      position: metadata.jobPosting?.position,
    });

    if (metadata.jobPosting?.company && metadata.jobPosting?.position) {
      metadata.kind = "job";
      console.log("[DEBUG] Classified as: job");
    } else if (metadata.recipe?.name) {
      metadata.kind = "recipe";
      console.log("[DEBUG] Classified as: recipe");
    } else {
      metadata.kind = "generic";
      console.log("[DEBUG] Classified as: generic - missing required fields");
    }

    // Ensure minimal baseline is always set
    if (!metadata.title) {
      metadata.title = extractTitle(html) || "Untitled";
    }

    // Debug info only in development (L3 - Security)
    const isDev = Deno.env.get("ENVIRONMENT") === "development";

    if (isDev) {
      const debugInfo = {
        version: "2.0",
        jsonLdFound:
          html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>/gi)
            ?.length || 0,
        hasJobPosting: !!metadata.jobPosting,
        jobPostingData: metadata.jobPosting,
        classificationReason:
          metadata.jobPosting?.company && metadata.jobPosting?.position
            ? "has company and position"
            : `missing ${!metadata.jobPosting?.company ? "company" : ""}${
                !metadata.jobPosting?.company && !metadata.jobPosting?.position
                  ? " and "
                  : ""
              }${!metadata.jobPosting?.position ? "position" : ""}`,
      };
      console.log("[DEBUG] Final response:", {
        kind: metadata.kind,
        debugInfo,
      });

      return new Response(JSON.stringify({ ...metadata, _debug: debugInfo }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Production response without debug info
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

    const matches = Array.from(jsonLdMatches);
    console.log(`[DEBUG] Found ${matches.length} JSON-LD script tags`);

    for (const match of matches) {
      try {
        const data = JSON.parse(match[1]);

        // Find all JobPosting objects by traversing the structure
        const jobPostings = findJobPostings(data);

        if (jobPostings.length > 0) {
          // Use the first job posting found
          const jobData = jobPostings[0];

          // Extract company (handle both object and string forms)
          let company: string | undefined;
          if (jobData.hiringOrganization) {
            if (typeof jobData.hiringOrganization === "string") {
              company = jobData.hiringOrganization;
            } else if (jobData.hiringOrganization.name) {
              company = jobData.hiringOrganization.name;
            }
          }

          // Extract location (handle multiple schemas)
          let location: string | undefined;
          if (jobData.jobLocation) {
            location = extractLocation(jobData.jobLocation);
          } else if (jobData.applicantLocationRequirements) {
            location = extractLocation(jobData.applicantLocationRequirements);
          }

          // Extract salary (handle MonetaryAmount and MonetaryAmountDistribution)
          let salary: string | undefined;
          if (jobData.baseSalary) {
            salary = extractSalary(jobData.baseSalary);
          }

          // Extract employment type (handle array or string)
          let employmentType: string | undefined;
          if (jobData.employmentType) {
            const validTypes = [
              "Full-time",
              "Part-time",
              "Contract",
              "Temporary",
              "Internship",
              "FULL_TIME",
              "PART_TIME",
              "CONTRACT",
              "TEMPORARY",
              "INTERN",
            ];
            const typeMap: Record<string, string> = {
              FULL_TIME: "Full-time",
              PART_TIME: "Part-time",
              CONTRACT: "Contract",
              TEMPORARY: "Temporary",
              INTERN: "Internship",
            };

            if (Array.isArray(jobData.employmentType)) {
              const mapped = jobData.employmentType
                .map(
                  (t: string) =>
                    typeMap[t] || (validTypes.includes(t) ? t : null)
                )
                .filter(Boolean);
              employmentType =
                mapped.length > 0 ? mapped.join(", ") : undefined;
            } else {
              const mapped = typeMap[jobData.employmentType];
              employmentType =
                mapped ||
                (validTypes.includes(jobData.employmentType)
                  ? jobData.employmentType
                  : undefined);
            }
          }

          return {
            company,
            position: jobData.title || undefined,
            salary,
            location,
            employmentType,
          };
        }
      } catch (e) {
        // Skip invalid JSON
        console.error("⚠️ Failed to parse JSON-LD:", e);
        continue;
      }
    }
  } catch (e) {
    console.error("⚠️ Error in extractJobPosting:", e);
  }

  return undefined;
}

/**
 * Recursively find all JobPosting objects in a JSON-LD structure
 * Handles @graph arrays, nested objects, and multi-type schemas
 */
function findJobPostings(data: any): any[] {
  const results: any[] = [];
  const queue = [data];
  let itemsProcessed = 0;

  while (queue.length > 0) {
    const current = queue.shift();
    itemsProcessed++;

    if (!current || typeof current !== "object") {
      continue;
    }

    // Check if this object is a JobPosting
    if (isJobPosting(current)) {
      console.log("[DEBUG] Found JobPosting object:", current["@type"]);
      results.push(current);
    }

    // Handle @graph array
    if (current["@graph"] && Array.isArray(current["@graph"])) {
      queue.push(...current["@graph"]);
    }

    // Traverse arrays
    if (Array.isArray(current)) {
      queue.push(...current);
    } else {
      // Traverse object properties
      for (const key in current) {
        if (typeof current[key] === "object" && current[key] !== null) {
          queue.push(current[key]);
        }
      }
    }
  }

  console.log(
    `[DEBUG] findJobPostings processed ${itemsProcessed} items, found ${results.length} JobPosting(s)`
  );
  return results;
}

/**
 * Check if an object has @type of JobPosting (handles string or array)
 */
function isJobPosting(obj: any): boolean {
  if (!obj || typeof obj !== "object") {
    return false;
  }

  const type = obj["@type"];
  if (!type) {
    return false;
  }

  if (typeof type === "string") {
    return type === "JobPosting";
  }

  if (Array.isArray(type)) {
    return type.includes("JobPosting");
  }

  return false;
}

/**
 * Extract location from various JobPosting location schemas
 */
function extractLocation(locationData: any): string | undefined {
  if (!locationData) {
    return undefined;
  }

  // Handle array of locations
  if (Array.isArray(locationData)) {
    locationData = locationData[0];
  }

  // Handle string
  if (typeof locationData === "string") {
    return locationData;
  }

  // Handle Place or PostalAddress object
  if (locationData.address) {
    const addr = locationData.address;
    if (typeof addr === "string") {
      return addr;
    }

    // Build location from address components
    const parts: string[] = [];
    if (addr.addressLocality) parts.push(addr.addressLocality);
    if (addr.addressRegion) parts.push(addr.addressRegion);
    if (addr.addressCountry) parts.push(addr.addressCountry);

    if (parts.length > 0) {
      return parts.join(", ");
    }
  }

  // Handle name property
  if (locationData.name) {
    return locationData.name;
  }

  return undefined;
}

/**
 * Extract and format salary from MonetaryAmount or MonetaryAmountDistribution
 */
function extractSalary(salaryData: any): string | undefined {
  if (!salaryData) {
    return undefined;
  }

  // Ensure we always return a string, never an object
  try {
    // If salaryData is already a string, return it
    if (typeof salaryData === "string") {
      return salaryData;
    }

    // Handle simple value
    if (salaryData.value) {
      const currency = salaryData.currency || "$";
      const unit = salaryData.unitText || "";
      return `${currency}${salaryData.value}${unit ? " " + unit : ""}`;
    }

    // Handle min/max range
    if (salaryData.minValue && salaryData.maxValue) {
      const currency = salaryData.currency || "$";
      const unit = salaryData.unitText || "";
      return `${currency}${salaryData.minValue} - ${currency}${
        salaryData.maxValue
      }${unit ? " " + unit : ""}`;
    }

    // Handle just minValue or maxValue
    if (salaryData.minValue) {
      const currency = salaryData.currency || "$";
      return `${currency}${salaryData.minValue}+`;
    }

    if (salaryData.maxValue) {
      const currency = salaryData.currency || "$";
      return `Up to ${currency}${salaryData.maxValue}`;
    }

    return undefined;
  } catch (error) {
    console.error("Error extracting salary:", error);
    return undefined;
  }
}

function extractJobPostingFallback(
  html: string,
  metadata: ScrapedMetadata,
  jsonData?: any
): ScrapedMetadata["jobPosting"] | undefined {
  // Try to extract job info from common patterns
  const jobPosting: ScrapedMetadata["jobPosting"] = {};
  const url = metadata.url || "";

  console.log(`[DEBUG] Fallback extraction for URL: ${url}`);

  // Site-specific extraction patterns
  if (url.includes("linkedin.com/jobs")) {
    console.log("[DEBUG] Using LinkedIn extractor");
    return extractLinkedInJob(html, metadata);
  } else if (url.includes("indeed.com")) {
    console.log("[DEBUG] Using Indeed extractor");
    return extractIndeedJob(html, metadata);
  } else if (
    url.includes("greenhouse.io") ||
    url.includes("gh_jid=") ||
    url.includes("gh_src=")
  ) {
    console.log("[DEBUG] Using Greenhouse extractor");
    return extractGreenhouseJob(html, metadata, jsonData);
  } else if (url.includes("lever.co")) {
    console.log("[DEBUG] Using Lever extractor");
    return extractLeverJob(html, metadata);
  } else if (
    url.includes("workatastartup.com") ||
    url.includes("ycombinator.com")
  ) {
    console.log("[DEBUG] Using Y Combinator/Work at a Startup extractor");
    return extractYCombinatorJob(html, metadata);
  }

  console.log("[DEBUG] Using generic fallback patterns");

  // Generic extraction patterns (improved)

  // Extract company - multiple strategies
  if (!jobPosting.company) {
    const companyPatterns = [
      // "Position at Company" or "Position | Company"
      /(?:at|@)\s+([A-Z][A-Za-z0-9\s&,.'-]+?)(?:\s*[-|•]|\s*$)/i,
      // "Company is hiring" or "Join Company"
      /(?:join|hiring at)\s+([A-Z][A-Za-z0-9\s&,.'-]+)/i,
      // Meta tag og:site_name often has company
      /<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i,
      // Hiring Organization in visible text
      /hiring organization[:\s]+([A-Z][A-Za-z0-9\s&,.'-]+?)(?:\s*[<•|]|\s*$)/i,
    ];

    for (const pattern of companyPatterns) {
      const match = (metadata.title || html).match(pattern);
      if (match?.[1] && match[1].length > 1 && match[1].length < 100) {
        jobPosting.company = match[1].trim();
        break;
      }
    }
  }

  // Extract position - look in title and description
  if (!jobPosting.position) {
    const positionPatterns = [
      // First part before " at ", " - ", " | "
      /^([^-|@]+?)(?:\s*(?:[-|@]|at\s))/i,
      // "Apply for Position"
      /apply\s+for\s+([^-|•]+?)(?:\s*[-|•]|\s*$)/i,
      // Job title meta tag
      /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i,
    ];

    for (const pattern of positionPatterns) {
      const match = (metadata.title || "").match(pattern);
      if (match?.[1] && match[1].length > 2 && match[1].length < 150) {
        let position = match[1].trim();
        // Remove common prefixes
        position = position.replace(/^(job|position|role)[:\s]+/i, "");
        jobPosting.position = position;
        break;
      }
    }
  }

  // Extract location - look in multiple places
  if (!jobPosting.location) {
    const locationPatterns = [
      // Explicit location label
      /(?:location|based in|office)[:\s]+([A-Z][A-Za-z\s,.-]+?)(?:\s*[•|<]|\s*\n|\s*$)/i,
      // City, State format (US)
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2})\b/,
      // City, Country format
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z][a-z]+)\b/,
      // Remote/Hybrid indicators
      /(Remote|Hybrid|On-site)(?:\s*[-–]\s*)?([A-Z][a-z]+(?:,\s*[A-Z]{2})?)?/i,
    ];

    for (const pattern of locationPatterns) {
      const match = (metadata.description || html).match(pattern);
      if (match?.[1]) {
        let location = match[1].trim();
        if (match[2]) location = `${match[1]} - ${match[2]}`;
        jobPosting.location = location;
        break;
      }
    }
  }

  // Extract salary range - multiple formats
  if (!jobPosting.salary) {
    const salaryPatterns = [
      // $100,000 - $150,000 or $100k - $150k
      /\$[\d,]+k?\s*[-–to]+\s*\$[\d,]+k?(?:\s*(?:per year|annually|\/yr))?/i,
      // $50/hour or $50-$75/hr
      /\$\d+(?:\.\d{2})?\s*(?:[-–]\s*\$\d+(?:\.\d{2})?)?\s*(?:per|\/)\s*(?:hour|hr)/i,
      // Explicit salary range label
      /(?:salary|compensation|pay)[:\s]+\$[\d,]+k?\s*[-–to]+\s*\$[\d,]+k?/i,
    ];

    for (const pattern of salaryPatterns) {
      const match = (metadata.description || html).match(pattern);
      if (match?.[0]) {
        jobPosting.salary = match[0].trim();
        break;
      }
    }
  }

  // Extract employment type
  if (!jobPosting.employmentType) {
    const typePatterns = [
      /(Full[- ]time|Part[- ]time|Contract|Temporary|Internship|Freelance)/i,
      /employment type[:\s]+([A-Za-z\s-]+?)(?:\s*[•|<]|\s*\n)/i,
    ];

    for (const pattern of typePatterns) {
      const match = (metadata.description || html).match(pattern);
      if (match?.[1]) {
        jobPosting.employmentType = match[1].trim();
        break;
      }
    }
  }

  // Return partial results if we found anything useful
  if (
    jobPosting.position ||
    jobPosting.company ||
    jobPosting.location ||
    jobPosting.salary
  ) {
    return jobPosting;
  }

  return undefined;
}

// Site-specific extractors
function extractLinkedInJob(
  html: string,
  metadata: ScrapedMetadata
): ScrapedMetadata["jobPosting"] | undefined {
  const jobPosting: ScrapedMetadata["jobPosting"] = {};

  // LinkedIn format: "Position - Company | LinkedIn"
  const titleMatch = metadata.title?.match(/^(.+?)\s*[-–]\s*(.+?)\s*[|\u2022]/);
  if (titleMatch) {
    jobPosting.position = titleMatch[1].trim();
    jobPosting.company = titleMatch[2].trim();
  }

  // Location often in description
  const locationMatch = html.match(
    /<span[^>]*class="[^"]*location[^"]*"[^>]*>([^<]+)<\/span>/i
  );
  if (locationMatch) {
    jobPosting.location = locationMatch[1].trim();
  }

  return Object.keys(jobPosting).length > 0 ? jobPosting : undefined;
}

function extractIndeedJob(
  html: string,
  metadata: ScrapedMetadata
): ScrapedMetadata["jobPosting"] | undefined {
  const jobPosting: ScrapedMetadata["jobPosting"] = {};

  // Indeed format varies, often "Position - Company - Location"
  const titleMatch = metadata.title?.match(
    /^(.+?)\s*[-–]\s*(.+?)\s*[-–]\s*(.+?)(?:\s*[-|]|$)/
  );
  if (titleMatch) {
    jobPosting.position = titleMatch[1].trim();
    jobPosting.company = titleMatch[2].trim();
    jobPosting.location = titleMatch[3].trim();
  }

  // Salary in Indeed's metadata
  const salaryMatch = html.match(
    /<div[^>]*class="[^"]*salary[^"]*"[^>]*>([^<]+)<\/div>/i
  );
  if (salaryMatch) {
    jobPosting.salary = salaryMatch[1].trim();
  }

  return Object.keys(jobPosting).length > 0 ? jobPosting : undefined;
}

function extractGreenhouseJob(
  html: string,
  metadata: ScrapedMetadata,
  jsonData?: any
): ScrapedMetadata["jobPosting"] | undefined {
  const jobPosting: ScrapedMetadata["jobPosting"] = {};
  console.log("[DEBUG] Starting Greenhouse DOM extraction");

  // First, try to use JSON API data if available
  if (jsonData) {
    console.log("[DEBUG] Using Greenhouse JSON API data", jsonData);

    if (jsonData.title) {
      jobPosting.position = jsonData.title;
      console.log(`[DEBUG] Position from JSON: ${jobPosting.position}`);
    }

    if (jsonData.location?.name) {
      jobPosting.location = jsonData.location.name;
      console.log(`[DEBUG] Location from JSON: ${jobPosting.location}`);
    }

    // Extract employment type and map to readable format
    if (jsonData.metadata) {
      for (const meta of jsonData.metadata) {
        if (meta.name === "Employment Type" && meta.value) {
          // Map Greenhouse employment types to readable format
          const typeMap: Record<string, string> = {
            FULL_TIME: "Full-time",
            PART_TIME: "Part-time",
            CONTRACT: "Contract",
            TEMPORARY: "Temporary",
            INTERN: "Internship",
          };
          const mappedType = typeMap[meta.value];
          if (mappedType) {
            jobPosting.employmentType = mappedType;
            console.log(
              `[DEBUG] Employment type from JSON: ${jobPosting.employmentType}`
            );
          }
          // Don't set employmentType if value is not in map
        }
      }
    }

    // Greenhouse sometimes includes content in JSON
    if (jsonData.content) {
      // Strip HTML tags from content for description
      const contentText = jsonData.content
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      // Take first ~500 chars
      jobPosting.description = contentText.substring(0, 500).trim();
      if (contentText.length > 500) jobPosting.description += "...";
      console.log(
        `[DEBUG] Description from JSON (${jobPosting.description?.length} chars)`
      );
    }
  }
  try {
    // Parse HTML with DOM
    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) {
      console.error("⚠️ Failed to parse HTML for Greenhouse job");
      return undefined;
    }
    console.log("[DEBUG] HTML parsed successfully");

    // Extract company from URL path (e.g., job-boards.greenhouse.io/COMPANY/jobs/...)
    const url = metadata.url || "";
    console.log(`[DEBUG] Extracting company from URL: ${url}`);
    const urlCompanyMatch = url.match(/greenhouse\.io\/([^\/]+)\/jobs/i);
    if (urlCompanyMatch) {
      console.log(`[DEBUG] Found company slug in URL: ${urlCompanyMatch[1]}`);
      // Convert URL slug to proper company name
      let company = urlCompanyMatch[1];

      // Handle common patterns:
      // energyhub -> EnergyHub, stripe -> Stripe, mongodb -> MongoDB
      const knownCompanies: Record<string, string> = {
        energyhub: "EnergyHub",
        mongodb: "MongoDB",
        stripe: "Stripe",
        github: "GitHub",
        gitlab: "GitLab",
        datadog: "Datadog",
        shopify: "Shopify",
      };

      company =
        knownCompanies[company.toLowerCase()] ||
        company.charAt(0).toUpperCase() + company.slice(1);

      jobPosting.company = company;
    }

    // Fallback: Try to extract company from header or semantic markers
    if (!jobPosting.company) {
      // Look for common header patterns
      const headerElement = doc.querySelector(
        "#header span, header .company-name, .employer-name"
      );
      if (headerElement?.textContent) {
        jobPosting.company = headerElement.textContent.trim();
      }
    }

    // Extract position from semantic HTML hierarchy
    // Priority: h1 near application form > any h1 with job title characteristics
    console.log(`[DEBUG] Searching for position in h1 elements`);
    if (!jobPosting.position) {
      // Try to find h1 elements and filter for likely job titles
      const h1Elements = doc.querySelectorAll("h1");
      console.log(`[DEBUG] Found ${h1Elements.length} h1 elements`);

      for (const h1 of h1Elements) {
        const text = h1.textContent?.trim() || "";

        // Skip navigation/header elements
        if (
          text.length > 3 &&
          text.length < 100 &&
          !text.toLowerCase().includes("search") &&
          !text.toLowerCase().includes("menu") &&
          !text.toLowerCase().includes("navigation") &&
          !text.toLowerCase().includes("greenhouse")
        ) {
          jobPosting.position = text;
          break;
        }
      }
    }

    // Fallback to metadata title if still not found
    if (!jobPosting.position && metadata.title) {
      const title = metadata.title.trim();
      if (
        !title.includes("Greenhouse") &&
        !title.includes("|") &&
        title.length > 2 &&
        title.length < 100
      ) {
        jobPosting.position = title;
      }
    }

    // Extract location using semantic markers
    if (!jobPosting.location) {
      // Look for location elements (common class names and semantic patterns)
      const locationElement = doc.querySelector(
        ".location, [class*='location'], [class*='office'], .job-location"
      );

      if (locationElement?.textContent) {
        jobPosting.location = locationElement.textContent.trim();
      } else {
        // Look for text patterns near "Apply" button or in heading area
        const bodyText = doc.body?.textContent || "";
        const remoteMatch = bodyText.match(/\b(Remote\s*-\s*[A-Z]{2})\b/i);
        if (remoteMatch) {
          jobPosting.location = remoteMatch[1].trim();
        } else {
          // Try to find City, State format
          const locationMatch = bodyText.match(
            /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2})\b/
          );
          if (locationMatch) {
            jobPosting.location = locationMatch[1].trim();
          }
        }
      }
    }

    // Extract salary range
    // Look for common salary patterns like "$100k - $150k" or "$140,000 - $200,000 USD"
    console.log("[DEBUG] Searching for salary information");
    const bodyText = doc.body?.textContent || "";

    // Pattern 1: Typical salary range with currency symbol
    const salaryPattern1 =
      /\$[\d,]+(?:k|,000)?\s*[-–—]\s*\$[\d,]+(?:k|,000)?\s*(?:USD)?/gi;
    const salaryMatches = bodyText.match(salaryPattern1);

    if (salaryMatches && salaryMatches.length > 0) {
      // Take the first match (usually the main salary range)
      jobPosting.salary = salaryMatches[0].trim();
      console.log(`[DEBUG] Found salary range: ${jobPosting.salary}`);
    }

    // Extract job description
    // Greenhouse typically has content in a main content area or #content div
    console.log("[DEBUG] Extracting job description");
    const contentElement = doc.querySelector(
      "#content, .content, [class*='job-description'], [class*='description'], main"
    );

    if (contentElement) {
      // Get all paragraph text, filtering out very short paragraphs
      const paragraphs = Array.from(contentElement.querySelectorAll("p, li"))
        .map((el) => el.textContent?.trim() || "")
        .filter((text) => text.length > 20); // Filter out short fragments

      if (paragraphs.length > 0) {
        // Take first 3-5 paragraphs or ~500 chars, whichever comes first
        let description = "";
        for (const p of paragraphs.slice(0, 5)) {
          if (description.length + p.length > 500) break;
          description += p + "\n\n";
        }

        jobPosting.description = description.trim();
        console.log(
          `[DEBUG] Extracted description (${jobPosting.description.length} chars)`
        );
      }
    }

    console.log("[DEBUG] Greenhouse extraction complete:", {
      company: jobPosting.company,
      position: jobPosting.position,
      location: jobPosting.location,
      hasData: Object.keys(jobPosting).length > 0,
    });

    return Object.keys(jobPosting).length > 0 ? jobPosting : undefined;
  } catch (error) {
    console.error("⚠️ Error in Greenhouse DOM extraction:", error);
    return undefined;
  }
}

function extractLeverJob(
  html: string,
  metadata: ScrapedMetadata
): ScrapedMetadata["jobPosting"] | undefined {
  const jobPosting: ScrapedMetadata["jobPosting"] = {};

  // Lever format: Position at Company
  const titleMatch = metadata.title?.match(/^(.+?)\s+at\s+(.+?)(?:\s*[-|]|$)/i);
  if (titleMatch) {
    jobPosting.position = titleMatch[1].trim();
    jobPosting.company = titleMatch[2].trim();
  }

  const locationMatch = html.match(
    /<div[^>]*class="location"[^>]*>([^<]+)<\/div>/i
  );
  if (locationMatch) {
    jobPosting.location = locationMatch[1].trim();
  }

  return Object.keys(jobPosting).length > 0 ? jobPosting : undefined;
}

function extractYCombinatorJob(
  html: string,
  metadata: ScrapedMetadata
): ScrapedMetadata["jobPosting"] | undefined {
  const jobPosting: ScrapedMetadata["jobPosting"] = {};

  try {
    const doc = new DOMParser().parseFromString(html, "text/html");

    // Extract company from title (format: "Position at Company | Work at a Startup")
    const titleMatch = metadata.title?.match(
      /^(.+?)\s+at\s+(.+?)\s*[|\u2022]/i
    );
    if (titleMatch) {
      jobPosting.position = titleMatch[1].trim();
      jobPosting.company = titleMatch[2].trim();
    }

    // Extract salary - YC often has salary in a specific div
    const salaryElement = doc.querySelector(
      '[class*="salary"], [class*="compensation"]'
    );
    if (salaryElement?.textContent) {
      jobPosting.salary = salaryElement.textContent.trim();
    }

    // Extract location
    const locationElement = doc.querySelector('[class*="location"]');
    if (locationElement?.textContent) {
      jobPosting.location = locationElement.textContent.trim();
    }

    // Extract description - YC uses specific class names
    const descElement = doc.querySelector(
      '[class*="description"], [class*="job-description"], .prose'
    );
    if (descElement) {
      const paragraphs = Array.from(descElement.querySelectorAll("p"))
        .map((p) => p.textContent?.trim() || "")
        .filter((text) => text.length > 20);

      if (paragraphs.length > 0) {
        let description = "";
        for (const p of paragraphs.slice(0, 5)) {
          if (description.length + p.length > 500) break;
          description += p + "\n\n";
        }
        jobPosting.description = description.trim();
      }
    }

    return Object.keys(jobPosting).length > 0 ? jobPosting : undefined;
  } catch (error) {
    console.error("⚠️ Error in YC job extraction:", error);
    return undefined;
  }
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
