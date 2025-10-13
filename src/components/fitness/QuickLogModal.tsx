import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import WeightForm from "./WeightForm";
import MeasurementForm from "./MeasurementForm";
import WorkoutForm from "./WorkoutForm";
import MealForm from "./MealForm";

type TabId = "weight" | "measurements" | "workout" | "meal";

interface Tab {
  id: TabId;
  label: string;
}

interface QuickLogModalProps {
  onClose: () => void;
  onLogAdded: () => void;
}

const TABS: Tab[] = [
  { id: "weight", label: "Weight" },
  { id: "measurements", label: "Measurements" },
  { id: "workout", label: "Workout" },
  { id: "meal", label: "Meal" },
];

const QuickLogModal: React.FC<QuickLogModalProps> = ({
  onClose,
  onLogAdded,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>("weight");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3
            id="modal-title"
            className="text-lg font-medium text-gray-900 dark:text-white"
          >
            Quick Log
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </header>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav
            className="-mb-px flex space-x-4 sm:space-x-8 px-6 overflow-x-auto"
            aria-label="Fitness tracking tabs"
            role="tablist"
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300"
                }`}
                aria-selected={activeTab === tab.id}
                role="tab"
                aria-controls={`${tab.id}-panel`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === "weight" && (
            <div role="tabpanel" id="weight-panel" aria-labelledby="weight-tab">
              <WeightForm onSubmit={onLogAdded} onCancel={onClose} />
            </div>
          )}
          {activeTab === "measurements" && (
            <div
              role="tabpanel"
              id="measurements-panel"
              aria-labelledby="measurements-tab"
            >
              <MeasurementForm onSubmit={onLogAdded} onCancel={onClose} />
            </div>
          )}
          {activeTab === "workout" && (
            <div
              role="tabpanel"
              id="workout-panel"
              aria-labelledby="workout-tab"
            >
              <WorkoutForm onSubmit={onLogAdded} onCancel={onClose} />
            </div>
          )}
          {activeTab === "meal" && (
            <div role="tabpanel" id="meal-panel" aria-labelledby="meal-tab">
              <MealForm onSubmit={onLogAdded} onCancel={onClose} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickLogModal;
