"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "./config";
import { getMessages, relativeTime, relativeTimeShort, type Messages } from "./messages";

interface LocaleContextValue {
  locale: Locale;
  m: Messages;
  setLocale: (next: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const router = useRouter();

  const setLocale = useCallback(
    (next: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      document.documentElement.lang = next;
      setLocaleState(next);
      router.refresh(); // 서버 컴포넌트(기사 상세 등)도 새 언어로
    },
    [router],
  );

  const value = useMemo(() => ({ locale, m: getMessages(locale), setLocale }), [locale, setLocale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/** 현재 언어 + 그 언어의 문구 묶음(m) + 언어 바꾸기 */
export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside <LocaleProvider>");
  return ctx;
}

/** 문구 묶음만 */
export function useMessages(): Messages {
  return useLocale().m;
}

/** 언어에 맞는 상대 시간: ago("…") → "5시간 전" / "5h ago", agoShort → "5시간" / "5h" */
export function useTimeAgo() {
  const { m } = useLocale();
  return useMemo(() => ({ ago: (d: string) => relativeTime(m, d), agoShort: (d: string) => relativeTimeShort(m, d) }), [m]);
}
