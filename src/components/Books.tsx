import React, { useState, useEffect } from "react";
import MediaPageLayout from "./layouts/MediaPageLayout";
import MediaSearchBar from "./media/MediaSearchBar";
import MediaFilters, { type Filter } from "./media/MediaFilters";
import MediaCard from "./media/MediaCard";
import MediaActionButtons from "./media/MediaActionButtons";
import MediaDetailModal from "./media/MediaDetailModal";

type MediaStatus = "read" | "to-read";

type MediaDetailStatus = "completed" | "in-progress" | "to-watch" | "dropped";

interface MediaItem {
  id: string;
  title: string;
  type: string;
  poster?: string;
  year: number;
  userRating?: number;
  userStatus?: MediaStatus;
  criticScore?: number;
  audienceScore?: number;
}

const BOOK_FILTERS: Filter[] = [
  {
    id: "genre",
    label: "Genre",
    type: "select",
    options: [
      { value: "fiction", label: "Fiction" },
      { value: "non-fiction", label: "Non-Fiction" },
      { value: "fantasy", label: "Fantasy" },
      { value: "sci-fi", label: "Sci-Fi" },
      { value: "mystery", label: "Mystery" },
      { value: "biography", label: "Biography" },
    ],
  },
  {
    id: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "read", label: "Read" },
      { value: "reading", label: "Currently Reading" },
      { value: "to-read", label: "To Read" },
      { value: "dnf", label: "Did Not Finish" },
    ],
  },
  {
    id: "sort",
    label: "Sort By",
    type: "select",
    options: [
      { value: "title", label: "Title" },
      { value: "author", label: "Author" },
      { value: "rating", label: "Your Rating" },
      { value: "year", label: "Publication Year" },
      { value: "added", label: "Date Added" },
    ],
  },
] as const;

/**
 * Books page with search, filtering, and personal ratings
 */
const Books: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(
    {}
  );
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      void loadUserItems();
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement Google Books API search
      // const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&key=${API_KEY}`);
      // const data = await response.json();
      // setMediaItems(data.items);

      console.log("Searching for books:", query);
      setLoading(false);
    } catch (error) {
      console.error("Search error:", error);
      setLoading(false);
    }
  };

  // Load user's saved items
  const loadUserItems = () => {
    setLoading(true);
    try {
      // TODO: Implement Supabase query for books
      const placeholderItems: MediaItem[] = [
        {
          id: "1",
          title: "Project Hail Mary",
          type: "book",
          year: 2021,
          userRating: 5,
          userStatus: "read",
          criticScore: 88,
          audienceScore: 95,
        },
        {
          id: "2",
          title: "The Name of the Wind",
          type: "book",
          year: 2007,
          userRating: 4,
          userStatus: "read",
          criticScore: 85,
          audienceScore: 92,
        },
      ];
      setMediaItems(placeholderItems);
      setLoading(false);
    } catch (error) {
      console.error("Load error:", error);
      setLoading(false);
    }
  };

  const handleFilterChange = (filterId: string, value: string) => {
    setActiveFilters((prev) => ({ ...prev, [filterId]: value }));
  };

  const handleRandom = () => {
    if (mediaItems.length === 0) return;
    const randomIndex = Math.floor(Math.random() * mediaItems.length);
    setSelectedItem(mediaItems[randomIndex]);
    setIsModalOpen(true);
  };

  const handleTopLists = () => {
    console.log("Show top 10 book lists");
  };

  const handleCardClick = (item: MediaItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleRatingChange = (rating: number) => {
    if (!selectedItem) return;
    // TODO: Update rating in database
    setMediaItems((prev) =>
      prev.map((item) =>
        item.id === selectedItem.id ? { ...item, userRating: rating } : item
      )
    );
    setSelectedItem((prev) => (prev ? { ...prev, userRating: rating } : null));
  };

  const handleStatusChange = (status: MediaDetailStatus) => {
    if (!selectedItem) return;
    // Map MediaDetailStatus to MediaStatus for Books
    const bookStatus: MediaStatus = status === "completed" ? "read" : "to-read";
    // TODO: Update status in database
    setMediaItems((prev) =>
      prev.map((item) =>
        item.id === selectedItem.id ? { ...item, userStatus: bookStatus } : item
      )
    );
    setSelectedItem((prev) =>
      prev ? { ...prev, userStatus: bookStatus } : null
    );
  };

  useEffect(() => {
    void loadUserItems();
  }, [activeFilters]);

  const searchBar = (
    <MediaSearchBar onSearch={handleSearch} placeholder="Search books..." />
  );

  const filtersComponent = (
    <MediaFilters
      filters={BOOK_FILTERS}
      activeFilters={activeFilters}
      onFilterChange={handleFilterChange}
    />
  );

  const actionButtons = (
    <MediaActionButtons
      onRandomClick={handleRandom}
      onTopListsClick={handleTopLists}
      disabled={mediaItems.length === 0}
    />
  );

  const mainContent = (
    <>
      {loading ? (
        <div className="col-span-full flex items-center justify-center py-12">
          <div className="text-gray-500 dark:text-gray-400">Loading...</div>
        </div>
      ) : mediaItems.length === 0 ? (
        <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery
              ? "No results found. Try a different search."
              : "No books yet. Search to get started!"}
          </p>
        </div>
      ) : (
        mediaItems.map((item) => (
          <MediaCard
            key={item.id}
            id={item.id}
            title={item.title}
            subtitle={`${item.year}`}
            posterUrl={item.poster}
            year={item.year}
            personalRating={item.userRating}
            criticRating={item.criticScore}
            audienceRating={item.audienceScore}
            status={item.userStatus}
            onClick={() => handleCardClick(item)}
          />
        ))
      )}
    </>
  );

  const sidebarContent = (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Your Stats
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Total Books
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {mediaItems.length}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Read</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {mediaItems.filter((item) => item.userStatus === "read").length}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">To Read</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {
                mediaItems.filter((item) => item.userStatus === "to-read")
                  .length
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <MediaPageLayout
        title="Books"
        searchBar={searchBar}
        filters={filtersComponent}
        actionButtons={actionButtons}
        content={mainContent}
        sidebar={sidebarContent}
      />
      {selectedItem && (
        <MediaDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          item={{
            title: selectedItem.title,
            poster: selectedItem.poster,
            year: selectedItem.year,
            criticScore: selectedItem.criticScore,
            audienceScore: selectedItem.audienceScore,
          }}
          userRating={selectedItem.userRating}
          userStatus={
            selectedItem.userStatus === "read"
              ? ("completed" as const)
              : selectedItem.userStatus === "to-read"
              ? ("to-watch" as const)
              : undefined
          }
          friendsRatings={[]}
          onRatingChange={handleRatingChange}
          onStatusChange={handleStatusChange}
        />
      )}
    </>
  );
};

export default Books;
