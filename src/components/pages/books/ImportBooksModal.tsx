import React from "react";
import Modal from "../../shared/Modal";
import Button from "../../shared/Button";

interface ImportBooksModalProps {
  onClose: () => void;
}

/**
 * Placeholder for future bulk import feature
 * Similar to ImportMediaModal but for books
 */
const ImportBooksModal: React.FC<ImportBooksModalProps> = ({ onClose }) => {
  return (
    <Modal isOpen={true} onClose={onClose} title="Import Books" maxWidth="lg">
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Bulk import feature coming soon!
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Import your reading list from Goodreads, LibraryThing, or CSV files.
          </p>
        </div>
        <div className="flex justify-end">
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ImportBooksModal;
