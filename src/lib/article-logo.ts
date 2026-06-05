import companyLogos from "./company-logos.json";
import { matchCompanySlug } from "./company-match";

export type ArticleLogo =
  | { kind: "model"; src: string; alt: string } // /icons/models/<slug>.svg
  | { kind: "company"; src: string; alt: string } // /icons/companies/<file>
  | { kind: "ai" }; // generic "AI" badge

const LOGO_MAP: Record<string, string> = companyLogos;

/**
 * Decide which logo to show for an article, in priority order:
 *   1. its AI model (existing brand SVG)
 *   2. a company detected in title/source/summary (downloaded brand logo)
 *   3. a generic "AI" badge
 */
export function resolveArticleLogo(article: {
  aiModel?: string | null;
  title?: string | null;
  source?: string | null;
}): ArticleLogo {
  if (article.aiModel) {
    return {
      kind: "model",
      src: `/icons/models/${article.aiModel}.svg`,
      alt: article.aiModel,
    };
  }

  const slug = matchCompanySlug(article);
  if (slug && LOGO_MAP[slug]) {
    return {
      kind: "company",
      src: `/icons/companies/${LOGO_MAP[slug]}`,
      alt: slug,
    };
  }

  return { kind: "ai" };
}
