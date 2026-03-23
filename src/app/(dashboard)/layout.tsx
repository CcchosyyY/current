"use client";

import { Suspense } from "react";
import Header from "@/components/Header";
import Sidebar, { useSidebarState } from "@/components/Sidebar";
import SidebarToggle from "@/components/SidebarToggle";
import { ToastProvider } from "@/lib/hooks/useToast";
import ToastContainer from "@/components/ToastContainer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { collapsed, toggle, mobileOpen, openMobile, closeMobile } =
    useSidebarState();

  return (
    <ToastProvider>
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header: fixed 60px height, full width */}
      <div className="flex items-center">
        {/* Mobile hamburger toggle */}
        <div className="lg:hidden pl-3">
          <SidebarToggle
            collapsed={false}
            onToggle={openMobile}
            variant="mobile"
          />
        </div>
        <div className="flex-1">
          <Header />
        </div>
      </div>

      {/* Body: Sidebar + Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Suspense fallback={<SidebarSkeleton collapsed={collapsed} />}>
          <Sidebar
            collapsed={collapsed}
            onToggle={toggle}
            mobileOpen={mobileOpen}
            onMobileClose={closeMobile}
          />
        </Suspense>

        {/* Main content: fills remaining space, scrollable */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
          <ToastContainer />
        </main>
      </div>
    </div>
    </ToastProvider>
  );
}

// Sidebar loading skeleton
function SidebarSkeleton({ collapsed }: { collapsed: boolean }) {
  return (
    <aside
      className={`hidden lg:flex flex-col h-full bg-bg-sidebar border-r border-border-subtle py-6 shrink-0 transition-[width] duration-200 ${
        collapsed ? "w-[60px] px-2" : "w-[240px] px-5"
      }`}
    >
      {!collapsed && (
        <div className="h-3 w-16 bg-bg-surface rounded mb-4 animate-pulse" />
      )}
      {collapsed && <div className="mb-4" />}
      <div className="flex flex-col gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <div className="w-[18px] h-[18px] bg-bg-surface rounded animate-pulse" />
            {!collapsed && (
              <div className="h-3 w-20 bg-bg-surface rounded animate-pulse" />
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
