import { useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSyncQueue, removeSyncQueueItem, type SyncQueueItem } from "@/lib/offlineDb";
import { useOnlineStatus } from "./useOnlineStatus";
import { toast } from "sonner";

export function useSyncQueue() {
  const isOnline = useOnlineStatus();
  const syncingRef = useRef(false);

  const processQueue = useCallback(async () => {
    if (syncingRef.current || !isOnline) return;
    syncingRef.current = true;

    try {
      const queue = await getSyncQueue();
      if (queue.length === 0) { syncingRef.current = false; return; }

      let synced = 0;
      let errors = 0;

      // Sort by creation time
      queue.sort((a, b) => a.createdAt - b.createdAt);

      for (const item of queue) {
        const success = await processItem(item);
        if (success) {
          await removeSyncQueueItem(item.id);
          synced++;
        } else {
          errors++;
        }
      }

      if (synced > 0) {
        toast.success(`${synced} alteração(ões) sincronizada(s)`);
      }
      if (errors > 0) {
        toast.error(`${errors} alteração(ões) falharam ao sincronizar`);
      }
    } finally {
      syncingRef.current = false;
    }
  }, [isOnline]);

  useEffect(() => {
    if (!isOnline) return;
    void processQueue();
  }, [isOnline, processQueue]);

  // Periodic check every 30s when online + focus/visibility retry
  useEffect(() => {
    if (!isOnline) return;

    const triggerProcess = () => {
      void processQueue();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void processQueue();
      }
    };

    const interval = setInterval(triggerProcess, 30000);
    window.addEventListener("focus", triggerProcess);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", triggerProcess);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isOnline, processQueue]);

  return { processQueue };
}

async function processItem(item: SyncQueueItem): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = supabase.from(item.table as any);

    switch (item.operation) {
      case "insert": {
        const { error } = await table.insert(item.payload as never);
        if (error) { console.error("Sync insert error:", error); return false; }
        return true;
      }
      case "update": {
        if (!item.recordId) return false;
        const { error } = await table.update(item.payload as never).eq("id", item.recordId);
        if (error) { console.error("Sync update error:", error); return false; }
        return true;
      }
      case "delete": {
        if (!item.recordId) return false;
        const { error } = await table.delete().eq("id", item.recordId);
        if (error) { console.error("Sync delete error:", error); return false; }
        return true;
      }
      default:
        return false;
    }
  } catch (e) {
    console.error("Sync process error:", e);
    return false;
  }
}
