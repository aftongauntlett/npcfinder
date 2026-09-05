import React, { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowsOutIcon as ArrowsOut } from "@phosphor-icons/react";
import type { ScreenshotData } from "../../../data/landingScreenshots";
import { hexToRgb } from "../../../data/landingTheme";
import { ScreenshotLightbox } from "./ScreenshotLightbox";

interface ScreenshotShowcaseProps {
  screenshot: ScreenshotData;
  reverse?: boolean;
}

export const ScreenshotShowcase: React.FC<ScreenshotShowcaseProps> = ({
  screenshot,
  reverse = false,
}) => {
  const {
    image,
    imageWidth,
    imageHeight,
    alt,
    icon: Icon,
    iconColor,
    title,
    description,
  } = screenshot;
  const prefersReducedMotion = useReducedMotion();
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const rgbString = useMemo(() => {
    const rgb = hexToRgb(iconColor);
    return rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : "255, 255, 255";
  }, [iconColor]);

  const headingId = `screenshot-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <>
      <motion.article
        className="grid grid-cols-1 lg:grid-cols-2 rounded-2xl border border-white/10 bg-slate-800/30 overflow-hidden"
        style={{
          borderTopWidth: 3,
          borderTopStyle: "solid",
          borderTopColor: `rgba(${rgbString}, 0.5)`,
        }}
        initial={prefersReducedMotion ? undefined : { opacity: 0, y: 24 }}
        whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        whileHover={
          prefersReducedMotion
            ? undefined
            : {
                borderTopColor: `rgba(${rgbString}, 0.9)`,
                boxShadow: `0 0 48px -12px rgba(${rgbString}, 0.4)`,
                transition: { duration: 0.3, ease: "easeOut" },
              }
        }
        transition={{ duration: 0.5, ease: "easeOut" }}
        aria-labelledby={headingId}
      >
        {/* Image */}
        <div
          className={`flex items-center justify-center p-8 sm:p-10 lg:p-12 ${reverse ? "lg:order-2" : ""}`}
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="group relative block w-full rounded-xl overflow-hidden border bg-slate-900/60 shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            style={{ borderColor: `rgba(${rgbString}, 0.25)` }}
            aria-label={`View larger screenshot: ${title}`}
          >
            <img
              src={image}
              alt={alt}
              width={imageWidth}
              height={imageHeight}
              loading="lazy"
              decoding="async"
              className="w-full h-auto block"
            />
            <span
              className="absolute inset-0 flex items-center justify-center bg-slate-950/0 group-hover:bg-slate-950/50 group-focus-visible:bg-slate-950/50 transition-colors duration-200"
              aria-hidden="true"
            >
              <span
                className="flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium text-white opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 group-focus-visible:opacity-100 group-focus-visible:scale-100 transition-all duration-200"
                style={{
                  backgroundColor: "rgba(15, 23, 42, 0.85)",
                  borderColor: `rgba(${rgbString}, 0.4)`,
                }}
              >
                <ArrowsOut className="w-4 h-4" weight="bold" />
                View larger
              </span>
            </span>
          </button>
        </div>

        {/* Text */}
        <div
          className={`flex flex-col justify-center p-8 sm:p-10 ${reverse ? "lg:order-1" : ""}`}
        >
          <div className="flex items-center gap-4 mb-4">
            <div
              className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl border"
              style={{
                backgroundColor: `rgba(${rgbString}, 0.12)`,
                borderColor: `rgba(${rgbString}, 0.3)`,
              }}
            >
              <motion.div
                whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <Icon
                  className="w-6 h-6"
                  style={{ color: iconColor }}
                  weight="duotone"
                  aria-hidden="true"
                />
              </motion.div>
            </div>
            <h4
              id={headingId}
              className="text-xl sm:text-2xl font-bold tracking-tight"
            >
              {title}
            </h4>
          </div>
          <p className="text-gray-300 leading-relaxed">{description}</p>
        </div>
      </motion.article>

      <ScreenshotLightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        image={image}
        imageWidth={imageWidth}
        imageHeight={imageHeight}
        alt={alt}
      />
    </>
  );
};
