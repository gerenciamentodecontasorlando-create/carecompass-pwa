import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook que determina se o plano da clínica permite usar recursos de IA.
 * IA é exclusiva do plano Enterprise. Demais planos (free, student, professional, basic) ficam bloqueados.
 * Também expõe o uso mensal e o limite mensal definido pelo administrador.
 */
export function useAIAccess() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<string>("free");
  const [aiMonthlyLimit, setAiMonthlyLimit] = useState<number>(0);
  const [aiUsedMonth, setAiUsedMonth] = useState<number>(0);
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
        .select("plan, ai_monthly_limit")
        .eq("id", profile.clinic_id)
        .maybeSingle();
      const ym = new Date().toISOString().slice(0, 7);
      const { data: usage } = await supabase
        .from("ai_usage")
        .select("count")
        .eq("clinic_id", profile.clinic_id)
        .eq("year_month", ym)
        .maybeSingle();
      if (!cancelled) {
        setPlan(clinic?.plan || "free");
        setAiMonthlyLimit(Number(clinic?.ai_monthly_limit) || 0);
        setAiUsedMonth(Number(usage?.count) || 0);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const hasAIAccess = plan === "enterprise";
  const hasReachedLimit = aiMonthlyLimit > 0 && aiUsedMonth >= aiMonthlyLimit;

  return { hasAIAccess, plan, loading, aiMonthlyLimit, aiUsedMonth, hasReachedLimit };
}
