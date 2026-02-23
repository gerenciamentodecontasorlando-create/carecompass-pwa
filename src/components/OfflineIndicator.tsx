import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { getSyncQueueCount } from "@/lib/offlineDb";
import { useEffect, useState } from "react";
import { Wifi, WifiOff, CloudUpload } from "lucide-react";

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const check = async () => setPendingCount(await getSyncQueueCount());
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
      isOnline 
        ? "bg-warning/15 text-warning-foreground border border-warning/30"
        : "bg-destructive/15 text-destructive border border-destructive/30"
    }`}>
      {isOnline ? (
        <>
          <CloudUpload className="h-3.5 w-3.5 animate-pulse" />
          <span>Sincronizando {pendingCount} alteração(ões)...</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3.5 w-3.5" />
          <span>Modo offline{pendingCount > 0 ? ` • ${pendingCount} pendente(s)` : ""}</span>
        </>
      )}
    </div>
  );
}
