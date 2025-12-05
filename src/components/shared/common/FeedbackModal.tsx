import React, { useState } from "react";
import { Send, AlertCircle, CheckCircle } from "lucide-react";
import { Button, Input, Textarea, Modal } from "@/components/shared";
import { logger } from "@/lib/logger";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const MAX_DESCRIPTION_LENGTH = 400;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      setError("Please provide a description of your suggestion or feedback");
      return;
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
      setError(
        `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("name", name.trim() || "Anonymous");
      formData.append("email", email.trim() || "No email provided");
      formData.append("message", description.trim());

      const response = await fetch("https://formspree.io/f/xeoykelb", {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      setSuccess(true);
      setName("");
      setEmail("");
      setDescription("");

      // Close modal after 2 seconds
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      setError("Failed to submit feedback. Please try again later.");
      logger.error("Failed to submit feedback", { error: err, name, email });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName("");
      setEmail("");
      setDescription("");
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Submit Feedback"
      maxWidth="md"
    >
      {/* Content */}
      {success ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Thank you!
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Your feedback has been submitted successfully.
          </p>
        </div>
      ) : (
        <form
          onSubmit={(e: React.FormEvent) => {
            void handleSubmit(e);
          }}
          className="space-y-4"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Have a suggestion or found a bug? Let us know! Your feedback helps
            make NPC Finder better.
          </p>

          {error && (
            <div
              className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Input
            id="feedback-name"
            label="Name (optional)"
            type="text"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setName(e.target.value)
            }
            placeholder="Your name"
            disabled={isSubmitting}
            maxLength={100}
          />

          <Input
            id="feedback-email"
            label="Email (optional)"
            type="email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEmail(e.target.value)
            }
            placeholder="your.email@example.com"
            disabled={isSubmitting}
            maxLength={100}
          />

          <Textarea
            id="feedback-description"
            label="Description"
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setDescription(e.target.value)
            }
            placeholder="Describe your suggestion, bug report, or feedback..."
            rows={6}
            disabled={isSubmitting}
            maxLength={MAX_DESCRIPTION_LENGTH}
            required
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !description.trim()}
              icon={<Send className="w-4 h-4" />}
              className="flex-1"
            >
              {isSubmitting ? "Sending..." : "Send Feedback"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default FeedbackModal;
