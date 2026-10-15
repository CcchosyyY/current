// 사이트 언어. 한국어가 기본이고, 헤더의 국기 버튼으로 English로 바꿀 수 있다.
// 고른 언어는 쿠키(LOCALE_COOKIE)에 저장 → 서버도 첫 화면부터 그 언어로 그린다.
export type Locale = "ko" | "en";
export const LOCALES: Locale[] = ["ko", "en"];
export const DEFAULT_LOCALE: Locale = "ko";
export const LOCALE_COOKIE = "lang";

export function toLocale(v: string | null | undefined): Locale {
  return v === "en" ? "en" : DEFAULT_LOCALE;
}

/** 카테고리 이름 (사이드바 등) */
export function categoryName(cat: { name: string; nameEn: string }, locale: Locale): string {
  return locale === "en" ? cat.nameEn : cat.name;
}
