// Single source of truth for which remote image hosts next/image may optimize.
//
// Imported by `next.config.ts` (to build `images.remotePatterns`) AND by runtime
// code that needs to know, ahead of render, whether a given URL would be accepted
// by next/image. RSS-crawled `image_url`s are untrusted data: some are plain
// `http://`, some point at video files (`.mp4`), some at hosts we never allowed.
// Passing any of those to <Image> throws "Invalid src prop" / "hostname not
// configured" — and because our article pages are server components, that throw
// becomes a 500. We pre-validate instead and simply skip the image.
//
// Keep this module dependency-free so it stays safe to import from both the
// Next config loader and the client bundle.

export interface ImageHostPattern {
  protocol: "https";
  hostname: string; // may use Next's "**." subdomain wildcard
}

// NOTE: Next's "**." wildcard matches subdomains only, NOT the bare apex host,
// so apex hosts (e.g. the-decoder.com serves images from its root) need an
// explicit entry alongside the subdomain wildcard. We intentionally do NOT use
// hostname:"**" — that would turn the Next image optimizer (/_next/image?url=)
// into an open proxy / SSRF vector that can fetch any https URL server-side.
// Add new source hosts here as feeds are added.
export const imageRemotePatterns: ImageHostPattern[] = [
  { protocol: "https", hostname: "**.arstechnica.net" },
  { protocol: "https", hostname: "**.ctfassets.net" },
  { protocol: "https", hostname: "storage.googleapis.com" },
  { protocol: "https", hostname: "the-decoder.com" },
  { protocol: "https", hostname: "**.the-decoder.com" },
  { protocol: "https", hostname: "the-decoder.de" },
  { protocol: "https", hostname: "**.the-decoder.de" },
  { protocol: "https", hostname: "**.technologyreview.com" },
  { protocol: "https", hostname: "techcrunch.com" },
  { protocol: "https", hostname: "**.techcrunch.com" },
  { protocol: "https", hostname: "**.wp.com" },
  { protocol: "https", hostname: "venturebeat.com" },
  { protocol: "https", hostname: "**.venturebeat.com" },
  { protocol: "https", hostname: "placehold.co" },
];

// Extensions next/image cannot render as a still image (video/audio/docs).
// GIF/AVIF/WebP/PNG/JPG are fine and intentionally not listed.
const NON_IMAGE_EXT = /\.(mp4|webm|mov|m4v|avi|mkv|flv|ogg|ogv|mp3|wav|pdf)$/i;

// Mirrors Next's host matching: "**.foo.com" matches a subdomain of foo.com
// (one or more leading labels) but NOT the apex; a bare "foo.com" matches exactly.
function hostMatches(host: string, pattern: string): boolean {
  if (pattern.startsWith("**.")) {
    const base = pattern.slice(3);
    return host.endsWith("." + base);
  }
  return host === pattern;
}

/**
 * Returns true only when `raw` is a URL that next/image will accept: https,
 * an image (not a video/doc), and on a host we've allowlisted above. Callers
 * use this to decide whether to render <Image> at all, so a single bad row of
 * crawled data can never crash the page.
 */
export function isRenderableImageUrl(raw: string | null | undefined): boolean {
  if (!raw) return false;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  if (NON_IMAGE_EXT.test(url.pathname)) return false;
  return imageRemotePatterns.some((p) => hostMatches(url.hostname, p.hostname));
}
