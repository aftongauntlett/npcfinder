import { Check } from "lucide-react";

interface Friend {
  user_id: string;
  display_name: string;
}

interface SendMediaModalFriendsStepProps {
  friends: Friend[];
  selectedFriends: Set<string>;
  friendsWithExistingRec: Set<string>;
  loadingFriends: boolean;
  onToggleFriend: (friendId: string) => void;
  onToggleAll: () => void;
}

export default function SendMediaModalFriendsStep({
  friends,
  selectedFriends,
  friendsWithExistingRec,
  loadingFriends,
  onToggleFriend,
  onToggleAll,
}: SendMediaModalFriendsStepProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900 dark:text-white">
          Select Connections
        </h3>
        {friends.length > 1 && (
          <button
            onClick={onToggleAll}
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
        <p className="text-center text-gray-500">Loading connections...</p>
      )}

      {!loadingFriends && friends.length === 0 && (
        <p className="text-center text-gray-500">No connections available.</p>
      )}

      {friends.length > 0 && (
        <div className="space-y-2">
          {friends.map((friend) => {
            const alreadyRecommended = friendsWithExistingRec.has(
              friend.user_id
            );
            const isSelected = selectedFriends.has(friend.user_id);

            return (
              <button
                key={friend.user_id}
                onClick={() =>
                  !alreadyRecommended && onToggleFriend(friend.user_id)
                }
                disabled={alreadyRecommended}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  alreadyRecommended
                    ? "opacity-40 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50"
                    : isSelected
                    ? "bg-gray-100/50 dark:bg-gray-700/30 border border-gray-200/50 dark:border-gray-600/50"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    alreadyRecommended
                      ? "border-gray-300 dark:border-gray-600"
                      : isSelected
                      ? "border-transparent"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  style={
                    isSelected && !alreadyRecommended
                      ? { backgroundColor: "var(--color-primary)" }
                      : undefined
                  }
                >
                  {isSelected && !alreadyRecommended && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </div>
                <span
                  className={
                    alreadyRecommended
                      ? "text-gray-400 dark:text-gray-600"
                      : isSelected
                      ? "text-white"
                      : "text-gray-900 dark:text-white"
                  }
                >
                  {friend.display_name}
                </span>
                {alreadyRecommended && (
                  <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                    Already recommended
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
