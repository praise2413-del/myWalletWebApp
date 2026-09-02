import { useState } from "react";
import { Outlet } from "react-router-dom";
import { MobileDrawer } from "@/components/layout/MobileDrawer";
import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Toaster } from "@/components/ui/Toaster";

export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <Sidebar />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMobileNav={() => setDrawerOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-20 pt-5 sm:px-6 lg:px-8 lg:pb-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
        <MobileNav />
      </div>
      <Toaster />
    </div>
  );
}
