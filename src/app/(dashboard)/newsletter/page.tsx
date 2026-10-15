"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BellOff, BellRing, Check, Loader2, Mail, X } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useToast } from "@/lib/hooks/useToast";
import { createClient } from "@/lib/supabase/client";
import { useMessages } from "@/lib/i18n/LocaleProvider";
import type { Messages } from "@/lib/i18n/messages";

// 뉴스레터: 매일 아침 크롤 뒤 scripts/newsletter.mjs가 지난 24시간의 중요한 기사를 골라 요약한 호.
// 구독은 로그인한 계정의 이메일로 (버튼 한 번). 해지는 확인 창을 한 번 거친다.
// 지난 호를 누르면 메일로 보낸 모습 그대로 창에서 본다.

interface IssueItem {
  article_id: string;
  headline: string;
  summary: string;
  why: string;
  title: string;
  source: string;
  url: string;
}
interface Issue {
  id: string;
  issue_date: string;
  title: string;
  intro: string;
  items: IssueItem[];
  sent_at: string | null;
}

function formatIssueDate(d: string, m: Messages) {
  const [y, mo, day] = d.split("-").map(Number);
  return m.newsletter.issueDate(y, mo, day, new Date(Date.UTC(y, mo - 1, day)).getUTCDay());
}

function NewsletterContent() {
  const m = useMessages();
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const searchParams = useSearchParams();

  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [open, setOpen] = useState<Issue | null>(null);
  const [subscribed, setSubscribed] = useState<boolean | null>(null); // null = 아직 모름
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    fetch("/api/newsletter/issues")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setIssues(Array.isArray(j?.data) ? j.data : []))
      .catch(() => setIssues([]));
  }, []);

  // 로그인한 사용자의 구독 상태
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setSubscribed(false);
      return;
    }
    fetch("/api/newsletter/subscription")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setSubscribed(!!j?.subscribed))
      .catch(() => setSubscribed(false));
  }, [user, authLoading]);

  // 메일의 "구독 해지" 링크로 돌아온 경우
  const unsubscribedParam = searchParams.get("unsubscribed");
  useEffect(() => {
    if (unsubscribedParam === "1") showToast(m.newsletter.unsubscribedOk, "success");
    else if (unsubscribedParam === "error") showToast(m.newsletter.unsubscribeBadLink, "error");
  }, [unsubscribedParam, showToast, m]);

  async function signIn() {
    setBusy(true);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/newsletter")}` },
    });
    if (error) setBusy(false);
  }

  async function change(on: boolean) {
    setBusy(true);
    try {
      const r = await fetch("/api/newsletter/subscription", { method: on ? "POST" : "DELETE" });
      if (!r.ok) throw new Error();
      setSubscribed(on);
      showToast(on ? m.newsletter.subscribedToast : m.newsletter.cancelledToast, "success");
    } catch {
      showToast(m.newsletter.failed, "error");
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  const loadingButton = authLoading || (user && subscribed === null);

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      {/* 제목 + 구독 버튼 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="flex items-center gap-2 font-heading text-[24px] font-bold text-text-primary">
            <Mail size={24} className="text-primary" />
            {m.newsletter.title}
          </h1>

          {loadingButton ? (
            <button disabled className="flex items-center gap-2 rounded-xl border border-border-subtle px-5 py-2.5 text-base text-text-tertiary">
              <Loader2 size={18} className="animate-spin" />
            </button>
          ) : subscribed ? (
            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-1.5 text-base text-success sm:flex">
                <Check size={18} /> {m.newsletter.subscribing}
              </span>
              <button
                onClick={() => setConfirming(true)}
                disabled={busy}
                className="flex items-center gap-2 rounded-xl border border-border-strong px-5 py-2.5 text-base font-medium text-text-secondary hover:text-text-primary disabled:opacity-60 cursor-pointer"
              >
                <BellOff size={18} /> {m.newsletter.unsubscribe}
              </button>
            </div>
          ) : (
            <button
              onClick={() => (user ? change(true) : signIn())}
              disabled={busy}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-base font-semibold text-white hover:bg-primary-dark disabled:opacity-60 cursor-pointer"
            >
              {busy ? <Loader2 size={18} className="animate-spin" /> : <BellRing size={18} />}
              {m.newsletter.subscribe}
            </button>
          )}
        </div>
        <p className="text-base leading-relaxed text-text-secondary">
          {m.newsletter.intro}
          {!user && !authLoading && m.newsletter.loginNeeded}
          {user?.email && subscribed && <span className="text-text-tertiary">{m.newsletter.receivingAt(user.email)}</span>}
          {m.newsletter.koreanOnly && <span className="block text-sm text-text-tertiary">{m.newsletter.koreanOnly}</span>}
        </p>
      </div>

      {/* 지난 호 */}
      <section>
        <h2 className="mb-5 font-heading text-2xl font-bold text-text-primary">{m.newsletter.pastIssues}</h2>
        {issues === null ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-bg-surface" />
            ))}
          </div>
        ) : issues.length === 0 ? (
          <p className="rounded-2xl border border-border-subtle bg-bg-card py-14 text-center text-base text-text-secondary">
            {m.newsletter.none}
          </p>
        ) : (
          <div className="space-y-3">
            {issues.map((issue) => (
              <button
                key={issue.id}
                onClick={() => setOpen(issue)}
                className="group flex w-full items-start gap-4 rounded-2xl border border-border-subtle bg-bg-card px-7 py-5 text-left transition-colors hover:border-border-strong cursor-pointer"
              >
                <Mail size={22} className="mt-0.5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-text-primary transition-colors group-hover:text-primary">
                    {issue.title}
                  </h3>
                  <p className="mt-1.5 flex items-center gap-2 text-sm text-text-tertiary">
                    <span className="shrink-0">{formatIssueDate(issue.issue_date, m)}</span>
                    <span>&middot;</span>
                    <span className="truncate">{issue.intro}</span>
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {open && <IssueModal issue={open} onClose={() => setOpen(null)} />}
      {confirming && (
        <ConfirmModal
          busy={busy}
          onCancel={() => setConfirming(false)}
          onConfirm={() => change(false)}
        />
      )}
    </div>
  );
}

// Esc로 닫기 + 배경 스크롤 잠금. onClose가 렌더마다 새로 만들어져도 리스너는 한 번만 단다.
function useModal(onClose: () => void) {
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeRef.current();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, []);
}

/** 메일로 보낸 모습 그대로 (scripts/newsletter.mjs의 emailHtml과 같은 구성) */
function IssueModal({ issue, onClose }: { issue: Issue; onClose: () => void }) {
  const m = useMessages();
  useModal(onClose);
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-10 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-label={issue.title}>
      <div className="relative w-full max-w-[760px] rounded-2xl bg-[#f9fafb] p-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label={m.newsletter.close} className="absolute -top-3 -right-3 rounded-full bg-bg-card p-1.5 text-text-secondary shadow-lg hover:text-text-primary cursor-pointer">
          <X size={20} />
        </button>
        <div className="rounded-xl bg-white p-9 font-sans text-[#111827]">
          <div className="text-sm font-bold tracking-[0.15em] text-[#2563eb]">CURRENT · {issue.issue_date}</div>
          <h2 className="mt-2 text-[28px] font-bold leading-snug">{issue.title}</h2>
          <p className="mt-3 text-base leading-8 text-[#4b5563]">{issue.intro}</p>
          {issue.items.map((it, n) => (
            <div key={it.article_id} className="border-b border-[#e5e7eb] py-6 last:border-b-0">
              <div className="text-sm text-[#6b7280]">
                {n + 1} · {it.source}
              </div>
              <div className="mb-2.5 mt-1 text-xl font-bold leading-snug">{it.headline}</div>
              <p className="text-base leading-8 text-[#374151]">{it.summary}</p>
              <p className="mt-2 text-[15px] leading-7 text-[#2563eb]">→ {it.why}</p>
              <div className="mt-3 text-sm">
                <Link href={`/article/${it.article_id}`} className="text-[#2563eb] underline" onClick={onClose}>
                  {m.newsletter.viewOnCurrent}
                </Link>
                <span className="text-[#9ca3af]"> · </span>
                <a href={it.url} target="_blank" rel="noopener noreferrer" className="text-[#6b7280] underline">
                  {m.newsletter.original}
                </a>
              </div>
            </div>
          ))}
          <p className="pt-5 text-sm text-[#9ca3af]">
            {issue.sent_at ? m.newsletter.sent : m.newsletter.notSent}
          </p>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ busy, onCancel, onConfirm }: { busy: boolean; onCancel: () => void; onConfirm: () => void }) {
  const m = useMessages();
  useModal(onCancel);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" onClick={onCancel} role="alertdialog" aria-modal="true" aria-labelledby="unsub-title">
      <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-bg-card p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 id="unsub-title" className="text-xl font-bold text-text-primary">{m.newsletter.confirmTitle}</h3>
        <p className="mt-3 text-base leading-relaxed text-text-secondary">{m.newsletter.confirmBody}</p>
        <div className="mt-7 flex justify-end gap-3">
          <button onClick={onCancel} disabled={busy} className="rounded-xl border border-border-strong px-5 py-2.5 text-base text-text-secondary hover:text-text-primary cursor-pointer">
            {m.newsletter.no}
          </button>
          <button onClick={onConfirm} disabled={busy} className="flex items-center gap-2 rounded-xl bg-error px-5 py-2.5 text-base font-semibold text-white hover:opacity-90 disabled:opacity-60 cursor-pointer">
            {busy && <Loader2 size={17} className="animate-spin" />}
            {m.newsletter.yesCancel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NewsletterPage() {
  return (
    <Suspense fallback={null}>
      <NewsletterContent />
    </Suspense>
  );
}
