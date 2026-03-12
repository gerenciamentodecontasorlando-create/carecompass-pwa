import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { medications, allergies, medicalHistory, currentMedications, patientName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é um farmacêutico clínico especialista em revisão de prescrições médicas e odontológicas.
Sua função é revisar a prescrição abaixo e identificar CONTRAINDICAÇÕES, INTERAÇÕES MEDICAMENTOSAS e RISCOS baseados nas condições do paciente.

REGRAS:
- Baseie-se em evidências científicas (bulas oficiais ANVISA, UpToDate, Micromedex, Drug Interactions Checker)
- Seja objetivo e direto
- Para cada problema encontrado, cite a fonte/referência científica
- Classifique cada alerta como: 🔴 GRAVE (contraindicação absoluta), 🟡 MODERADO (requer ajuste ou monitoramento), 🟢 LEVE (atenção mas aceitável)
- Se não houver problemas, diga claramente "✅ Prescrição sem contraindicações identificadas"
- Sempre sugira alternativas quando houver contraindicação
- Responda em português do Brasil`;

    const userPrompt = `PACIENTE: ${patientName || "Não informado"}

ALERGIAS: ${allergies || "Nenhuma registrada"}

HISTÓRICO MÉDICO: ${medicalHistory || "Não informado"}

MEDICAMENTOS EM USO: ${currentMedications || "Nenhum registrado"}

PRESCRIÇÃO A REVISAR:
${medications}

Analise esta prescrição considerando as condições do paciente e identifique possíveis contraindicações, interações medicamentosas e riscos.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido, tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const review = data.choices?.[0]?.message?.content || "Não foi possível analisar a prescrição.";

    return new Response(JSON.stringify({ review }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("review-prescription error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
