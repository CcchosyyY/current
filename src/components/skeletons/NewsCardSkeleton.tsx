export default function NewsCardSkeleton() {
  return (
    <div className="bg-bg-card border border-border-subtle rounded-xl p-4 flex flex-col gap-3">
      {/* Source + time */}
      <div className="flex items-center gap-2">
        <div className="h-3 w-16 bg-bg-surface rounded animate-pulse" />
        <div className="h-3 w-12 bg-bg-surface rounded animate-pulse" />
      </div>

      {/* Title (2 lines) */}
      <div className="flex flex-col gap-1.5">
        <div className="h-4 w-full bg-bg-surface rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-bg-surface rounded animate-pulse" />
      </div>

      {/* Summary */}
      <div className="flex flex-col gap-1">
        <div className="h-3 w-full bg-bg-surface rounded animate-pulse" />
        <div className="h-3 w-5/6 bg-bg-surface rounded animate-pulse" />
      </div>

      {/* Tags */}
      <div className="flex gap-2 mt-1">
        <div className="h-5 w-14 bg-bg-surface rounded-full animate-pulse" />
        <div className="h-5 w-18 bg-bg-surface rounded-full animate-pulse" />
        <div className="h-5 w-12 bg-bg-surface rounded-full animate-pulse" />
      </div>
    </div>
  );
}
