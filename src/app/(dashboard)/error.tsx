"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw } from "lucide-react";

// 대시보드 라우트에서 발생한 런타임 오류 경계
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 운영에서는 에러 리포팅 서비스로 전송 (현재는 콘솔)
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center text-center py-24 gap-4">
      <div className="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center">
        <AlertTriangle size={26} className="text-error" />
      </div>
      <h2 className="text-xl font-bold font-heading text-text-primary">
        문제가 발생했어요
      </h2>
      <p className="text-sm text-text-secondary max-w-md">
        페이지를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
      </p>
      <div className="flex items-center gap-3 mt-2">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-light transition-colors cursor-pointer"
        >
          <RotateCw size={16} />
          다시 시도
        </button>
        <Link
          href="/"
          className="px-4 py-2 text-sm font-medium rounded-lg border border-border-strong text-text-secondary hover:text-text-primary transition-colors"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}
