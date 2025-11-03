import React, { useState } from "react";

interface Recipient {
  name: string;
  recId: string;
  status: string;
}

interface GroupedSentMediaCardProps<T> {
  mediaItem: T;
  recipients: Recipient[];
  index: number;
  onDelete: (recId: string) => Promise<void>;
  renderMediaArt: (item: T) => React.ReactNode;
  renderMediaInfo: (item: T) => React.ReactNode;
}

/**
 * GroupedSentMediaCard
 * Shows a single media item with all the recipients it was sent to
 * Replaces showing the same item multiple times
 */
function GroupedSentMediaCard<T>({
  mediaItem,
  recipients,
  index,
  onDelete: _onDelete,
  renderMediaArt,
  renderMediaInfo,
}: GroupedSentMediaCardProps<T>) {
  const [showAllRecipients, setShowAllRecipients] = useState(false);
  const maxVisible = 3;
  const hasMore = recipients.length > maxVisible;
  const visibleRecipients = hasMore
    ? recipients.slice(0, maxVisible)
    : recipients;
  const remainingCount = recipients.length - maxVisible;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <div className="flex items-start gap-3">
        {/* Index Number */}
        <div className="w-8 text-center text-gray-500 dark:text-gray-400 text-sm pt-2">
          {index + 1}
        </div>

        {/* Media Art */}
        {renderMediaArt(mediaItem)}

        {/* Media Info + Recipients */}
        <div className="flex-1 min-w-0">
          {renderMediaInfo(mediaItem)}

          {/* Recipients List */}
          <div className="mt-2 flex flex-wrap gap-2">
            {visibleRecipients.map((recipient) => (
              <div
                key={recipient.recId}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300"
              >
                <span className="truncate max-w-[200px]">{recipient.name}</span>
              </div>
            ))}
            {hasMore && (
              <div
                className="relative px-2.5 py-1 rounded-full text-xs font-medium cursor-help bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                onMouseEnter={() => setShowAllRecipients(true)}
                onMouseLeave={() => setShowAllRecipients(false)}
              >
                <span>+{remainingCount}</span>

                {/* Hover Tooltip */}
                {showAllRecipients && (
                  <div className="absolute bottom-full left-0 mb-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg shadow-lg p-3 z-10 min-w-[200px] max-w-[300px]">
                    <div className="text-xs font-semibold mb-2">
                      All Recipients:
                    </div>
                    <div className="space-y-1">
                      {recipients.map((recipient) => (
                        <div key={recipient.recId} className="text-xs">
                          <span>{recipient.name}</span>
                        </div>
                      ))}
                    </div>
                    {/* Arrow pointer */}
                    <div className="absolute top-full left-4 -mt-1 w-2 h-2 bg-gray-900 dark:bg-gray-700 transform rotate-45"></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GroupedSentMediaCard;
