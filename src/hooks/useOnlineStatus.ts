import { useState, useEffect, useCallback, useRef } from "react";

const ONLINE_CHECK_INTERVAL_MS = 15000;
const ONLINE_CHECK_TIMEOUT_MS = 4000;
const HEALTH_PATH = "/auth/v1/health";

async function checkBackendReachable(signal: AbortSignal): Promise<boolean> {
  const backendUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!backendUrl) return typeof navigator === "undefined" ? true : navigator.onLine;

  try {
    await fetch(`${backendUrl}${HEALTH_PATH}?t=${Date.now()}`, {
      method: "GET",
      cache: "no-store",
      signal,
    });
    return true;
  } catch {
    return false;
  }
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine
  );
  const checkingRef = useRef(false);

  const syncOnlineStatus = useCallback(async () => {
    if (checkingRef.current) return;
    checkingRef.current = true;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), ONLINE_CHECK_TIMEOUT_MS);

    try {
      const reachable = await checkBackendReachable(controller.signal);
      setIsOnline(reachable);
    } finally {
      window.clearTimeout(timeoutId);
      checkingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const handleStatusCheck = () => {
      void syncOnlineStatus();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void syncOnlineStatus();
      }
    };

    window.addEventListener("online", handleStatusCheck);
    window.addEventListener("offline", handleStatusCheck);
    window.addEventListener("focus", handleStatusCheck);
    document.addEventListener("visibilitychange", handleVisibility);

    const interval = window.setInterval(handleStatusCheck, ONLINE_CHECK_INTERVAL_MS);
    void syncOnlineStatus();

    return () => {
      window.removeEventListener("online", handleStatusCheck);
      window.removeEventListener("offline", handleStatusCheck);
      window.removeEventListener("focus", handleStatusCheck);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.clearInterval(interval);
    };
  }, [syncOnlineStatus]);

  return isOnline;
}

