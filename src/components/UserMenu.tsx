"use client";

import { useState, useEffect, useRef } from "react";
import { User, Settings, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="User menu"
        className="w-8 h-8 rounded-full bg-bg-surface border border-border-subtle overflow-hidden flex items-center justify-center cursor-pointer"
      >
        <span className="text-xs font-medium text-text-secondary">U</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-56 bg-bg-card border border-border-subtle rounded-xl shadow-lg shadow-black/20 z-50 overflow-hidden"
          >
            {/* User info */}
            <div className="px-4 py-3">
              <p className="text-sm font-medium text-text-primary">Guest</p>
              <p className="text-xs text-text-tertiary">guest@current.app</p>
            </div>

            <div className="border-t border-border-subtle" />

            {/* Menu items */}
            <div className="py-1">
              <button
                disabled
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary opacity-50 cursor-not-allowed hover:bg-bg-surface transition-colors"
              >
                <User size={16} />
                Profile
              </button>
              <button
                disabled
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary opacity-50 cursor-not-allowed hover:bg-bg-surface transition-colors"
              >
                <Settings size={16} />
                Settings
              </button>
            </div>

            <div className="border-t border-border-subtle" />

            <div className="py-1">
              <button
                disabled
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary opacity-50 cursor-not-allowed hover:bg-bg-surface transition-colors"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
