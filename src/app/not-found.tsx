import Link from "next/link";

// 전역 404 — 대시보드 밖(미매칭 경로)에서 표시 (루트 레이아웃만 적용)
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center gap-4 px-6">
      <p className="text-5xl font-bold font-heading text-primary">404</p>
      <h1 className="text-xl font-bold font-heading text-text-primary">
        페이지를 찾을 수 없어요
      </h1>
      <p className="text-sm text-text-secondary max-w-md">
        주소가 잘못되었거나 페이지가 이동/삭제되었을 수 있습니다.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-light transition-colors"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
