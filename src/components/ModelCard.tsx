"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ExternalLink, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { AIModel } from "@/lib/types";

const CATEGORY_LABELS: Record<string, string> = {
  llm: "LLM",
  image: "Image",
  code: "Code",
  search: "Search",
  multimodal: "Multimodal",
  "open-source": "Open Source",
};

const POP_W = 256; // matches w-64
const POP_H = 210; // approximate popover height for edge-flip math
const GAP = 8;

interface ModelCardProps {
  model: AIModel;
}

/**
 * AI model tile with a hover/focus detail popover.
 * - The tile links to the model's website (click).
 * - Hovering OR keyboard-focusing the tile reveals a popover with the model's
 *   description, category, and external links.
 * - The popover is rendered in a portal with fixed positioning so it escapes the
 *   scroll container's `overflow-y-auto` clipping (otherwise bottom-row cards'
 *   popovers get cut off), and it flips above the tile near the viewport bottom.
 * - A short close delay bridges the gap between tile and portaled popover, and
 *   close is suppressed while keyboard focus is still inside either element.
 */
function ModelCardInner({ model }: ModelCardProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ left: number; top: number } | null>(null);
  const anchorRef = useRef<HTMLAnchorElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  const computeCoords = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Flip above the tile when there isn't room below.
    const openUp = r.bottom + POP_H + GAP > vh && r.top - POP_H - GAP > 0;
    const top = openUp ? r.top - POP_H - GAP : r.bottom + GAP;
    // Center on the tile, then clamp into the viewport.
    let left = r.left + r.width / 2 - POP_W / 2;
    left = Math.max(8, Math.min(left, vw - POP_W - 8));
    setCoords({ left, top });
  }, []);

  const openPop = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    computeCoords();
    setOpen(true);
  }, [computeCoords]);

  const scheduleClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      const active = document.activeElement;
      // Keep open while keyboard focus is still inside the tile or popover.
      if (anchorRef.current?.contains(active) || popRef.current?.contains(active)) {
        return;
      }
      setOpen(false);
    }, 100);
  }, []);

  // Reposition while open (scroll/resize); clean up the timer on unmount.
  useEffect(() => {
    if (!open) return;
    const onMove = () => computeCoords();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open, computeCoords]);

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  const gradient = `linear-gradient(135deg, color-mix(in srgb, ${model.color} 20%, #08080E), color-mix(in srgb, ${
    model.colorSecondary || model.color
  } 12%, #08080E))`;

  const popover = mounted
    ? createPortal(
        <AnimatePresence>
          {open && coords && (
            <motion.div
              ref={popRef}
              role="group"
              aria-label={`${model.name} details`}
              onMouseEnter={openPop}
              onMouseLeave={scheduleClose}
              onFocus={openPop}
              onBlur={scheduleClose}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setOpen(false);
                  anchorRef.current?.focus();
                }
              }}
              initial={{ opacity: 0, y: 4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.97 }}
              transition={{ duration: 0.14 }}
              style={{ position: "fixed", left: coords.left, top: coords.top, width: POP_W }}
              className="z-[60]"
            >
              <div className="rounded-xl border border-border-strong bg-bg-card/95 backdrop-blur-sm shadow-2xl shadow-black/40 p-3.5">
                <div className="flex items-center gap-2.5 mb-2">
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${model.color}, ${
                        model.colorSecondary || model.color
                      })`,
                    }}
                  >
                    <Image
                      src={`/icons/models/${model.slug}.svg`}
                      alt=""
                      width={20}
                      height={20}
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">
                      {model.name}
                    </p>
                    <p className="text-[11px] text-text-tertiary truncate">
                      {model.company}
                    </p>
                  </div>
                  <span
                    className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ color: model.color, backgroundColor: `${model.color}1A` }}
                  >
                    {CATEGORY_LABELS[model.category] ?? model.category}
                  </span>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed mb-3">
                  {model.description}
                </p>

                <div className="flex items-center gap-2">
                  <a
                    href={model.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-medium text-primary border border-primary/30 rounded-lg px-2 py-1.5 hover:bg-primary/10 transition-colors"
                  >
                    <ExternalLink size={12} aria-hidden="true" /> Website
                  </a>
                  {model.blogUrl && (
                    <a
                      href={model.blogUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-medium text-text-secondary border border-border-subtle rounded-lg px-2 py-1.5 hover:border-border-strong hover:text-text-primary transition-colors"
                    >
                      <ArrowUpRight size={12} aria-hidden="true" /> Blog
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )
    : null;

  return (
    <div
      className="relative"
      onMouseEnter={openPop}
      onMouseLeave={scheduleClose}
      onFocus={openPop}
      onBlur={scheduleClose}
    >
      <a
        ref={anchorRef}
        href={model.websiteUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${model.name} by ${model.company}`}
        className="group relative block overflow-hidden rounded-xl aspect-[4/3] cursor-pointer transition-transform duration-300 hover:scale-[1.03] focus-visible:scale-[1.03]"
        style={{ background: gradient }}
      >
        <div className="absolute inset-0 transition-all duration-300 group-hover:brightness-125" />
        <div className="absolute inset-0 flex items-center justify-center pb-6">
          <Image
            src={`/icons/models/${model.slug}.svg`}
            alt={model.name}
            width={40}
            height={40}
            className="drop-shadow-lg transition-transform duration-300 group-hover:scale-110"
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-black/60 to-transparent">
          <p className="text-white text-sm font-semibold leading-tight truncate">
            {model.name}
          </p>
          <p className="text-white/70 text-[10px] truncate">{model.company}</p>
        </div>
      </a>

      {popover}
    </div>
  );
}

const ModelCard = React.memo(ModelCardInner);
export default ModelCard;
