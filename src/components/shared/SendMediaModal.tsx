import { useState, useEffect, useCallback } from "react";
import { Search, Send, Check } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { getFriends } from "../../lib/connections";
import Modal from "./Modal";
import Button from "./Button";

// Generic media item interface
export interface MediaItem {
  external_id: string;
  title: string;
  subtitle?: string; // artist for music, director for movies, author for books, developer for games
  poster_url: string | null;
  release_date?: string | null;
  description?: string | null;
  media_type?: string; // track/album for music, movie/tv for movies, etc.
}

// Friend interface
interface Friend {
  user_id: string;
  display_name: string;
}

// Props for the generic modal
interface SendMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSent: () => void;

  // Media-specific configuration
  mediaType: "music" | "movies" | "books" | "games";
  tableName: string; // e.g., "music_recommendations", "movie_recommendations"
  searchPlaceholder: string; // e.g., "Search for songs, albums, or artists..."

  // Search function - returns media items
  searchFunction: (query: string) => Promise<MediaItem[]>;

  // Recommendation type options (e.g., listen/watch for music, watch/rewatch for movies)
  recommendationTypes: Array<{ value: string; label: string }>;
  defaultRecommendationType: string;

  // Optional: Preselected item (skips search step)
  preselectedItem?: MediaItem;
}

