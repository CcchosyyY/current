"use client";

import { useCallback, useEffect, useState } from "react";

// 사이드바 "새 글" 점: 카테고리를 마지막으로 연 뒤에 새 기사가 들어왔으면 점을 띄우고,
// 그 카테고리를 열면 지운다. 기록은 이 브라우저에만 (localStorage).
// 처음 오는 사람은 지금 시각을 기준으로 시작 — 첫 방문에 모든 카테고리에 점이 뜨지 않게.

const KEY = "current:seen-categories";
// DB는 "…+00:00", 브라우저는 "…Z" 형식이라 문자열이 아니라 시각으로 비교한다
const t = (iso: string | undefined) => (iso ? Date.parse(iso) || 0 : 0);
type Seen = Record<string, string> & { __since?: string };

function read(): Seen | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Seen) : null;
  } catch {
    return null;
  }
}
function write(seen: Seen) {
  try {
    localStorage.setItem(KEY, JSON.stringify(seen));
  } catch {}
}

export function useSeenCategories(latest: Record<string, string>) {
  const [seen, setSeen] = useState<Seen | null>(null); // null = 아직 안 읽음 (서버 렌더와 맞추려고 effect에서)

  useEffect(() => {
    let stored = read();
    if (!stored) {
      stored = { __since: new Date().toISOString() };
      write(stored);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 저장된 기록을 마운트 후 반영 (서버 렌더와 맞추기 위해 effect에서)
    setSeen(stored);
  }, []);

  const hasNew = useCallback(
    (slug: string) => {
      if (!seen || !latest[slug]) return false;
      return t(latest[slug]) > t(seen[slug] ?? seen.__since);
    },
    [seen, latest],
  );

  const markSeen = useCallback(
    (slug: string) => {
      const ts = latest[slug];
      if (!ts) return;
      setSeen((prev) => {
        if (!prev || t(prev[slug]) >= t(ts)) return prev;
        const next = { ...prev, [slug]: ts };
        write(next);
        return next;
      });
    },
    [latest],
  );

  return { hasNew, markSeen };
}
