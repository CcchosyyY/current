"use client";

import { useState } from "react";
import { Send, Mail, BookOpen, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NEWSLETTER_ISSUES } from "@/lib/mock-data";

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export default function NewsletterPage() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || isLoading) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) setError("Too many attempts. Please try again later.");
        else setError(data.error || "Failed to subscribe");
        return;
      }
      setSubscribed(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <h1 className="text-2xl font-bold font-heading text-text-primary flex items-center gap-2">
        <Mail size={24} className="text-primary" />
        Newsletter
      </h1>

      {/* ── Subscribe box ── */}
      <div className="bg-bg-card border border-border-subtle rounded-xl p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-2">
          Stay Updated with AI News
        </h2>
        <p className="text-sm text-text-secondary mb-5">
          Get the latest AI technology news delivered to your inbox every
          morning. Curated summaries, expert insights, and trending topics.
        </p>

        <AnimatePresence mode="wait">
          {subscribed ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-2 text-success text-sm font-medium"
            >
              <span className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center text-xs">
                ✓
              </span>
              Successfully subscribed! Check your inbox for confirmation.
            </motion.div>
          ) : (
            <motion.div
              key="form"
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <form onSubmit={handleSubscribe} className="flex gap-3">
                <label htmlFor="newsletter-email" className="sr-only">Email address</label>
                <input
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="flex-1 bg-bg-page border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary transition-colors"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-medium text-sm px-5 py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      Subscribing...
                      <Loader2 size={14} className="animate-spin" />
                    </>
                  ) : (
                    <>
                      Subscribe
                      <Send size={14} />
                    </>
                  )}
                </button>
              </form>
              {error && (
                <p className="text-xs text-red-400 mt-2">{error}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Past Issues ── */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <BookOpen size={18} className="text-text-tertiary" />
          Past Issues
        </h2>

        <motion.div
          className="space-y-3"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {NEWSLETTER_ISSUES.map((issue) => (
            <motion.div key={issue.id} variants={staggerItem}>
              <div className="flex items-center justify-between bg-bg-card border border-border-subtle rounded-xl px-6 py-4 hover:border-border-strong transition-colors group">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <Mail
                    size={18}
                    className="text-primary mt-0.5 shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                      {issue.title}
                    </h3>
                    <p className="text-xs text-text-tertiary mt-1 flex items-center gap-2">
                      <span>{issue.publishedAt}</span>
                      <span>&middot;</span>
                      <span className="truncate">{issue.summary}</span>
                    </p>
                  </div>
                </div>

                <button className="text-xs font-medium text-text-secondary border border-border-subtle rounded-lg px-3 py-1.5 hover:border-border-strong hover:text-text-primary transition-colors shrink-0 ml-4 cursor-pointer">
                  Read
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
