"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { Locale } from "@/lib/i18n/config";

// 헤더의 언어 전환 (국기). 윈도우는 국기 이모지를 글자(KR/US)로 보여줘서 SVG로 그린다.

function FlagKR({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 2) / 3} viewBox="0 0 36 24" aria-hidden className="rounded-[2px] shadow-sm">
      <rect width="36" height="24" fill="#fff" />
      <g transform="translate(18 12) rotate(33.69)">
        <path d="M-6 0a6 6 0 0 1 12 0z" fill="#CD2E3A" />
        <path d="M-6 0a6 6 0 0 0 12 0z" fill="#0047A0" />
        <circle cx="-3" cy="0" r="3" fill="#CD2E3A" />
        <circle cx="3" cy="0" r="3" fill="#0047A0" />
      </g>
      {/* 4괘 (간략) */}
      <g fill="#000">
        <g transform="translate(6.2 5.2) rotate(-33.69)">
          <rect x="-3" y="-2" width="6" height="0.9" /><rect x="-3" y="-0.45" width="6" height="0.9" /><rect x="-3" y="1.1" width="6" height="0.9" />
        </g>
        <g transform="translate(29.8 18.8) rotate(-33.69)">
          <rect x="-3" y="-2" width="2.6" height="0.9" /><rect x="0.4" y="-2" width="2.6" height="0.9" />
          <rect x="-3" y="-0.45" width="2.6" height="0.9" /><rect x="0.4" y="-0.45" width="2.6" height="0.9" />
          <rect x="-3" y="1.1" width="2.6" height="0.9" /><rect x="0.4" y="1.1" width="2.6" height="0.9" />
        </g>
        <g transform="translate(29.8 5.2) rotate(33.69)">
          <rect x="-3" y="-2" width="2.6" height="0.9" /><rect x="0.4" y="-2" width="2.6" height="0.9" />
          <rect x="-3" y="-0.45" width="6" height="0.9" />
          <rect x="-3" y="1.1" width="2.6" height="0.9" /><rect x="0.4" y="1.1" width="2.6" height="0.9" />
        </g>
        <g transform="translate(6.2 18.8) rotate(33.69)">
          <rect x="-3" y="-2" width="6" height="0.9" />
          <rect x="-3" y="-0.45" width="2.6" height="0.9" /><rect x="0.4" y="-0.45" width="2.6" height="0.9" />
          <rect x="-3" y="1.1" width="6" height="0.9" />
        </g>
      </g>
    </svg>
  );
}

function FlagUS({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 2) / 3} viewBox="0 0 38 26" aria-hidden className="rounded-[2px] shadow-sm">
      <rect width="38" height="26" fill="#fff" />
      {[0, 2, 4, 6, 8, 10, 12].map((i) => (
        <rect key={i} y={i * 2} width="38" height="2" fill="#B22234" />
      ))}
      <rect width="16" height="14" fill="#3C3B6E" />
      <g fill="#fff">
        {[2, 6, 10].map((y) => [2.5, 6.5, 10.5, 14].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="0.9" />))}
        {[4, 8, 12].map((y) => [4.5, 8.5, 12.5].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="0.9" />))}
      </g>
    </svg>
  );
}

const OPTIONS: { value: Locale; label: string; short: string; Flag: typeof FlagKR }[] = [
  { value: "ko", label: "한국어", short: "KO", Flag: FlagKR },
  { value: "en", label: "English", short: "EN", Flag: FlagUS },
];

export default function LanguageSwitcher() {
  const { locale, setLocale, m } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = OPTIONS.find((o) => o.value === locale) ?? OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={m.header.language}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] font-medium text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary cursor-pointer"
      >
        <current.Flag />
        {current.short}
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-xl border border-border-subtle bg-bg-card py-1 shadow-lg shadow-black/20">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              role="menuitemradio"
              aria-checked={o.value === locale}
              onClick={() => {
                setOpen(false);
                if (o.value !== locale) setLocale(o.value);
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary cursor-pointer"
            >
              <o.Flag />
              <span className="flex-1 text-left">{o.label}</span>
              {o.value === locale && <Check size={14} className="text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
