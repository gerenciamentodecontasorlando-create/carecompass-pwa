import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook que determina se o plano da clínica permite usar recursos de IA.
 * IA é exclusiva do plano Enterprise. O plano Básico (free/basic) é bloqueado.
 */
export function useAIAccess() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<string>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("clinic_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!profile?.clinic_id) {
        if (!cancelled) setLoading(false);
        return;
      }
      const { data: clinic } = await supabase
        .from("clinics")
        .select("plan")
        .eq("id", profile.clinic_id)
        .maybeSingle();
      if (!cancelled) {
        setPlan(clinic?.plan || "free");
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const hasAIAccess = plan === "enterprise";

  return { hasAIAccess, plan, loading };
}
