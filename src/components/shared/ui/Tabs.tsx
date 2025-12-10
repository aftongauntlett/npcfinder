import React, { useCallback, useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { motion } from "framer-motion";

export interface Tab {
  id: string;
  label: string;
  icon?: React.ElementType;
  badge?: number;
  closeable?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTabId: string | undefined;
  onTabChange: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
  ariaLabel: string;
}

/**
 * Accessible Tab Component
 * 
 * Implements WAIARIA tab pattern with:
 * - role="tablist" container
 * - role="tab" buttons with aria-selected and aria-controls
 * - Keyboard navigation (Arrow keys)
 * - Focus management
 * - Mobile dropdown variant
 */
const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTabId,
  onTabChange,
  onTabClose,
  ariaLabel,
}) => {
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const prevActiveTabRef = useRef<string | undefined>(activeTabId);

  // Scroll active tab into view when it changes
  useEffect(() => {
    if (activeTabId && activeTabId !== prevActiveTabRef.current) {
      prevActiveTabRef.current = activeTabId;

      if (activeTabRef.current) {
        activeTabRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [activeTabId]);

  // Handle keyboard navigation (left/right arrow keys)
  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ) => {
    if (!tabs || tabs.length === 0) return;

    let newIndex = currentIndex;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
    } else {
      return;
    }

    const newTab = tabs[newIndex];
    onTabChange(newTab.id);
  };

  return (
    <>
      {/* Mobile Tab Dropdown */}
      <MobileTabSelector
        tabs={tabs}
        activeTabId={activeTabId}
        onTabChange={onTabChange}
        ariaLabel={ariaLabel}
      />

      {/* Desktop Tabs */}
      <nav
        className="hidden sm:flex gap-0 border-b border-gray-200 dark:border-gray-700 -mb-px overflow-x-auto"
        role="tablist"
        aria-label={ariaLabel}
      >
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTabId === tab.id;
          const isFirstAndNoActive = !activeTabId && index === 0;
          const shouldBeFocusable = isActive || isFirstAndNoActive;
          const panelId = `${tab.id}-panel`;

          return (
            <div key={tab.id} className="flex items-center">
              <motion.button
                id={`${tab.id}-tab`}
                ref={isActive ? activeTabRef : null}
                type="button"
                onClick={() => onTabChange(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, index)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
                  isActive
                    ? "text-primary dark:text-primary-light border-primary dark:border-primary-light"
                    : "text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600"
                } ${tab.closeable ? "pr-2" : ""}`}
                role="tab"
                aria-selected={isActive || isFirstAndNoActive}
                aria-controls={panelId}
                tabIndex={shouldBeFocusable ? 0 : -1}
                animate={{
                  backgroundColor: isActive
                    ? [
                        "rgba(0, 0, 0, 0)",
                        "var(--color-primary-pale)",
                        "rgba(0, 0, 0, 0)",
                      ]
                    : "rgba(0, 0, 0, 0)",
                }}
                transition={{
                  backgroundColor: {
                    duration: 0.6,
                    times: [0, 0.5, 1],
                    ease: "easeInOut",
                  },
                }}
              >
                {Icon && <Icon className="w-5 h-5" aria-hidden="true" />}
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className="flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
                    aria-label={`${tab.badge} items`}
                  >
                    {tab.badge}
                  </span>
                )}
              </motion.button>
              {tab.closeable && onTabClose && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                  className={`ml-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                    isActive
                      ? "text-primary dark:text-primary-light"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                  aria-label={`Close ${tab.label}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </nav>
    </>
  );
};

/**
 * MobileTabSelector - Dropdown tab selector for mobile
 */
interface MobileTabSelectorProps {
  tabs: Tab[];
  activeTabId: string | undefined;
  onTabChange: (tabId: string) => void;
  ariaLabel: string;
}

const MobileTabSelector = React.memo<MobileTabSelectorProps>(
  ({ tabs, activeTabId, onTabChange, ariaLabel }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleTabClick = useCallback(
      (tabId: string) => {
        onTabChange(tabId);
        setIsOpen(false);
      },
      [onTabChange]
    );

    const handleToggle = useCallback(() => {
      setIsOpen((prev) => !prev);
    }, []);

    // Close mobile menu on click outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          menuRef.current &&
          !menuRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener("keydown", handleEscape);
      }

      return () => {
        document.removeEventListener("keydown", handleEscape);
      };
    }, [isOpen]);

    const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
    const activeBadgeText =
      activeTab?.badge !== undefined && activeTab.badge > 0
        ? ` (${activeTab.badge})`
        : "";

    return (
      <div ref={menuRef} className="sm:hidden mb-6 relative">
        <button
          onClick={handleToggle}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-base font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            isOpen
              ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
          aria-label="Select tab"
          aria-expanded={isOpen}
        >
          <span>
            {activeTab?.label}
            {activeBadgeText}
          </span>
          <Check
            className={`w-5 h-5 transition-opacity ${
              isOpen ? "opacity-100" : "opacity-0"
            }`}
          />
        </button>

        {/* Dropdown Menu with proper tab semantics */}
        {isOpen && (
          <div
            className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 max-h-[400px] overflow-y-auto"
            role="tablist"
            aria-label={ariaLabel}
          >
            {tabs.map((tab) => {
              const isActive = activeTabId === tab.id;
              const panelId = `${tab.id}-panel`;
              const badgeText =
                tab.badge !== undefined && tab.badge > 0
                  ? ` (${tab.badge})`
                  : "";

              return (
                <button
                  key={tab.id}
                  id={`${tab.id}-tab`}
                  onClick={() => handleTabClick(tab.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-base transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={panelId}
                >
                  <span>
                    {tab.label}
                    {badgeText}
                  </span>
                  {isActive && <Check className="w-5 h-5 text-primary" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);

MobileTabSelector.displayName = "MobileTabSelector";

export default Tabs;