export default function SendMediaModal({
  isOpen,
  onClose,
  onSent,
  mediaType,
  tableName,
  searchPlaceholder,
  searchFunction,
  recommendationTypes,
  defaultRecommendationType,
  preselectedItem,
}: SendMediaModalProps) {
  const { user } = useAuth();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [searching, setSearching] = useState(false);

  // Selection state
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(
    preselectedItem || null
  );
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(
    new Set()
  );
  const [recommendationType, setRecommendationType] = useState(
    defaultRecommendationType
  );
  const [message, setMessage] = useState("");

  // Friends state
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  // UI state
  const [step, setStep] = useState<"search" | "friends" | "details">(
    preselectedItem ? "friends" : "search"
  );
  const [sending, setSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Load friends
  const loadFriends = useCallback(async () => {
    if (!user) return;

    setLoadingFriends(true);
    try {
      // Use the connections service (works with mock or real data)
      const { data: friendsList, error: friendsError } = await getFriends(
        user.id
      );

      if (friendsError) {
        console.error("Error loading friends:", friendsError);
        setFriends([]);
      } else {
        setFriends(friendsList || []);
      }
    } catch (error) {
      console.error("Error loading friends:", error);
      setFriends([]);
    } finally {
      setLoadingFriends(false);
    }
  }, [user]);

  // Search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      void (async () => {
        setSearching(true);
        try {
          const results = await searchFunction(searchQuery);
          setSearchResults(results);
        } catch (error) {
          console.error("Search error:", error);
          setSearchResults([]);
        } finally {
          setSearching(false);
        }
      })();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchFunction]);

  // Load friends when modal opens
  useEffect(() => {
    if (isOpen) {
      void loadFriends();
    }
  }, [isOpen, loadFriends]);

  // Update selected item and step when modal opens with preselected item
  useEffect(() => {
    if (isOpen && preselectedItem) {
      setSelectedItem(preselectedItem);
      setStep("friends");
    }
  }, [isOpen, preselectedItem]);

  // Reset modal state when closed
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSearchResults([]);
      setSelectedItem(null);
      setSelectedFriends(new Set());
      setRecommendationType(defaultRecommendationType);
      setMessage("");
      setStep("search");
      setSending(false);
      setShowSuccess(false);
    }
  }, [isOpen, defaultRecommendationType]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !sending) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose, sending]);

  const handleClose = () => {
    onClose();
  };

  const handleItemSelect = (item: MediaItem) => {
    setSelectedItem(item);
    setStep("friends");
  };

  const toggleFriend = (friendId: string) => {
    const newSelected = new Set(selectedFriends);
    if (newSelected.has(friendId)) {
      newSelected.delete(friendId);
    } else {
      newSelected.add(friendId);
    }
    setSelectedFriends(newSelected);
  };

  const toggleAllFriends = () => {
    if (selectedFriends.size === friends.length) {
      setSelectedFriends(new Set());
    } else {
      setSelectedFriends(new Set(friends.map((f) => f.user_id)));
    }
  };

  const handleContinue = () => {
    if (selectedFriends.size > 0) {
      setStep("details");
    }
  };

  const handleSend = async () => {
    if (!user || !selectedItem || selectedFriends.size === 0) return;

    setSending(true);
    try {
      // Create recommendations for each selected friend
      const recommendations = Array.from(selectedFriends).map((friendId) => {
        const baseRecommendation = {
          from_user_id: user.id,
          to_user_id: friendId,
          external_id: selectedItem.external_id,
          title: selectedItem.title,
          poster_url: selectedItem.poster_url,
          media_type: selectedItem.media_type || "unknown",
          status: "pending",
          recommendation_type: recommendationType,
          sent_message: message || null,
        };

        // Add media-type-specific fields
        if (mediaType === "music") {
          return {
            ...baseRecommendation,
            artist: selectedItem.subtitle || null,
            album: null, // Could be extracted from media_type if needed
            release_date: selectedItem.release_date || null,
            preview_url: null, // Could add preview URL if available from API
          };
        } else if (mediaType === "movies") {
          return {
            ...baseRecommendation,
            release_date: selectedItem.release_date || null,
            overview: selectedItem.description || null,
          };
        }

        return baseRecommendation;
      });

      const { error } = await supabase.from(tableName).insert(recommendations);

      if (error) {
        if (error.message.includes("duplicate key")) {
          alert(
            "You've already sent this recommendation to one or more of these friends."
          );
        } else {
          alert(`Failed to send recommendation: ${error.message}`);
        }
        setSending(false);
        return;
      }

      // Show success message
      setSending(false);
      setShowSuccess(true);

      // Wait a moment before closing
      setTimeout(() => {
        setShowSuccess(false);
        onSent();
        handleClose();
      }, 1500);
    } catch (error) {
      console.error("Error sending recommendations:", error);
      setSending(false);
      alert("Failed to send recommendation. Please try again.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Send ${
        mediaType.charAt(0).toUpperCase() + mediaType.slice(1)
      } Recommendation`}
      maxWidth="2xl"
    >
      {/* Content */}
      <div className="overflow-y-auto p-6 max-h-[60vh]">
        {/* Search Step */}
        {step === "search" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                autoFocus
              />
            </div>

            {searching && (
              <p className="text-center text-gray-500">Searching...</p>
            )}

            {!searching && searchQuery && searchResults.length === 0 && (
              <p className="text-center text-gray-500">No results found</p>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((item) => (
                  <button
                    key={item.external_id}
                    onClick={() => handleItemSelect(item)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                  >
                    {item.poster_url && (
                      <img
                        src={item.poster_url}
                        alt={item.title}
                        className="w-12 h-12 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Connections Step */}
        {step === "friends" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 dark:text-white">
                Select Connections
              </h3>
              {friends.length > 1 && (
                <button
                  onClick={toggleAllFriends}
                  className="text-sm font-medium"
                  style={{ color: "var(--color-primary)" }}
                >
                  {selectedFriends.size === friends.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              )}
            </div>

            {loadingFriends && (
              <p className="text-center text-gray-500">
                Loading connections...
              </p>
            )}

            {!loadingFriends && friends.length === 0 && (
              <p className="text-center text-gray-500">
                No connections available.
              </p>
            )}

            {friends.length > 0 && (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <button
                    key={friend.user_id}
                    onClick={() => toggleFriend(friend.user_id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      selectedFriends.has(friend.user_id)
                        ? "bg-gray-100/50 dark:bg-gray-700/30 border border-gray-200/50 dark:border-gray-600/50"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        selectedFriends.has(friend.user_id)
                          ? "border-transparent"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      style={
                        selectedFriends.has(friend.user_id)
                          ? { backgroundColor: "var(--color-primary)" }
                          : undefined
                      }
                    >
                      {selectedFriends.has(friend.user_id) && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span
                      className={
                        selectedFriends.has(friend.user_id)
                          ? "text-white"
                          : "text-gray-900 dark:text-white"
                      }
                    >
                      {friend.display_name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Details Step */}
        {step === "details" && (
          <div className="space-y-4">
            {/* Only show recommendation type selector if there are types AND it's relevant for this media */}
            {recommendationTypes.length > 0 &&
              // For movies, only show if it's a TV show
              (mediaType !== "movies" || selectedItem?.media_type === "tv") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Recommendation Type
                  </label>
                  <div className="flex gap-2">
                    {recommendationTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setRecommendationType(type.value)}
                        className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                          recommendationType === type.value
                            ? "text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                        style={
                          recommendationType === type.value
                            ? { backgroundColor: "var(--color-primary)" }
                            : undefined
                        }
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a note about why you're recommending this..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Success State */}
        {showSuccess && (
          <div className="flex flex-col items-center justify-center py-8">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: "var(--color-primary-pale)" }}
            >
              <Check
                className="w-8 h-8"
                style={{ color: "var(--color-primary)" }}
              />
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              Sent!
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      {!showSuccess && (
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant={step === "search" ? "danger" : "subtle"}
            onClick={
              step === "search"
                ? handleClose
                : () => setStep(step === "details" ? "friends" : "search")
            }
          >
            {step === "search" ? "Cancel" : "Back"}
          </Button>

          {step === "friends" && (
            <Button
              variant="primary"
              onClick={handleContinue}
              disabled={selectedFriends.size === 0}
            >
              Continue
            </Button>
          )}

          {step === "details" && (
            <Button
              variant="primary"
              onClick={() => void handleSend()}
              disabled={sending}
              loading={sending}
              icon={<Send className="w-4 h-4" />}
            >
              {sending ? "Sending..." : "Send"}
            </Button>
          )}
        </div>
      )}
    </Modal>
  );
}
