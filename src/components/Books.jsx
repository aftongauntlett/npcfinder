import React, { useState, useEffect } from "react";
import MediaPageLayout from "../components/layouts/MediaPageLayout";
import MediaSearchBar from "../components/media/MediaSearchBar";
import MediaFilters from "../components/media/MediaFilters";
import MediaCard from "../components/media/MediaCard";
import MediaActionButtons from "../components/media/MediaActionButtons";
import MediaDetailModal from "../components/media/MediaDetailModal";

/**
 * Books page with search, filtering, and personal ratings
 */
const Books = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState({});
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter configuration for books
  const filters = [
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
  ];

  // Handle search
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      loadUserItems();
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
  const loadUserItems = async () => {
    setLoading(true);
    try {
      // TODO: Implement Supabase query for books
      const placeholderItems = [
        {
          id: "1",
          title: "Project Hail Mary",
          type: "book",
          poster: null,
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
          poster: null,
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

  const handleFilterChange = (filterId, value) => {
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

  const handleCardClick = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleRatingChange = async (rating) => {
    if (!selectedItem) return;
    // TODO: Update rating in database
    setMediaItems((prev) =>
      prev.map((item) =>
        item.id === selectedItem.id ? { ...item, userRating: rating } : item
      )
    );
    setSelectedItem((prev) => ({ ...prev, userRating: rating }));
  };

  const handleStatusChange = async (status) => {
    if (!selectedItem) return;
    // TODO: Update status in database
    setMediaItems((prev) =>
      prev.map((item) =>
        item.id === selectedItem.id ? { ...item, userStatus: status } : item
      )
    );
    setSelectedItem((prev) => ({ ...prev, userStatus: status }));
  };

  useEffect(() => {
    loadUserItems();
  }, [activeFilters]);

  const searchBar = (
    <MediaSearchBar
      searchQuery={searchQuery}
      onSearchChange={handleSearch}
      placeholder="Search books..."
    />
  );

  const filtersComponent = (
    <MediaFilters
      filters={filters}
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
            item={item}
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
            <span className="text-gray-600 dark:text-gray-400">
              Currently Reading
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {
                mediaItems.filter((item) => item.userStatus === "reading")
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
        mainContent={mainContent}
        sidebarContent={sidebarContent}
      />
      <MediaDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={selectedItem || {}}
        userRating={selectedItem?.userRating}
        userStatus={selectedItem?.userStatus}
        friendsRatings={[]}
        onRatingChange={handleRatingChange}
        onStatusChange={handleStatusChange}
      />
    </>
  );
};

export default Books;
