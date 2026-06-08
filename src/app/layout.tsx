import type { Metadata } from "next";
import { Nunito, Nunito_Sans, Noto_Sans_KR } from "next/font/google";
import { env } from "@/lib/env";
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

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: "Current — AI News Curation Platform",
    template: "%s | Current",
  },
  description:
    "AI 기술 뉴스를 자동 수집·요약하고 카드형 UI로 제공하는 뉴스 큐레이션 플랫폼",
  keywords: ["AI", "news", "Claude", "ChatGPT", "Gemini", "tech", "curation"],
  authors: [{ name: "Jyos" }],
  openGraph: {
    type: "website",
    siteName: "Current",
    title: "Current — AI News Curation Platform",
    description:
      "AI 기술 뉴스를 자동 수집·요약하고 카드형 UI로 제공하는 뉴스 큐레이션 플랫폼",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <body
        className={`${nunito.variable} ${nunitoSans.variable} ${notoSansKr.variable} antialiased bg-bg-page text-text-primary font-body`}
      >
        {children}
      </body>
    </html>
  );
}
