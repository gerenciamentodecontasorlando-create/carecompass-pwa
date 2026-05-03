import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkAiAccess, corsHeaders } from "../_shared/aiGuard.ts";
import { callGemini } from "../_shared/gemini.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const guard = await checkAiAccess(req);
    if (!guard.ok) return guard.response;

    const { description, fileName, category, patientInfo, language } = await req.json();
    const lang = language === "es" ? "es" : "pt";

    const langInstruction = lang === "es" ? "Responda en español." : "Responda em português brasileiro.";
    const systemPrompt = `Você é um assistente clínico especializado em análise de exames complementares. Auxilie o profissional de saúde na interpretação dos resultados.

Forneça:
1. **Observações**: O que se pode inferir das informações disponíveis
2. **Possíveis achados**: Achados clínicos a investigar
3. **Sugestões**: Recomendações de conduta ou exames complementares
4. **Alertas**: Valores ou achados que merecem atenção imediata

IMPORTANTE: Suas análises são AUXILIARES. A decisão final é SEMPRE do profissional. Seja objetivo e use terminologia técnica.
${langInstruction}`;

    const userMessage = `Analise o seguinte exame:
- Arquivo: ${fileName}
- Categoria: ${category}
- Descrição do profissional: ${description || "Sem descrição"}
${patientInfo ? `- Informações do paciente: ${patientInfo}` : ""}

Forneça sua análise auxiliar.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "Sem resposta da IA.";

    return new Response(JSON.stringify({ analysis: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-exam error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
