"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, ArrowUpRight } from "lucide-react";
import type { AIModel } from "@/lib/types";
import { findCompany } from "@/lib/companies";

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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-bg-surface border border-border-subtle px-4 py-3">
      <p className="text-[11px] text-text-tertiary">{label}</p>
      <p className="text-[15px] font-bold text-text-primary mt-1 leading-tight">
        {value}
      </p>
    </div>
  );
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

  const company = model ? findCompany(model.company) : null;
  const detail = company?.detail;
  const website = company ? `https://${company.domain}` : null;
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

          {/* Card */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${model.name} details`}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="relative w-full max-w-[560px] overflow-hidden rounded-2xl border border-border-subtle bg-bg-card shadow-2xl shadow-black/50"
          >
            {/* Header banner with brand-color glow */}
            <div
              className="relative px-7 pt-7 pb-6"
              style={{ background: `linear-gradient(180deg, ${accent}26, transparent)` }}
            >
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-bg-surface/70 border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>

              <div
                className="w-[68px] h-[68px] rounded-2xl flex items-center justify-center mb-4"
                style={{
                  background: `linear-gradient(135deg, ${accent}, ${model.colorSecondary || accent})`,
                  boxShadow: `0 8px 24px ${accent}40`,
                }}
              >
                <Image
                  src={`/icons/models/${model.slug}.svg`}
                  alt={model.name}
                  width={36}
                  height={36}
                />
              </div>

              <h2 className="text-2xl font-bold text-text-primary font-heading leading-tight">
                {model.name}
              </h2>
              <p className="text-sm text-text-secondary mt-1">by {model.company}</p>

              <div className="flex items-center gap-2 mt-3">
                <span
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ color: accent, backgroundColor: `${accent}24` }}
                >
                  {CATEGORY_LABELS[model.category] ?? model.category}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="px-7 pt-5 pb-7 space-y-5">
              <p className="text-[15px] text-text-secondary leading-relaxed">
                {model.description}
              </p>

              {detail && (
                <div className="grid grid-cols-3 gap-3">
                  {detail.founded && <Stat label="Founded" value={detail.founded} />}
                  {detail.valuation && (
                    <Stat label="Valuation" value={detail.valuation} />
                  )}
                  {detail.hq && <Stat label="Headquarters" value={detail.hq} />}
                </div>
              )}

              {detail?.about && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold tracking-wider text-text-tertiary">
                    ABOUT
                  </p>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {detail.about}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                {website && (
                  <a
                    href={website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-bg-surface border border-border-strong text-sm font-bold text-text-primary hover:border-text-tertiary transition-colors"
                  >
                    <ExternalLink size={15} aria-hidden="true" /> Visit Website
                  </a>
                )}
                <a
                  href={model.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: accent }}
                >
                  Try {model.name} <ArrowUpRight size={15} aria-hidden="true" />
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
