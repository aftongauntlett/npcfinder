import React from "react";
import { Link } from "react-router-dom";

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-teal-50 px-4 py-10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="mx-auto w-full max-w-3xl rounded-xl bg-white p-8 shadow-2xl dark:bg-gray-800">
        <header className="mb-8 border-b border-gray-200 pb-5 dark:border-gray-700">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Privacy Policy
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
              What We Collect
            </h2>
            <p className="mt-2">
              We collect the information needed to run the app and your account,
              including:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                Account information such as your email address and profile
                fields.
              </li>
              <li>
                Usage data needed to operate core features and improve
                reliability.
              </li>
              <li>
                Playlist and tracker data you create, edit, and share within the
                app.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Data Processing
            </h2>
            <p className="mt-2">
              We use Supabase as our data processor and infrastructure provider.
              You can read Supabase privacy terms at{" "}
              <a
                href="https://supabase.com/privacy"
                target="_blank"
                rel="noreferrer"
                className="text-teal-600 dark:text-teal-300 underline-offset-2 hover:underline"
              >
                supabase.com/privacy
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              What We Do Not Do
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>We do not sell your personal data.</li>
              <li>We do not use ad tracking networks.</li>
              <li>We do not run behavior-based advertising profiles.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Account Deletion
            </h2>
            <p className="mt-2">
              When you delete your account, your app data is permanently
              removed. We keep only a minimal legal consent log needed to
              demonstrate that you accepted this policy version.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Privacy Requests
            </h2>
            <p className="mt-2">
              For privacy questions or requests, contact:
              hello@aftongauntlett.com
            </p>
          </section>
        </main>

        <footer className="mt-8 border-t border-gray-200 pt-4 text-sm dark:border-gray-700 flex justify-end gap-3">
          <Link
            to="/terms"
            className="inline-flex items-center rounded-md border border-teal-600 px-4 py-2 font-medium text-teal-700 transition-colors hover:bg-teal-50 dark:border-teal-300 dark:text-teal-200 dark:hover:bg-teal-900/30"
          >
            Terms of Service
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

export default PrivacyPolicyPage;
