/**
 * Google Books API discovery utilities
 * Provides trending, popular, and similar book recommendations
 */

import { googleBooksLimiter } from "./rateLimiter";

export interface BookItem {
  external_id: string;
  title: string;
  authors: string | null; // Plural to match API
  thumbnail_url: string | null;
  published_date: string | null;
  description: string | null;
  isbn: string | null;
  page_count: number | null;
}

const GOOGLE_BOOKS_API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY || "";
const BASE_URL = "https://www.googleapis.com/books/v1/volumes";

interface GoogleBooksVolume {
  id: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    publishedDate?: string;
    description?: string;
    pageCount?: number;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
  };
}

/**
 * Convert Google Books API response to BookItem
 */
function convertToBookItem(volume: GoogleBooksVolume): BookItem {
  const volumeInfo = volume.volumeInfo || {};
  const imageLinks = volumeInfo.imageLinks || {};

  // Get ISBN
  const isbn13 = volumeInfo.industryIdentifiers?.find(
    (id) => id.type === "ISBN_13"
  )?.identifier;
  const isbn10 = volumeInfo.industryIdentifiers?.find(
    (id) => id.type === "ISBN_10"
  )?.identifier;

  return {
    external_id: volume.id,
    title: volumeInfo.title || "Unknown Title",
    authors: volumeInfo.authors?.join(", ") || null, // Plural to match API
    thumbnail_url: imageLinks.thumbnail || imageLinks.smallThumbnail || null,
    published_date: volumeInfo.publishedDate || null,
    description: volumeInfo.description || null,
    isbn: isbn13 || isbn10 || null,
    page_count: volumeInfo.pageCount || null,
  };
}

/**
 * Fetch trending books (bestsellers, popular fiction)
 */
export async function fetchTrendingBooks(): Promise<BookItem[]> {
  return googleBooksLimiter.add(async () => {
    try {
      const response = await fetch(
        `${BASE_URL}?q=subject:fiction&orderBy=newest&maxResults=20&key=${GOOGLE_BOOKS_API_KEY}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch trending books");
      }

      const data = (await response.json()) as { items?: GoogleBooksVolume[] };
      return (data.items || []).map(convertToBookItem);
    } catch (error) {
      console.error("Error fetching trending books:", error);
      return [];
    }
  });
}

/**
 * Fetch popular books (highly rated, general interest)
 */
export async function fetchPopularBooks(): Promise<BookItem[]> {
  return googleBooksLimiter.add(async () => {
    try {
      // Search for bestsellers and popular titles
      const response = await fetch(
        `${BASE_URL}?q=bestseller&orderBy=relevance&maxResults=20&key=${GOOGLE_BOOKS_API_KEY}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch popular books");
      }

      const data = (await response.json()) as { items?: GoogleBooksVolume[] };
      return (data.items || []).map(convertToBookItem);
    } catch (error) {
      console.error("Error fetching popular books:", error);
      return [];
    }
  });
}

/**
 * Fetch similar books based on a book title
 * Uses subject-based search for recommendations
 */
export async function fetchSimilarBooks(
  bookTitle: string
): Promise<BookItem[]> {
  return googleBooksLimiter.add(async () => {
    try {
      // Search for books with similar subjects or by the same author
      const response = await fetch(
        `${BASE_URL}?q=intitle:${encodeURIComponent(
          bookTitle
        )}&orderBy=relevance&maxResults=20&key=${GOOGLE_BOOKS_API_KEY}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch similar books");
      }

      const data = (await response.json()) as { items?: GoogleBooksVolume[] };
      const books = (data.items || []).map(convertToBookItem);

      // Filter out the exact book we're basing recommendations on
      return books.filter(
        (book: BookItem) => book.title.toLowerCase() !== bookTitle.toLowerCase()
      );
    } catch (error) {
      console.error("Error fetching similar books:", error);
      return [];
    }
  });
}
