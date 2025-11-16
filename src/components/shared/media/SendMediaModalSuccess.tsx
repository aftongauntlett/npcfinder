import { Check } from "lucide-react";

export default function SendMediaModalSuccess() {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: "var(--color-primary-pale)" }}
      >
        <Check className="w-8 h-8" style={{ color: "var(--color-primary)" }} />
      </div>
      <p className="text-lg font-semibold text-gray-900 dark:text-white">
        Sent!
      </p>
    </div>
  );
}
