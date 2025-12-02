import React, { useEffect } from "react";
import type { TemplateType } from "../../utils/boardTemplates";

interface TemplateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: TemplateType) => void;
}

const TemplateSelectionModal: React.FC<TemplateSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  // Handle ESC key and body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const templates = [
    {
      id: "markdown",
      name: "To-Do List",
      desc: "Markdown-style list with support for bold, bullets, and formatting",
    },
    {
      id: "job_tracker",
      name: "Job Applications",
      desc: "Quick add via URL and track job applications with detailed fields",
    },
    {
      id: "recipe",
      name: "Recipe Collection",
      desc: "Quick add via URL and organize recipes with ingredients and instructions",
    },
    {
      id: "kanban",
      name: "Kanban Board",
      desc: "Drag-and-drop style board for organizing tasks in columns",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-6 font-heading">
          Choose a Board Template
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template.id as TemplateType)}
              className="p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 text-left transition-all duration-200 group flex flex-col items-start"
            >
              <div className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 mb-2 transition-colors">
                {template.name}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 flex-grow">
                {template.desc}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TemplateSelectionModal;
