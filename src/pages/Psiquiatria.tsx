import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Brain, ClipboardList, Activity, Pill, Save, Printer, FileText, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useClinicData } from "@/hooks/useClinicData";

// ===== Escalas psiquiátricas =====
const PHQ9 = [
  "Pouco interesse ou prazer em fazer as coisas",
  "Sentir-se deprimido(a), desanimado(a) ou sem esperança",
  "Dificuldade para dormir, ou dormir demais",
  "Sentir-se cansado(a) ou com pouca energia",
  "Falta de apetite ou comer demais",
  "Sentir-se mal consigo mesmo(a) ou um fracasso",
  "Dificuldade para se concentrar",
  "Lentidão para se mover/falar OU agitação",
  "Pensamentos de que estaria melhor morto(a) ou de se ferir",
];

const GAD7 = [
  "Sentir-se nervoso(a), ansioso(a) ou no limite",
  "Não conseguir parar ou controlar as preocupações",
  "Preocupar-se demais com coisas diversas",
  "Dificuldade para relaxar",
  "Inquietação a ponto de não conseguir ficar parado(a)",
  "Ficar facilmente aborrecido(a) ou irritado(a)",
  "Sentir medo como se algo terrível fosse acontecer",
];

const ASRS6 = [
  "Dificuldade em concluir os detalhes finais de um projeto",
  "Dificuldade em organizar tarefas que requerem organização",
  "Problemas para lembrar compromissos ou obrigações",
  "Adiar tarefas que exigem muito esforço mental",
  "Mexer-se ou contorcer mãos/pés quando sentado por muito tempo",
  "Sentir-se ativo demais, como se estivesse impelido por um motor",
];

const AUDITC = [
  { q: "Frequência de consumo de bebida alcoólica", opts: ["Nunca", "Mensal ou menos", "2-4x mês", "2-3x semana", "≥4x semana"] },
  { q: "Doses por dia em que bebe", opts: ["1-2", "3-4", "5-6", "7-9", "≥10"] },
  { q: "Frequência de ≥6 doses na mesma ocasião", opts: ["Nunca", "Mensal ou menos", "Mensal", "Semanal", "Diário"] },
];

const PROTOCOLOS: Record<string, string> = {
  "depressao": `## Episódio Depressivo Maior - Conduta

**Diagnóstico:** ≥5 sintomas DSM-5 por ≥2 semanas, incluindo humor deprimido OU anedonia.

**1ª linha (ISRS):**
- Sertralina 50mg/dia → titular até 100-200mg
- Escitalopram 10mg/dia → 20mg
- Fluoxetina 20mg/dia → 40-60mg

**Alternativas:**
- Venlafaxina XR 75-225mg (IRSN)
- Bupropiona 150-300mg (sem disfunção sexual; evitar se ansiedade alta)
- Mirtazapina 15-45mg noite (insônia/perda de peso)

**Acompanhamento:** reavaliar em 2-4 semanas; resposta esperada em 4-6 sem.
Manter por ≥6-9 meses após remissão (1º episódio); ≥2 anos se recorrente.

**Sinais de alarme:** ideação suicida ativa, sintomas psicóticos, catatonia → encaminhar.`,

  "ansiedade": `## Transtorno de Ansiedade Generalizada (TAG)

**1ª linha:** ISRS (escitalopram 10-20mg, sertralina 50-200mg) ou IRSN (venlafaxina XR).
**Adjuvante curto prazo:** buspirona 15-30mg/dia OU pregabalina 150-600mg/dia.
**Benzodiazepínicos:** apenas crise/curtíssimo prazo (≤4 sem) - clonazepam 0,5-2mg/dia.

**Não-farmacológico:** TCC, mindfulness, higiene do sono, redução de cafeína.`,

  "bipolar": `## Transtorno Bipolar - Conduta

**Mania aguda:** Lítio 600-1200mg (litemia 0,8-1,2) OU Valproato 750-2000mg OU Quetiapina 400-800mg.
**Depressão bipolar:** Quetiapina, Lurasidona, Lítio, Lamotrigina (titular lentamente).
**Manutenção:** Lítio (padrão-ouro), Valproato, Lamotrigina (predomínio depressivo).

**EVITAR antidepressivo isolado** (risco de virada maníaca).
Monitorizar: TSH, função renal, hemograma, peso, lipídeos.`,

  "tdah": `## TDAH no Adulto

**Estimulantes (1ª linha):**
- Metilfenidato LA 20-60mg/dia (Ritalina LA, Concerta)
- Lisdexanfetamina 30-70mg/dia (Venvanse)

**Não-estimulantes:**
- Atomoxetina 40-80mg/dia
- Bupropiona 150-300mg

**Comorbidades:** tratar ansiedade/depressão associada. TCC + treino de habilidades.`,

  "insonia": `## Insônia

**1º passo:** higiene do sono + TCC-I (terapia cognitivo-comportamental).
**Farmacológico (curto prazo):**
- Trazodona 50-100mg noite
- Mirtazapina 7,5-15mg
- Zolpidem 5-10mg (≤4 sem)
- Melatonina 3-5mg (idosos, jet-lag)

**Evitar:** benzodiazepínicos crônicos.`,

  "psicose": `## Surto Psicótico / Esquizofrenia

**Antipsicóticos atípicos (1ª linha):**
- Risperidona 2-6mg
- Olanzapina 10-20mg
- Quetiapina 300-800mg
- Aripiprazol 10-30mg

**Refratário:** Clozapina 200-600mg (monitorar leucograma semanal nas 1ªs 18 sem).
**Encaminhar** para CAPS / serviço especializado.`,
};

