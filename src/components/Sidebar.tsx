"use client";

import { useEffect, useCallback, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  MessageSquare,
  Image,
  Video,
  Music,
  Code,
  Search,
  Languages,
  Palette,
  Zap,
  Bot,
  Box,
  LayoutGrid,
  X,
  type LucideIcon,
} from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import { useCategoryCounts } from "@/lib/hooks/useCategoryCounts";
import { useSeenCategories } from "@/lib/hooks/useSeenCategories";
import { modelCountsByCategory } from "@/lib/model-sections";
import { useModelsSection } from "@/lib/hooks/useModelsSection";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { categoryName } from "@/lib/i18n/config";
import SidebarToggle from "./SidebarToggle";

const STORAGE_KEY = "sidebar-collapsed";

const ICON_MAP: Record<string, LucideIcon> = {
  brain: Brain,
  "message-square": MessageSquare,
  image: Image,
  video: Video,
  music: Music,
  code: Code,
  search: Search,
  languages: Languages,
  palette: Palette,
  zap: Zap,
  bot: Bot,
  box: Box,
  "layout-grid": LayoutGrid,
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function useSidebarState() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage는 마운트 후에만 읽음 (SSR엔 없음 → 하이드레이션 불일치 방지)
      setCollapsed(true);
    }
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return { collapsed, toggle, mobileOpen, openMobile, closeMobile };
}

const coreCategories = CATEGORIES.filter((c) => c.group === "core");
const extendedCategories = CATEGORIES.filter((c) => c.group === "extended");

