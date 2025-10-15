import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Search,
  Send,
  Music as MusicIcon,
  Headphones,
  Video,
  Check,
  Clock,
  Users,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

interface Friend {
  user_id: string;
  display_name: string;
}

interface Song {
  external_id: string;
  title: string;
  artist: string;
  album: string;
  year: number | null;
  poster_url: string | null;
  media_type: string;
}

interface SendMusicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSent: () => void;
}

/**
 * SendMusicModal - Search for music and send to friends
 * Simple, calm flow: search → select → choose friend → optional message → send
 */
const SendMusicModal: React.FC<SendMusicModalProps> = ({
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
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [recentFriendIds, setRecentFriendIds] = useState<string[]>([]);
  const [friendSearchQuery, setFriendSearchQuery] = useState("");
  const [recommendationType, setRecommendationType] = useState<
    "listen" | "watch"
  >("listen");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Load list of friends (users who have profiles)
  const loadFriends = useCallback(async () => {
    if (!user) return;

    try {
      // For now, get all user profiles except current user
      // TODO: In the future, filter to actual friends list
      const { data, error } = await supabase
        .from("user_profiles")
        .select("user_id, display_name")
        .neq("user_id", user.id)
        .order("display_name");

      if (error) throw error;

      setFriends(data || []);

      // Load recent friends (last 3 people you sent music to)
      const { data: recentRecs, error: recentError } = await supabase
        .from("music_recommendations")
        .select("to_user_id")
        .eq("from_user_id", user.id)
        .order("sent_at", { ascending: false })
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

  // Search iTunes API
  const searchMusic = useCallback(async () => {
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      const response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(
          searchQuery
        )}&entity=song&limit=20`
      );
      const data = await response.json();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const songs: Song[] = (data.results || []).map(
        (item: {
          trackId: number;
          trackName: string;
          artistName: string;
          collectionName: string;
          releaseDate?: string;
          artworkUrl100?: string;
        }) => ({
          external_id: String(item.trackId),
          title: item.trackName,
          artist: item.artistName,
          album: item.collectionName,
          year: item.releaseDate
            ? new Date(item.releaseDate).getFullYear()
            : null,
          poster_url: item.artworkUrl100?.replace("100x100", "300x300") || null,
          media_type: "track", // Changed from "song" to "track" to match database constraint
        })
      );

      setSearchResults(songs);
    } catch (error) {
      console.error("Error searching music:", error);
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  // Load friends on mount
  useEffect(() => {
    if (isOpen) {
      void loadFriends();
    }
  }, [isOpen, loadFriends]);

  // Debounced search: search automatically as user types (with 500ms delay)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const debounceTimer = setTimeout(() => {
      void searchMusic();
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, searchMusic]);

  // Handle song selection
  const handleSelectSong = (song: Song) => {
    setSelectedSong(song);
    setStep("select-friend");
  };

  // Toggle friend selection
  const toggleFriend = (friendId: string) => {
    setSelectedFriendIds((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  // Select all friends
  const selectAllFriends = () => {
    setSelectedFriendIds(friends.map((f) => f.user_id));
  };

  // Deselect all friends
  const deselectAllFriends = () => {
    setSelectedFriendIds([]);
  };

  // Filter friends based on search query
  const getFilteredFriends = () => {
    if (!friendSearchQuery.trim()) return friends;

    const query = friendSearchQuery.toLowerCase();
    return friends.filter((f) => f.display_name.toLowerCase().includes(query));
  };

  // Get recent friends (that are still in friends list)
  const getRecentFriends = () => {
    return recentFriendIds
      .map((id) => friends.find((f) => f.user_id === id))
      .filter((f): f is Friend => f !== undefined);
  };

  // Send recommendations
  const handleSend = async () => {
    if (!user || !selectedSong || selectedFriendIds.length === 0) return;

    try {
      setSending(true);

      // Create a recommendation for each selected friend
      const recommendations = selectedFriendIds.map((friendId) => ({
        from_user_id: user.id,
        to_user_id: friendId,
        external_id: selectedSong.external_id,
        title: selectedSong.title,
        artist: selectedSong.artist,
        album: selectedSong.album,
        media_type: selectedSong.media_type,
        year: selectedSong.year,
        poster_url: selectedSong.poster_url,
        status: "pending",
        recommendation_type: recommendationType,
        sent_message: message.trim() || null,
      }));

      const { error } = await supabase
        .from("music_recommendations")
        .insert(recommendations);

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      // Success! Reset and close
      onSent();
      handleClose();
    } catch (error) {
      console.error("Error sending recommendations:", error);

      // Show more detailed error message
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      alert(
        `Failed to send recommendation:\n${errorMessage}\n\nCheck console for details.`
      );
    } finally {
      setSending(false);
    }
  };

  // Reset modal state
  const handleClose = () => {
    setStep("search");
    setSearchQuery("");
    setSearchResults([]);
    setSelectedSong(null);
    setSelectedFriendIds([]);
    setFriendSearchQuery("");
    setRecommendationType("listen");
    setMessage("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {step === "search" && "Search for Music"}
            {step === "select-friend" && "Send to Friends"}
            {step === "message" && "Add a Message"}
          </h2>
          <button
            onClick={handleClose}
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
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Start typing to search for songs, artists, or albums..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    autoFocus
                  />
                  {searching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
                      Searching...
                    </div>
                  )}
                </div>
              </div>

              {/* Results */}
              {searchResults.length > 0 && (
                <div className="space-y-1">
                  {searchResults.map((song, index) => (
                    <button
                      key={song.external_id}
                      onClick={() => handleSelectSong(song)}
                      className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      {/* Track Number */}
                      <div className="w-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                        {index + 1}
                      </div>

                      {/* Album Art */}
                      {song.poster_url ? (
                        <img
                          src={song.poster_url}
                          alt={song.title}
                          className="w-12 h-12 rounded object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                          <MusicIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {song.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {song.artist} • {song.album}
                        </div>
                      </div>

                      {/* Year */}
                      {song.year && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {song.year}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {searchResults.length === 0 && !searching && searchQuery && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No results found. Try a different search.
                </div>
              )}

              {!searchQuery && (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                  <MusicIcon className="w-16 h-16 mx-auto mb-3 opacity-50" />
                  <p>Start typing to search for music</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Friends */}
          {step === "select-friend" && selectedSong && (
            <div>
              {/* Selected Song Preview */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center gap-4">
                {selectedSong.poster_url && (
                  <img
                    src={selectedSong.poster_url}
                    alt={selectedSong.title}
                    className="w-16 h-16 rounded object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white truncate">
                    {selectedSong.title}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {selectedSong.artist}
                  </div>
                </div>
              </div>

              {/* Friends Multi-Select */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Send to:
                  </h3>
                  <div className="flex gap-2">
                    {selectedFriendIds.length > 0 && (
                      <button
                        type="button"
                        onClick={deselectAllFriends}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        Clear all
                      </button>
                    )}
                    {friends.length > 1 && (
                      <button
                        type="button"
                        onClick={selectAllFriends}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        Select all ({friends.length})
                      </button>
                    )}
                  </div>
                </div>

                {friends.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No friends found. Invite some friends to share music!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Search Box */}
                    {friends.length > 3 && (
                      <div className="relative">
                        <Search
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                          size={16}
                        />
                        <input
                          type="text"
                          value={friendSearchQuery}
                          onChange={(e) => setFriendSearchQuery(e.target.value)}
                          placeholder="Search friends..."
                          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    )}

                    {/* Selected Count */}
                    {selectedFriendIds.length > 0 && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-600 dark:text-blue-400">
                        <Check size={16} />
                        {selectedFriendIds.length} friend
                        {selectedFriendIds.length !== 1 ? "s" : ""} selected
                      </div>
                    )}

                    {/* Recent Friends Section */}
                    {getRecentFriends().length > 0 && !friendSearchQuery && (
                      <div>
                        <div className="flex items-center gap-2 mb-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          <Clock size={12} />
                          Recent
                        </div>
                        <div className="space-y-1">
                          {getRecentFriends().map((friend) => (
                            <button
                              key={friend.user_id}
                              type="button"
                              onClick={() => toggleFriend(friend.user_id)}
                              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                selectedFriendIds.includes(friend.user_id)
                                  ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500"
                                  : "bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                              }`}
                            >
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {friend.display_name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 text-left">
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {friend.display_name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Recently sent
                                </div>
                              </div>
                              {selectedFriendIds.includes(friend.user_id) && (
                                <Check
                                  className="text-blue-600 dark:text-blue-400"
                                  size={20}
                                />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* All Friends Section */}
                    {getFilteredFriends().length > 0 && (
                      <div>
                        {getRecentFriends().length > 0 &&
                          !friendSearchQuery && (
                            <div className="flex items-center gap-2 mb-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              <Users size={12} />
                              All Friends
                            </div>
                          )}
                        <div className="space-y-1 max-h-60 overflow-y-auto">
                          {getFilteredFriends()
                            .filter((f) => !recentFriendIds.includes(f.user_id))
                            .map((friend) => (
                              <button
                                key={friend.user_id}
                                type="button"
                                onClick={() => toggleFriend(friend.user_id)}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                  selectedFriendIds.includes(friend.user_id)
                                    ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500"
                                    : "bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                }`}
                              >
                                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                  {friend.display_name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 text-left font-medium text-gray-900 dark:text-white">
                                  {friend.display_name}
                                </div>
                                {selectedFriendIds.includes(friend.user_id) && (
                                  <Check
                                    className="text-blue-600 dark:text-blue-400"
                                    size={20}
                                  />
                                )}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* No Results */}
                    {friendSearchQuery && getFilteredFriends().length === 0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No friends found matching "{friendSearchQuery}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Optional Message */}
          {step === "message" && selectedSong && (
            <div>
              {/* Selected Song Preview */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center gap-4">
                {selectedSong.poster_url && (
                  <img
                    src={selectedSong.poster_url}
                    alt={selectedSong.title}
                    className="w-16 h-16 rounded object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white truncate">
                    {selectedSong.title}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Sending to {selectedFriendIds.length} friend
                    {selectedFriendIds.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>

              {/* Recommendation Type Selection - Compact */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  How should they experience it?
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRecommendationType("listen")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-colors ${
                      recommendationType === "listen"
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500"
                    }`}
                  >
                    <Headphones size={18} />
                    <span className="font-medium">Listen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecommendationType("watch")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-colors ${
                      recommendationType === "watch"
                        ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                        : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500"
                    }`}
                  >
                    <Video size={18} />
                    <span className="font-medium">Watch</span>
                  </button>
                </div>
              </div>

              {/* Message Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Add a message (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Why do you think they'll like this?"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  rows={4}
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                  {message.length}/500
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <button
            onClick={() => {
              if (step === "select-friend") setStep("search");
              else if (step === "message") setStep("select-friend");
            }}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            {step !== "search" && "← Back"}
          </button>

          <div className="flex gap-2">
            {step === "select-friend" && selectedFriendIds.length > 0 && (
              <button
                onClick={() => setStep("message")}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Continue
              </button>
            )}
            {step === "message" && (
              <>
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Send size={16} />
                  {sending ? "Sending..." : "Send"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendMusicModal;
