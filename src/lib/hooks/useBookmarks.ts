"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useAuth } from "./useAuth";

// 북마크는 페이지 전체가 함께 쓰는 하나의 저장소에 둔다.
// 예전에는 카드마다 이 훅이 /api/bookmarks를 따로 불러서(기사 30개면 30번) 요청 한도(429)에
// 걸렸고, 그 상태에서 저장을 누르면 서버가 거절해 체크 표시가 조용히 되돌아갔다.
// 이제 로그인한 사용자당 한 번만 불러오고, 모든 카드·저장 페이지·기사 화면이 같은 값을 본다.

interface Store {
  userId: string | null;
  ids: Set<string>;
  loaded: boolean;
  loading: Promise<void> | null;
}

let store: Store = { userId: null, ids: new Set(), loaded: false, loading: null };
const listeners = new Set<() => void>();

function emit(next: Partial<Store>) {
  store = { ...store, ...next };
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
const getSnapshot = () => store;
const SERVER_SNAPSHOT: Store = { userId: null, ids: new Set(), loaded: false, loading: null };
const getServerSnapshot = () => SERVER_SNAPSHOT;

// 사용자가 바뀌면(로그인·로그아웃·계정 전환) 비우고 그 사용자 것으로 한 번만 불러온다
function ensureLoaded(userId: string | null) {
  if (store.userId === userId && (store.loaded || store.loading)) return;
  if (!userId) {
    emit({ userId: null, ids: new Set(), loaded: true, loading: null });
    return;
  }
  const loading = fetch("/api/bookmarks?limit=200")
    .then((res) => (res.ok ? res.json() : null))
    .then((json) => {
      if (store.userId !== userId) return; // 그 사이 사용자가 바뀜
      const ids = Array.isArray(json?.data)
        ? (json.data as { articles: { id: string } | null }[])
            .map((b) => b.articles?.id)
            .filter((id): id is string => !!id)
        : [];
      emit({ ids: new Set(ids), loaded: true, loading: null });
    })
    .catch(() => {
      if (store.userId === userId) emit({ loaded: true, loading: null });
    });
  emit({ userId, ids: new Set(), loaded: false, loading });
}

function setBookmarked(id: string, on: boolean) {
  const ids = new Set(store.ids);
  if (on) ids.add(id);
  else ids.delete(id);
  emit({ ids });
}

interface UseBookmarksReturn {
  bookmarkedIds: Set<string>;
  /**
   * Flips a bookmark. Returns false (and does nothing) when signed out.
   * The change shows immediately; if the server refuses it, it is undone and onError runs.
   */
  toggleBookmark: (articleId: string, opts?: { onError?: () => void }) => boolean;
  isBookmarked: (articleId: string) => boolean;
  /** Bookmarks are a signed-in feature only. */
  canBookmark: boolean;
  isLoading: boolean;
  /** True once the initial API load has settled. */
  loaded: boolean;
}

export function useBookmarks(): UseBookmarksReturn {
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (!authLoading) ensureLoaded(userId);
  }, [userId, authLoading]);

  const toggleBookmark = useCallback(
    (articleId: string, opts?: { onError?: () => void }): boolean => {
      if (!userId) return false;
      const wasBookmarked = store.ids.has(articleId);
      setBookmarked(articleId, !wasBookmarked);

      const revert = () => {
        setBookmarked(articleId, wasBookmarked);
        opts?.onError?.();
      };
      fetch("/api/bookmarks", {
        method: wasBookmarked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ article_id: articleId }),
      })
        .then((res) => {
          // 409 = already bookmarked, which is fine for a POST.
          if (!res.ok && res.status !== 409) revert();
        })
        .catch(revert);
      return true;
    },
    [userId],
  );

  const current = snap.userId === userId;
  const bookmarkedIds = current ? snap.ids : SERVER_SNAPSHOT.ids;
  const isBookmarked = useCallback((articleId: string) => bookmarkedIds.has(articleId), [bookmarkedIds]);

  return {
    bookmarkedIds,
    toggleBookmark,
    isBookmarked,
    canBookmark: !!userId,
    isLoading: !!userId && current && !!snap.loading,
    loaded: current && snap.loaded,
  };
}
