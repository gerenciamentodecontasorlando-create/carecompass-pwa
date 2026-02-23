import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { transcript, segments, patientName } = await req.json();

    const formattedTranscript = segments
      ? segments.map((s: { speaker: string; text: string }) => `[${s.speaker}]: ${s.text}`).join("\n")
      : transcript;

    const systemPrompt = `Você é um assistente clínico odontológico especializado em transformar transcrições de consultas em notas clínicas no formato SOAP.

Regras:
1. A transcrição possui dois falantes: um é o PROFISSIONAL (dentista) e outro é o PACIENTE.
2. Use o contexto para identificar quem é quem (o profissional faz perguntas técnicas, examina, dá instruções; o paciente relata sintomas, responde perguntas).
3. Organize as informações relevantes no formato SOAP:
   - **S (Subjetivo)**: Queixas, sintomas e relatos do PACIENTE em suas próprias palavras.
   - **O (Objetivo)**: Achados clínicos, observações e exames relatados pelo PROFISSIONAL.
   - **A (Avaliação)**: Diagnóstico ou hipótese diagnóstica mencionada pelo profissional.
   - **P (Plano)**: Tratamento proposto, orientações e próximos passos.
4. Se informações de procedimento ou dente forem mencionadas, inclua-as separadamente.
5. Filtre conversas irrelevantes (cumprimentos, assuntos pessoais).
6. Responda APENAS em português brasileiro.
7. Retorne SOMENTE o JSON, sem markdown, sem code blocks.

Formato de resposta (JSON puro):
{
  "subjective": "texto...",
  "objective": "texto...",
  "assessment": "texto...",
  "plan": "texto...",
  "procedure": "texto ou vazio",
  "tooth_number": "número ou vazio"
}`;

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
          { role: "user", content: `Paciente: ${patientName || "Não informado"}\n\nTranscrição da consulta:\n${formattedTranscript}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
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
      throw new Error("Erro no serviço de IA");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";

    // Parse JSON from the AI response
    let soap;
    try {
      // Try to extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      soap = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch {
      console.error("Failed to parse SOAP JSON:", content);
      soap = {
        subjective: content,
        objective: "",
        assessment: "",
        plan: "",
        procedure: "",
        tooth_number: "",
      };
    }

    return new Response(JSON.stringify(soap), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-soap error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
