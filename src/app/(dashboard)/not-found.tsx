import Link from "next/link";
import { Compass } from "lucide-react";

// 대시보드 내 404 (사이드바/헤더 유지) — article notFound() 포함
export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 gap-4">
      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
        <Compass size={26} className="text-primary" />
      </div>
      <p className="text-4xl font-bold font-heading text-text-primary">404</p>
      <h2 className="text-xl font-bold font-heading text-text-primary">
        페이지를 찾을 수 없어요
      </h2>
      <p className="text-sm text-text-secondary max-w-md">
        요청하신 페이지가 없거나 이동되었을 수 있어요. 삭제된 기사일 수도 있습니다.
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
