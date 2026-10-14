"use client";

import { ArrowLeft, ArrowRight, type LucideIcon } from "lucide-react";

// 홈 가로 슬라이드의 전환 버튼. 뉴스 → 비교(오른쪽 가장자리)와 비교 → 뉴스(왼쪽 가장자리)가
// 같은 모양을 좌우만 뒤집어 쓴다.
export default function SlideTab({
  direction,
  icon: Icon,
  label,
  onClick,
}: {
  direction: "left" | "right";
  icon: LucideIcon;
  label: [string, string]; // 두 줄
  onClick: () => void;
}) {
  const Arrow = direction === "right" ? ArrowRight : ArrowLeft;
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-3 rounded-2xl border border-primary/40 bg-gradient-to-b from-primary/15 to-violet-500/10 px-4 py-6 backdrop-blur hover:border-primary hover:from-primary/25 transition-colors cursor-pointer"
    >
      <Icon size={22} className="text-primary-light" />
      <span className="text-center text-xs font-semibold leading-snug text-text-primary">
        {label[0]}
        <br />
        {label[1]}
      </span>
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white transition-transform ${
          direction === "right" ? "group-hover:translate-x-1" : "group-hover:-translate-x-1"
        }`}
      >
        <Arrow size={16} />
      </span>
    </button>
  );
}
