import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkAiAccess, corsHeaders } from "../_shared/aiGuard.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const guard = await checkAiAccess(req);
    if (!guard.ok) return guard.response;

    const { messages, type, patientContext, imageUrl, language } = await req.json();
    const lang = language === "es" ? "es" : "pt";
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
      if (patientContext.transactions?.length > 0) {
        const txText = patientContext.transactions.map((t: any) =>
          `- ${t.date} | ${t.type} | R$ ${t.amount} | ${t.description}${t.category ? " (" + t.category + ")" : ""}`
        ).join("\n");
        parts.push(`## Transações Detalhadas (últimas ${patientContext.transactions.length})\n${txText}`);
      }
      if (patientContext.appointments?.length > 0) {
        const apptText = patientContext.appointments.map((a: any) =>
          `- ${a.date} ${a.time} | ${a.patient_name} | ${a.procedure || a.type || "Consulta"} | Status: ${a.status || "agendado"}${a.dentist ? " | Prof: " + a.dentist : ""}${a.notes ? " | Obs: " + a.notes : ""}`
        ).join("\n");
        parts.push(`## Agenda (${patientContext.appointments.length} compromissos)\n${apptText}`);
      }
      if (patientContext.certificates?.length > 0) {
        const certText = patientContext.certificates.map((c: any) =>
          `- ${c.date} | ${c.patient_name} | ${c.days || "1"} dia(s)${c.content ? " | " + c.content.substring(0, 100) : ""}`
        ).join("\n");
        parts.push(`## Atestados Recentes (${patientContext.certificates.length})\n${certText}`);
      }
      if (parts.length > 0) {
        contextBlock = `\n\n--- CONTEXTO DO PACIENTE / CLÍNICA ---\n${parts.join("\n\n")}\n--- FIM DO CONTEXTO ---\n`;
      }
    }

    const imageInstruction = imageUrl
      ? "\n\nIMPORTANTE: O profissional anexou uma imagem (radiografia/exame). Analise a imagem detalhadamente, descreva os achados radiográficos/clínicos visíveis, sugira diagnósticos diferenciais e recomende condutas."
      : "";

    const langInstruction = lang === "es"
      ? "Responda en español."
      : "Responda em português brasileiro.";

    const systemPrompts: Record<string, string> = {
      prescription: `Você é um assistente clínico especializado em prescrição medicamentosa, atendendo profissionais de diversas áreas da saúde.
Ajude o profissional a sugerir medicamentos, posologia, alertar sobre contraindicações e interações.
${contextBlock ? "\nVocê tem acesso aos dados do paciente abaixo. USE-OS para personalizar suas sugestões." : ""}
IMPORTANTE: Sempre lembre que suas sugestões devem ser validadas pelo profissional.
${langInstruction}${contextBlock}${imageInstruction}`,
      
      diagnosis: `Você é um assistente clínico especializado em diagnóstico e planejamento de tratamento.
Ajude com análise de sinais, sintomas, exames e imagens. Sugira diagnósticos diferenciais e planos de tratamento.
${contextBlock ? "\nVocê tem acesso à ficha clínica do paciente abaixo. ANALISE-OS detalhadamente." : ""}
IMPORTANTE: Suas sugestões são auxiliares e a decisão final é do profissional.
${langInstruction}${contextBlock}${imageInstruction}`,

      clinic: `Você é um consultor especializado em gestão de clínicas e consultórios de saúde.
Ajude com análise financeira, organização de agenda, controle de estoque e indicadores de desempenho.
${contextBlock ? "\nVocê tem acesso aos dados da clínica abaixo. ANALISE-OS DETALHADAMENTE." : ""}
${langInstruction}${contextBlock}`,

      jarvis: `Você é ROMA, um assistente virtual inteligente para clínicas e consultórios de saúde.
Seu tom deve ser educado, profissional, eficiente e amigável.
Você ajuda com dúvidas clínicas, análise de exames, gestão da clínica e navegação no sistema.
${contextBlock ? "\nVocê tem acesso aos dados do paciente/clínica abaixo." : ""}
Responda de forma CONCISA e DIRETA, pois suas respostas serão lidas em voz alta.
Limite respostas a no máximo 3-4 frases quando possível.
${langInstruction}
IMPORTANTE: Suas sugestões clínicas são auxiliares. A decisão final é sempre do profissional.${contextBlock}${imageInstruction}`,
    };

    const systemContent = systemPrompts[type] || systemPrompts.diagnosis;

    // Use a vision-capable model when image is present
    const model = imageUrl ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview";

    // Build the last user message with image if provided
    const apiMessages = [...messages];
    if (imageUrl && apiMessages.length > 0) {
      const lastMsg = apiMessages[apiMessages.length - 1];
      if (lastMsg.role === "user") {
        // If the last message already has multimodal content, keep it
        if (typeof lastMsg.content === "string") {
          lastMsg.content = [
            { type: "text", text: lastMsg.content || "Analise esta imagem" },
            { type: "image_url", image_url: { url: imageUrl } },
          ];
        }
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemContent },
          ...apiMessages,
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
