"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, FileText, Cpu, Compass, X } from "lucide-react";
import {
  TODAYS_ARTICLES,
  TRENDING_ARTICLES,
  SAVED_ARTICLES,
} from "@/lib/mock-data";
import { AI_MODELS, NAV_LINKS } from "@/lib/constants";
import type { Article } from "@/lib/types";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  category: "articles" | "models" | "pages";
}

const MAX_RESULTS_PER_CATEGORY = 5;

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Deduplicate articles by id
  const allArticles = useMemo(() => {
    const map = new Map<string, Article>();
    [...TODAYS_ARTICLES, ...TRENDING_ARTICLES, ...SAVED_ARTICLES].forEach(
      (a) => {
        if (!map.has(a.id)) map.set(a.id, a);
      }
    );
    return Array.from(map.values());
  }, []);

  // Compute search results
  const results = useMemo<SearchResult[]>(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const articles: SearchResult[] = allArticles
      .filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q)
      )
      .slice(0, MAX_RESULTS_PER_CATEGORY)
      .map((a) => ({
        id: `article-${a.id}`,
        title: a.title,
        subtitle: `${a.source} · ${a.readTime}min read`,
        href: `/article/${a.id}`,
        category: "articles" as const,
      }));

    const models: SearchResult[] = AI_MODELS.filter(
      (m) =>
        m.name.toLowerCase().includes(q) || m.company.toLowerCase().includes(q)
    )
      .slice(0, MAX_RESULTS_PER_CATEGORY)
      .map((m) => ({
        id: `model-${m.slug}`,
        title: m.name,
        subtitle: `${m.company} · ${m.description}`,
        href: `/models/${m.slug}`,
        category: "models" as const,
      }));

    const pages: SearchResult[] = NAV_LINKS.filter((l) =>
      l.label.toLowerCase().includes(q)
    )
      .slice(0, MAX_RESULTS_PER_CATEGORY)
      .map((l) => ({
        id: `page-${l.href}`,
        title: l.label,
        subtitle: l.href,
        href: l.href,
        category: "pages" as const,
      }));

    return [...articles, ...models, ...pages];
  }, [query, allArticles]);

  // Group results by category
  const groupedResults = useMemo(() => {
    const groups: {
      label: string;
      icon: React.ReactNode;
      items: SearchResult[];
    }[] = [];

    const articles = results.filter((r) => r.category === "articles");
    const models = results.filter((r) => r.category === "models");
    const pages = results.filter((r) => r.category === "pages");

    if (articles.length > 0)
      groups.push({
        label: "Articles",
        icon: <FileText size={14} />,
        items: articles,
      });
    if (models.length > 0)
      groups.push({
        label: "AI Models",
        icon: <Cpu size={14} />,
        items: models,
      });
    if (pages.length > 0)
      groups.push({
        label: "Pages",
        icon: <Compass size={14} />,
        items: pages,
      });

    return groups;
  }, [results]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIndex(0);
      // Focus input on next frame
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen]);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Navigate to selected result
  const navigateTo = useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [onClose, router]
  );

  // Keyboard navigation within modal
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0
        );
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1
        );
        return;
      }

      if (e.key === "Enter" && results.length > 0) {
        e.preventDefault();
        const result = results[activeIndex];
        if (result) navigateTo(result.href);
        return;
      }
    },
    [results, activeIndex, navigateTo, onClose]
  );

  // Scroll active item into view
  useEffect(() => {
    resultRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-lg bg-bg-card border border-border-subtle rounded-2xl shadow-2xl overflow-hidden"
            onKeyDown={handleKeyDown}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle">
              <Search
                size={18}
                className="text-text-tertiary shrink-0"
                aria-hidden="true"
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search articles, models, and pages..."
                aria-label="Search input"
                className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"
              />
              <button
                onClick={onClose}
                className="shrink-0 bg-bg-surface border border-border-subtle rounded px-1.5 py-0.5 text-xs text-text-tertiary hover:text-text-secondary transition-colors"
                aria-label="Close search"
              >
                ESC
              </button>
            </div>

            {/* Results area */}
            <div className="max-h-[360px] overflow-y-auto">
              {query.trim() === "" && (
                <div className="px-4 py-10 text-center text-sm text-text-tertiary">
                  Type to search articles, models, and pages...
                </div>
              )}

              {query.trim() !== "" && results.length === 0 && (
                <div className="px-4 py-10 text-center text-sm text-text-tertiary">
                  No results found for &apos;{query}&apos;
                </div>
              )}

              {groupedResults.map((group) => {
                return (
                  <div key={group.label} className="py-2">
                    <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-text-tertiary uppercase tracking-wider">
                      {group.icon}
                      {group.label}
                    </div>
                    {group.items.map((item) => {
                      const flatIndex = results.indexOf(item);
                      const isActive = flatIndex === activeIndex;

                      return (
                        <button
                          key={item.id}
                          ref={(el) => {
                            resultRefs.current[flatIndex] = el;
                          }}
                          onClick={() => navigateTo(item.href)}
                          onMouseEnter={() => setActiveIndex(flatIndex)}
                          className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors ${
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-text-primary hover:bg-bg-surface"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">
                              {item.title}
                            </div>
                            <div
                              className={`text-xs truncate mt-0.5 ${
                                isActive
                                  ? "text-primary/70"
                                  : "text-text-tertiary"
                              }`}
                            >
                              {item.subtitle}
                            </div>
                          </div>
                          {isActive && (
                            <ArrowRight
                              size={14}
                              className="shrink-0 text-primary"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Footer hints */}
            <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border-subtle text-xs text-text-tertiary">
              <span className="flex items-center gap-1">
                <kbd className="bg-bg-surface border border-border-subtle rounded px-1.5 py-0.5 text-[10px] font-mono">
                  &uarr;&darr;
                </kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-bg-surface border border-border-subtle rounded px-1.5 py-0.5 text-[10px] font-mono">
                  &crarr;
                </kbd>
                open
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-bg-surface border border-border-subtle rounded px-1.5 py-0.5 text-[10px] font-mono">
                  esc
                </kbd>
                close
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
