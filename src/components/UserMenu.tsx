"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, LogIn, Bookmark, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

export default function UserMenu() {
  const { user, isLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  async function handleSignIn() {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    // On success the browser navigates away to Google; only reset on failure.
    if (error) setBusy(false);
  }

  async function handleSignOut() {
    setBusy(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    setBusy(false);
    router.refresh();
  }

  // While resolving the session, show a neutral placeholder.
  if (isLoading) {
    return (
      <div className="w-8 h-8 rounded-full bg-bg-surface border border-border-subtle animate-pulse" />
    );
  }

  // Not signed in → a button that kicks off Google OAuth directly.
  if (!user) {
    return (
      <button
        onClick={handleSignIn}
        disabled={busy}
        aria-label="Sign in with Google"
        className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary border border-border-subtle hover:border-border-strong rounded-lg px-3 py-1.5 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {busy ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <LogIn size={16} />
        )}
        <span className="hidden sm:inline">Sign in</span>
      </button>
    );
  }

  // Signed in → avatar + dropdown.
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const displayName =
    (user.user_metadata?.full_name as string | undefined) ||
    user.email ||
    "User";
  const initial = (displayName[0] || "U").toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="User menu"
        className="w-8 h-8 rounded-full bg-bg-surface border border-border-subtle overflow-hidden flex items-center justify-center cursor-pointer"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="text-xs font-medium text-text-secondary">
            {initial}
          </span>
        )}
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
              <p className="text-sm font-medium text-text-primary truncate">
                {displayName}
              </p>
              <p className="text-xs text-text-tertiary truncate">
                {user.email}
              </p>
            </div>

            <div className="border-t border-border-subtle" />

            {/* Menu items */}
            <div className="py-1">
              <Link
                href="/saved"
                onClick={() => setOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-bg-surface hover:text-text-primary transition-colors"
              >
                <Bookmark size={16} />
                Saved
              </Link>
            </div>

            <div className="border-t border-border-subtle" />

            <div className="py-1">
              <button
                onClick={handleSignOut}
                disabled={busy}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-bg-surface hover:text-text-primary transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {busy ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <LogOut size={16} />
                )}
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
