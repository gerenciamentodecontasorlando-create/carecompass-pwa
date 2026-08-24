import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Apple, Calculator, ClipboardList, FileText, Save, Printer } from "lucide-react";
import { toast } from "sonner";
import { useClinicData } from "@/hooks/useClinicData";

type Patient = { id: string; name: string };

const ATIVIDADE = [
  { v: 1.2, label: "Sedentário (sem exercício)" },
  { v: 1.375, label: "Leve (1-3x/semana)" },
  { v: 1.55, label: "Moderado (3-5x/semana)" },
  { v: 1.725, label: "Intenso (6-7x/semana)" },
  { v: 1.9, label: "Muito intenso (atleta / trabalho físico)" },
];

const OBJETIVOS = [
  { id: "manutencao", label: "Manutenção de peso", ajuste: 0 },
  { id: "emagrecimento", label: "Emagrecimento (-500 kcal)", ajuste: -500 },
  { id: "emagrecimento_agressivo", label: "Emagrecimento acelerado (-750 kcal)", ajuste: -750 },
  { id: "hipertrofia", label: "Ganho de massa (+400 kcal)", ajuste: 400 },
  { id: "recuperacao", label: "Recuperação nutricional (+600 kcal)", ajuste: 600 },
];

const PROTOCOLOS: Record<string, string> = {
  obesidade: `## Obesidade / Sobrepeso

**Meta:** perda de 5-10% do peso em 6 meses (0,5-1 kg/semana).
**Déficit:** 500-750 kcal/dia sobre o GET.
**Macros:** PTN 1,2-1,6 g/kg peso atual • CHO 40-50% • LIP 25-30%.
**Estratégias:** fracionamento em 4-5 refeições, 25-35 g de fibras/dia, 30-35 mL água/kg,
priorizar alimentos in natura (NOVA 1), reduzir ultraprocessados e bebidas açucaradas.
**Monitorar:** peso, circunferência abdominal, perfil lipídico, glicemia, HbA1c.`,

  diabetes: `## Diabetes Mellitus tipo 2

**CHO:** 45-60% do VET, priorizar baixo índice glicêmico; contagem de carboidratos se insulinizado.
**Fibras:** ≥20 g/1000 kcal (ideal 30-40 g/dia).
**Sacarose:** ≤10% do VET. Adoçantes não nutritivos permitidos.
**PTN:** 15-20% (0,8-1 g/kg se DRC estágio ≥3).
**LIP:** ≤7% saturada, evitar trans, incluir mono/poli-insaturados.
**Distribuição:** 3 refeições + 2-3 lanches, evitar jejum prolongado se em uso de insulina/sulfonilureia.`,

  has: `## Hipertensão Arterial (dieta DASH)

**Sódio:** <2000 mg/dia (≤5 g de sal). Retirar saleiro da mesa.
**Potássio:** 4700 mg/dia (frutas, verduras, leguminosas) — cuidado se DRC.
**Padrão DASH:** 4-5 porções frutas + 4-5 hortaliças + 2-3 lácteos desnatados + oleaginosas 4-5x/semana.
**Álcool:** ≤1 dose/dia (mulher) e ≤2 (homem).
**Peso:** cada 1 kg perdido reduz ~1 mmHg na PAS.`,

  dislipidemia: `## Dislipidemia

**Saturada:** <7% do VET • **Trans:** zero • **Colesterol:** <300 mg/dia.
**Fitosteróis:** 2 g/dia (redução LDL 8-10%).
**Fibra solúvel:** 10-25 g/dia (aveia, leguminosas, frutas com casca).
**Ômega-3:** 1-4 g/dia EPA+DHA se hipertrigliceridemia.
**Reduzir:** frutose livre e álcool (triglicerídeos).`,

  gestante: `## Gestação e Lactação

**Energia extra:** 1º trimestre +0 • 2º +340 kcal • 3º +452 kcal • lactação +500 kcal.
**PTN:** 1,1 g/kg/dia (≈ +25 g/dia).
**Ácido fólico:** 400-600 mcg/dia • **Ferro:** 27 mg/dia • **Cálcio:** 1000 mg/dia • **Iodo:** 220 mcg.
**Ganho de peso (IMC pré-gestacional):** baixo peso 12,5-18 kg • eutrófica 11,5-16 • sobrepeso 7-11,5 • obesidade 5-9 kg.
**Evitar:** álcool, carne/ovo cru, queijos não pasteurizados, peixes com alto mercúrio, cafeína >200 mg.`,

  pediatria: `## Nutrição Infantil

**0-6 meses:** aleitamento materno exclusivo em livre demanda.
**6 meses:** introdução alimentar — papa principal amassada (não liquidificada), 2 papas de fruta.
**7-8 meses:** 2 papas principais • **9-11 meses:** comida da família amassada • **12 meses:** dieta da família.
**Evitar até 2 anos:** açúcar, mel, sal em excesso, ultraprocessados, sucos industrializados.
**Ferro:** suplementar 1 mg/kg/dia dos 3 aos 24 meses (SBP) se em risco.`,

  esportiva: `## Nutrição Esportiva

**CHO:** resistência 6-10 g/kg/dia; força 4-7 g/kg/dia. Pré-treino 1-4 g/kg 1-4 h antes.
**PTN:** 1,6-2,2 g/kg/dia, dividido em 4 doses de 0,3 g/kg.
**Pós-treino:** 0,3 g/kg PTN + 1 g/kg CHO na janela de 2 h.
**Hidratação:** 400-800 mL/h de treino; repor 1,5x a perda de peso pós-treino.
**Suplementos com evidência:** creatina 3-5 g/dia, cafeína 3-6 mg/kg, beta-alanina 4-6 g/dia.`,

  renal: `## Doença Renal Crônica (conservador)

**PTN:** 0,6-0,8 g/kg/dia (não dialítico) • 1,0-1,2 g/kg (hemodiálise).
**Sódio:** <2000 mg • **Potássio:** restringir se K >5,5 (deixar de molho / cozimento duplo).
**Fósforo:** 800-1000 mg/dia, evitar aditivos fosfatados (refrigerante escuro, embutidos).
**Energia:** 30-35 kcal/kg/dia para evitar catabolismo.`,
};

