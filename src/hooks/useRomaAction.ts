import { useEffect } from "react";

/**
 * Listens for global Roma voice actions dispatched as CustomEvent('roma:action').
 * Pages register handlers for action names (e.g. "new-patient", "save", "print", "close").
 *
 * Usage:
 *   useRomaAction({
 *     "new-patient": () => setOpen(true),
 *     "save":        () => formRef.current?.requestSubmit(),
 *   });
 */
export function useRomaAction(handlers: Record<string, () => void>) {
  useEffect(() => {
    const onAction = (e: Event) => {
      const detail = (e as CustomEvent<{ action: string }>).detail;
      const fn = detail && handlers[detail.action];
      if (fn) {
        try { fn(); } catch (err) { console.warn("[Roma action] handler error:", err); }
      }
    };
    window.addEventListener("roma:action", onAction);
    return () => window.removeEventListener("roma:action", onAction);
  }, [handlers]);
}
