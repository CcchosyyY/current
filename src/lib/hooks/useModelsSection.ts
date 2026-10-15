"use client";

import { useSyncExternalStore } from "react";

// Models 화면에서 "지금 화면에 보이는 묶음"을 사이드바에 알려 주는 작은 공유 저장소.
// 주소(?category=)만 history.replaceState로 바꾸면 Next가 useSearchParams에 반영하지 않아
// 사이드바 강조가 따라오지 않았다 → 화면이 직접 이 값을 바꾸고 사이드바가 구독한다.

let section: string | null = null;
const listeners = new Set<() => void>();

export function setModelsSection(next: string | null) {
  if (next === section) return;
  section = next;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Models 화면에서 지금 보이는 묶음 slug ("all" = 맨 위). Models 밖이면 null */
export function useModelsSection(): string | null {
  return useSyncExternalStore(subscribe, () => section, () => null);
}
