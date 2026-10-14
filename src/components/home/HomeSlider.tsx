"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, FlaskConical } from "lucide-react";
import ComparePanel from "@/components/compare/ComparePanel";
import NewsHome from "./NewsHome";

// 홈 = 뉴스(왼쪽) ↔ 모델 비교(오른쪽) 가로 슬라이드.
// 어느 쪽인지는 주소의 ?view=compare로 둔다 → 뒤로가기·새로고침·로그인 후 복귀가 그대로 동작.

const SLIDE = { type: "spring", stiffness: 90, damping: 20, mass: 0.9 } as const;

export default function HomeSlider() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") === "compare" ? "compare" : "news";

  const go = useCallback(
    (next: "news" | "compare") => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "compare") params.set("view", "compare");
      else params.delete("view");
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  // 키보드: Esc → 뉴스로 (입력 중이 아닐 때)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "Escape" && view === "compare") go("news");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, go]);

  return (
    // 대시보드 main의 여백을 상쇄하고 헤더(48px) 아래를 꽉 채운다. 패널마다 자기 스크롤.
    <div className="relative -mx-6 -my-4 md:-mx-10 md:-my-6 lg:-mx-[130px] lg:-my-8 h-[calc(100vh-48px)] overflow-hidden">
      <motion.div
        className="flex h-full w-[200%]"
        initial={false}
        animate={{ x: view === "news" ? "0%" : "-50%" }}
        transition={SLIDE}
      >
        <section
          className="h-full w-1/2 overflow-y-auto px-6 py-4 md:px-10 md:py-6 lg:px-[130px] lg:py-8"
          aria-hidden={view !== "news"}
          inert={view !== "news"}
        >
          <NewsHome />
        </section>
        <div className="contents" aria-hidden={view !== "compare"} inert={view !== "compare"}>
          <ComparePanel onBack={() => go("news")} />
        </div>
      </motion.div>

      {/* 비교 입구 — 슬라이드 바깥에 둔다 (움직이는 부모 안에선 위치가 같이 밀린다) */}
      <AnimatePresence>
        {view === "news" && (
          <motion.div
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            <button
              onClick={() => go("compare")}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-primary/40 bg-gradient-to-b from-primary/15 to-violet-500/10 px-4 py-6 backdrop-blur hover:border-primary hover:from-primary/25 transition-colors cursor-pointer"
            >
              <FlaskConical size={22} className="text-primary-light" />
              <span className="text-center text-xs font-semibold leading-snug text-text-primary">
                여러 모델
                <br />
                비교해보기
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white transition-transform group-hover:translate-x-1">
                <ArrowRight size={16} />
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
