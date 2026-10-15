"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BellOff, BellRing, Check, Loader2, Mail, X } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useToast } from "@/lib/hooks/useToast";
import { createClient } from "@/lib/supabase/client";

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

function formatIssueDate(d: string) {
  const [y, m, day] = d.split("-").map(Number);
  const wd = ["일", "월", "화", "수", "목", "금", "토"][new Date(Date.UTC(y, m - 1, day)).getUTCDay()];
  return `${y}년 ${m}월 ${day}일 (${wd})`;
}

function NewsletterContent() {
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
    if (unsubscribedParam === "1") showToast("뉴스레터 구독을 해지했어요", "success");
    else if (unsubscribedParam === "error") showToast("구독 해지 링크가 올바르지 않아요", "error");
  }, [unsubscribedParam, showToast]);

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
      showToast(on ? "구독했어요. 내일 아침부터 메일로 보내드려요" : "구독을 취소했어요", "success");
    } catch {
      showToast("처리하지 못했어요. 잠시 후 다시 시도해 주세요", "error");
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
            Newsletter
          </h1>

          {loadingButton ? (
            <button disabled className="flex items-center gap-2 rounded-xl border border-border-subtle px-5 py-2.5 text-base text-text-tertiary">
              <Loader2 size={18} className="animate-spin" />
            </button>
          ) : subscribed ? (
            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-1.5 text-base text-success sm:flex">
                <Check size={18} /> 구독 중
              </span>
              <button
                onClick={() => setConfirming(true)}
                disabled={busy}
                className="flex items-center gap-2 rounded-xl border border-border-strong px-5 py-2.5 text-base font-medium text-text-secondary hover:text-text-primary disabled:opacity-60 cursor-pointer"
              >
                <BellOff size={18} /> 구독 취소
              </button>
            </div>
          ) : (
            <button
              onClick={() => (user ? change(true) : signIn())}
              disabled={busy}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-base font-semibold text-white hover:bg-primary-dark disabled:opacity-60 cursor-pointer"
            >
              {busy ? <Loader2 size={18} className="animate-spin" /> : <BellRing size={18} />}
              구독하기
            </button>
          )}
        </div>
        <p className="text-base leading-relaxed text-text-secondary">
          매일 아침, 지난 24시간의 AI 소식 중 중요한 것만 골라 요약해 보내드려요.
          {!user && !authLoading && " 구독하려면 로그인이 필요해요."}
          {user?.email && subscribed && <span className="text-text-tertiary"> · {user.email}로 받는 중</span>}
        </p>
      </div>

      {/* 지난 호 */}
      <section>
        <h2 className="mb-5 font-heading text-2xl font-bold text-text-primary">Past Issues</h2>
        {issues === null ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-bg-surface" />
            ))}
          </div>
        ) : issues.length === 0 ? (
          <p className="rounded-2xl border border-border-subtle bg-bg-card py-14 text-center text-base text-text-secondary">
            아직 발행된 뉴스레터가 없어요. 내일 아침에 첫 호가 나와요.
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
                    <span className="shrink-0">{formatIssueDate(issue.issue_date)}</span>
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
  useModal(onClose);
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-10 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-label={issue.title}>
      <div className="relative w-full max-w-[760px] rounded-2xl bg-[#f9fafb] p-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="닫기" className="absolute -top-3 -right-3 rounded-full bg-bg-card p-1.5 text-text-secondary shadow-lg hover:text-text-primary cursor-pointer">
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
                  Current에서 보기
                </Link>
                <span className="text-[#9ca3af]"> · </span>
                <a href={it.url} target="_blank" rel="noopener noreferrer" className="text-[#6b7280] underline">
                  원문
                </a>
              </div>
            </div>
          ))}
          <p className="pt-5 text-sm text-[#9ca3af]">
            {issue.sent_at ? "구독자에게 메일로 보낸 호예요." : "아직 메일로 보내지 않은 호예요 (사이트에만 공개)."}
          </p>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ busy, onCancel, onConfirm }: { busy: boolean; onCancel: () => void; onConfirm: () => void }) {
  useModal(onCancel);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" onClick={onCancel} role="alertdialog" aria-modal="true" aria-labelledby="unsub-title">
      <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-bg-card p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 id="unsub-title" className="text-xl font-bold text-text-primary">구독을 취소할까요?</h3>
        <p className="mt-3 text-base leading-relaxed text-text-secondary">내일부터 뉴스레터 메일이 오지 않아요. 언제든 다시 구독할 수 있어요.</p>
        <div className="mt-7 flex justify-end gap-3">
          <button onClick={onCancel} disabled={busy} className="rounded-xl border border-border-strong px-5 py-2.5 text-base text-text-secondary hover:text-text-primary cursor-pointer">
            아니요
          </button>
          <button onClick={onConfirm} disabled={busy} className="flex items-center gap-2 rounded-xl bg-error px-5 py-2.5 text-base font-semibold text-white hover:opacity-90 disabled:opacity-60 cursor-pointer">
            {busy && <Loader2 size={17} className="animate-spin" />}
            예, 취소할게요
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
