/**
 * Google Books API adapter
 * Converts Google Books API responses to our MediaItem format
 */

import { MediaItem } from "../components/shared/SendMediaModal";

const GOOGLE_BOOKS_API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
const GOOGLE_BOOKS_BASE_URL = "https://www.googleapis.com/books/v1/volumes";

interface GoogleBooksVolume {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
    pageCount?: number;
    categories?: string[];
    averageRating?: number;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    language?: string;
  };
}

/**
 * Search Google Books API
 */
export async function searchBooks(query: string): Promise<MediaItem[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      maxResults: "20",
      printType: "books",
      key: GOOGLE_BOOKS_API_KEY || "",
    });

    const response = await fetch(`${GOOGLE_BOOKS_BASE_URL}?${params}`);

    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return [];
    }

    return data.items.map((item: GoogleBooksVolume) =>
      convertGoogleBookToMediaItem(item)
    );
  } catch (error) {
    console.error("Google Books search error:", error);
    return [];
  }
}

/**
 * Get book by ISBN
 */
export async function searchBookByISBN(
  isbn: string
): Promise<MediaItem | null> {
  try {
    const params = new URLSearchParams({
      q: `isbn:${isbn}`,
      key: GOOGLE_BOOKS_API_KEY || "",
    });

    const response = await fetch(`${GOOGLE_BOOKS_BASE_URL}?${params}`);

    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return null;
    }

    return convertGoogleBookToMediaItem(data.items[0]);
  } catch (error) {
    console.error("Google Books ISBN search error:", error);
    return null;
  }
}

/**
 * Convert Google Books API volume to our MediaItem format
 */
function convertGoogleBookToMediaItem(volume: GoogleBooksVolume): MediaItem {
  const info = volume.volumeInfo;

  // Extract ISBN (prefer ISBN_13, fallback to ISBN_10)
  let isbn: string | undefined;
  if (info.industryIdentifiers) {
    const isbn13 = info.industryIdentifiers.find((id) => id.type === "ISBN_13");
    const isbn10 = info.industryIdentifiers.find((id) => id.type === "ISBN_10");
    isbn = isbn13?.identifier || isbn10?.identifier;
  }

  // Use higher quality thumbnail if available
  const thumbnailUrl =
    info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail;

  return {
    external_id: volume.id,
    title: info.title,
    authors: info.authors?.join(", "), // Plural to match API
    poster_url: thumbnailUrl || null,
    release_date: info.publishedDate,
    description: info.description,
    isbn,
    page_count: info.pageCount,
    categories: info.categories?.join(", "), // Store as comma-separated string
    media_type: "book",
  };
}
