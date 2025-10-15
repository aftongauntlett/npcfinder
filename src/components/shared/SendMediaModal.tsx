import { useState, useEffect, useCallback } from "react";
import { X, Search, Send, Check } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

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
}: SendMediaModalProps) {
  const { user } = useAuth();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [searching, setSearching] = useState(false);

  // Selection state
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
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
  const [step, setStep] = useState<"search" | "friends" | "details">("search");
  const [sending, setSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Load friends
  const loadFriends = useCallback(async () => {
    if (!user) return;

    setLoadingFriends(true);
    try {
      // Get friends from friendships table
      const { data: friendships, error: friendshipsError } = await supabase
        .from("friendships")
        .select("friend_id, user_id")
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq("status", "accepted");

      if (friendshipsError) throw friendshipsError;

      // Extract friend IDs
      const friendIds =
        friendships?.map((f) =>
          f.user_id === user.id ? f.friend_id : f.user_id
        ) || [];

      if (friendIds.length === 0) {
        setFriends([]);
        setLoadingFriends(false);
        return;
      }

      // Get friend profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("user_profiles")
        .select("user_id, display_name")
        .in("user_id", friendIds);

      if (profilesError) throw profilesError;

      setFriends(profiles || []);
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
      const recommendations = Array.from(selectedFriends).map((friendId) => ({
        from_user_id: user.id,
        to_user_id: friendId,
        external_id: selectedItem.external_id,
        title: selectedItem.title,
        artist: selectedItem.subtitle || null, // For music
        album: null, // Could be extracted from media_type if needed
        year: selectedItem.release_date
          ? new Date(selectedItem.release_date).getFullYear()
          : null,
        poster_url: selectedItem.poster_url,
        media_type: selectedItem.media_type || "unknown",
        status: "pending",
        recommendation_type: recommendationType,
        sent_message: message || null,
      }));

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Send {mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}{" "}
            Recommendation
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
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

          {/* Friends Step */}
          {step === "friends" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Select Friends
                </h3>
                {friends.length > 1 && (
                  <button
                    onClick={toggleAllFriends}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {selectedFriends.size === friends.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                )}
              </div>

              {loadingFriends && (
                <p className="text-center text-gray-500">Loading friends...</p>
              )}

              {!loadingFriends && friends.length === 0 && (
                <p className="text-center text-gray-500">
                  No friends yet. Add friends to send recommendations!
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
                          ? "bg-blue-100 dark:bg-blue-900"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedFriends.has(friend.user_id)
                            ? "bg-blue-600 border-blue-600"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        {selectedFriends.has(friend.user_id) && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <span className="text-gray-900 dark:text-white">
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
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

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
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-600 dark:text-green-300" />
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                Sent!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!showSuccess && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={
                step === "search"
                  ? handleClose
                  : () => setStep(step === "details" ? "friends" : "search")
              }
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {step === "search" ? "Cancel" : "Back"}
            </button>

            {step === "friends" && (
              <button
                onClick={handleContinue}
                disabled={selectedFriends.size === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue
              </button>
            )}

            {step === "details" && (
              <button
                onClick={() => void handleSend()}
                disabled={sending}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
                {sending ? "Sending..." : "Send"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
