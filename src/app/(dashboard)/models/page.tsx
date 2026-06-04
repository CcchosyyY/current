"use client";

import { useMemo, useState } from "react";
import { LayoutGrid } from "lucide-react";
import { AI_MODELS, AI_MODEL_CATEGORIES } from "@/lib/constants";
import type { AIModelCategory, AIModelFilter } from "@/lib/types";
import ModelCard from "@/components/ModelCard";

// Order + display labels for grouped sections when no filter is active.
const CATEGORY_ORDER: { key: AIModelCategory; label: string }[] = [
  { key: "llm", label: "Language Models" },
  { key: "image", label: "Image Generation" },
  { key: "multimodal", label: "Multimodal / Video / Audio" },
  { key: "code", label: "Coding" },
  { key: "search", label: "Search & Agents" },
  { key: "open-source", label: "Open Source" },
];

export default function ModelsPage() {
  const [filter, setFilter] = useState<AIModelFilter>("all");

  const groups = useMemo(() => {
    if (filter !== "all") {
      const items = AI_MODELS.filter((m) => m.category === filter);
      const label =
        CATEGORY_ORDER.find((c) => c.key === filter)?.label ?? "Models";
      return items.length ? [{ label, items }] : [];
    }
    return CATEGORY_ORDER.map((c) => ({
      label: c.label,
      items: AI_MODELS.filter((m) => m.category === c.key),
    })).filter((g) => g.items.length > 0);
  }, [filter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold font-heading text-text-primary flex items-center gap-2">
          <LayoutGrid size={24} className="text-primary" />
          AI Models
          <span className="text-sm font-medium text-text-tertiary tabular-nums">
            {AI_MODELS.length}
          </span>
        </h1>

        <div className="flex items-center gap-1.5 flex-wrap">
          {AI_MODEL_CATEGORIES.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value as AIModelFilter)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                filter === tab.value
                  ? "bg-primary text-white"
                  : "border border-border-subtle text-text-secondary hover:border-border-strong hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-secondary">No models in this category</p>
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.label}>
            <h2 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3">
              {group.label}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {group.items.map((model) => (
                <ModelCard key={model.slug} model={model} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
