"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { AIModel } from "@/lib/types";
import { findCompany } from "@/lib/companies";
import { MODEL_DETAILS } from "@/lib/model-details";

type Section = "description" | "specs" | "about";

interface ModelInfoSectionsProps {
  model: AIModel;
  // When true (the modal), the description starts collapsed behind a teaser and
  // a Read more / Show less toggle. When false (the full page), everything is
  // shown at once with no toggle.
  collapsible?: boolean;
  // Which sections to render. Defaults to all — the page passes a subset to lay
  // the description and the specs/about infobox out in separate columns.
  show?: Section[];
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-bg-surface border border-border-subtle px-3.5 py-2.5">
      <p className="text-[11px] text-text-tertiary">{label}</p>
      <p className="text-[13px] font-bold text-text-primary mt-0.5 leading-snug">
        {value}
      </p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold tracking-wider text-text-tertiary">
      {children}
    </p>
  );
}

/**
 * The shared "about this model" body: collapsible description (overview +
 * key features + best-for), specs grid, and about-the-company block. Rendered
 * inside the detail modal and on the full /models/[slug] page.
 */
export default function ModelInfoSections({
  model,
  collapsible = true,
  show = ["description", "specs", "about"],
}: ModelInfoSectionsProps) {
  const [expanded, setExpanded] = useState(false);

  const company = findCompany(model.company);
  const companyDetail = company?.detail;
  const accent = model.color ?? "#3B82F6";
  const detail = MODEL_DETAILS[model.slug];

  const overviewParas = detail?.overview
    ? detail.overview.split("\n\n")
    : model.description
      ? [model.description]
      : [];

  const hasDescription =
    overviewParas.length > 0 ||
    (detail?.highlights?.length ?? 0) > 0 ||
    (detail?.bestFor?.length ?? 0) > 0;

  const showFull = !collapsible || expanded;

  return (
    <div className="space-y-6">
      {/* Description (overview + key features + best-for) */}
      {show.includes("description") && hasDescription && (
        <div className="space-y-3">
          {showFull ? (
            <div className="space-y-6">
              {overviewParas.length > 0 && (
                <div className="space-y-2">
                  {overviewParas.map((p, i) => (
                    <p
                      key={i}
                      className="text-[15px] text-text-secondary leading-relaxed"
                    >
                      {p}
                    </p>
                  ))}
                </div>
              )}

              {detail?.highlights && detail.highlights.length > 0 && (
                <div className="space-y-2.5">
                  <SectionLabel>KEY FEATURES</SectionLabel>
                  <ul className="space-y-2">
                    {detail.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2.5">
                        <span
                          className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: `${accent}24`, color: accent }}
                        >
                          <Check size={11} strokeWidth={3} />
                        </span>
                        <span className="text-sm text-text-secondary leading-snug">
                          {h}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {detail?.bestFor && detail.bestFor.length > 0 && (
                <div className="space-y-2">
                  <SectionLabel>BEST FOR</SectionLabel>
                  <div className="flex flex-wrap gap-2">
                    {detail.bestFor.map((b) => (
                      <span
                        key={b}
                        className="text-xs font-medium text-text-secondary bg-bg-surface border border-border-subtle px-3 py-1.5 rounded-full"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Collapsed teaser — first paragraph, clamped to two lines.
            <p className="text-[15px] text-text-secondary leading-relaxed line-clamp-2">
              {overviewParas[0] ?? model.description}
            </p>
          )}

          {collapsible && (
            <button
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="flex items-center gap-1 text-sm font-semibold transition-colors cursor-pointer"
              style={{ color: accent }}
            >
              {expanded ? "Show less" : "Read more"}
              <ChevronDown
                size={16}
                className={`transition-transform ${expanded ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </div>
      )}

      {/* Specs */}
      {show.includes("specs") && detail?.specs && detail.specs.length > 0 && (
        <div className="space-y-2">
          <SectionLabel>SPECS</SectionLabel>
          <div className="grid grid-cols-2 gap-2.5">
            {detail.specs.map((s) => (
              <Stat key={s.label} label={s.label} value={s.value} />
            ))}
          </div>
        </div>
      )}

      {/* About the company */}
      {show.includes("about") && companyDetail && (
        <div className="space-y-2.5">
          <SectionLabel>ABOUT {model.company.toUpperCase()}</SectionLabel>
          {(companyDetail.founded ||
            companyDetail.valuation ||
            companyDetail.hq) && (
            <div className="grid grid-cols-3 gap-2.5">
              {companyDetail.founded && (
                <Stat label="Founded" value={companyDetail.founded} />
              )}
              {companyDetail.valuation && (
                <Stat label="Valuation" value={companyDetail.valuation} />
              )}
              {companyDetail.hq && <Stat label="HQ" value={companyDetail.hq} />}
            </div>
          )}
          {companyDetail.about && (
            <p className="text-sm text-text-secondary leading-relaxed">
              {companyDetail.about}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
