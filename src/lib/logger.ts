/**
 * Centralized logger with dev-gated output
 * Gates console output based on DEV environment
 * SECURITY (M4): Production logs sent to Sentry instead of console
 * to prevent information disclosure via browser console
 */

import * as Sentry from "@sentry/react";

const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

// Initialize Sentry in production
if (isProd && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: "production",
    // Sample 10% of transactions for performance monitoring
    tracesSampleRate: 0.1,
    // Don't capture breadcrumbs with sensitive data
    beforeBreadcrumb(breadcrumb) {
      // Filter out console breadcrumbs to avoid sensitive data
      if (breadcrumb.category === "console") {
        return null;
      }
      return breadcrumb;
    },
    // Additional sanitization before sending to Sentry
    beforeSend(event, _hint) {
      const sanitized = sanitizeForProduction(event);
      return sanitized as Sentry.ErrorEvent;
    },
  });
}

/**
 * Sanitize data for production logging
 * Removes sensitive fields like user_id, email, token, password, etc.
 */
function sanitizeForProduction(arg: unknown): unknown {
  if (arg === null || arg === undefined) {
    return arg;
  }

  if (typeof arg === "string") {
    // Redact email patterns
    return arg.replace(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      "[REDACTED_EMAIL]"
    );
  }

  if (arg instanceof Error) {
    return {
      name: arg.name,
      message: arg.message,
      // Stack trace is included by Sentry but not logged to console
    };
  }

  if (typeof arg === "object") {
    const obj = arg as Record<string, unknown>;
    const sanitized: Record<string, unknown> = {};

    // List of sensitive field names to remove
    const sensitiveFields = [
      "user_id",
      "userId",
      "email",
      "token",
      "password",
      "passwordHash",
      "session",
      "sessionToken",
      "refreshToken",
      "accessToken",
      "apiKey",
      "secret",
      "privateKey",
      "credential",
      "authorization",
      "cookie",
    ];

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (
        sensitiveFields.some((field) => lowerKey.includes(field.toLowerCase()))
      ) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = sanitizeForProduction(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  return arg;
}

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },

  info: (...args: unknown[]) => {
    if (isDev) {
      console.info(...args);
    }
  },

  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  error: (...args: unknown[]) => {
    if (isDev) {
      // In development, log everything to console
      console.error(...args);
    } else if (isProd) {
      // In production, sanitize and send to Sentry
      const sanitized = args.map((arg) => sanitizeForProduction(arg));

      // Send to Sentry if configured
      if (import.meta.env.VITE_SENTRY_DSN) {
        // Create error object from arguments
        const errorMessage =
          sanitized
            .map((arg) =>
              typeof arg === "object" ? JSON.stringify(arg) : String(arg)
            )
            .join(" ") || "Unknown error";

        Sentry.captureException(new Error(errorMessage), {
          contexts: {
            sanitizedArgs: {
              args: sanitized,
            },
          },
        });
      } else {
        // Fallback to console if Sentry not configured
        // This ensures errors are not completely lost
        console.error("[SANITIZED]", ...sanitized);
      }
    }
  },
};
