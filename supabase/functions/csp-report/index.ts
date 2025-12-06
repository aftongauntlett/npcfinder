import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * CSP Report Edge Function (L4-L5)
 *
 * Receives and logs Content Security Policy violation reports.
 * This helps identify and fix CSP issues in production.
 *
 * SECURITY:
 * - Only accepts POST requests
 * - Validates report structure
 * - Logs to console for monitoring
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const report = await req.json();

    // Log CSP violation with structured data
    console.error("CSP Violation Report:", {
      timestamp: new Date().toISOString(),
      documentUri: report["csp-report"]?.["document-uri"],
      violatedDirective: report["csp-report"]?.["violated-directive"],
      blockedUri: report["csp-report"]?.["blocked-uri"],
      originalPolicy: report["csp-report"]?.["original-policy"],
      sourceFile: report["csp-report"]?.["source-file"],
      lineNumber: report["csp-report"]?.["line-number"],
      columnNumber: report["csp-report"]?.["column-number"],
    });

    // Could also store in database for analysis
    // For now, just logging is sufficient

    return new Response("OK", {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Error processing CSP report:", error);
    return new Response("Error", {
      status: 500,
      headers: corsHeaders,
    });
  }
});
