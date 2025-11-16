import { motion } from "framer-motion";
import ModernCard from "../../landing/demo/ModernCard";
import Accordion from "../../landing/demo/Accordion";
import { landingAvailability } from "../../../data/landingAvailability";
import { LANDING_PEACH } from "../../../data/landingTheme";

/**
 * AvailabilitySection - Landing page access & availability section
 *
 * Handles access & availability information with documentation accordions.
 */
const AvailabilitySection = () => {
  return (
    <motion.section
      id="availability"
      className="max-w-7xl mx-auto px-6 py-32"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="mb-12">
        <h3 className="text-4xl font-bold mb-3 tracking-tight">
          {landingAvailability.title}
        </h3>
        <p className="text-gray-400 max-w-2xl">
          {landingAvailability.description}
        </p>
      </div>

      {/* Availability Points - Modern 2025 hover effects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {landingAvailability.points.map((point, index) => (
          <ModernCard
            key={index}
            icon={point.icon}
            iconColor={point.iconColor}
            title={point.title}
            description={point.description}
          />
        ))}
      </div>

      {/* Demo Video Coming Soon - Distinct callout style */}
      <div
        className="relative bg-gradient-to-br from-slate-800/30 via-slate-800/20 to-transparent rounded-xl p-8 mb-12 text-center"
        style={{
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: `${LANDING_PEACH}20`,
        }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-14 h-14 flex items-center justify-center rounded-full"
            style={{
              backgroundColor: `${LANDING_PEACH}10`,
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: `${LANDING_PEACH}30`,
            }}
          >
            <svg
              className="w-7 h-7"
              style={{ color: LANDING_PEACH }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white mb-2">
              Demo Video Coming Soon
            </h4>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              {landingAvailability.demoNote}
            </p>
          </div>
        </div>
      </div>

      {/* Documentation Accordions */}
      <div className="space-y-4">
        <Accordion
          title="Invite System Guide"
          defaultOpen={true}
          index={0}
          idPrefix="availability"
        >
          <p className="mb-3">
            Learn how invite codes work and how to generate them for your friend
            group.
          </p>
          <p className="mb-3">
            Admins can create invite codes tied to specific email addresses.
            Each code expires after 30 days and works only once. When someone
            signs up, their email must match the intended recipient - this
            prevents code sharing and unauthorized access.
          </p>
          <a
            href="https://github.com/aftongauntlett/npcfinder/blob/main/docs/INVITE-SYSTEM-QUICKSTART.md"
            style={{ color: LANDING_PEACH }}
            className="hover:opacity-80 underline transition-opacity"
            target="_blank"
            rel="noopener noreferrer"
          >
            View full invite system documentation →
          </a>
        </Accordion>

        <Accordion
          title="Privacy Reality Check"
          defaultOpen={false}
          index={1}
          idPrefix="availability"
        >
          <p className="mb-3">
            NPC Finder uses Row-Level Security to protect your data from other
            users. However, the database administrator has technical access to
            the underlying data, similar to how Netflix or Spotify
            administrators can access their platforms.
          </p>
          <p className="mb-3">
            End-to-end encryption for private messaging and journaling (like
            Signal) is on the future roadmap, but it requires significant
            architectural changes. For now, if you need that level of privacy
            for sensitive communications, use a platform specifically built for
            that purpose.
          </p>
          <a
            href="https://github.com/aftongauntlett/npcfinder/blob/main/docs/PRIVACY-REALITY-CHECK.md"
            style={{ color: LANDING_PEACH }}
            className="hover:opacity-80 underline transition-opacity"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read the full privacy documentation →
          </a>
        </Accordion>

        <Accordion
          title="Quick Start Guide"
          defaultOpen={false}
          index={2}
          idPrefix="availability"
        >
          <p className="mb-3">Set up your own instance from scratch.</p>
          <p className="mb-3">
            Want to run NPC Finder for your own friend group? This guide covers
            everything: cloning the repo, setting up Supabase, configuring API
            keys, running migrations, and deploying to production. Perfect for
            developers who want full control over their data.
          </p>
          <a
            href="https://github.com/aftongauntlett/npcfinder/blob/main/docs/QUICK-START.md"
            style={{ color: LANDING_PEACH }}
            className="hover:opacity-80 underline transition-opacity"
            target="_blank"
            rel="noopener noreferrer"
          >
            View setup instructions →
          </a>
        </Accordion>
      </div>
    </motion.section>
  );
};

export default AvailabilitySection;
