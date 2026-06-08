// 대시보드 라우트 전환 중 표시되는 로딩 스켈레톤
export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="로딩 중">
      {/* 섹션 제목 */}
      <div className="h-6 w-40 bg-bg-surface rounded animate-pulse" />

      {/* 뉴스 리스트 행 */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <div className="w-9 h-9 rounded-full bg-bg-surface animate-pulse shrink-0" />
            <div className="h-3 flex-1 bg-bg-surface rounded animate-pulse" />
            <div className="h-3 w-12 bg-bg-surface rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* 모델 그리드 */}
      <div className="bg-bg-card border border-border-subtle rounded-2xl p-5">
        <div className="h-5 w-28 bg-bg-surface rounded animate-pulse mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-24 bg-bg-surface rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
