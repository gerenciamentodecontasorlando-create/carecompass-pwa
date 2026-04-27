// Shared AI access guard for edge functions.
// Verifies the calling user's clinic, checks the plan + monthly AI limit,
// and increments the usage counter. Returns null on success or a Response on failure.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export async function checkAiAccess(req: Request): Promise<{ ok: true; clinicId: string } | { ok: false; response: Response }> {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");

  if (!token) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Não autenticado." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Sessão inválida." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  const userId = userData.user.id;

  // Find clinic via profile
  const { data: profile } = await admin
    .from("profiles").select("clinic_id").eq("user_id", userId).maybeSingle();

  if (!profile?.clinic_id) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Clínica não encontrada." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  const clinicId = profile.clinic_id as string;

  const { data: clinic } = await admin
    .from("clinics").select("plan, ai_monthly_limit").eq("id", clinicId).maybeSingle();

  if (!clinic) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Clínica não encontrada." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  if (clinic.plan !== "enterprise") {
    return {
      ok: false,
      response: new Response(JSON.stringify({
        error: "Recurso de IA disponível apenas no plano Enterprise. Faça upgrade para liberar.",
      }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }),
    };
  }

  // Check current month usage vs limit (0 = unlimited)
  const ym = new Date().toISOString().slice(0, 7); // YYYY-MM
  const { data: usage } = await admin
    .from("ai_usage").select("count").eq("clinic_id", clinicId).eq("year_month", ym).maybeSingle();
  const used = usage?.count || 0;
  const limit = clinic.ai_monthly_limit || 0;

  if (limit > 0 && used >= limit) {
    return {
      ok: false,
      response: new Response(JSON.stringify({
        error: `Limite mensal de IA atingido (${used}/${limit}). Entre em contato com o administrador para aumentar.`,
      }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }),
    };
  }

  // Increment counter (best-effort)
  await admin.rpc("increment_ai_usage", { _clinic_id: clinicId });

  return { ok: true, clinicId };
}
