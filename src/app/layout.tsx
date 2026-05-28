import type { Metadata } from "next";
import { Nunito, Nunito_Sans } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Current — AI News Curation Platform",
  description:
    "AI 기술 뉴스를 자동 수집·요약하고 카드형 UI로 제공하는 뉴스 큐레이션 플랫폼",
  keywords: ["AI", "news", "Claude", "ChatGPT", "Gemini", "tech", "curation"],
  authors: [{ name: "Jyos" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <body
        className={`${nunito.variable} ${nunitoSans.variable} antialiased bg-bg-page text-text-primary font-body`}
      >
        {children}
      </body>
    </html>
  );
}