export default function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { locale, m } = useLocale();
  const urlCategory = searchParams.get("category") || "all";
  // Models에서는 지금 화면에 보이는 묶음을 강조 (스크롤을 따라감)
  const modelsSection = useModelsSection();
  const activeCategory = pathname === "/models" && modelsSection ? modelsSection : urlCategory;
  // 홈의 비교 화면(?view=compare)에서는 뉴스 카테고리가 쓸모없으니 사이드바를 접어 없앤다
  const hiddenForCompare = pathname === "/" && searchParams.get("view") === "compare";

  // Models에선 스크롤할 때마다 ?category=가 바뀌므로(스크롤 감지) 기사 수 재조회 키에서 카테고리를 뺀다
  const articleCounts = useCategoryCounts(
    pathname === "/models" ? pathname : `${pathname}|${activeCategory}`,
  );
  const { latest } = articleCounts;
  // Models 화면에서는 카테고리 옆 숫자가 기사 수가 아니라 그 묶음의 모델 수
  const onModelsPage = pathname === "/models";
  const { counts: categoryCounts, total } = onModelsPage ? modelCountsByCategory() : articleCounts;
  const { hasNew, markSeen } = useSeenCategories(latest);

  // 홈에서 카테고리를 열면(클릭·주소 이동 모두) 그 카테고리의 "새 글" 점을 지운다
  const homeCategory = pathname === "/" ? activeCategory : null;
  useEffect(() => {
    if (homeCategory) markSeen(homeCategory);
  }, [homeCategory, markSeen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && mobileOpen) {
        onMobileClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onMobileClose]);

  useEffect(() => {
    onMobileClose();
  }, [pathname, searchParams, onMobileClose]);

  // 모바일 드로어 열림 중 배경 본문 스크롤 잠금 (ModelDetailModal과 동일 패턴)
  useEffect(() => {
    if (!mobileOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  function renderCategoryItem(cat: (typeof CATEGORIES)[number], isActive: boolean) {
    const Icon = ICON_MAP[cat.icon] || Brain;
    const count = cat.slug === "all" ? total : categoryCounts[cat.slug] ?? 0;
    // 새 글 점은 기사 이야기라 Models 화면에선 숨긴다
    const showNew = !onModelsPage && hasNew(cat.slug) && !(isActive && pathname === "/");

    return (
      <Link
        key={cat.slug}
        href={`${pathname}?category=${cat.slug}`}
        // Models는 묶음으로 직접 스크롤하므로 Next의 '맨 위로' 스크롤을 끈다 (위로 튀었다 다시 내려오던 문제)
        scroll={!onModelsPage}
        title={collapsed ? categoryName(cat, locale) : undefined}
        className={`group relative flex items-center gap-3 py-[7px] rounded-lg transition-all duration-150 ${
          collapsed ? "justify-center px-2.5" : "pl-3.5 pr-2.5"
        } ${
          isActive
            ? "text-white"
            : "hover:bg-white/[0.04]"
        }`}
        style={
          isActive
            ? ({ backgroundColor: `${cat.color}20`, "--cat-color": cat.color } as React.CSSProperties)
            : ({ "--cat-color": cat.color } as React.CSSProperties)
        }
      >
        {/* Active accent bar */}
        {isActive && (
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full"
            style={{ backgroundColor: cat.color }}
            aria-hidden="true"
          />
        )}

        {/* Icon: text color by default, category color on hover/active */}
        <span className="relative shrink-0">
          <Icon
            size={16}
            className={`transition-all duration-150 group-hover:scale-110 ${
              isActive
                ? "[color:var(--cat-color)]"
                : "text-text-secondary group-hover:[color:var(--cat-color)]"
            }`}
          />
          {/* 새 글 점 (접힌 사이드바) */}
          {showNew && collapsed && (
            <span
              className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full ring-2 ring-bg-sidebar animate-pulse"
              style={{ backgroundColor: cat.color }}
              aria-hidden="true"
            />
          )}
        </span>

        {!collapsed && (
          <>
            <span
              className={`flex-1 text-[12.5px] font-semibold tracking-tight transition-colors ${
                isActive
                  ? "text-text-primary"
                  : "text-text-secondary group-hover:text-text-primary"
              }`}
            >
              {categoryName(cat, locale)}
            </span>
            {/* 새 글 점 — 마지막으로 연 뒤 새 기사가 들어왔을 때. 카테고리를 열면 사라진다 */}
            {showNew && (
              <span
                className="h-1.5 w-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: cat.color }}
                title={m.sidebar.newPosts}
                aria-label={m.sidebar.hasNew}
              />
            )}
            {count > 0 && (
              <span
                className={`text-[10px] font-bold tabular-nums transition-colors duration-150 ${
                  isActive
                    ? "[color:var(--cat-color)]"
                    : "text-text-secondary group-hover:[color:var(--cat-color)]"
                }`}
              >
                {count}
              </span>
            )}
          </>
        )}
      </Link>
    );
  }

  const sidebarContent = (
    <>
      {/* Core categories */}
      {!collapsed && (
        <h3 className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2 px-2.5">
          {m.sidebar.main}
        </h3>
      )}
      {collapsed && <div className="mb-2" />}

      <nav aria-label="Core category navigation" className="flex flex-col gap-0.5">
        {coreCategories.map((cat) =>
          renderCategoryItem(cat, activeCategory === cat.slug)
        )}
      </nav>

      {/* Divider */}
      <div className={`my-3 ${collapsed ? "mx-1" : "mx-2.5"}`}>
        <div className="h-px bg-border-subtle" />
      </div>

      {/* Extended categories */}
      {!collapsed && (
        <h3 className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2 px-2.5">
          {m.sidebar.more}
        </h3>
      )}

      <nav aria-label="Extended category navigation" className="flex flex-col gap-0.5 flex-1">
        {extendedCategories.map((cat) =>
          renderCategoryItem(cat, activeCategory === cat.slug)
        )}
      </nav>

      <SidebarToggle
        collapsed={collapsed}
        onToggle={onToggle}
        variant="desktop"
      />
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        aria-hidden={hiddenForCompare}
        inert={hiddenForCompare}
        className={`hidden lg:flex flex-col h-full bg-bg-sidebar border-border-subtle py-4 shrink-0 transition-[width,padding] duration-300 overflow-y-auto overflow-x-hidden ${
          hiddenForCompare
            ? "w-0 px-0 border-r-0"
            : collapsed
              ? "w-[50px] px-1.5 border-r"
              : "w-[220px] px-3 border-r"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay — fade backdrop + slide-in drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="lg:hidden fixed inset-0 z-40 flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="fixed inset-0 bg-black/50"
              onClick={onMobileClose}
              aria-hidden="true"
            />

            <motion.aside
              className="relative z-50 w-[260px] h-full bg-bg-sidebar border-r border-border-subtle flex flex-col py-5 px-4 shrink-0 overflow-y-auto overscroll-contain"
              role="dialog"
              aria-modal="true"
              aria-label={m.sidebar.categoryMenu}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
            >
              <button
                onClick={onMobileClose}
                aria-label={m.sidebar.closeMenu}
                className="self-end mb-1 p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-white/[0.04] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <h3 className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2 px-2.5">
                {m.sidebar.main}
              </h3>

              <nav aria-label="Core category navigation" className="flex flex-col gap-0.5">
                {coreCategories.map((cat) =>
                  renderCategoryItem(cat, activeCategory === cat.slug)
                )}
              </nav>

              <div className="my-3 mx-2.5">
                <div className="h-px bg-border-subtle" />
              </div>

              <h3 className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2 px-2.5">
                {m.sidebar.more}
              </h3>

              <nav aria-label="Extended category navigation" className="flex flex-col gap-0.5 flex-1">
                {extendedCategories.map((cat) =>
                  renderCategoryItem(cat, activeCategory === cat.slug)
                )}
              </nav>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
