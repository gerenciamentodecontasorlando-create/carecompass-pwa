import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import { JarvisButton } from "@/components/JarvisButton";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { useSyncQueue } from "@/hooks/useSyncQueue";

export function AppLayout() {
  useSyncQueue();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-h-screen">
          <header className="h-14 flex items-center border-b bg-card px-4 no-print">
            <SidebarTrigger />
            <span className="ml-3 text-lg font-bold text-primary tracking-tight">ClínicaPRO</span>
            <div className="ml-auto">
              <OfflineIndicator />
            </div>
          </header>
          <div className="flex-1 p-4 md:p-6 overflow-auto">
            <Outlet />
          </div>
        </main>
        <JarvisButton />
      </div>
    </SidebarProvider>
  );
}
