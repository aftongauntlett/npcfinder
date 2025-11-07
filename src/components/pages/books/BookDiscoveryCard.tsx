import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Star,
  BookOpen,
} from "lucide-react";
import { SimilarBooksCarousel } from "./SimilarBooksCarousel";
import { useReadingList } from "../../../hooks/useReadingListQueries";
import { useAddToReadingList } from "../../../hooks/useReadingListQueries";
import { useTheme } from "../../../hooks/useTheme";
import Toast from "../../ui/Toast";
import {
  fetchTrendingBooks,
  fetchPopularBooks,
  fetchSimilarBooks,
  type BookItem,
} from "../../../utils/googleBooksDiscovery";

interface ReadingListAnalysis {
  favoriteBook: {
    external_id: string;
    title: string;
    authors: string | null;
  } | null;
}

/**
 * BookDiscoveryCard
 *
 * Matches the MovieDiscoveryCard styling but for books:
 * - Trending This Week (collapsible)
 * - Popular Right Now (collapsible)
 * - Because You Read (personalized, collapsible)
 */
const BookDiscoveryCard: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );
  const [trendingBooks, setTrendingBooks] = useState<BookItem[]>([]);
  const [popularBooks, setPopularBooks] = useState<BookItem[]>([]);
  const [similarBooks, setSimilarBooks] = useState<BookItem[]>([]);
  const [loadingSections, setLoadingSections] = useState<Set<string>>(
    new Set()
  );
  const [toast, setToast] = useState<{ message: string } | null>(null);

  const { data: readingList = [] } = useReadingList();
  const addToReadingListMutation = useAddToReadingList();
  const { themeColor } = useTheme();

  // Get existing reading list IDs to show "In List" badges
  const existingIds = readingList.map((item) => item.external_id);

  // Analyze reading list for personalized recommendations
  const analyzeReadingList = (): ReadingListAnalysis => {
    let favoriteBook: ReadingListAnalysis["favoriteBook"] = null;

    // Find most recently read item for "Because You Read"
    const readItems = readingList.filter((item) => item.read);
    if (readItems.length > 0) {
      // Sort by read_at descending, use most recent
      const sorted = [...readItems].sort((a, b) => {
        const dateA = a.read_at ? new Date(a.read_at).getTime() : 0;
        const dateB = b.read_at ? new Date(b.read_at).getTime() : 0;
        return dateB - dateA;
      });

      const mostRecent = sorted[0];
      if (mostRecent) {
        favoriteBook = {
          external_id: mostRecent.external_id,
          title: mostRecent.title,
          authors: mostRecent.authors,
        };
      }
    }

    return { favoriteBook };
  };

  const analysis = analyzeReadingList();

  const toggleSection = async (section: string) => {
    // Toggle section in the set (allow multiple open)
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });

    // Load data on first expand
    if (!loadingSections.has(section)) {
      setLoadingSections((prev) => new Set(prev).add(section));

      try {
        if (section === "trending" && trendingBooks.length === 0) {
          const data = await fetchTrendingBooks();
          setTrendingBooks(data);
        } else if (section === "popular" && popularBooks.length === 0) {
          const data = await fetchPopularBooks();
          setPopularBooks(data);
        } else if (
          section === "similar" &&
          analysis.favoriteBook &&
          similarBooks.length === 0
        ) {
          const data = await fetchSimilarBooks(analysis.favoriteBook.title);
          setSimilarBooks(data);
        }
      } catch (error) {
        console.error(`Error loading ${section}:`, error);
      } finally {
        setLoadingSections((prev) => {
          const newSet = new Set(prev);
          newSet.delete(section);
          return newSet;
        });
      }
    }
  };

  const handleAddToReadingList = async (book: BookItem) => {
    try {
      await addToReadingListMutation.mutateAsync({
        external_id: book.external_id,
        title: book.title,
        authors: book.authors,
        thumbnail_url: book.thumbnail_url,
        published_date: book.published_date,
        description: book.description,
        isbn: book.isbn,
        page_count: book.page_count,
        categories: book.categories,
        read: false,
      });

      setToast({
        message: `Added "${book.title}" to reading list`,
      });
    } catch {
      setToast({
        message: "Failed to add to reading list",
      });
    }
  };

  const sections = [
    {
      id: "trending",
      label: "Trending This Week",
      icon: TrendingUp,
      count: trendingBooks.length || "20",
      data: trendingBooks,
      enabled: true,
    },
    {
      id: "popular",
      label: "Popular Right Now",
      icon: Star,
      count: popularBooks.length || "20",
      data: popularBooks,
      enabled: true,
    },
    {
      id: "similar",
      label: analysis.favoriteBook
        ? `Because You Read "${analysis.favoriteBook.title}"`
        : "Because You Read",
      icon: BookOpen,
      count: similarBooks.length || "20",
      data: similarBooks,
      enabled: !!analysis.favoriteBook,
    },
  ];

  const enabledSections = sections.filter((s) => s.enabled);

  if (enabledSections.length === 0) {
    return null;
  }

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Discover
          </h2>
        </div>

        <div className="space-y-3">
          {enabledSections.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSections.has(section.id);
            const isLoading = loadingSections.has(section.id);

            return (
              <div
                key={section.id}
                className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => void toggleSection(section.id)}
                  className="w-full p-4 flex items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: `${themeColor}20`,
                      }}
                    >
                      <Icon className="w-5 h-5" style={{ color: themeColor }} />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {section.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {section.count} books
                      </div>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                    {isLoading ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        Loading...
                      </div>
                    ) : section.data.length > 0 ? (
                      <SimilarBooksCarousel
                        books={section.data}
                        onAddToReadingList={(book) =>
                          void handleAddToReadingList(book)
                        }
                        existingIds={existingIds}
                      />
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No recommendations available
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} onClose={() => setToast(null)} />
      )}
    </>
  );
};

export default BookDiscoveryCard;