const REFEICOES = [
  "Café da manhã",
  "Lanche da manhã",
  "Almoço",
  "Lanche da tarde",
  "Jantar",
  "Ceia",
];

const Nutricao = () => {
  const { data: patients } = useClinicData("patients");
  const { insert: insertEvolution } = useClinicData("evolutions");
  const { data: clinicSettings } = useClinicData("clinic_settings");
  const clinic = ((clinicSettings as any[]) || [])[0] || {};

  const [selectedPatientId, setSelectedPatientId] = useState("");
  const selectedPatient = useMemo(
    () => ((patients as unknown as Patient[]) || []).find((p) => p.id === selectedPatientId),
    [patients, selectedPatientId]
  );

  // ==== Antropometria ====
  const [sexo, setSexo] = useState<"M" | "F">("F");
  const [idade, setIdade] = useState("");
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [cintura, setCintura] = useState("");
  const [quadril, setQuadril] = useState("");
  const [braco, setBraco] = useState("");
  const [panturrilha, setPanturrilha] = useState("");

  const pesoN = parseFloat(peso.replace(",", ".")) || 0;
  const alturaN = parseFloat(altura.replace(",", ".")) || 0;
  const alturaM = alturaN > 3 ? alturaN / 100 : alturaN;
  const imc = alturaM > 0 ? pesoN / (alturaM * alturaM) : 0;
  const imcLabel =
    imc === 0 ? "-" :
    imc < 18.5 ? "Baixo peso" :
    imc < 25 ? "Eutrofia" :
    imc < 30 ? "Sobrepeso" :
    imc < 35 ? "Obesidade grau I" :
    imc < 40 ? "Obesidade grau II" : "Obesidade grau III";

  const rcq = parseFloat(quadril) > 0 ? parseFloat(cintura) / parseFloat(quadril) : 0;
  const rcqRisco = rcq === 0 ? "-" : sexo === "M" ? (rcq >= 0.9 ? "Risco elevado" : "Adequado") : (rcq >= 0.85 ? "Risco elevado" : "Adequado");
  const cinturaRisco =
    !cintura ? "-" :
    sexo === "M"
      ? parseFloat(cintura) >= 102 ? "Risco muito elevado" : parseFloat(cintura) >= 94 ? "Risco elevado" : "Adequado"
      : parseFloat(cintura) >= 88 ? "Risco muito elevado" : parseFloat(cintura) >= 80 ? "Risco elevado" : "Adequado";

  const pesoIdealMin = alturaM > 0 ? 18.5 * alturaM * alturaM : 0;
  const pesoIdealMax = alturaM > 0 ? 24.9 * alturaM * alturaM : 0;

  // ==== Gasto energético ====
  const [fator, setFator] = useState("1.375");
  const [objetivo, setObjetivo] = useState("manutencao");
  const idadeN = parseFloat(idade) || 0;
  // Mifflin-St Jeor
  const tmb = pesoN > 0 && alturaM > 0 && idadeN > 0
    ? Math.round(10 * pesoN + 6.25 * (alturaM * 100) - 5 * idadeN + (sexo === "M" ? 5 : -161))
    : 0;
  const get = Math.round(tmb * parseFloat(fator));
  const ajuste = OBJETIVOS.find((o) => o.id === objetivo)?.ajuste || 0;
  const vet = get > 0 ? Math.max(1000, get + ajuste) : 0;

  const [pctPtn, setPctPtn] = useState("20");
  const [pctCho, setPctCho] = useState("50");
  const [pctLip, setPctLip] = useState("30");
  const gPtn = vet ? Math.round((vet * (parseFloat(pctPtn) / 100)) / 4) : 0;
  const gCho = vet ? Math.round((vet * (parseFloat(pctCho) / 100)) / 4) : 0;
  const gLip = vet ? Math.round((vet * (parseFloat(pctLip) / 100)) / 9) : 0;
  const somaPct = (parseFloat(pctPtn) || 0) + (parseFloat(pctCho) || 0) + (parseFloat(pctLip) || 0);
  const agua = pesoN ? Math.round(pesoN * 35) : 0;

  // ==== Anamnese ====
  const [objetivoConsulta, setObjetivoConsulta] = useState("");
  const [historiaClinica, setHistoriaClinica] = useState("");
  const [habitos, setHabitos] = useState("");
  const [intolerancias, setIntolerancias] = useState("");
  const [recordatorio, setRecordatorio] = useState("");
  const [exames, setExames] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [conduta, setConduta] = useState("");

  // ==== Plano alimentar ====
  const [plano, setPlano] = useState<Record<string, string>>({});
  const [orientacoes, setOrientacoes] = useState("");
  const [protocolo, setProtocolo] = useState("obesidade");

  const buildResumo = () => {
    const l: string[] = [];
    l.push("=== ATENDIMENTO NUTRICIONAL ===");
    if (objetivoConsulta) l.push(`\nObjetivo da consulta: ${objetivoConsulta}`);
    if (historiaClinica) l.push(`\nHistória clínica:\n${historiaClinica}`);
    if (habitos) l.push(`\nHábitos alimentares e de vida:\n${habitos}`);
    if (intolerancias) l.push(`\nAlergias / intolerâncias / aversões: ${intolerancias}`);
    if (recordatorio) l.push(`\nRecordatório alimentar 24h:\n${recordatorio}`);
    if (exames) l.push(`\nExames laboratoriais: ${exames}`);

    l.push("\n--- Avaliação antropométrica ---");
    if (pesoN) l.push(`Peso: ${pesoN} kg`);
    if (alturaM) l.push(`Altura: ${(alturaM * 100).toFixed(0)} cm`);
    if (imc) l.push(`IMC: ${imc.toFixed(1)} kg/m² (${imcLabel})`);
    if (pesoIdealMin) l.push(`Faixa de peso saudável: ${pesoIdealMin.toFixed(1)} - ${pesoIdealMax.toFixed(1)} kg`);
    if (cintura) l.push(`Circunferência da cintura: ${cintura} cm (${cinturaRisco})`);
    if (rcq) l.push(`Relação cintura/quadril: ${rcq.toFixed(2)} (${rcqRisco})`);
    if (braco) l.push(`Circunferência do braço: ${braco} cm`);
    if (panturrilha) l.push(`Circunferência da panturrilha: ${panturrilha} cm`);

    if (vet) {
      l.push("\n--- Necessidades energéticas ---");
      l.push(`TMB (Mifflin-St Jeor): ${tmb} kcal • GET: ${get} kcal`);
      l.push(`VET prescrito: ${vet} kcal (${OBJETIVOS.find((o) => o.id === objetivo)?.label})`);
      l.push(`Macros: PTN ${gPtn} g (${pctPtn}%) | CHO ${gCho} g (${pctCho}%) | LIP ${gLip} g (${pctLip}%)`);
      if (agua) l.push(`Hidratação: ${agua} mL/dia`);
    }

    const refs = REFEICOES.filter((r) => plano[r]?.trim());
    if (refs.length) {
      l.push("\n--- Plano alimentar ---");
      refs.forEach((r) => l.push(`${r}: ${plano[r]}`));
    }
    if (orientacoes) l.push(`\nOrientações: ${orientacoes}`);
    if (diagnostico) l.push(`\nDiagnóstico nutricional: ${diagnostico}`);
    if (conduta) l.push(`\nConduta:\n${conduta}`);
    return l.join("\n");
  };

  const salvarNoProntuario = async () => {
    if (!selectedPatientId) {
      toast.error("Selecione um paciente para integrar ao prontuário");
      return;
    }
    const ok = await insertEvolution({
      patient_id: selectedPatientId,
      date: new Date().toISOString().slice(0, 10),
      subjective: [objetivoConsulta, habitos, recordatorio].filter(Boolean).join("\n"),
      objective: [
        pesoN ? `Peso ${pesoN} kg` : "",
        imc ? `IMC ${imc.toFixed(1)} (${imcLabel})` : "",
        cintura ? `CA ${cintura} cm (${cinturaRisco})` : "",
        exames ? `Exames: ${exames}` : "",
      ].filter(Boolean).join(" | "),
      assessment: diagnostico || imcLabel,
      plan: [
        vet ? `VET ${vet} kcal — PTN ${gPtn}g / CHO ${gCho}g / LIP ${gLip}g` : "",
        conduta,
        orientacoes,
      ].filter(Boolean).join("\n"),
      procedure: "Atendimento nutricional",
      professional: "Nutrição",
    });
    if (ok) toast.success(`Salvo no prontuário de ${selectedPatient?.name}`);
  };

  const imprimir = (titulo: string, corpo: string) => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>${titulo}</title>
      <style>@page{size:A4;margin:14mm}
      body{font-family:Arial;line-height:1.6;color:#000;font-size:13px}
      h1{color:#0f766e;border-bottom:2px solid #0f766e;padding-bottom:6px;font-size:18px}
      .clinic{font-size:11px;margin-bottom:10px}
      pre{white-space:pre-wrap;font-family:Arial;font-size:13px}
      .ass{margin-top:50px;text-align:center}
      .linha{width:60%;border-bottom:1px solid #000;margin:0 auto 4px}</style>
      </head><body>
      <div class="clinic"><strong>${clinic.clinic_name || "Clínica"}</strong><br/>${clinic.address || ""}<br/>${clinic.phone ? "Tel: " + clinic.phone : ""}</div>
      <h1>${titulo}</h1>
      ${selectedPatient ? `<p><strong>Paciente:</strong> ${selectedPatient.name}</p>` : ""}
      <p><strong>Data:</strong> ${new Date().toLocaleDateString("pt-BR")}</p>
      <pre>${corpo.replace(/</g, "&lt;")}</pre>
      <div class="ass"><div class="linha"></div>
      <div>${clinic.professional_name || "Nutricionista"}<br/>${clinic.registration_number || ""}</div></div>
      </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  const planoTexto = () => {
    const l: string[] = [];
    if (vet) l.push(`Meta calórica: ${vet} kcal/dia • PTN ${gPtn} g • CHO ${gCho} g • LIP ${gLip} g • Água ${agua} mL\n`);
    REFEICOES.forEach((r) => {
      if (plano[r]?.trim()) l.push(`${r.toUpperCase()}\n${plano[r]}\n`);
    });
    if (orientacoes) l.push(`ORIENTAÇÕES GERAIS\n${orientacoes}`);
    return l.join("\n");
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Apple className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Nutrição</h1>
      </div>

      <Card>
        <CardContent className="pt-4 flex flex-col md:flex-row gap-3 md:items-end">
          <div className="flex-1">
            <Label>Paciente (integração com prontuário)</Label>
            <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
              <SelectTrigger><SelectValue placeholder="Selecione o paciente" /></SelectTrigger>
              <SelectContent>
                {((patients as unknown as Patient[]) || []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={salvarNoProntuario}>
            <Save className="h-4 w-4 mr-1" /> Salvar no prontuário
          </Button>
          <Button variant="outline" onClick={() => imprimir("Atendimento Nutricional", buildResumo())}>
            <Printer className="h-4 w-4 mr-1" /> Imprimir
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="avaliacao">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="avaliacao"><Calculator className="h-4 w-4 mr-1" /> Avaliação</TabsTrigger>
          <TabsTrigger value="anamnese"><ClipboardList className="h-4 w-4 mr-1" /> Anamnese</TabsTrigger>
          <TabsTrigger value="plano"><Apple className="h-4 w-4 mr-1" /> Plano alimentar</TabsTrigger>
          <TabsTrigger value="protocolos"><FileText className="h-4 w-4 mr-1" /> Protocolos</TabsTrigger>
        </TabsList>

        <TabsContent value="avaliacao" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Antropometria</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-4 gap-3">
                <div>
                  <Label>Sexo</Label>
                  <Select value={sexo} onValueChange={(v) => setSexo(v as "M" | "F")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="F">Feminino</SelectItem>
                      <SelectItem value="M">Masculino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Idade (anos)</Label><Input value={idade} onChange={(e) => setIdade(e.target.value)} placeholder="Ex.: 34" /></div>
                <div><Label>Peso (kg)</Label><Input value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="Ex.: 72,5" /></div>
                <div><Label>Altura (cm)</Label><Input value={altura} onChange={(e) => setAltura(e.target.value)} placeholder="Ex.: 168" /></div>
                <div><Label>Cintura (cm)</Label><Input value={cintura} onChange={(e) => setCintura(e.target.value)} /></div>
                <div><Label>Quadril (cm)</Label><Input value={quadril} onChange={(e) => setQuadril(e.target.value)} /></div>
                <div><Label>Braço (cm)</Label><Input value={braco} onChange={(e) => setBraco(e.target.value)} /></div>
                <div><Label>Panturrilha (cm)</Label><Input value={panturrilha} onChange={(e) => setPanturrilha(e.target.value)} /></div>
              </div>

              <div className="grid md:grid-cols-4 gap-3 pt-2 border-t">
                <div className="p-3 rounded bg-muted">
                  <div className="text-xs text-muted-foreground">IMC</div>
                  <div className="text-lg font-bold">{imc ? imc.toFixed(1) : "-"}</div>
                  <Badge variant={imc >= 25 || (imc > 0 && imc < 18.5) ? "destructive" : "secondary"}>{imcLabel}</Badge>
                </div>
                <div className="p-3 rounded bg-muted">
                  <div className="text-xs text-muted-foreground">Peso saudável</div>
                  <div className="text-lg font-bold">{pesoIdealMin ? `${pesoIdealMin.toFixed(1)}–${pesoIdealMax.toFixed(1)} kg` : "-"}</div>
                </div>
                <div className="p-3 rounded bg-muted">
                  <div className="text-xs text-muted-foreground">Cintura</div>
                  <div className="text-lg font-bold">{cintura || "-"}</div>
                  <div className="text-xs">{cinturaRisco}</div>
                </div>
                <div className="p-3 rounded bg-muted">
                  <div className="text-xs text-muted-foreground">RCQ</div>
                  <div className="text-lg font-bold">{rcq ? rcq.toFixed(2) : "-"}</div>
                  <div className="text-xs">{rcqRisco}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Gasto energético e macronutrientes</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label>Nível de atividade física</Label>
                  <Select value={fator} onValueChange={setFator}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ATIVIDADE.map((a) => <SelectItem key={a.v} value={String(a.v)}>{a.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Objetivo</Label>
                  <Select value={objetivo} onValueChange={setObjetivo}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {OBJETIVOS.map((o) => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <div><Label>Proteína (%)</Label><Input value={pctPtn} onChange={(e) => setPctPtn(e.target.value)} /></div>
                <div><Label>Carboidrato (%)</Label><Input value={pctCho} onChange={(e) => setPctCho(e.target.value)} /></div>
                <div><Label>Lipídio (%)</Label><Input value={pctLip} onChange={(e) => setPctLip(e.target.value)} /></div>
              </div>
              {somaPct !== 100 && (
                <div className="text-xs text-destructive">A soma dos macronutrientes está em {somaPct}% — ajuste para 100%.</div>
              )}

              <div className="grid md:grid-cols-4 gap-3 pt-2 border-t">
                <div className="p-3 rounded bg-muted"><div className="text-xs text-muted-foreground">TMB</div><div className="text-lg font-bold">{tmb || "-"} kcal</div></div>
                <div className="p-3 rounded bg-muted"><div className="text-xs text-muted-foreground">GET</div><div className="text-lg font-bold">{get || "-"} kcal</div></div>
                <div className="p-3 rounded bg-primary/10"><div className="text-xs text-muted-foreground">VET prescrito</div><div className="text-lg font-bold">{vet || "-"} kcal</div></div>
                <div className="p-3 rounded bg-muted"><div className="text-xs text-muted-foreground">Água</div><div className="text-lg font-bold">{agua || "-"} mL</div></div>
              </div>
              <div className="text-sm p-3 rounded border">
                <strong>Macros diários:</strong> Proteína {gPtn} g • Carboidrato {gCho} g • Lipídio {gLip} g
                {pesoN > 0 && gPtn > 0 && <> &nbsp;({(gPtn / pesoN).toFixed(1)} g PTN/kg)</>}
              </div>
              <p className="text-xs text-muted-foreground">Equação de Mifflin-St Jeor. Valores são referência e devem ser ajustados clinicamente.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anamnese" className="space-y-3 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Anamnese nutricional</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Objetivo da consulta</Label><Textarea rows={2} value={objetivoConsulta} onChange={(e) => setObjetivoConsulta(e.target.value)} /></div>
              <div><Label>História clínica / comorbidades / medicações</Label><Textarea rows={3} value={historiaClinica} onChange={(e) => setHistoriaClinica(e.target.value)} /></div>
              <div><Label>Hábitos alimentares, sono, intestino, atividade física</Label><Textarea rows={3} value={habitos} onChange={(e) => setHabitos(e.target.value)} /></div>
              <div><Label>Alergias, intolerâncias e aversões alimentares</Label><Textarea rows={2} value={intolerancias} onChange={(e) => setIntolerancias(e.target.value)} /></div>
              <div><Label>Recordatório alimentar de 24 horas</Label><Textarea rows={5} value={recordatorio} onChange={(e) => setRecordatorio(e.target.value)} placeholder="Café da manhã: ...&#10;Almoço: ..." /></div>
              <div><Label>Exames laboratoriais relevantes</Label><Textarea rows={2} value={exames} onChange={(e) => setExames(e.target.value)} /></div>
              <div><Label>Diagnóstico nutricional</Label><Textarea rows={2} value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} /></div>
              <div><Label>Conduta / metas</Label><Textarea rows={3} value={conduta} onChange={(e) => setConduta(e.target.value)} /></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plano" className="space-y-3 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Plano alimentar</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {vet > 0 && (
                <div className="text-sm p-3 rounded bg-primary/10">
                  Meta: <strong>{vet} kcal</strong> • PTN {gPtn} g • CHO {gCho} g • LIP {gLip} g • Água {agua} mL
                </div>
              )}
              {REFEICOES.map((r) => (
                <div key={r}>
                  <Label>{r}</Label>
                  <Textarea rows={2} value={plano[r] || ""} onChange={(e) => setPlano((p) => ({ ...p, [r]: e.target.value }))} />
                </div>
              ))}
              <div><Label>Orientações gerais e substituições</Label><Textarea rows={3} value={orientacoes} onChange={(e) => setOrientacoes(e.target.value)} /></div>
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => imprimir("Plano Alimentar", planoTexto())}>
                  <Printer className="h-4 w-4 mr-1" /> Imprimir plano alimentar
                </Button>
                <Button onClick={salvarNoProntuario}><Save className="h-4 w-4 mr-1" /> Salvar no prontuário</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="protocolos" className="space-y-3 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Protocolos e condutas</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select value={protocolo} onValueChange={setProtocolo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="obesidade">Obesidade / Sobrepeso</SelectItem>
                  <SelectItem value="diabetes">Diabetes tipo 2</SelectItem>
                  <SelectItem value="has">Hipertensão (DASH)</SelectItem>
                  <SelectItem value="dislipidemia">Dislipidemia</SelectItem>
                  <SelectItem value="gestante">Gestação e lactação</SelectItem>
                  <SelectItem value="pediatria">Nutrição infantil</SelectItem>
                  <SelectItem value="esportiva">Nutrição esportiva</SelectItem>
                  <SelectItem value="renal">Doença renal crônica</SelectItem>
                </SelectContent>
              </Select>
              <pre className="text-sm whitespace-pre-wrap p-3 rounded bg-muted">{PROTOCOLOS[protocolo]}</pre>
              <Button variant="outline" onClick={() => imprimir("Orientação Nutricional", PROTOCOLOS[protocolo])}>
                <Printer className="h-4 w-4 mr-1" /> Imprimir orientação
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Nutricao;
