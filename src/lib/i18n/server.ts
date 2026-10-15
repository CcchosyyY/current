import "server-only";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, toLocale, type Locale } from "./config";
import { getMessages } from "./messages";

/** 서버 컴포넌트에서 현재 언어 (쿠키, 없으면 한국어) */
export async function getLocale(): Promise<Locale> {
  return toLocale((await cookies()).get(LOCALE_COOKIE)?.value);
}

export async function getServerMessages() {
  return getMessages(await getLocale());
}
