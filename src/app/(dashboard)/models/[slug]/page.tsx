"use client";

import { useState } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Loader2, Eye } from "lucide-react";
import { AI_MODELS } from "@/lib/constants";
import ModelActions from "@/components/model/ModelActions";
import ModelInfoSections from "@/components/model/ModelInfoSections";
import ModelDetailModal from "@/components/ModelDetailModal";
import NewsCard from "@/components/NewsCard";
import { useModelArticles } from "@/lib/hooks/useModelArticles";

const CATEGORY_LABELS: Record<string, string> = {
  llm: "LLM",
  image: "Image",
  code: "Code",
  search: "Search",
  multimodal: "Multimodal",
  "open-source": "Open Source",
};

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card overflow-hidden">
      <div className="aspect-[2/1] bg-bg-surface animate-pulse" />
      <div className="p-4 space-y-2">
        <div className="h-3 w-1/3 bg-bg-surface rounded animate-pulse" />
        <div className="h-3.5 w-5/6 bg-bg-surface rounded animate-pulse" />
        <div className="h-3 w-2/3 bg-bg-surface rounded animate-pulse" />
      </div>
    </div>
  );
}

export default function ModelPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const model = AI_MODELS.find((m) => m.slug === slug) ?? null;

  // "간략히 보기" quick-view modal (full model detail lives here, not on the page).
  const [quickOpen, setQuickOpen] = useState(false);

  // Hook is called unconditionally (null slug → no fetch) so hook order stays
  // stable even on the not-found path below.
  const { articles, total, isLoading, loadingMore, hasMore, loadMore } =
    useModelArticles(model ? model.slug : null);

  if (!model) notFound();

  const accent = model.color ?? "#3B82F6";

  return (
    <div className="space-y-8">
      {/* ── Slim full-bleed header (breaks out of the main content padding) ── */}
      <section
        className="-mx-6 -mt-4 px-6 pt-5 pb-6 border-b border-border-subtle md:-mx-10 md:-mt-6 md:px-10 lg:-mx-[130px] lg:-mt-8 lg:px-[130px]"
        style={{ background: `linear-gradient(180deg, ${accent}24, transparent)` }}
      >
        <Link
          href="/models"
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={16} /> All models
        </Link>

        <div className="mt-4 flex items-start justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${model.colorSecondary || accent})`,
                boxShadow: `0 8px 24px ${accent}40`,
              }}
            >
              <Image
                src={`/icons/models/${model.slug}.svg`}
                alt={model.name}
                width={32}
                height={32}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-text-primary font-heading leading-tight">
                  {model.name}
                </h1>
                <span
                  className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ color: accent, backgroundColor: `${accent}24` }}
                >
                  {CATEGORY_LABELS[model.category] ?? model.category}
                </span>
              </div>
              <p className="text-sm text-text-secondary">by {model.company}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <ModelActions model={model} accent={accent} />
            <button
              type="button"
              onClick={() => setQuickOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-border-subtle text-[13px] font-bold text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors whitespace-nowrap cursor-pointer"
            >
              <Eye size={14} aria-hidden="true" /> Quick view
            </button>
          </div>
        </div>

        {/* Description — collapsed to a teaser; the chevron expands the full
            overview. (Specs / About still live in the quick-view modal.) */}
        <div className="mt-4 max-w-2xl">
          <ModelInfoSections model={model} show={["description"]} />
        </div>
      </section>

      {/* ── Articles: the focus of the page ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary font-heading">
            Latest news about {model.name}
          </h2>
          {total > 0 && (
            <span className="text-sm text-text-tertiary">{total}</span>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="py-16 text-center text-sm text-text-secondary border border-dashed border-border-subtle rounded-2xl">
            No news yet for {model.name}.
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {articles.map((a) => (
                <NewsCard key={a.id} article={a} variant="card" />
              ))}
            </div>

            {hasMore && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-surface border border-border-strong text-sm font-semibold text-text-primary hover:border-text-tertiary transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {loadingMore && <Loader2 size={15} className="animate-spin" />}
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Quick-view modal — full description / specs / about live here */}
      <ModelDetailModal
        model={quickOpen ? model : null}
        onClose={() => setQuickOpen(false)}
      />
    </div>
  );
}
