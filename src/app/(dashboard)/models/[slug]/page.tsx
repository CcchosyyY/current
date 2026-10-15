import type { Metadata } from "next";
import { AI_MODELS } from "@/lib/constants";
import ModelPageClient from "./ModelPageClient";
import { getLocale } from "@/lib/i18n/server";
import { getMessages } from "@/lib/i18n/messages";
import { modelDescription } from "@/lib/model-i18n";

// 정적 모델 목록 기반이라 DB 조회 없이 메타데이터 생성
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const model = AI_MODELS.find((x) => x.slug === slug);
  const locale = await getLocale();
  const m = getMessages(locale);
  if (!model) return { title: m.model.notFound };

  const title = m.model.pageTitle(model.name);
  const description = modelDescription(model, locale) || m.model.pageDescription(model.name, model.company);
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
