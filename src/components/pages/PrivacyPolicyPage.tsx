import React from "react";
import LandingLayout from "../landing/LandingLayout";
import { LANDING_PEACH } from "../../data/landingTheme";
import { usePageMeta } from "../../hooks/usePageMeta";

const pageMetaOptions = {
  title: "Privacy Policy",
  description:
    "How NPC Finder collects, stores, and protects your data.",
  canonical: "https://npcfinder.com/privacy",
};

const PrivacyPolicyPage: React.FC = () => {
  usePageMeta(pageMetaOptions);

  return (
    <LandingLayout>
      <section className="max-w-3xl mx-auto px-6 py-16 sm:py-20">
        <header className="mb-10 border-b border-white/10 pb-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <h2
              className="text-3xl sm:text-4xl font-bold tracking-tight"
              style={{ color: LANDING_PEACH }}
            >
              Privacy Policy
            </h2>
            <div className="text-sm text-gray-400 text-left sm:text-right">
              <p>Effective date: September 13, 2025</p>
              <p>Last updated: September 5, 2026</p>
            </div>
          </div>
        </header>

        <div className="space-y-8 text-sm leading-6 text-gray-300">
          <section>
            <p>
              NPC Finder is a small personal project built and run by one
              person, not a company. This policy explains what the app stores
              and why, in plain terms.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">
              What We Collect
            </h3>
            <p className="mb-2">
              The app stores the information needed to run your account and
              the features you use, including:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Account information: your email address and display name.</li>
              <li>
                Tracker data you add: media entries, notes, ratings, and
                timeline dates for movies, TV, books, music, and games.
              </li>
              <li>
                Playlists you create and any items, notes, or comments shared
                within them with friends you invite.
              </li>
              <li>
                Basic crash and error reports (via Sentry) if something breaks,
                so it can get fixed. These are stripped of sensitive fields
                like emails, tokens, and passwords before they're sent.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">
              Data Processing
            </h3>
            <p>
              The app runs on{" "}
              <a
                href="https://supabase.com/privacy"
                target="_blank"
                rel="noreferrer"
                className="text-teal-300 underline-offset-2 hover:underline"
              >
                Supabase
              </a>{" "}
              for authentication and data storage, and{" "}
              <a
                href="https://sentry.io/privacy/"
                target="_blank"
                rel="noreferrer"
                className="text-teal-300 underline-offset-2 hover:underline"
              >
                Sentry
              </a>{" "}
              for error monitoring. No other third parties process your data.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">Sharing</h3>
            <p>
              Your tracker data is private by default. Playlists are only
              visible to people you explicitly invite to them. There is no
              public profile, feed, or discovery surface where your activity
              is shown to strangers.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">
              What We Do Not Do
            </h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>We do not sell or share your data with advertisers.</li>
              <li>We do not run analytics or ad-tracking scripts.</li>
              <li>We do not build behavior-based advertising profiles.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">
              Account Deletion
            </h3>
            <p>
              You can delete your account at any time from Settings. This
              permanently removes your tracker data, playlists, and account
              record from the database.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">
              Privacy Requests
            </h3>
            <p>
              For privacy questions or requests, contact:{" "}
              hello@aftongauntlett.com
            </p>
          </section>
        </div>
      </section>
    </LandingLayout>
  );
};

export default PrivacyPolicyPage;
