"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { AIModel } from "@/lib/types";
import ModelDetailModal from "./ModelDetailModal";

interface ModelCardProps {
  model: AIModel;
}

/**
 * AI model tile. Clicking the tile opens the model page (/models/[slug]); the
 * "Quick view" button opens the detail modal instead.
 */
function ModelCardInner({ model }: ModelCardProps) {
  const [open, setOpen] = useState(false);

  const gradient = `linear-gradient(135deg, color-mix(in srgb, ${model.color} 20%, #08080E), color-mix(in srgb, ${
    model.colorSecondary || model.color
  } 12%, #08080E))`;

  // Decorative tile content (background glow, logo, name).
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

  return (
    <>
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
        {/* Quick view → opens the modal instead of navigating. A labeled pill (an
            icon alone wasn't clear). Shown on card hover or keyboard focus; always
            visible on touch screens, which have no hover. */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(true);
          }}
          className="absolute top-2 right-2 z-10 rounded-full border border-white/25 bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm hover:bg-black/80 opacity-0 transition-[opacity,background-color] duration-150 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 cursor-pointer"
        >
          Quick view
        </button>
      </div>

      <ModelDetailModal model={open ? model : null} onClose={() => setOpen(false)} />
    </>
  );
}

const ModelCard = React.memo(ModelCardInner);
export default ModelCard;
