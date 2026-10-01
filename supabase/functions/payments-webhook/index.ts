import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyWebhook, type StripeEnv } from "../_shared/stripe.ts";

const limits: Record<string, { plan: string; patients: number; storage: number; ai: number }> = {
  student_monthly: { plan: "student", patients: 200, storage: 500, ai: 0 },
  professional_monthly: { plan: "professional", patients: 5000, storage: 2048, ai: 0 },
  enterprise_ai_monthly: { plan: "enterprise", patients: 5000, storage: 5120, ai: 1000 },
};

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") return new Response(JSON.stringify({ received: true }), { status: 200 });
  try {
    const env = rawEnv as StripeEnv;
    const event = await verifyWebhook(req, env);
    if (["customer.subscription.created", "customer.subscription.updated", "subscription.created", "subscription.updated"].includes(event.type)) {
      const subscription = event.data.object;
      const userId = subscription.metadata?.userId;
      const item = subscription.items?.data?.[0];
      const priceId = item?.price?.lookup_key || item?.price?.metadata?.lovable_external_id;
      const plan = limits[priceId];
      if (userId && plan && ["active", "trialing", "past_due"].includes(subscription.status)) {
        const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        const { data: profile } = await db.from("profiles").select("clinic_id").eq("user_id", userId).single();
        if (profile?.clinic_id) await db.from("clinics").update({ plan: plan.plan, max_patients: plan.patients, max_storage_mb: plan.storage, ai_monthly_limit: plan.ai }).eq("id", profile.clinic_id);
      }
    }
    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Payment webhook error", error);
    return new Response("Webhook error", { status: 400 });
  }
});