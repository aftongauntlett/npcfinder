import React from "react";
import { Link } from "react-router-dom";

const TermsOfServicePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-teal-50 px-4 py-10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="mx-auto w-full max-w-3xl rounded-xl bg-white p-8 shadow-2xl dark:bg-gray-800">
        <header className="mb-8 border-b border-gray-200 pb-5 dark:border-gray-700">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Terms of Service
            </h1>
            <div className="text-sm text-gray-600 dark:text-gray-300 text-left sm:text-right">
              <p>Effective date: September 13, 2025</p>
              <p>Last updated: June 1, 2026</p>
            </div>
          </div>
        </header>

        <main className="space-y-6 text-sm leading-6 text-gray-700 dark:text-gray-200">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Acceptance
            </h2>
            <p className="mt-2">
              By creating an account or using NPC Finder, you agree to these
              Terms of Service and our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Invite-Only Access
            </h2>
            <p className="mt-2">
              NPC Finder is currently invite-only. Access may be limited,
              suspended, or removed to protect platform safety and stability.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Your Content
            </h2>
            <p className="mt-2">
              You retain ownership of the notes, ratings, and playlists you
              create. You grant us permission to store and process that content
              only to operate and improve the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Acceptable Use
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                Do not attempt unauthorized access to accounts or systems.
              </li>
              <li>Do not upload malicious, harmful, or illegal content.</li>
              <li>
                Do not misuse invite flows, abuse rate limits, or disrupt the
                service.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Account Termination
            </h2>
            <p className="mt-2">
              You may delete your account at any time in Settings. We may
              suspend or terminate accounts that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Changes to Terms
            </h2>
            <p className="mt-2">
              We may update these terms from time to time. Material changes will
              be reflected by an updated policy version and date.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Contact
            </h2>
            <p className="mt-2">
              Questions about these terms: hello@aftongauntlett.com
            </p>
          </section>
        </main>

        <footer className="mt-8 border-t border-gray-200 pt-4 text-sm dark:border-gray-700 flex justify-end gap-3">
          <Link
            to="/privacy"
            className="inline-flex items-center rounded-md border border-teal-600 px-4 py-2 font-medium text-teal-700 transition-colors hover:bg-teal-50 dark:border-teal-300 dark:text-teal-200 dark:hover:bg-teal-900/30"
          >
            Privacy Policy
          </Link>
          <Link
            to="/"
            className="inline-flex items-center rounded-md bg-teal-600 px-4 py-2 font-medium text-white transition-colors hover:bg-teal-500"
          >
            Back to Home
          </Link>
        </footer>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
