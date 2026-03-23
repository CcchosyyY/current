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

  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);

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
      <header className="h-[60px] w-full bg-bg-page border-b border-border-subtle flex items-center justify-between px-4 md:px-8">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="text-primary"
          >
            <path
              d="M12 2L4 20h16L12 2z"
              fill="currentColor"
              opacity="0.9"
            />
          </svg>
          <span className="text-lg font-semibold font-heading text-text-primary tracking-tight">
            Current
          </span>
        </Link>

        {/* Center: Navigation */}
        <nav aria-label="Main navigation" className="flex items-center gap-4 md:gap-7">
          {NAV_LINKS.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
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
        <div className="flex items-center gap-2 md:gap-4">
          {/* Search trigger - desktop */}
          <button
            onClick={openSearch}
            aria-label="Search (Ctrl+K)"
            className="hidden md:flex items-center gap-2 bg-bg-card border border-border-subtle rounded-lg px-3 py-2 w-[220px] cursor-pointer hover:border-border-strong transition-colors"
          >
            <Search size={16} className="text-text-tertiary" aria-hidden="true" />
            <span className="text-sm text-text-tertiary flex-1 text-left">
              Search news...
            </span>
            <kbd className="bg-bg-surface border border-border-subtle rounded px-1.5 py-0.5 text-[10px] text-text-tertiary font-mono">
              &nbsp;K
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
            <Bell size={20} className="text-text-secondary" />
          </button>

          {/* User avatar + dropdown */}
          <UserMenu />
        </div>
      </header>

      <SearchModal isOpen={isSearchOpen} onClose={closeSearch} />
    </>
  );
}
