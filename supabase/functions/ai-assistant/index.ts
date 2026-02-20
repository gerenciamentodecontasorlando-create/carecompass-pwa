import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompts: Record<string, string> = {
      prescription: `Você é um assistente odontológico especializado em prescrição medicamentosa. 
Ajude o dentista a:
- Sugerir medicamentos adequados para cada situação clínica
- Informar posologia, dosagem e duração do tratamento
- Alertar sobre contraindicações e interações medicamentosas
- Considerar alergias do paciente quando informadas
- Sugerir alternativas quando necessário

IMPORTANTE: Sempre lembre que suas sugestões devem ser validadas pelo profissional. 
Formate as prescrições de forma clara e organizada.
Responda em português brasileiro.`,
      
      diagnosis: `Você é um assistente odontológico especializado em diagnóstico clínico.
Ajude o dentista a:
- Analisar sinais e sintomas relatados
- Sugerir diagnósticos diferenciais
- Recomendar exames complementares quando necessário
- Classificar a urgência do caso
- Sugerir plano de tratamento baseado no diagnóstico

IMPORTANTE: Sempre lembre que suas sugestões são auxiliares e a decisão final é do profissional.
Responda em português brasileiro.`,

      jarvis: `Você é JARVIS, um assistente virtual inteligente para um consultório odontológico, inspirado no assistente do Homem de Ferro.
Seu tom deve ser educado, profissional, eficiente e levemente sofisticado, como o JARVIS dos filmes.
Você ajuda o dentista com:
- Dúvidas clínicas odontológicas (diagnósticos, tratamentos, medicamentos)
- Informações sobre procedimentos odontológicos
- Sugestões de planos de tratamento
- Orientações sobre materiais dentários
- Qualquer dúvida profissional da área odontológica
- Navegação no sistema (se pedirem, oriente sobre as seções disponíveis: Dashboard, Pacientes, Agenda, Receituário, Atestados, Odontograma, Notas, Financeiro, Materiais, Configurações)

Responda de forma CONCISA e DIRETA, pois suas respostas serão lidas em voz alta.
Limite respostas a no máximo 3-4 frases quando possível.
Responda em português brasileiro.
IMPORTANTE: Suas sugestões clínicas são auxiliares. A decisão final é sempre do profissional.`,
    };

    const systemContent = systemPrompts[type] || systemPrompts.diagnosis;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemContent },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos em Configurações." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
