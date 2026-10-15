"use client";

import { ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { useMessages } from "@/lib/i18n/LocaleProvider";

interface SidebarToggleProps {
  collapsed: boolean;
  onToggle: () => void;
  variant: "desktop" | "mobile";
}

export default function SidebarToggle({
  collapsed,
  onToggle,
  variant,
}: SidebarToggleProps) {
  const m = useMessages();
  if (variant === "mobile") {
    return (
      <button
        onClick={onToggle}
        className="lg:hidden p-2 rounded-lg text-text-secondary hover:bg-bg-surface hover:text-text-primary transition-colors"
        aria-label={m.sidebar.openSidebar}
      >
        <Menu size={20} />
      </button>
    );
  }

  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-center w-full py-3 border-t border-border-subtle text-text-tertiary hover:text-text-primary transition-colors"
      aria-label={collapsed ? m.sidebar.expand : m.sidebar.collapse}
    >
      {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
    </button>
  );
}
