"use client";

import { useEffect, useCallback, useState, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Brain,
  Monitor,
  Sparkles,
  Gem,
  Globe,
  type LucideIcon,
} from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import { TODAYS_ARTICLES } from "@/lib/mock-data";
import SidebarToggle from "./SidebarToggle";

const STORAGE_KEY = "sidebar-collapsed";

// Map category icon names to lucide-react components
const ICON_MAP: Record<string, LucideIcon> = {
  brain: Brain,
  monitor: Monitor,
  sparkles: Sparkles,
  gem: Gem,
  globe: Globe,
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

  // Restore collapsed state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") {
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

export default function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") || "ai-ml";

  // Count articles per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of CATEGORIES) {
      if (cat.slug === "ai-ml") {
        counts[cat.slug] = TODAYS_ARTICLES.length;
      } else {
        counts[cat.slug] = TODAYS_ARTICLES.filter((a) => a.category === cat.slug).length;
      }
    }
    return counts;
  }, []);

  // Close mobile sidebar on ESC
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && mobileOpen) {
        onMobileClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onMobileClose]);

  // Close mobile sidebar on route change
  useEffect(() => {
    onMobileClose();
  }, [pathname, searchParams, onMobileClose]);

  const sidebarContent = (
    <>
      {/* Section title - hidden when collapsed */}
      {!collapsed && (
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-4">
          Categories
        </h3>
      )}

      {/* Spacer when collapsed to align items */}
      {collapsed && <div className="mb-4" />}

      {/* Category list */}
      <nav aria-label="Category navigation" className="flex flex-col gap-1 flex-1">
        {CATEGORIES.map((cat) => {
          const Icon = ICON_MAP[cat.icon] || Brain;
          const isActive = activeCategory === cat.slug;

          return (
            <Link
              key={cat.slug}
              href={`${pathname}?category=${cat.slug}`}
              title={collapsed ? cat.name : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                collapsed ? "justify-center" : ""
              } ${
                isActive
                  ? "bg-primary text-white"
                  : "text-text-secondary hover:bg-bg-surface hover:text-text-primary"
              }`}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1">{cat.name}</span>
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-bg-surface text-text-tertiary"
                    }`}
                  >
                    {categoryCounts[cat.slug] ?? 0}
                  </span>
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Desktop toggle button at the bottom */}
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
        className={`hidden lg:flex flex-col h-full bg-bg-sidebar border-r border-border-subtle py-6 shrink-0 transition-[width] duration-200 overflow-hidden ${
          collapsed ? "w-[60px] px-2" : "w-[240px] px-5"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Dim background */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={onMobileClose}
            aria-hidden="true"
          />

          {/* Sidebar panel */}
          <aside className="relative z-50 w-[240px] h-full bg-bg-sidebar border-r border-border-subtle flex flex-col py-6 px-5 shrink-0">
            {/* Always show expanded content on mobile */}
            <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-4">
              Categories
            </h3>

            <nav aria-label="Category navigation" className="flex flex-col gap-1 flex-1">
              {CATEGORIES.map((cat) => {
                const Icon = ICON_MAP[cat.icon] || Brain;
                const isActive = activeCategory === cat.slug;

                return (
                  <Link
                    key={cat.slug}
                    href={`${pathname}?category=${cat.slug}`}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-text-secondary hover:bg-bg-surface hover:text-text-primary"
                    }`}
                  >
                    <Icon size={18} />
                    <span className="flex-1">{cat.name}</span>
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-bg-surface text-text-tertiary"
                      }`}
                    >
                      {categoryCounts[cat.slug] ?? 0}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
