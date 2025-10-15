import React, { useState, useEffect, useCallback } from "react";
import { X, Search, Send, Film, Tv, Check, Users } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

interface Friend {
  user_id: string;
  display_name: string;
}

interface Movie {
  external_id: string;
  title: string;
  media_type: "movie" | "tv";
  poster_url: string | null;
  release_date: string | null;
  overview: string | null;
}

interface SendMovieModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSent: () => void;
}

/**
 * SendMovieModal - Search for movies/TV and send to friends
 * Flow: search → select → choose friends → optional message → send
 */
const SendMovieModal: React.FC<SendMovieModalProps> = ({
  isOpen,
  onClose,
  onSent,
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<"search" | "select-friend" | "message">(
    "search"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [recentFriendIds, setRecentFriendIds] = useState<string[]>([]);
  const [friendSearchQuery, setFriendSearchQuery] = useState("");
  const [recommendationType, setRecommendationType] = useState<
    "watch" | "rewatch"
  >("watch");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Load friends list
  const loadFriends = useCallback(async () => {
    if (!user) return;

    try {
      // Get all user profiles except current user
      const { data, error } = await supabase
        .from("user_profiles")
        .select("user_id, display_name")
        .neq("user_id", user.id)
        .order("display_name");

      if (error) throw error;

      setFriends(data || []);

      // Load recent friends (last 3 people you sent movies to)
      const { data: recentRecs, error: recentError } = await supabase
        .from("movie_recommendations")
        .select("to_user_id")
        .eq("from_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (recentError) throw recentError;

      // Get unique recent friend IDs (top 3)
      const uniqueRecent = [
        ...new Set(recentRecs?.map((r) => r.to_user_id) || []),
      ].slice(0, 3);
      setRecentFriendIds(uniqueRecent);
    } catch (error) {
      console.error("Error loading friends:", error);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      void loadFriends();
    }
  }, [isOpen, loadFriends]);

  // Search TMDB API with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSearching(true);
      try {
        const apiKey = import.meta.env.VITE_TMDB_API_KEY;
        const response = await fetch(
          `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(
            searchQuery
          )}&include_adult=false`
        );

        if (!response.ok) throw new Error("Search failed");

        const data = await response.json();

        // Filter to only movies and TV shows
        const results = (data.results || [])
          .filter(
            (item: any) =>
              item.media_type === "movie" || item.media_type === "tv"
          )
          .slice(0, 20)
          .map((item: any) => ({
            external_id: item.id.toString(),
            title: item.media_type === "movie" ? item.title : item.name,
            media_type: item.media_type,
            poster_url: item.poster_path
              ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
              : null,
            release_date:
              item.media_type === "movie"
                ? item.release_date
                : item.first_air_date,
            overview: item.overview || null,
          }));

        setSearchResults(results);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Reset modal state when closed
  useEffect(() => {
    if (!isOpen) {
      setStep("search");
      setSearchQuery("");
      setSearchResults([]);
      setSelectedMovie(null);
      setSelectedFriendIds([]);
      setFriendSearchQuery("");
      setRecommendationType("watch");
      setMessage("");
      setSending(false);
    }
  }, [isOpen]);

  const handleSelectMovie = (movie: Movie) => {
    setSelectedMovie(movie);
    setStep("select-friend");
  };

  const handleToggleFriend = (friendId: string) => {
    setSelectedFriendIds((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleSelectAll = () => {
    const filtered = filteredFriends();
    setSelectedFriendIds(filtered.map((f) => f.user_id));
  };

  const handleClearAll = () => {
    setSelectedFriendIds([]);
  };

  const handleBack = () => {
    if (step === "select-friend") {
      setStep("search");
      setSelectedMovie(null);
      setSelectedFriendIds([]);
    } else if (step === "message") {
      setStep("select-friend");
    }
  };

  const handleContinue = () => {
    if (step === "select-friend" && selectedFriendIds.length > 0) {
      setStep("message");
    }
  };

  const handleSend = async () => {
    if (!selectedMovie || selectedFriendIds.length === 0 || !user) return;

    setSending(true);
    try {
      // Create recommendation for each selected friend
      const recommendations = selectedFriendIds.map((friendId) => ({
        from_user_id: user.id,
        to_user_id: friendId,
        external_id: selectedMovie.external_id,
        title: selectedMovie.title,
        media_type: selectedMovie.media_type,
        poster_url: selectedMovie.poster_url,
        release_date: selectedMovie.release_date,
        overview: selectedMovie.overview,
        recommendation_type: recommendationType,
        sent_message: message || null,
        status: "pending",
      }));

      const { error } = await supabase
        .from("movie_recommendations")
        .insert(recommendations);

      if (error) {
        console.error("Error sending recommendations:", error);
        alert(`Failed to send recommendations: ${error.message}`);
        return;
      }

      onSent();
      onClose();
    } catch (error) {
      console.error("Error sending recommendations:", error);
      alert("Failed to send recommendations");
    } finally {
      setSending(false);
    }
  };

  const filteredFriends = () => {
    if (!friendSearchQuery.trim()) return friends;
    const query = friendSearchQuery.toLowerCase();
    return friends.filter((f) => f.display_name.toLowerCase().includes(query));
  };

  const recentFriends = friends.filter((f) =>
    recentFriendIds.includes(f.user_id)
  );
  const otherFriends = filteredFriends().filter(
    (f) => !recentFriendIds.includes(f.user_id)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {step === "search" && "Search for Movies & TV"}
            {step === "select-friend" && "Choose Friends"}
            {step === "message" && "Add a Message"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Search */}
          {step === "search" && (
            <div>
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <Search
                    size={20}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Start typing to search for movies or TV shows..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    autoFocus
                  />
                </div>
              </div>

              {/* Search Results */}
              {searching && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  Searching...
                </div>
              )}

              {!searching && searchQuery && searchResults.length === 0 && (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                  No results found. Try a different search.
                </div>
              )}

              {!searching && !searchQuery && (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                  <Film className="w-16 h-16 mx-auto mb-3 opacity-50" />
                  <p>Start typing to search for movies or TV shows</p>
                </div>
              )}

              {!searching && searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((movie) => (
                    <button
                      key={movie.external_id}
                      onClick={() => handleSelectMovie(movie)}
                      className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      {movie.poster_url ? (
                        <img
                          src={movie.poster_url}
                          alt={movie.title}
                          className="w-12 h-18 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-18 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                          {movie.media_type === "movie" ? (
                            <Film size={24} className="text-gray-400" />
                          ) : (
                            <Tv size={24} className="text-gray-400" />
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {movie.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {movie.media_type === "movie" ? "Movie" : "TV Show"}
                          {movie.release_date &&
                            ` • ${movie.release_date.split("-")[0]}`}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Friends */}
          {step === "select-friend" && (
            <div>
              {/* Selected Movie Preview */}
              {selectedMovie && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center gap-4">
                  {selectedMovie.poster_url ? (
                    <img
                      src={selectedMovie.poster_url}
                      alt={selectedMovie.title}
                      className="w-16 h-24 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-24 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                      {selectedMovie.media_type === "movie" ? (
                        <Film size={32} className="text-gray-400" />
                      ) : (
                        <Tv size={32} className="text-gray-400" />
                      )}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {selectedMovie.title}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedMovie.media_type === "movie"
                        ? "Movie"
                        : "TV Show"}
                      {selectedMovie.release_date &&
                        ` • ${selectedMovie.release_date.split("-")[0]}`}
                    </div>
                  </div>
                </div>
              )}

              {/* Watch/Rewatch Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recommendation Type
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRecommendationType("watch")}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                      recommendationType === "watch"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                        : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <Film size={20} className="inline mr-2" />
                    Watch
                  </button>
                  <button
                    onClick={() => setRecommendationType("rewatch")}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                      recommendationType === "rewatch"
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                        : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <Tv size={20} className="inline mr-2" />
                    Rewatch
                  </button>
                </div>
              </div>

              {/* Friends List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Send to Friends{" "}
                    {selectedFriendIds.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                        {selectedFriendIds.length}
                      </span>
                    )}
                  </label>
                  {friends.length > 1 && (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSelectAll}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Select All
                      </button>
                      {selectedFriendIds.length > 0 && (
                        <button
                          onClick={handleClearAll}
                          className="text-xs text-gray-600 dark:text-gray-400 hover:underline"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Search friends if there are 4+ */}
                {friends.length >= 4 && (
                  <div className="mb-4">
                    <div className="relative">
                      <Search
                        size={16}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        value={friendSearchQuery}
                        onChange={(e) => setFriendSearchQuery(e.target.value)}
                        placeholder="Search friends..."
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {/* Recent Friends Section */}
                  {recentFriends.length > 0 && !friendSearchQuery && (
                    <div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                        <Users size={12} />
                        Recent
                      </div>
                      <div className="space-y-2">
                        {recentFriends.map((friend) => {
                          const isSelected = selectedFriendIds.includes(
                            friend.user_id
                          );
                          return (
                            <button
                              key={friend.user_id}
                              onClick={() => handleToggleFriend(friend.user_id)}
                              className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                isSelected
                                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                              }`}
                            >
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                                  isSelected
                                    ? "bg-gradient-to-br from-blue-500 to-purple-600"
                                    : "bg-gradient-to-br from-blue-400 to-purple-500"
                                }`}
                              >
                                {friend.display_name[0].toUpperCase()}
                              </div>
                              <div className="flex-1 text-left">
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {friend.display_name}
                                </div>
                              </div>
                              {isSelected && (
                                <Check
                                  size={20}
                                  className="text-blue-600 dark:text-blue-400"
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Other Friends */}
                  {otherFriends.length > 0 && (
                    <div>
                      {recentFriends.length > 0 && !friendSearchQuery && (
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                          All Friends
                        </div>
                      )}
                      <div className="space-y-2">
                        {otherFriends.map((friend) => {
                          const isSelected = selectedFriendIds.includes(
                            friend.user_id
                          );
                          return (
                            <button
                              key={friend.user_id}
                              onClick={() => handleToggleFriend(friend.user_id)}
                              className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                isSelected
                                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                              }`}
                            >
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                                  isSelected
                                    ? "bg-gradient-to-br from-green-500 to-blue-600"
                                    : "bg-gradient-to-br from-green-400 to-blue-500"
                                }`}
                              >
                                {friend.display_name[0].toUpperCase()}
                              </div>
                              <div className="flex-1 text-left">
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {friend.display_name}
                                </div>
                              </div>
                              {isSelected && (
                                <Check
                                  size={20}
                                  className="text-green-600 dark:text-green-400"
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {filteredFriends().length === 0 && (
                    <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                      {friendSearchQuery
                        ? "No friends found"
                        : "No friends yet"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Message */}
          {step === "message" && (
            <div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Add a message (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell your friends why they should watch this..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                />
              </div>

              {/* Preview */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sending to {selectedFriendIds.length}{" "}
                  {selectedFriendIds.length === 1 ? "friend" : "friends"}
                </div>
                <div className="flex flex-wrap gap-2">
                  {friends
                    .filter((f) => selectedFriendIds.includes(f.user_id))
                    .map((friend) => (
                      <span
                        key={friend.user_id}
                        className="px-3 py-1 bg-white dark:bg-gray-600 rounded-full text-sm text-gray-700 dark:text-gray-200"
                      >
                        {friend.display_name}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <button
            onClick={step === "search" ? onClose : handleBack}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            {step === "search" ? "Cancel" : "Back"}
          </button>

          <div className="flex gap-2">
            {step === "select-friend" && (
              <button
                onClick={handleContinue}
                disabled={selectedFriendIds.length === 0}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue
              </button>
            )}

            {step === "message" && (
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? (
                  "Sending..."
                ) : (
                  <>
                    <Send size={18} />
                    Send
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendMovieModal;
