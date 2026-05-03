import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkAiAccess, corsHeaders } from "../_shared/aiGuard.ts";
import { callGemini } from "../_shared/gemini.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const guard = await checkAiAccess(req);
    if (!guard.ok) return guard.response;

    const { medications, allergies, medicalHistory, currentMedications, patientName, language } = await req.json();
    const lang = language === "es" ? "es" : "pt";

    const langInstruction = lang === "es" ? "Responda en español." : "Responda em português do Brasil.";
    const systemPrompt = `Você é um farmacêutico clínico especialista em revisão de prescrições.
Identifique CONTRAINDICAÇÕES, INTERAÇÕES MEDICAMENTOSAS e RISCOS baseados nas condições do paciente.

REGRAS:
- Baseie-se em evidências (bulas ANVISA, UpToDate, Micromedex)
- Classifique cada alerta como: 🔴 GRAVE, 🟡 MODERADO, 🟢 LEVE
- Sugira alternativas quando houver contraindicação
- Se não houver problemas, diga: "✅ Prescrição sem contraindicações identificadas"
${langInstruction}`;

    const userPrompt = `PACIENTE: ${patientName || "Não informado"}

ALERGIAS: ${allergies || "Nenhuma registrada"}

HISTÓRICO MÉDICO: ${medicalHistory || "Não informado"}

MEDICAMENTOS EM USO: ${currentMedications || "Nenhum registrado"}

PRESCRIÇÃO A REVISAR:
${medications}

Analise esta prescrição considerando as condições do paciente.`;

    const response = await callGemini({
      model: "gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido." }), {
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
