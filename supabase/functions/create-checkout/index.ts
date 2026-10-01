import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.25.76";
import { createStripeClient, type StripeEnv } from "../_shared/stripe.ts";

const schema = z.object({
  priceId: z.enum(["student_monthly", "professional_monthly", "enterprise_ai_monthly"]),
  quantity: z.literal(1),
  customerEmail: z.string().email().optional(),
  userId: z.string().uuid(),
  returnUrl: z.string().url(),
  environment: z.enum(["sandbox", "live"]),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (req.method !== "POST") throw new Error("Method not allowed");
    const auth = req.headers.get("Authorization")?.replace("Bearer ", "");
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user } } = await db.auth.getUser(auth);
    if (!user) return new Response(JSON.stringify({ error: "Sessão inválida" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success || parsed.data.userId !== user.id) return new Response(JSON.stringify({ error: "Dados inválidos" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const input = parsed.data;
    const stripe = createStripeClient(input.environment as StripeEnv);
    const prices = await stripe.prices.list({ lookup_keys: [input.priceId] });
    const price = prices.data[0];
    if (!price) throw new Error("Plano não encontrado");
    const customers = await stripe.customers.search({ query: `metadata['userId']:'${user.id}'`, limit: 1 });
    let customerId = customers.data[0]?.id;
    if (!customerId) customerId = (await stripe.customers.create({ email: input.customerEmail, metadata: { userId: user.id } })).id;
    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: price.id, quantity: 1 }],
      mode: "subscription",
      ui_mode: "embedded_page",
      return_url: input.returnUrl,
      customer: customerId,
      automatic_tax: { enabled: true },
      metadata: { userId: user.id, managed_payments: "false" },
      subscription_data: { metadata: { userId: user.id } },
    });
    return new Response(JSON.stringify({ clientSecret: session.client_secret }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro no pagamento" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});