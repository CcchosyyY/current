"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye } from "lucide-react";
import type { AIModel } from "@/lib/types";
import ModelDetailModal from "./ModelDetailModal";

interface ModelCardProps {
  model: AIModel;
}

// Pilot: these models open their full page (/models/[slug]) on click, with a
// "간략히 보기" (quick view) button that opens the modal instead. All other
// models still open the modal directly. Add more slugs (or drop the gate) once
// the UX is confirmed.
const PAGE_FIRST_SLUGS = new Set(["chatgpt"]);

/**
 * AI model tile. Page-first models navigate to the model page and offer a quick
 * "간략히 보기" modal; other models open the detail modal on click.
 */
function ModelCardInner({ model }: ModelCardProps) {
  const [open, setOpen] = useState(false);

  const gradient = `linear-gradient(135deg, color-mix(in srgb, ${model.color} 20%, #08080E), color-mix(in srgb, ${
    model.colorSecondary || model.color
  } 12%, #08080E))`;

  // Decorative tile content (background glow, logo, name) — shared by both modes.
  const visual = (
    <>
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
    </>
  );

  const pageFirst = PAGE_FIRST_SLUGS.has(model.slug);

  return (
    <>
      {pageFirst ? (
        <div
          className="group relative block w-full overflow-hidden rounded-xl aspect-[4/3] transition-transform duration-300 hover:scale-[1.03]"
          style={{ background: gradient }}
        >
          {/* The whole tile navigates to the model page. */}
          <Link
            href={`/models/${model.slug}`}
            aria-label={`${model.name} 페이지 보기`}
            className="absolute inset-0 z-0"
          />
          {/* Decorative content is click-through so the link underneath fires. */}
          <div className="pointer-events-none">{visual}</div>
          {/* Quick view → opens the modal instead of navigating. Icon-only;
              the label shows as a tooltip on hover. */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(true);
            }}
            aria-label="Quick view"
            className="group/qv absolute top-2 right-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-white/90 backdrop-blur-sm hover:bg-black/70 transition-colors cursor-pointer"
          >
            <Eye size={13} aria-hidden="true" />
            <span className="pointer-events-none absolute top-full right-0 mt-1 whitespace-nowrap rounded-md bg-black/85 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity duration-150 group-hover/qv:opacity-100">
              Quick view
            </span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`${model.name} by ${model.company} — view details`}
          className="group relative block w-full overflow-hidden rounded-xl aspect-[4/3] cursor-pointer text-left transition-transform duration-300 hover:scale-[1.03] focus-visible:scale-[1.03]"
          style={{ background: gradient }}
        >
          {visual}
        </button>
      )}

      <ModelDetailModal model={open ? model : null} onClose={() => setOpen(false)} />
    </>
  );
}

const ModelCard = React.memo(ModelCardInner);
export default ModelCard;
