// 기사 상세(서버 컴포넌트)의 Supabase 조회 대기 중 스켈레톤
export default function ArticleLoading() {
  return (
    <div className="max-w-3xl mx-auto" aria-busy="true" aria-label="기사 불러오는 중">
      {/* Back link */}
      <div className="h-4 w-24 bg-bg-surface rounded animate-pulse mb-6" />

      {/* Meta row */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-5 w-16 bg-bg-surface rounded animate-pulse" />
        <div className="h-4 w-20 bg-bg-surface rounded animate-pulse" />
      </div>

      {/* Title (2 lines) */}
      <div className="space-y-2 mb-4">
        <div className="h-8 w-full bg-bg-surface rounded animate-pulse" />
        <div className="h-8 w-2/3 bg-bg-surface rounded animate-pulse" />
      </div>

      {/* Source */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 rounded-full bg-bg-surface animate-pulse" />
        <div className="space-y-1.5">
          <div className="h-3 w-24 bg-bg-surface rounded animate-pulse" />
          <div className="h-3 w-16 bg-bg-surface rounded animate-pulse" />
        </div>
      </div>

      {/* Hero image */}
      <div className="w-full aspect-video rounded-xl bg-bg-surface animate-pulse mb-8" />

      {/* Body paragraphs */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`h-4 bg-bg-surface rounded animate-pulse ${
              i % 3 === 2 ? "w-4/5" : "w-full"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
