import { COMPANIES } from "./companies";

interface MatchInput {
  title?: string | null;
  source?: string | null;
}

// Pre-compile every alias into a word-boundary regex. Longest aliases first so
// the most specific name wins (e.g. "Bristol Myers Squibb" before "Merck").
// `&` is treated as part of a name so "AT&T" / "Procter & Gamble" match cleanly.
const PATTERNS: { slug: string; re: RegExp; len: number }[] = COMPANIES.flatMap(
  (c) =>
    c.aliases.map((a) => {
      const escaped = a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return {
        slug: c.slug,
        re: new RegExp(`(?<![\\w&])${escaped}(?![\\w&])`, "i"),
        len: a.length,
      };
    }),
).sort((a, b) => b.len - a.len);

function matchInText(text?: string | null): string | null {
  if (!text) return null;
  for (const p of PATTERNS) {
    if (p.re.test(text)) return p.slug;
  }
  return null;
}

/**
 * Detect which company an article is about, by scanning its text for a known
 * brand name. Only the title and source are checked (summary is excluded — a
 * company merely mentioned in passing there should not claim the logo).
 * Title wins over source. Returns the company slug, or null if none matched.
 */
export function matchCompanySlug(article: MatchInput): string | null {
  return matchInText(article.title) ?? matchInText(article.source);
}
