import React, { useState } from "react";
import { X } from "lucide-react";
import WeightForm from "./WeightForm";
import MeasurementForm from "./MeasurementForm";
import WorkoutForm from "./WorkoutForm";
import MealForm from "./MealForm";

const QuickLogModal = ({ onClose, onLogAdded }) => {
  const [activeTab, setActiveTab] = useState("weight");

  const tabs = [
    { id: "weight", label: "Weight" },
    { id: "measurements", label: "Measurements" },
    { id: "workout", label: "Workout" },
    { id: "meal", label: "Meal" },
  ];

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Quick Log
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
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
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === "weight" && (
            <WeightForm onSubmit={onLogAdded} onCancel={onClose} />
          )}
          {activeTab === "measurements" && (
            <MeasurementForm onSubmit={onLogAdded} onCancel={onClose} />
          )}
          {activeTab === "workout" && (
            <WorkoutForm onSubmit={onLogAdded} onCancel={onClose} />
          )}
          {activeTab === "meal" && (
            <MealForm onSubmit={onLogAdded} onCancel={onClose} />
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickLogModal;
