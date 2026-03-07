import { useState, useEffect } from "react";

const ONLINE_CHECK_INTERVAL_MS = 10000;

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  useEffect(() => {
    const syncOnlineStatus = () => setIsOnline(navigator.onLine);

    window.addEventListener("online", syncOnlineStatus);
    window.addEventListener("offline", syncOnlineStatus);
    window.addEventListener("focus", syncOnlineStatus);
    document.addEventListener("visibilitychange", syncOnlineStatus);

    const interval = window.setInterval(syncOnlineStatus, ONLINE_CHECK_INTERVAL_MS);

    return () => {
      window.removeEventListener("online", syncOnlineStatus);
      window.removeEventListener("offline", syncOnlineStatus);
      window.removeEventListener("focus", syncOnlineStatus);
      document.removeEventListener("visibilitychange", syncOnlineStatus);
      window.clearInterval(interval);
    };
  }, []);

  return isOnline;
}
