import Link from "next/link";
import { Compass } from "lucide-react";
import { getServerMessages } from "@/lib/i18n/server";

// 대시보드 내 404 (사이드바/헤더 유지) — article notFound() 포함
export default async function DashboardNotFound() {
  const m = await getServerMessages();
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 gap-4">
      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
        <Compass size={26} className="text-primary" />
      </div>
      <p className="text-4xl font-bold font-heading text-text-primary">404</p>
      <h2 className="text-xl font-bold font-heading text-text-primary">
        {m.errors.notFoundTitle}
      </h2>
      <p className="text-sm text-text-secondary max-w-md">
        {m.errors.notFoundDashboard}
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
