import { motion } from "framer-motion";
import {
  X,
  Eye,
  RotateCcw,
  Headphones,
  Video,
  BookOpen,
  Gamepad2,
} from "lucide-react";

interface Friend {
  user_id: string;
  display_name: string;
}

interface RecommendationType {
  value: string;
  label: string;
}

interface SendMediaModalDetailsStepProps {
  selectedFriends: Set<string>;
  friends: Friend[];
  recommendationTypes?: RecommendationType[];
  recommendationType?: string;
  setRecommendationType: (type: string) => void;
  message: string;
  setMessage: (message: string) => void;
  mediaType: "music" | "movies" | "books" | "games";
  onRemoveFriend: (friendId: string) => void;
}

export default function SendMediaModalDetailsStep({
  selectedFriends,
  friends,
  recommendationTypes,
  recommendationType,
  setRecommendationType,
  message,
  setMessage,
  mediaType,
  onRemoveFriend,
}: SendMediaModalDetailsStepProps) {
  return (
    <div className="space-y-4">
      {/* Recipients List */}
      <div>
        <label className="block text-sm font-medium text-gray-400 dark:text-gray-400 mb-3 uppercase tracking-wider">
          Sending to ({selectedFriends.size})
        </label>
        <div className="flex flex-wrap gap-2">
          {Array.from(selectedFriends).map((friendId) => {
            const friend = friends.find((f) => f.user_id === friendId);
            if (!friend) return null;
            return (
              <button
                key={friendId}
                onClick={() => onRemoveFriend(friendId)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 dark:bg-primary/10 border border-primary/30 dark:border-primary/30 text-primary dark:text-primary-light hover:bg-primary/20 dark:hover:bg-primary/20 transition-colors group"
                aria-label={`Remove ${friend.display_name} from recipients`}
              >
                <span className="text-sm font-medium">
                  {friend.display_name}
                </span>
                <X
                  size={14}
                  className="text-primary/60 dark:text-primary-light/60 group-hover:text-primary dark:group-hover:text-primary-light transition-colors"
                />
              </button>
            );
          })}
        </div>
        {selectedFriends.size === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            No recipients selected. Go back to select friends.
          </p>
        )}
      </div>

      {/* Only show recommendation type selector if there are types */}
      {recommendationTypes && recommendationTypes.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-400 dark:text-gray-400 mb-4 uppercase tracking-wider">
            Recommendation Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            {recommendationTypes.map((type) => {
              const isSelected = recommendationType === type.value;

              // Choose icon and color based on media type and recommendation type
              let Icon = Eye;
              let accentColor = "#3b82f6"; // blue
              let bgGradient = "from-blue-500/10 to-blue-600/5";
              let hoverGlow = "rgba(59, 130, 246, 0.3)";

              // Music icons
              if (mediaType === "music") {
                if (type.value === "listen") {
                  Icon = Headphones;
                  accentColor = "#3b82f6";
                  bgGradient = "from-blue-500/10 to-blue-600/5";
                  hoverGlow = "rgba(59, 130, 246, 0.3)";
                } else if (type.value === "watch") {
                  Icon = Video;
                  accentColor = "#6366f1";
                  bgGradient = "from-indigo-500/10 to-indigo-600/5";
                  hoverGlow = "rgba(99, 102, 241, 0.3)";
                }
              }
              // Movie/TV icons
              else if (mediaType === "movies") {
                if (type.value === "watch") {
                  Icon = Eye;
                  accentColor = "#3b82f6";
                  bgGradient = "from-blue-500/10 to-blue-600/5";
                  hoverGlow = "rgba(59, 130, 246, 0.3)";
                } else if (type.value === "rewatch") {
                  Icon = RotateCcw;
                  accentColor = "#6366f1";
                  bgGradient = "from-indigo-500/10 to-indigo-600/5";
                  hoverGlow = "rgba(99, 102, 241, 0.3)";
                }
              }
              // Book icons
              else if (mediaType === "books") {
                if (type.value === "read") {
                  Icon = BookOpen;
                  accentColor = "#3b82f6";
                  bgGradient = "from-blue-500/10 to-blue-600/5";
                  hoverGlow = "rgba(59, 130, 246, 0.3)";
                } else if (type.value === "listen") {
                  Icon = Headphones;
                  accentColor = "#6366f1";
                  bgGradient = "from-indigo-500/10 to-indigo-600/5";
                  hoverGlow = "rgba(99, 102, 241, 0.3)";
                }
              }
              // Game icons
              else if (mediaType === "games") {
                if (type.value === "play") {
                  Icon = Gamepad2;
                  accentColor = "#3b82f6";
                  bgGradient = "from-blue-500/10 to-blue-600/5";
                  hoverGlow = "rgba(59, 130, 246, 0.3)";
                } else if (type.value === "replay") {
                  Icon = RotateCcw;
                  accentColor = "#6366f1";
                  bgGradient = "from-indigo-500/10 to-indigo-600/5";
                  hoverGlow = "rgba(99, 102, 241, 0.3)";
                }
              }
              return (
                <motion.button
                  key={type.value}
                  onClick={() => setRecommendationType(type.value)}
                  className={`group relative flex flex-col items-center justify-center gap-3 py-5 px-4 rounded-xl transition-all duration-300 ${
                    isSelected
                      ? `bg-gradient-to-br ${bgGradient} border-2`
                      : "bg-gray-800/40 dark:bg-gray-800/40 border-2 border-gray-700/30"
                  }`}
                  style={{
                    borderColor: isSelected ? accentColor : undefined,
                  }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    boxShadow: isSelected
                      ? `0 0 30px ${hoverGlow}, 0 10px 20px -5px rgba(0,0,0,0.3)`
                      : "0 4px 6px -1px rgba(0,0,0,0.1)",
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Icon with animation */}
                  <motion.div
                    animate={
                      isSelected
                        ? { scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] }
                        : { scale: 1, rotate: 0 }
                    }
                    transition={{
                      duration: 0.5,
                      ease: "easeInOut",
                    }}
                  >
                    <Icon
                      size={28}
                      className="transition-all duration-300"
                      style={{
                        color: isSelected ? accentColor : "#9ca3af",
                        filter: isSelected
                          ? `drop-shadow(0 0 8px ${hoverGlow})`
                          : "none",
                      }}
                      strokeWidth={1.5}
                    />
                  </motion.div>

                  {/* Label */}
                  <span
                    className={`text-sm font-semibold transition-colors duration-300 ${
                      isSelected
                        ? "text-white"
                        : "text-gray-400 group-hover:text-gray-300"
                    }`}
                  >
                    {type.label}
                  </span>

                  {/* Shine effect on hover */}
                  <motion.div
                    className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                  >
                    <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </motion.div>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      <div className="pt-6">
        <label className="block text-sm font-medium text-gray-400 dark:text-gray-400 mb-4 uppercase tracking-wider">
          Message (Optional)
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a note about why you're recommending this..."
          className="w-full px-4 py-4 border border-gray-700/50 dark:border-gray-700/50 rounded-xl bg-gray-900/40 dark:bg-gray-900/40 text-gray-300 dark:text-gray-300 placeholder:text-gray-500 dark:placeholder:text-gray-500 resize-none focus:outline-none focus:border-gray-600 dark:focus:border-gray-600 focus:bg-gray-800/50 dark:focus:bg-gray-800/50 transition-all"
          rows={4}
        />
      </div>
    </div>
  );
}
