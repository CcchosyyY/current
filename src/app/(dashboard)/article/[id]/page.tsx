import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { supabasePublic } from "@/lib/supabase/public";
import { dbArticleToArticle } from "@/lib/transforms";
import { getRelativeTime } from "@/lib/utils";
import type { DBArticleRow } from "@/lib/transforms";
import ArticleActions from "@/components/ArticleActions";
import ArticleLogo from "@/components/ArticleLogo";

// ISR: 기사 본문은 발행 후 거의 안 바뀌므로 60초 동안 렌더 결과를 캐시한다.
// → 클릭마다 일어나던 Supabase 왕복이 사라지고(첫 요청만 조회 후 캐시),
//   재방문/타 사용자 요청은 캐시 히트가 된다.
// 전제: 쿠키 없는 supabasePublic 사용 (server.ts createClient는 cookies()로
//       라우트를 강제 동적화해 revalidate를 무효화하므로 여기선 쓰면 안 됨).
export const revalidate = 60;
export const dynamicParams = true; // 프리렌더 안 된 기사도 첫 방문 시 생성 후 캐시

// 최근 기사 일부는 빌드 시 미리 생성해 즉시 서빙(가장 많이 보는 콘텐츠).
// 나머지/신규 기사는 dynamicParams=true 로 첫 방문 시 ISR 생성된다.
export async function generateStaticParams() {
  try {
    const { data } = await supabasePublic
      .from("articles")
      .select("id")
      .order("published_at", { ascending: false })
      .limit(20);
    return (data ?? []).map((row: { id: string }) => ({ id: row.id }));
  } catch {
    // 빌드 환경에서 DB 접근 불가해도 빌드를 깨지 않음 — 전부 on-demand ISR로 폴백
    return [];
  }
}

// generateMetadata와 페이지가 같은 요청 내에서 1번만 조회하도록 cache로 메모이즈
const getArticle = cache(async (id: string) => {
  const { data, error } = await supabasePublic
    .from("articles")
    .select(`
      *,
      categories(name, slug, color),
      ai_models(name, slug, company, brand_color, logo_url)
    `)
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return dbArticleToArticle(data as unknown as DBArticleRow);
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) return { title: "기사를 찾을 수 없어요" };

  const description = (article.summary ?? "").slice(0, 160);
  return {
    title: article.title,
    description,
    openGraph: {
      type: "article",
      title: article.title,
      description,
      images: article.imageUrl ? [article.imageUrl] : undefined,
    },
    twitter: {
      card: article.imageUrl ? "summary_large_image" : "summary",
      title: article.title,
      description,
    },
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticle(id);

  if (!article) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Back to News
      </Link>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-xs font-medium bg-primary/20 text-primary px-2.5 py-1 rounded-md">
          {article.category}
        </span>
        <span className="text-xs text-text-tertiary">
          {article.publishedAt.split("T")[0]}
        </span>
        <span className="text-xs text-text-tertiary">&middot;</span>
        <span className="flex items-center gap-1 text-xs text-text-tertiary">
          <Clock size={12} />
          {article.readTime} min read
        </span>
      </div>

      <h1 className="text-3xl font-bold font-heading text-text-primary leading-tight mb-4">
        {article.title}
      </h1>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 rounded-full bg-bg-surface border border-border-subtle flex items-center justify-center shrink-0">
          <ArticleLogo article={article} size={18} />
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">
            {article.source}
          </p>
          <p className="text-xs text-text-tertiary">
            {getRelativeTime(article.publishedAt)}
          </p>
        </div>
      </div>

      <ArticleActions
        articleId={article.id}
        articleTitle={article.title}
        sourceUrl={article.sourceUrl}
      />

      {article.imageUrl && (
        <div className="w-full aspect-video rounded-xl overflow-hidden mb-8 bg-bg-card border border-border-subtle relative">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />
        </div>
      )}

      <article className="space-y-5">
        <p className="text-text-secondary leading-relaxed text-base font-medium">
          {article.summary}
        </p>

        {article.content.split("\n\n").map((paragraph, i) => (
          <p
            key={i}
            className="text-text-secondary leading-relaxed text-[15px]"
          >
            {paragraph}
          </p>
        ))}

        {article.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-4">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-text-tertiary bg-bg-surface px-2.5 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