const RISCO_SUICIDA = [
  { id: "ideacao", label: "Ideação suicida atual" },
  { id: "plano", label: "Plano estruturado" },
  { id: "tentativa_previa", label: "Tentativa prévia" },
  { id: "acesso_meios", label: "Acesso a meios letais" },
  { id: "isolamento", label: "Isolamento social" },
  { id: "abuso_substancia", label: "Abuso de substâncias" },
  { id: "perda_recente", label: "Perda recente significativa" },
];

type Patient = { id: string; name: string };

const Psiquiatria = () => {
  const { data: patients } = useClinicData("patients");
  const { insert: insertEvolution } = useClinicData("evolutions");
  const { data: clinicSettings } = useClinicData("clinic_settings");
  const clinic = (clinicSettings as any[])?.[0] || {};

  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const selectedPatient = useMemo(
    () => (patients as unknown as Patient[]).find((p) => p.id === selectedPatientId),
    [patients, selectedPatientId]
  );

  // ===== Receita de Controle Especial (Notificação B - branca / Portaria 344/98) =====
  const [rxTipo, setRxTipo] = useState<"B1" | "B2" | "C1">("C1");
  const [rxNumero, setRxNumero] = useState("");
  const [rxMedicamentos, setRxMedicamentos] = useState("");
  const [rxPosologia, setRxPosologia] = useState("");
  const [rxEndereco, setRxEndereco] = useState("");
  const [rxIdade, setRxIdade] = useState("");
  const [rxCompradorNome, setRxCompradorNome] = useState("");
  const [rxCompradorRg, setRxCompradorRg] = useState("");
  const [rxCompradorEndereco, setRxCompradorEndereco] = useState("");

  const tipoLabel = {
    B1: "Notificação de Receita B1 (AZUL) - Psicotrópicos (benzodiazepínicos, barbitúricos)",
    B2: "Notificação de Receita B2 (AZUL) - Anorexígenos",
    C1: "Receita de Controle Especial (BRANCA, 2 vias) - Outras substâncias sujeitas a controle (antidepressivos, antipsicóticos, anticonvulsivantes)",
  }[rxTipo];

  const imprimirReceitaControle = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const hoje = new Date().toLocaleDateString("pt-BR");
    const corBorda = rxTipo === "C1" ? "#000" : "#1e40af";
    const tituloDoc = rxTipo === "C1" ? "RECEITA DE CONTROLE ESPECIAL" : `NOTIFICAÇÃO DE RECEITA ${rxTipo}`;
    const viaHtml = (via: string) => `
      <div class="receita">
        <div class="cabec">
          <div class="clinic">
            <strong>${clinic.clinic_name || "Clínica"}</strong><br />
            ${clinic.address || ""}<br />
            ${clinic.phone ? "Tel: " + clinic.phone : ""}
          </div>
          <div class="tipo">
            <div class="titulo">${tituloDoc}</div>
            <div class="via">${via}</div>
            ${rxNumero ? `<div>Nº ${rxNumero}</div>` : ""}
          </div>
        </div>
        <hr />
        <div class="campo"><strong>Paciente:</strong> ${selectedPatient?.name || "_____________________________"}</div>
        <div class="campo"><strong>Idade:</strong> ${rxIdade || "_____"} &nbsp;&nbsp; <strong>Endereço:</strong> ${rxEndereco || "_____________________________"}</div>
        <hr />
        <div class="rx">
          <div><strong>Prescrição:</strong></div>
          <pre>${rxMedicamentos || "_______________________________________________"}</pre>
          <div><strong>Posologia / Modo de usar:</strong></div>
          <pre>${rxPosologia || "_______________________________________________"}</pre>
        </div>
        <hr />
        <div class="comprador">
          <strong>IDENTIFICAÇÃO DO COMPRADOR</strong><br />
          Nome: ${rxCompradorNome || "_____________________________"}<br />
          RG: ${rxCompradorRg || "_____________"} &nbsp;&nbsp; Endereço: ${rxCompradorEndereco || "_____________________________"}
        </div>
        <hr />
        <div class="comprador">
          <strong>IDENTIFICAÇÃO DO FORNECEDOR</strong><br />
          Farmácia: ___________________________________________ &nbsp; Data: ___/___/______<br />
          Farmacêutico (nome/CRF): ___________________________________________
        </div>
        <div class="ass">
          <div class="linha"></div>
          <div>${clinic.professional_name || "Médico(a)"}<br />
          ${clinic.professional_council || "CRM ____________"}<br />
          Data: ${hoje}</div>
        </div>
      </div>`;

    const segundaVia = rxTipo === "C1" ? viaHtml("2ª VIA - FARMÁCIA") : "";
    w.document.write(`
      <html><head><title>${tituloDoc}</title>
      <style>
        @page { size: A4; margin: 12mm; }
        body { font-family: Arial, sans-serif; font-size: 12px; color: #000; }
        .receita { border: 2px solid ${corBorda}; padding: 14px; margin-bottom: 14px; page-break-inside: avoid; }
        .cabec { display: flex; justify-content: space-between; align-items: flex-start; }
        .clinic { font-size: 11px; }
        .tipo { text-align: right; }
        .titulo { font-weight: bold; font-size: 13px; color: ${corBorda}; }
        .via { font-weight: bold; font-size: 11px; }
        hr { border: none; border-top: 1px dashed #999; margin: 8px 0; }
        .campo { margin: 4px 0; }
        pre { white-space: pre-wrap; font-family: Arial; font-size: 12px; min-height: 50px; border: 1px solid #ddd; padding: 6px; }
        .ass { margin-top: 30px; text-align: center; }
        .linha { width: 60%; border-bottom: 1px solid #000; margin: 0 auto 4px; }
        .comprador { font-size: 11px; line-height: 1.6; }
      </style></head><body>
      ${viaHtml(rxTipo === "C1" ? "1ª VIA - PACIENTE" : "VIA DA FARMÁCIA")}
      ${segundaVia}
      </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };


  // Anamnese
  const [queixa, setQueixa] = useState("");
  const [historia, setHistoria] = useState("");
  const [psiquiatricoPrevio, setPsiquiatricoPrevio] = useState("");
  const [medicacoes, setMedicacoes] = useState("");
  const [familiar, setFamiliar] = useState("");
  const [exameMental, setExameMental] = useState("");
  const [hipotese, setHipotese] = useState("");
  const [conduta, setConduta] = useState("");

  // Escalas
  const [phq, setPhq] = useState<number[]>(Array(9).fill(0));
  const [gad, setGad] = useState<number[]>(Array(7).fill(0));
  const [asrs, setAsrs] = useState<number[]>(Array(6).fill(0));
  const [audit, setAudit] = useState<number[]>(Array(3).fill(0));

  const phqTotal = phq.reduce((a, b) => a + b, 0);
  const gadTotal = gad.reduce((a, b) => a + b, 0);
  const asrsTotal = asrs.reduce((a, b) => a + b, 0);
  const auditTotal = audit.reduce((a, b) => a + b, 0);

  const phqLabel =
    phqTotal >= 20 ? "Depressão grave" :
    phqTotal >= 15 ? "Depressão moderadamente grave" :
    phqTotal >= 10 ? "Depressão moderada" :
    phqTotal >= 5 ? "Depressão leve" : "Mínimo / sem depressão";

  const gadLabel =
    gadTotal >= 15 ? "Ansiedade grave" :
    gadTotal >= 10 ? "Ansiedade moderada" :
    gadTotal >= 5 ? "Ansiedade leve" : "Mínima";

  // Risco
  const [risco, setRisco] = useState<string[]>([]);
  const toggleRisco = (id: string) =>
    setRisco((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]));
  const nivelRisco =
    risco.includes("plano") || risco.includes("tentativa_previa") ? "ALTO" :
    risco.length >= 3 ? "MODERADO" :
    risco.length >= 1 ? "BAIXO" : "AUSENTE";

  // Protocolo
  const [protocolo, setProtocolo] = useState("depressao");

  const buildResumo = () => {
    const linhas: string[] = [];
    linhas.push("=== ATENDIMENTO PSIQUIÁTRICO ===");
    if (queixa) linhas.push(`\nQueixa principal: ${queixa}`);
    if (historia) linhas.push(`\nHistória da doença atual:\n${historia}`);
    if (psiquiatricoPrevio) linhas.push(`\nAntec. psiquiátricos: ${psiquiatricoPrevio}`);
    if (medicacoes) linhas.push(`\nMedicações em uso: ${medicacoes}`);
    if (familiar) linhas.push(`\nHistória familiar: ${familiar}`);
    if (exameMental) linhas.push(`\nExame psíquico: ${exameMental}`);

    linhas.push(`\n--- Escalas ---`);
    linhas.push(`PHQ-9: ${phqTotal}/27 (${phqLabel})`);
    linhas.push(`GAD-7: ${gadTotal}/21 (${gadLabel})`);
    if (asrsTotal > 0) linhas.push(`ASRS-6: ${asrsTotal}/24${asrsTotal >= 14 ? " - sugestivo de TDAH" : ""}`);
    if (auditTotal > 0) linhas.push(`AUDIT-C: ${auditTotal}/12${auditTotal >= 4 ? " - uso de risco" : ""}`);

    linhas.push(`\nRisco de suicídio: ${nivelRisco}`);
    if (risco.length > 0) {
      linhas.push(`Fatores: ${risco.map((r) => RISCO_SUICIDA.find((x) => x.id === r)?.label).join("; ")}`);
    }

    if (hipotese) linhas.push(`\nHipótese diagnóstica: ${hipotese}`);
    if (conduta) linhas.push(`\nConduta:\n${conduta}`);
    return linhas.join("\n");
  };

  const salvarNoProntuario = async () => {
    if (!selectedPatientId) {
      toast.error("Selecione um paciente para integrar ao prontuário");
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const resumo = buildResumo();
    const ok = await insertEvolution({
      patient_id: selectedPatientId,
      date: today,
      subjective: queixa,
      objective: exameMental,
      assessment: `${hipotese}\nPHQ-9: ${phqTotal} (${phqLabel}) | GAD-7: ${gadTotal} (${gadLabel}) | Risco: ${nivelRisco}`,
      plan: conduta,
      procedure: "Atendimento psiquiátrico",
      professional: "Psiquiatria",
    });
    if (ok) {
      toast.success(`Salvo no prontuário de ${selectedPatient?.name}`);
      // Append full resumo as a clinical note too
      console.log("[Psiquiatria] Evolução salva:", resumo);
    }
  };

  const imprimir = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>Atendimento Psiquiátrico</title>
      <style>body{font-family:Arial;padding:30px;line-height:1.6;max-width:800px;margin:auto}
      h1{color:#0f766e;border-bottom:2px solid #0f766e;padding-bottom:8px}
      pre{white-space:pre-wrap;font-family:Arial;font-size:14px}</style>
      </head><body>
      <h1>Atendimento Psiquiátrico</h1>
      ${selectedPatient ? `<p><strong>Paciente:</strong> ${selectedPatient.name}</p>` : ""}
      <p><strong>Data:</strong> ${new Date().toLocaleDateString("pt-BR")}</p>
      <pre>${buildResumo().replace(/</g, "&lt;")}</pre>
      </body></html>`);
    w.document.close();
    w.print();
  };

  const renderEscala = (
    titulo: string,
    perguntas: string[],
    valores: number[],
    setValores: (v: number[]) => void,
    opts = ["0 - Nenhuma", "1 - Vários dias", "2 - + da metade", "3 - Quase todos os dias"]
  ) => (
    <Card>
      <CardHeader><CardTitle className="text-base">{titulo}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {perguntas.map((p, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center text-sm border-b pb-2">
            <div className="md:col-span-8">{i + 1}. {p}</div>
            <div className="md:col-span-4">
              <Select
                value={String(valores[i])}
                onValueChange={(v) => {
                  const next = [...valores]; next[i] = parseInt(v); setValores(next);
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {opts.map((o, idx) => <SelectItem key={idx} value={String(idx)}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <div className="container max-w-6xl mx-auto p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Brain className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Psiquiatria</h1>
          <p className="text-sm text-muted-foreground">
            Anamnese psiquiátrica, escalas validadas, avaliação de risco e protocolos terapêuticos
          </p>
        </div>
      </div>

      {/* Integração com prontuário */}
      <Card className="border-primary/30">
        <CardContent className="pt-4 flex flex-col md:flex-row gap-3 md:items-end">
          <div className="flex-1">
            <Label>Integrar ao prontuário do paciente</Label>
            <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
              <SelectTrigger><SelectValue placeholder="Selecione um paciente (opcional)" /></SelectTrigger>
              <SelectContent>
                {(patients as unknown as Patient[]).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={salvarNoProntuario} disabled={!selectedPatientId}>
            <Save className="h-4 w-4 mr-1" />Salvar no prontuário
          </Button>
          <Button variant="outline" onClick={imprimir}>
            <Printer className="h-4 w-4 mr-1" />Imprimir
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="anamnese">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
          <TabsTrigger value="anamnese"><FileText className="h-4 w-4 mr-1" />Anamnese</TabsTrigger>
          <TabsTrigger value="escalas"><ClipboardList className="h-4 w-4 mr-1" />Escalas</TabsTrigger>
          <TabsTrigger value="risco"><AlertTriangle className="h-4 w-4 mr-1" />Risco</TabsTrigger>
          <TabsTrigger value="protocolos"><Activity className="h-4 w-4 mr-1" />Protocolos</TabsTrigger>
          <TabsTrigger value="rx"><Pill className="h-4 w-4 mr-1" />Receituário</TabsTrigger>
        </TabsList>

        {/* ANAMNESE */}
        <TabsContent value="anamnese" className="space-y-3">
          <Card>
            <CardContent className="pt-4 grid gap-3">
              <div>
                <Label>Queixa principal</Label>
                <Input value={queixa} onChange={(e) => setQueixa(e.target.value)} />
              </div>
              <div>
                <Label>História da doença atual</Label>
                <Textarea rows={4} value={historia} onChange={(e) => setHistoria(e.target.value)} />
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label>Antecedentes psiquiátricos</Label>
                  <Textarea rows={2} value={psiquiatricoPrevio} onChange={(e) => setPsiquiatricoPrevio(e.target.value)} />
                </div>
                <div>
                  <Label>Medicações em uso</Label>
                  <Textarea rows={2} value={medicacoes} onChange={(e) => setMedicacoes(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>História familiar (psiquiátrica)</Label>
                <Textarea rows={2} value={familiar} onChange={(e) => setFamiliar(e.target.value)} />
              </div>
              <div>
                <Label>Exame psíquico (aparência, humor, afeto, pensamento, sensopercepção, juízo crítico)</Label>
                <Textarea rows={4} value={exameMental} onChange={(e) => setExameMental(e.target.value)} />
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label>Hipótese diagnóstica (CID-10/DSM-5)</Label>
                  <Input value={hipotese} onChange={(e) => setHipotese(e.target.value)} />
                </div>
                <div>
                  <Label>Conduta</Label>
                  <Textarea rows={2} value={conduta} onChange={(e) => setConduta(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ESCALAS */}
        <TabsContent value="escalas" className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <Card className="bg-primary/5">
              <CardContent className="pt-4 text-center">
                <div className="text-xs text-muted-foreground">PHQ-9 (Depressão)</div>
                <div className="text-3xl font-bold">{phqTotal}<span className="text-base text-muted-foreground">/27</span></div>
                <Badge variant={phqTotal >= 15 ? "destructive" : phqTotal >= 10 ? "default" : "secondary"}>{phqLabel}</Badge>
              </CardContent>
            </Card>
            <Card className="bg-primary/5">
              <CardContent className="pt-4 text-center">
                <div className="text-xs text-muted-foreground">GAD-7 (Ansiedade)</div>
                <div className="text-3xl font-bold">{gadTotal}<span className="text-base text-muted-foreground">/21</span></div>
                <Badge variant={gadTotal >= 15 ? "destructive" : gadTotal >= 10 ? "default" : "secondary"}>{gadLabel}</Badge>
              </CardContent>
            </Card>
          </div>
          {renderEscala("PHQ-9 - Triagem de Depressão", PHQ9, phq, setPhq)}
          {renderEscala("GAD-7 - Ansiedade Generalizada", GAD7, gad, setGad)}
          {renderEscala("ASRS-6 - Triagem TDAH adulto", ASRS6, asrs, setAsrs,
            ["0 - Nunca", "1 - Raramente", "2 - Às vezes", "3 - Frequentemente", "4 - Muito frequente"])}
          {renderEscala("AUDIT-C - Uso de álcool", AUDITC.map(a => a.q), audit, setAudit,
            ["0", "1", "2", "3", "4"])}
        </TabsContent>

        {/* RISCO */}
        <TabsContent value="risco" className="space-y-3">
          <Card className={
            nivelRisco === "ALTO" ? "border-destructive bg-destructive/10" :
            nivelRisco === "MODERADO" ? "border-orange-500 bg-orange-500/10" :
            "border-border"
          }>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Avaliação de risco de suicídio: {nivelRisco}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {RISCO_SUICIDA.map((r) => (
                <label key={r.id} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-accent">
                  <input type="checkbox" checked={risco.includes(r.id)} onChange={() => toggleRisco(r.id)} />
                  <span>{r.label}</span>
                </label>
              ))}
              {nivelRisco === "ALTO" && (
                <div className="p-3 bg-destructive/20 rounded text-sm">
                  ⚠️ <strong>Risco ALTO</strong> — considerar internação, contato de emergência (CVV 188),
                  remoção de meios letais, acompanhamento psiquiátrico imediato.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PROTOCOLOS */}
        <TabsContent value="protocolos">
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                {Object.keys(PROTOCOLOS).map((k) => (
                  <Button key={k} size="sm" variant={protocolo === k ? "default" : "outline"} onClick={() => setProtocolo(k)}>
                    {k.charAt(0).toUpperCase() + k.slice(1)}
                  </Button>
                ))}
              </div>
              <Textarea value={PROTOCOLOS[protocolo]} readOnly rows={22} className="font-mono text-xs" />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { navigator.clipboard.writeText(PROTOCOLOS[protocolo]); toast.success("Copiado"); }}>
                  Copiar protocolo
                </Button>
                <Button variant="outline" onClick={() => setConduta((c) => (c ? c + "\n\n" : "") + PROTOCOLOS[protocolo])}>
                  Aplicar à conduta
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rx">
          <Card>
            <CardContent className="pt-6 text-center space-y-3">
              <Pill className="h-12 w-12 mx-auto text-primary" />
              <p className="text-sm">
                Use o Receituário para gerar prescrições psiquiátricas (antidepressivos, ansiolíticos, estabilizadores, antipsicóticos).
              </p>
              <Button asChild><a href="/receituario">Abrir Receituário</a></Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Psiquiatria;
