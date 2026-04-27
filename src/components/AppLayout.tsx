import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import { JarvisButton } from "@/components/JarvisButton";
import { SuggestionBox } from "@/components/SuggestionBox";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { useSyncQueue } from "@/hooks/useSyncQueue";
import { Shield, Lock } from "lucide-react";

export function AppLayout() {
  useSyncQueue();

  // Force re-render on orientation change / resize for tablets
  const [, setViewKey] = useState(0);
  useEffect(() => {
    const handleResize = () => setViewKey((k) => k + 1);
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-h-screen">
          <header className="h-14 flex items-center border-b bg-card px-4 no-print">
            <SidebarTrigger />
            <span className="ml-3 text-lg font-bold text-primary tracking-tight">Btx CliniCos</span>
            <div className="ml-auto flex items-center gap-3">
              <OfflineIndicator />
              <div className="hidden md:flex items-center gap-1 text-[10px] text-muted-foreground">
                <Lock className="h-3 w-3" />
                <span>TLS/SSL</span>
              </div>
            </div>
          </header>
          <div className="flex-1 p-4 md:p-6 overflow-auto">
            <Outlet />
          </div>
          <footer className="border-t bg-card px-4 py-2 no-print">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><Shield className="h-3 w-3" />Protegido pela LGPD — Lei nº 13.709/2018</span>
              <span className="flex items-center gap-1"><Lock className="h-3 w-3" />Dados criptografados em trânsito (TLS) e em repouso (AES-256)</span>
              <span>© {new Date().getFullYear()} Btx CliniCos — Todos os direitos reservados</span>
            </div>
          </footer>
        </main>
        <JarvisButton />
        <SuggestionBox />
      </div>
    </SidebarProvider>
  );
}
