import { useEffect } from "react";

interface PageMetaOptions {
  title: string;
  description?: string;
  ogImage?: string;
  canonical?: string;
  noIndex?: boolean; // For authenticated pages
}

export function usePageMeta(options: PageMetaOptions) {
  useEffect(() => {
    // Set document title
    document.title = `${options.title} | NPC Finder`;

    // Compute normalized canonical URL (exclude query params and hash)
    const normalizedUrl =
      options.canonical ||
      `${window.location.origin}${window.location.pathname}`;

    // Update or create meta tags
    updateMetaTag(
      "name",
      "description",
      options.description ||
        "Your personal dashboard for entertainment, music, games, tasks, and memories."
    );
    updateMetaTag("property", "og:title", options.title);
    updateMetaTag(
      "property",
      "og:description",
      options.description ||
        "Your personal dashboard for entertainment, music, games, tasks, and memories."
    );
    updateMetaTag("property", "og:image", options.ogImage || "/og-image.png");
    updateMetaTag("property", "og:url", normalizedUrl);

    // Canonical URL
    updateLinkTag("canonical", normalizedUrl);

    // Robots meta (noindex for authenticated pages)
    if (options.noIndex) {
      updateMetaTag("name", "robots", "noindex, nofollow");
    } else {
      // Reset to default for public pages
      updateMetaTag("name", "robots", "index, follow");
    }

    // Cleanup on unmount (reset to defaults)
    return () => {
      document.title = "NPC Finder";
    };
  }, [
    options.title,
    options.description,
    options.ogImage,
    options.canonical,
    options.noIndex,
  ]);
}

function updateMetaTag(
  attr: "name" | "property",
  key: string,
  content: string
) {
  let tag = document.querySelector(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function updateLinkTag(rel: string, href: string) {
  let tag = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute("href", href);
}
