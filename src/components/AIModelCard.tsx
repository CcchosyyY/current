import React from "react";
import type { AIModel } from "@/lib/types";

interface AIModelCardProps {
  model: AIModel;
}

function AIModelCardInner({ model }: AIModelCardProps) {
  return (
    <a
      href={model.websiteUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${model.name} by ${model.company}`}
      className="group flex flex-col items-center justify-center aspect-square rounded-xl border border-border-subtle hover:border-border-strong transition-all hover:scale-[1.03] cursor-pointer"
      style={{
        background: `linear-gradient(135deg, ${model.color}15, ${model.color}08)`,
      }}
    >
      {/* Brand color circle with initial */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-2 text-sm font-bold text-white shadow-sm"
        style={{ backgroundColor: model.color }}
        aria-hidden="true"
      >
        {model.name.slice(0, 2)}
      </div>

      {/* Model name */}
      <span className="text-xs font-semibold text-text-primary text-center leading-tight px-1 truncate w-full">
        {model.name}
      </span>

      {/* Company */}
      <span className="text-[10px] text-text-tertiary text-center truncate w-full px-1">
        {model.company}
      </span>
    </a>
  );
}

const AIModelCard = React.memo(AIModelCardInner);
export default AIModelCard;
