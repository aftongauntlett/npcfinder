/**
 * Centralized logger with dev-gated output
 * Gates console output based on DEV environment
 * SECURITY: Production logs are sanitized to prevent sensitive data exposure
 */

const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

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
      // Don't include stack trace in production
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
      // In development, log everything
      console.error(...args);
    } else if (isProd) {
      // In production, sanitize sensitive data
      const sanitized = args.map((arg) => sanitizeForProduction(arg));
      console.error("[SANITIZED]", ...sanitized);

      // TODO: Send to external error tracking service (e.g., Sentry)
      // This would replace console.error in production
      // Example: Sentry.captureException(new Error(JSON.stringify(sanitized)));
    }
  },
};
