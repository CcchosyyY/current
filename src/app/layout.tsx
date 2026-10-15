import type { Metadata } from "next";
import { Nunito, Nunito_Sans, Noto_Sans_KR } from "next/font/google";
import { env } from "@/lib/env";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { getLocale } from "@/lib/i18n/server";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// 한글 폴백 — 라틴 폰트(Nunito)가 못 그리는 글자만 이 폰트로 떨어짐.
// CJK는 파일이 크므로 preload는 끄고 swap으로 점진 표시.
const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-kr",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
  preload: false,
});

// 기본 제목·설명은 언어별로 (쿠키 lang, 기본 한국어)
export async function generateMetadata(): Promise<Metadata> {
  const ko = (await getLocale()) === "ko";
  const title = ko ? "Current — AI 뉴스 큐레이션" : "Current — AI News Curation Platform";
  const description = ko
    ? "AI 모델·도구 뉴스를 매일 모아 보여주고, 내 작업에 맞는 모델을 직접 비교해 찾는 서비스"
    : "Daily AI model and tool news, plus side-by-side model comparisons for your own tasks";
  return {
    metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
    title: { default: title, template: "%s | Current" },
    description,
    keywords: ["AI", "news", "Claude", "ChatGPT", "Gemini", "tech", "curation"],
    authors: [{ name: "Jyos" }],
    openGraph: { type: "website", siteName: "Current", title, description },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html lang={locale} className="dark">
      <body
        className={`${nunito.variable} ${nunitoSans.variable} ${notoSansKr.variable} antialiased bg-bg-page text-text-primary font-body`}
      >
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
