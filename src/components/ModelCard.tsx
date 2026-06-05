"use client";

import React, { useState } from "react";
import Image from "next/image";
import type { AIModel } from "@/lib/types";
import ModelDetailModal from "./ModelDetailModal";

interface ModelCardProps {
  model: AIModel;
}

/**
 * AI model tile. Clicking it opens a detail modal with the model's company
 * info, stats, description and links.
 */
function ModelCardInner({ model }: ModelCardProps) {
  const [open, setOpen] = useState(false);

  const gradient = `linear-gradient(135deg, color-mix(in srgb, ${model.color} 20%, #08080E), color-mix(in srgb, ${
    model.colorSecondary || model.color
  } 12%, #08080E))`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${model.name} by ${model.company} — view details`}
        className="group relative block w-full overflow-hidden rounded-xl aspect-[4/3] cursor-pointer text-left transition-transform duration-300 hover:scale-[1.03] focus-visible:scale-[1.03]"
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
      </button>

      <ModelDetailModal model={open ? model : null} onClose={() => setOpen(false)} />
    </>
  );
}

const ModelCard = React.memo(ModelCardInner);
export default ModelCard;
