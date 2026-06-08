import type { Metadata } from "next";
import { AI_MODELS } from "@/lib/constants";
import ModelPageClient from "./ModelPageClient";

// 정적 모델 목록 기반이라 DB 조회 없이 메타데이터 생성
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const model = AI_MODELS.find((m) => m.slug === slug);
  if (!model) return { title: "모델을 찾을 수 없어요" };

  const title = `${model.name} — AI 모델 뉴스`;
  const description =
    model.description ??
    `${model.name} (${model.company}) 관련 최신 AI 뉴스를 한곳에 모았습니다.`;

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      images: [`/icons/models/${model.slug}.svg`],
    },
    twitter: { card: "summary", title, description },
  };
}

// 정적 파라미터로 빌드 시 모델 페이지 프리렌더 (뉴스는 클라이언트에서 로드)
export function generateStaticParams() {
  return AI_MODELS.map((m) => ({ slug: m.slug }));
}

export default function ModelPage() {
  return <ModelPageClient />;
}
