/**
 * Utilities for parsing imported media lists from various formats
 */

export interface ParseResult {
  titles: string[];
  errors: string[];
}

/**
 * Parses text content into an array of titles
 * Supports multiple formats:
 * - Line-separated (.txt)
 * - Comma-separated (.csv)
 * - JSON array (.json)
 */
export function parseImportData(
  content: string,
  filename: string
): ParseResult {
  const errors: string[] = [];
  let titles: string[] = [];

  try {
    // Remove BOM if present
    const cleanContent = content.replace(/^\uFEFF/, "").trim();

    if (!cleanContent) {
      errors.push("File is empty");
      return { titles: [], errors };
    }

    // Detect format based on filename or content
    if (filename.endsWith(".json")) {
      titles = parseJSON(cleanContent, errors);
    } else if (filename.endsWith(".csv")) {
      titles = parseCSV(cleanContent);
    } else {
      // Default to line-separated for .txt or unknown formats
      titles = parseLineSeparated(cleanContent);
    }

    // Clean up titles
    titles = titles
      .map((title) => title.trim())
      .filter((title) => title.length > 0)
      .filter((title) => {
        // Remove titles that are just numbers or special characters
        if (/^[\d\s\-_.,;:!?]+$/.test(title)) {
          errors.push(`Skipped invalid title: "${title}"`);
          return false;
        }
        return true;
      });

    // Remove duplicates
    const uniqueTitles = [...new Set(titles)];
    if (uniqueTitles.length < titles.length) {
      errors.push(
        `Removed ${titles.length - uniqueTitles.length} duplicate titles`
      );
    }
    titles = uniqueTitles;

    if (titles.length === 0) {
      errors.push("No valid titles found after parsing");
    }
  } catch (error) {
    errors.push(
      `Failed to parse file: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }

  return { titles, errors };
}

/**
 * Parse JSON format - expects array of strings or objects with title property
 */
function parseJSON(content: string, errors: string[]): string[] {
  const data = JSON.parse(content);

  if (Array.isArray(data)) {
    return data.map((item, index) => {
      if (typeof item === "string") {
        return item;
      } else if (typeof item === "object" && item !== null) {
        // Support various common property names
        const titleKey = ["title", "name", "Title", "Name"].find(
          (key) => key in item
        );
        if (titleKey && typeof item[titleKey] === "string") {
          return item[titleKey];
        }
        errors.push(`Item at index ${index} missing title property`);
        return "";
      }
      errors.push(`Item at index ${index} is not a string or object`);
      return "";
    });
  } else if (typeof data === "object" && data !== null) {
    // Single object - treat as single title
    const titleKey = ["title", "name", "Title", "Name"].find(
      (key) => key in data
    );
    if (titleKey && typeof data[titleKey] === "string") {
      return [data[titleKey]];
    }
  }

  errors.push(
    "JSON format not recognized. Expected array of strings or objects with title property"
  );
  return [];
}

/**
 * Parse CSV format - handles quoted values
 */
function parseCSV(content: string): string[] {
  const titles: string[] = [];

  // Simple CSV parser that handles quotes
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Split by comma, but respect quoted values
    const parts: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < trimmedLine.length; i++) {
      const char = trimmedLine[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        parts.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    if (current) {
      parts.push(current.trim());
    }

    // Add all parts (supports multiple columns, takes all values)
    titles.push(...parts.map((p) => p.replace(/^["']|["']$/g, "")));
  }

  return titles;
}

/**
 * Parse line-separated format (.txt)
 */
function parseLineSeparated(content: string): string[] {
  // Split by newlines, semicolons, or pipes (common separators)
  return content
    .split(/[\n\r;|]+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Validates file before parsing
 */
export function validateImportFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = [
    "text/plain",
    "text/csv",
    "application/json",
    "application/vnd.ms-excel",
  ];
  const allowedExtensions = [".txt", ".csv", ".json"];

  if (file.size > maxSize) {
    return { valid: false, error: "File size must be less than 5MB" };
  }

  const hasValidExtension = allowedExtensions.some((ext) =>
    file.name.toLowerCase().endsWith(ext)
  );
  const hasValidType = allowedTypes.includes(file.type) || file.type === "";

  if (!hasValidExtension && !hasValidType) {
    return {
      valid: false,
      error: `Invalid file type. Supported formats: ${allowedExtensions.join(
        ", "
      )}`,
    };
  }

  return { valid: true };
}

/**
 * Reads file content as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === "string") {
        resolve(content);
      } else {
        reject(new Error("Failed to read file as text"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsText(file);
  });
}
