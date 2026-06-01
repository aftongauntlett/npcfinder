import React, { useState } from "react";
import { Send, AlertCircle, CheckCircle } from "lucide-react";
import { Button, Input, Textarea, Card } from "@/components/shared";
import { logger } from "@/lib/logger";

const MAX_DESCRIPTION_LENGTH = 400;

const FeedbackSection: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!description.trim()) {
      setError("Please provide a description of your suggestion or feedback");
      return;
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
      setError(
        `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`,
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
    } catch (err) {
      setError("Failed to submit feedback. Please try again later.");
      logger.error("Failed to submit feedback", { error: err, name, email });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card variant="glass" spacing="md" border>
      <form
        onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
          void handleSubmit(e);
        }}
        className="space-y-4"
      >
        <div>
          <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
            Feedback
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Have a suggestion or found a bug? Send feedback directly from your
            settings.
          </p>
        </div>

        {success && (
          <div
            className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-300"
            role="status"
          >
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Your feedback has been submitted successfully.</span>
          </div>
        )}

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

        <div className="flex items-center justify-between pt-1 gap-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {description.length}/{MAX_DESCRIPTION_LENGTH}
          </p>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || !description.trim()}
            icon={<Send className="w-4 h-4" />}
          >
            {isSubmitting ? "Sending..." : "Send Feedback"}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default FeedbackSection;
