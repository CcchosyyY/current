"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";
import SearchModal from "./SearchModal";
import UserMenu from "./UserMenu";

export default function Header() {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // Resolve the platform after mount so the keyboard hint matches reality
  // (Ctrl on Windows/Linux, ⌘ on Mac) without an SSR hydration mismatch.
  const [isMac, setIsMac] = useState(false);

  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent));
  }, []);

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="h-[48px] w-full bg-bg-page border-b border-border-subtle grid grid-cols-3 items-center pl-4 md:pl-6 lg:pl-10 pr-12 md:pr-20 lg:pr-28">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 justify-self-start">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="text-primary"
          >
            <path
              d="M10.5 2L4 20h16L10.5 2z"
              fill="currentColor"
              opacity="0.9"
            />
          </svg>
          <span className="text-xl font-bold font-heading text-text-primary tracking-tight">
            Current
          </span>
        </Link>

        {/* Center: Navigation */}
        <nav aria-label="Main navigation" className="flex items-center justify-center gap-4 md:gap-7 translate-x-8">
          {NAV_LINKS.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[12px] font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "text-primary"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Search, Bell, Avatar */}
        <div className="flex items-center gap-2 md:gap-4 justify-self-end">
          {/* Search trigger - desktop */}
          <button
            onClick={openSearch}
            aria-label={isMac ? "Search (Cmd+K)" : "Search (Ctrl+K)"}
            className="hidden md:flex items-center gap-2 bg-bg-card border border-border-subtle rounded-md px-2.5 py-1.5 w-[180px] cursor-pointer hover:border-border-strong transition-colors"
          >
            <Search size={14} className="text-text-tertiary" aria-hidden="true" />
            <span className="text-sm text-text-tertiary flex-1 text-left">
              Search news...
            </span>
            <kbd className="bg-bg-surface border border-border-subtle rounded px-1.5 py-0.5 text-[10px] text-text-tertiary font-mono">
              {isMac ? "⌘K" : "Ctrl K"}
            </kbd>
          </button>

          {/* Search trigger - mobile */}
          <button
            onClick={openSearch}
            aria-label="Search"
            className="md:hidden p-1.5 hover:bg-bg-surface rounded-lg transition-colors"
          >
            <Search size={20} className="text-text-secondary" />
          </button>

          {/* Notification bell */}
          <button
            aria-label="Notifications"
            className="relative p-1.5 hover:bg-bg-surface rounded-lg transition-colors"
          >
            <Bell size={16} className="text-text-secondary" />
          </button>

          {/* User avatar + dropdown */}
          <UserMenu />
        </div>
      </header>

      <SearchModal isOpen={isSearchOpen} onClose={closeSearch} />
    </>
  );
}
