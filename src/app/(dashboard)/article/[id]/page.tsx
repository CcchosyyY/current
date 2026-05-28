import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { dbArticleToArticle } from "@/lib/transforms";
import { getRelativeTime } from "@/lib/utils";
import type { DBArticleRow } from "@/lib/transforms";
import ArticleActions from "@/components/ArticleActions";

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("articles")
    .select(`
      *,
      categories(name, slug, color),
      ai_models(name, slug, company, brand_color, logo_url)
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const article = dbArticleToArticle(data as unknown as DBArticleRow);

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
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
          {article.source.slice(0, 2).toUpperCase()}
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

      <ArticleActions
        articleId={article.id}
        articleTitle={article.title}
        sourceUrl={article.sourceUrl}
      />
    </div>
  );
}
