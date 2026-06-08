import { ExternalLink, ArrowUpRight } from "lucide-react";
import type { AIModel } from "@/lib/types";
import { findCompany } from "@/lib/companies";

interface ModelActionsProps {
  model: AIModel;
  accent: string;
}

/**
 * "Visit Website" + "Try {model}" buttons. Shared by the model detail modal
 * header and the full model page so both stay in sync.
 */
export default function ModelActions({ model, accent }: ModelActionsProps) {
  const company = findCompany(model.company);
  const website = company ? `https://${company.domain}` : null;

  return (
    <div className="flex items-center gap-2 shrink-0">
      {website && (
        <a
          href={website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-bg-surface border border-border-strong text-[13px] font-bold text-text-primary hover:border-text-tertiary transition-colors whitespace-nowrap"
        >
          <ExternalLink size={14} aria-hidden="true" /> Visit Website
        </a>
      )}
      <a
        href={model.websiteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-bold text-white transition-opacity hover:opacity-90 whitespace-nowrap"
        style={{ backgroundColor: accent }}
      >
        Try {model.name} <ArrowUpRight size={14} aria-hidden="true" />
      </a>
    </div>
  );
}
