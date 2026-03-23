import React from "react";
import { Quote } from "lucide-react";

interface ExpertCardProps {
  name: string;
  handle: string;
  avatar: string;
  quote: string;
  source: string;
}

function ExpertCardInner({
  name,
  handle,
  avatar,
  quote,
  source,
}: ExpertCardProps) {
  return (
    <div className="bg-bg-card border border-border-subtle rounded-xl p-5 flex flex-col gap-4 hover:border-border-strong transition-colors">
      {/* Quote icon */}
      <Quote size={20} className="text-primary shrink-0" aria-hidden="true" />

      {/* Quote text */}
      <blockquote className="text-sm text-text-secondary leading-relaxed italic">
        &ldquo;{quote}&rdquo;
      </blockquote>

      {/* Author info */}
      <div className="flex items-center gap-3 mt-auto pt-2 border-t border-border-subtle">
        {/* Avatar circle */}
        <div
          className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary"
          aria-hidden="true"
        >
          {avatar}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary">{name}</p>
          <p className="text-xs text-text-tertiary">
            {handle} &middot; {source}
          </p>
        </div>
      </div>
    </div>
  );
}

const ExpertCard = React.memo(ExpertCardInner);
export default ExpertCard;
