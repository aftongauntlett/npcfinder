import React from "react";
import LandingLayout from "../landing/LandingLayout";
import { LANDING_PEACH } from "../../data/landingTheme";
import { usePageMeta } from "../../hooks/usePageMeta";

const pageMetaOptions = {
  title: "Terms of Service",
  description: "The terms that govern use of NPC Finder.",
  canonical: "https://npcfinder.com/terms",
};

const TermsOfServicePage: React.FC = () => {
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
              Terms of Service
            </h2>
            <div className="text-sm text-gray-400 text-left sm:text-right">
              <p>Effective date: September 13, 2025</p>
              <p>Last updated: September 5, 2026</p>
            </div>
          </div>
        </header>

        <div className="space-y-8 text-sm leading-6 text-gray-300">
          <section>
            <h3 className="text-lg font-semibold text-white mb-2">
              Acceptance
            </h3>
            <p>
              By creating an account or using NPC Finder, you agree to these
              Terms of Service and our Privacy Policy.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">
              A Small Personal Project
            </h3>
            <p>
              NPC Finder is a hobby project built and maintained by one person,
              not a company. Access is invite-only and limited to a small
              circle of friends. It's provided "as is," with no uptime
              guarantees or formal support, and features may change as the
              project evolves.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">
              Your Content
            </h3>
            <p>
              You retain ownership of the notes, ratings, and playlists you
              create. That content is stored only to run the app for you and
              the friends you choose to share playlists with.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">
              Acceptable Use
            </h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Do not attempt unauthorized access to other accounts or
                systems.
              </li>
              <li>Do not upload malicious, harmful, or illegal content.</li>
              <li>
                Do not misuse invite codes, abuse rate limits, or disrupt the
                service for other users.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">
              Account Termination
            </h3>
            <p>
              You may delete your account at any time in Settings, which
              permanently removes your data. Access may also be revoked if
              these terms are violated.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">
              Changes to Terms
            </h3>
            <p>
              These terms may be updated from time to time as the app changes.
              Material changes will be reflected by an updated date above.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">Contact</h3>
            <p>Questions about these terms: hello@aftongauntlett.com</p>
          </section>
        </div>
      </section>
    </LandingLayout>
  );
};

export default TermsOfServicePage;
