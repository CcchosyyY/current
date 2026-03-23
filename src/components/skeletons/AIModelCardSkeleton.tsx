export default function AIModelCardSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center aspect-square rounded-xl border border-border-subtle bg-bg-card">
      {/* Brand color circle */}
      <div className="w-10 h-10 bg-bg-surface rounded-lg animate-pulse mb-2" />

      {/* Model name */}
      <div className="h-3 w-14 bg-bg-surface rounded animate-pulse mb-1" />

      {/* Company */}
      <div className="h-2.5 w-10 bg-bg-surface rounded animate-pulse" />
    </div>
  );
}
