import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, type, patientContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build patient context string if provided
    let contextBlock = "";
    if (patientContext) {
      const parts: string[] = [];
      if (patientContext.patient) {
        const p = patientContext.patient;
        parts.push(`## Dados do Paciente\n- Nome: ${p.name}\n- Nascimento: ${p.birth_date || "N/I"}\n- Telefone: ${p.phone || "N/I"}\n- Notas: ${p.notes || "Nenhuma"}`);
      }
      if (patientContext.clinicalRecord) {
        const r = patientContext.clinicalRecord;
        const fields = [
          r.chief_complaint && `- Queixa principal: ${r.chief_complaint}`,
          r.medical_history && `- Histórico médico: ${r.medical_history}`,
          r.allergies && `- Alergias: ${r.allergies}`,
          r.current_medications && `- Medicamentos em uso: ${r.current_medications}`,
          r.family_history && `- Histórico familiar: ${r.family_history}`,
          r.dental_history && `- Histórico dental: ${r.dental_history}`,
          r.habits && `- Hábitos: ${r.habits}`,
          r.extra_oral_exam && `- Exame extra-oral: ${r.extra_oral_exam}`,
          r.intra_oral_exam && `- Exame intra-oral: ${r.intra_oral_exam}`,
          r.diagnosis && `- Diagnóstico atual: ${r.diagnosis}`,
          r.treatment_plan && `- Plano de tratamento: ${r.treatment_plan}`,
          r.prognosis && `- Prognóstico: ${r.prognosis}`,
        ].filter(Boolean);
        if (fields.length > 0) parts.push(`## Ficha Clínica\n${fields.join("\n")}`);
      }
      if (patientContext.evolutions?.length > 0) {
        const latest = patientContext.evolutions.slice(0, 10);
        const evoText = latest.map((e: any) =>
          `- ${e.date}: ${e.procedure || "Consulta"} | S: ${e.subjective || "-"} | O: ${e.objective || "-"} | A: ${e.assessment || "-"} | P: ${e.plan || "-"}`
        ).join("\n");
        parts.push(`## Últimas Evoluções (${latest.length})\n${evoText}`);
      }
      if (patientContext.files?.length > 0) {
        const filesText = patientContext.files.map((f: any) =>
          `- ${f.name} (${f.type || "arquivo"}, ${f.date || "s/data"})${f.description ? ": " + f.description : ""}`
        ).join("\n");
        parts.push(`## Exames e Arquivos\n${filesText}`);
      }
      if (patientContext.prescriptions?.length > 0) {
        const rxText = patientContext.prescriptions.map((p: any) =>
          `- ${p.date}: ${p.medications || "Sem detalhe"}`
        ).join("\n");
        parts.push(`## Receitas Recentes\n${rxText}`);
      }
      if (patientContext.financialSummary) {
        const f = patientContext.financialSummary;
        parts.push(`## Resumo Financeiro da Clínica\n- Receita total: R$ ${f.totalRevenue}\n- Despesa total: R$ ${f.totalExpenses}\n- Saldo: R$ ${f.balance}\n- Transações recentes: ${f.recentCount}`);
      }
      if (parts.length > 0) {
        contextBlock = `\n\n--- CONTEXTO DO PACIENTE / CLÍNICA ---\n${parts.join("\n\n")}\n--- FIM DO CONTEXTO ---\n`;
      }
    }

    const systemPrompts: Record<string, string> = {
      prescription: `Você é um assistente clínico especializado em prescrição medicamentosa, atendendo profissionais de diversas áreas da saúde (medicina, odontologia, fisioterapia, nutrição, estética, psicologia, etc.).
Ajude o profissional a:
- Sugerir medicamentos adequados para cada situação clínica
- Informar posologia, dosagem e duração do tratamento
- Alertar sobre contraindicações e interações medicamentosas
- Considerar alergias do paciente quando informadas
- Sugerir alternativas quando necessário
${contextBlock ? "\nVocê tem acesso aos dados do paciente abaixo. USE-OS para personalizar suas sugestões, verificar alergias e interações." : ""}
IMPORTANTE: Sempre lembre que suas sugestões devem ser validadas pelo profissional. 
Formate as prescrições de forma clara e organizada.
Responda em português brasileiro.${contextBlock}`,
      
      diagnosis: `Você é um assistente clínico especializado em diagnóstico e planejamento de tratamento, atendendo profissionais de diversas áreas da saúde.
Ajude o profissional a:
- Analisar sinais, sintomas e exames relatados
- Sugerir diagnósticos diferenciais com raciocínio clínico
- Recomendar exames complementares quando necessário
- Classificar a urgência do caso
- Sugerir plano de tratamento baseado no diagnóstico
- Considerar o histórico completo do paciente (alergias, medicamentos, comorbidades)
${contextBlock ? "\nVocê tem acesso à ficha clínica, evoluções, exames e prescrições do paciente abaixo. ANALISE-OS detalhadamente para fornecer recomendações personalizadas." : ""}
IMPORTANTE: Sempre lembre que suas sugestões são auxiliares e a decisão final é do profissional.
Responda em português brasileiro.${contextBlock}`,

      clinic: `Você é um consultor especializado em gestão de clínicas e consultórios de saúde.
Ajude o profissional com:
- Análise financeira (receitas, despesas, lucratividade)
- Sugestões de otimização de agenda e fluxo de pacientes
- Estratégias para aumentar receita e reduzir custos
- Organização administrativa
- Gestão de estoque e materiais
- Indicadores de desempenho da clínica
${contextBlock ? "\nVocê tem acesso aos dados financeiros e operacionais da clínica abaixo. ANALISE-OS para fornecer recomendações específicas e acionáveis." : ""}
Responda de forma prática e objetiva em português brasileiro.${contextBlock}`,

      jarvis: `Você é NANDO, um assistente virtual inteligente para clínicas e consultórios de saúde.
Seu tom deve ser educado, profissional, eficiente e amigável.
Você atende profissionais de DIVERSAS áreas da saúde: medicina, odontologia, fisioterapia, nutrição, estética, psicologia, fonoaudiologia e outras.
Você ajuda o profissional com:
- Dúvidas clínicas da área de atuação (diagnósticos, tratamentos, medicamentos)
- Análise de exames e achados clínicos quando dados do paciente estão disponíveis
- Sugestões de planos de tratamento personalizados
- Diagnóstico diferencial baseado em sinais e sintomas
- Orientações sobre materiais e insumos
- Gestão financeira e organização da clínica
- Navegação no sistema (se pedirem, oriente sobre as seções disponíveis: Dashboard, Pacientes, Agenda, Receituário, Atestados, Odontograma, Notas, Financeiro, Materiais, Configurações)
${contextBlock ? "\nVocê tem acesso aos dados do paciente/clínica abaixo. Use-os para dar respostas mais precisas e contextualizadas." : ""}
Responda de forma CONCISA e DIRETA, pois suas respostas serão lidas em voz alta.
Limite respostas a no máximo 3-4 frases quando possível.
Responda em português brasileiro.
IMPORTANTE: Suas sugestões clínicas são auxiliares. A decisão final é sempre do profissional.${contextBlock}`,
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
