import Link from "next/link";
import { getServerMessages } from "@/lib/i18n/server";

// 전역 404 — 대시보드 밖(미매칭 경로)에서 표시 (루트 레이아웃만 적용)
export default async function NotFound() {
  const m = await getServerMessages();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center gap-4 px-6">
      <p className="text-5xl font-bold font-heading text-primary">404</p>
      <h1 className="text-xl font-bold font-heading text-text-primary">
        {m.errors.notFoundTitle}
      </h1>
      <p className="text-sm text-text-secondary max-w-md">
        {m.errors.notFoundGlobal}
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-light transition-colors"
      >
        {m.errors.backHome}
      </Link>
    </div>
  );
}
