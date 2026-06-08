"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { AIModel } from "@/lib/types";
import ModelActions from "./model/ModelActions";
import ModelInfoSections from "./model/ModelInfoSections";
import ModelRelatedNews from "./ModelRelatedNews";

const CATEGORY_LABELS: Record<string, string> = {
  llm: "LLM",
  image: "Image",
  code: "Code",
  search: "Search",
  multimodal: "Multimodal",
  "open-source": "Open Source",
};

interface ModelDetailModalProps {
  model: AIModel | null;
  onClose: () => void;
}

export default function ModelDetailModal({
  model,
  onClose,
}: ModelDetailModalProps) {
  // Close on Escape and lock body scroll while open.
  useEffect(() => {
    if (!model) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [model, onClose]);

  if (typeof document === "undefined") return null;

  const accent = model?.color ?? "#3B82F6";

  return createPortal(
    <AnimatePresence>
      {model && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Card — fixed height with an internal scroll region */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${model.name} details`}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="relative flex max-h-[85vh] w-full max-w-[600px] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-bg-card shadow-2xl shadow-black/50"
          >
            {/* ── Fixed header: logo + action buttons on one centered line,
                 X in the top-right corner. Stays visible while body scrolls. ── */}
            <div
              className="relative shrink-0 px-6 pt-10 pb-5"
              style={{ background: `linear-gradient(180deg, ${accent}26, transparent)` }}
            >
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-bg-surface/70 border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors cursor-pointer z-10"
              >
                <X size={15} />
              </button>

              {/* Logo + identity on the left, actions vertically centered on the
                  right so the buttons line up with the logo. */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${accent}, ${model.colorSecondary || accent})`,
                      boxShadow: `0 8px 24px ${accent}40`,
                    }}
                  >
                    <Image
                      src={`/icons/models/${model.slug}.svg`}
                      alt={model.name}
                      width={30}
                      height={30}
                    />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-text-primary font-heading leading-tight truncate">
                      {model.name}
                    </h2>
                    <p className="text-sm text-text-secondary truncate">
                      by {model.company}
                    </p>
                    <span
                      className="inline-block mt-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                      style={{ color: accent, backgroundColor: `${accent}24` }}
                    >
                      {CATEGORY_LABELS[model.category] ?? model.category}
                    </span>
                  </div>
                </div>

                <ModelActions model={model} accent={accent} />
              </div>
            </div>

            {/* ── Scrollable body ── */}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Latest news — shown first, with a link to the full model page */}
              <ModelRelatedNews
                slug={model.slug}
                accent={accent}
                onNavigate={onClose}
                seeAllHref={`/models/${model.slug}`}
              />

              {/* Shared description / specs / about (collapsible in the modal).
                  Keyed by slug so the collapsed state resets per model. */}
              <ModelInfoSections key={model.slug} model={model} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
