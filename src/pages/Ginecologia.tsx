import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Baby, FileText, Heart, Printer, Plus, Trash2, Stethoscope, Calculator, Pill } from "lucide-react";
import { toast } from "sonner";
import { useClinicData } from "@/hooks/useClinicData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// ---------------- Protocolos GO ----------------
const PROTOCOLOS: Record<string, string> = {
  "pre-natal": `## Pré-natal de baixo risco — Roteiro (FEBRASGO/MS)

**Consultas:** mínimo 6 — 1ª antes de 12 sem; mensal até 28 sem; quinzenal 28-36 sem; semanal após 36 sem.

**1ª consulta — anamnese e exame:**
- DUM, ciclo, gestações anteriores (G/P/A), comorbidades, vacinas, hábitos
- PA, peso, altura, IMC pré-gestacional
- Exame ginecológico, mamas, especular + colpocitologia se atrasada
- Altura uterina, BCF (>12 sem com sonar)

**Exames 1º trimestre:**
- Tipagem sanguínea + Coombs indireto (se Rh-)
- Hemograma, glicemia jejum, TSH, EAS + urocultura
- Sorologias: HIV, VDRL, HBsAg, anti-HCV, toxoplasmose IgG/IgM, rubéola IgG
- USG obstétrica 11-14 sem (TN + osso nasal)

**Suplementação:**
- Ácido fólico 5mg/dia (ideal pré-concepção até 12 sem)
- Sulfato ferroso 40mg Fe elementar/dia a partir de 20 sem

**Vacinas:**
- dTpa entre 20-36 sem (toda gestação)
- Influenza em qualquer idade gestacional
- Hepatite B se não imunizada
- COVID-19 conforme calendário vigente

**2º/3º trimestre:**
- USG morfológica 20-24 sem
- TOTG 75g entre 24-28 sem
- Strepto B (cultura vaginorretal) 35-37 sem
- Repetir VDRL, HIV, HBsAg no 3º tri`,

  "dpp": `## Cálculo da DPP — Regra de Naegele

**DPP = DUM + 7 dias − 3 meses + 1 ano**

Exemplo: DUM 10/03/2025 → DPP 17/12/2025

**Idade gestacional:** semanas e dias entre DUM e data atual.
Confirmar IG por USG de 1º tri se diferença > 7 dias.

**Termo:** 37 sem 0d a 41 sem 6d
**Pré-termo:** < 37 sem | **Pós-termo:** ≥ 42 sem`,

  "dmg": `## Diabetes Mellitus Gestacional — Diagnóstico e manejo

**Rastreio:** TOTG 75g entre 24-28 sem.
Diagnóstico DMG (qualquer 1 alterado):
- Jejum ≥ 92 mg/dL
- 1h ≥ 180 mg/dL
- 2h ≥ 153 mg/dL

**DM prévio diagnosticado na gestação:**
- Jejum ≥ 126 ou 2h ≥ 200 ou HbA1c ≥ 6,5%

**Conduta:**
1. Orientação nutricional + atividade física
2. Glicemia capilar 4-6x/dia (alvo: jejum < 95, 1h pp < 140, 2h pp < 120)
3. Insulina se 30% das medidas alteradas em 2 sem
   - NPH 0,3-0,5 UI/kg/dia inicial
   - Regular/análogos rápidos antes refeições conforme glicemia pp
4. Metformina off-label em casos selecionados
5. USG mensal a partir de 28 sem + perfil biofísico no 3º tri
6. Reclassificar 6 sem pós-parto (TOTG)`,

  "pe": `## Pré-eclâmpsia — Rastreio e manejo

**Definição:** PA ≥ 140/90 após 20 sem + proteinúria ou disfunção orgânica.

**Sinais de gravidade:**
- PA ≥ 160/110
- Proteinúria > 5g/24h
- Cefaleia, escotomas, epigastralgia
- Plaquetas < 100mil, TGO/TGP 2x, Cr > 1,1
- HELLP, EAP, oligúria

**Profilaxia (alto risco):**
- AAS 100mg/dia entre 12-36 sem
- Cálcio 1,5-2g/dia se ingesta baixa

**Manejo PE leve:** anti-hipertensivos (metildopa, nifedipino, hidralazina). Resolução com 37 sem.
**PE grave:** internação, sulfato de magnésio (Pritchard ou Zuspan), interrupção conforme gravidade/IG.

**Crise hipertensiva:**
- Hidralazina 5mg IV (rep. 5/5 min até 20mg)
- Nifedipino 10mg VO (rep. 30/30 min até 30mg)
- Sulfato MgSO4: ataque 4-6g IV + manutenção 1-2g/h`,

  "ist": `## Infecções Sexualmente Transmissíveis — Manejo (MS 2024)

**Sífilis:**
- Primária/secundária/latente recente (<1 ano): Penicilina G Benzatina 2,4 milhões UI IM dose única
- Latente tardia/indeterminada: 2,4 mi UI IM 1x/sem por 3 sem (total 7,2 mi)
- Gestante: SEMPRE tratar com penicilina (dessensibilizar se alergia)

**Gonorreia/Clamídia (cervicite):**
- Ceftriaxona 500mg IM dose única + Azitromicina 1g VO dose única
- Tratar parceiro(s)

**Tricomoníase:** Metronidazol 2g VO dose única (parceiro também)

**Vaginose bacteriana:** Metronidazol 500mg 12/12h por 7 dias OU creme vaginal 5g/noite por 5 dias

**Candidíase:** Fluconazol 150mg VO dose única OU Miconazol creme vaginal 7 noites

**HPV/condiloma:** Ácido tricloroacético 80-90%, podofilotoxina, imiquimode, eletro/criocauterização`,

  "anticoncep": `## Anticoncepção — Critérios médicos de elegibilidade (OMS)

**COCs (estro+progest):** evitar em fumantes >35 anos, HAS não controlada, TVP/TEP, enxaqueca com aura, amamentação <6 sem.

**Progesterona isolada (minipílula, DIU LNG, implante, injetável trimestral):** seguros na lactação e na maioria das comorbidades.

**Métodos LARC (1ª escolha em adolescentes e nulíparas):**
- DIU de cobre (10 anos) — não hormonal
- DIU LNG 52mg (Mirena/Kyleena, 5-8 anos) — reduz fluxo
- Implante subdérmico Etonogestrel (Implanon, 3 anos)

**Emergência:** Levonorgestrel 1,5mg até 72h OU Acetato de Ulipristal 30mg até 120h OU DIU Cu até 5 dias.`,

  "climaterio": `## Climatério / Menopausa — Manejo

**Menopausa:** 12 meses de amenorreia, idade média 51 anos.

**Sintomas:** fogachos, sudorese, insônia, atrofia genitourinária, alterações de humor, perda óssea.

**TRH (Terapia de Reposição Hormonal):**
- Indicação: sintomas vasomotores moderados/graves em <60 anos ou <10 anos pós-menopausa
- Útero presente: estrogênio + progestagênio
- Histerectomizada: estrogênio isolado
- Vias: oral, transdérmica (preferida em risco TEV), vaginal (sintomas locais)

**Contraindicações absolutas:** CA mama, CA endométrio, TEV ativa, doença hepática, sangramento vaginal sem dx.

**Não-hormonal:** ISRS (paroxetina, venlafaxina), gabapentina, clonidina.

**Saúde óssea:** cálcio 1200mg + vit D 800-1000UI/dia, DEXA, bisfosfonatos se T-score ≤ -2,5.`,
};

// ---------------- Tipos ----------------
type ConsultaPN = {
  id: string;
  data: string;
  ig: string;
  peso: string;
  pa: string;
  au: string;
  bcf: string;
  edema: string;
  obs: string;
};

type Procedimento = {
  id: string;
  data: string;
  tipo: string;
  obs: string;
};

const TIPOS_PROCEDIMENTO = [
  "Colpocitologia (Papanicolau)",
  "Colposcopia",
  "Inserção DIU Cobre",
  "Inserção DIU LNG (Mirena)",
  "Inserção Implanon",
  "Cauterização química (HPV)",
  "Biópsia de colo",
  "USG transvaginal",
  "USG obstétrica",
  "Aspiração manual intrauterina (AMIU)",
];

// ---------------- Helpers ----------------
function calcIG(dum: string, ref: string): { semanas: number; dias: number; total: number } | null {
  if (!dum) return null;
  const d1 = new Date(dum);
  const d2 = new Date(ref || new Date().toISOString().slice(0, 10));
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null;
  const diff = Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return null;
  return { semanas: Math.floor(diff / 7), dias: diff % 7, total: diff };
}

function calcDPP(dum: string): string | null {
  if (!dum) return null;
  const d = new Date(dum);
  if (isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + 7);
  d.setMonth(d.getMonth() - 3);
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

function classificarIG(semanas: number): { label: string; color: string } {
  if (semanas < 14) return { label: "1º trimestre", color: "bg-pink-100 text-pink-700" };
  if (semanas < 28) return { label: "2º trimestre", color: "bg-amber-100 text-amber-700" };
  if (semanas < 37) return { label: "3º trimestre", color: "bg-blue-100 text-blue-700" };
  if (semanas < 42) return { label: "Termo", color: "bg-green-100 text-green-700" };
  return { label: "Pós-termo", color: "bg-red-100 text-red-700" };
}

// ---------------- Componente ----------------
const Ginecologia = () => {
  const { clinicId } = useAuth();
  const { data: pacientes } = useClinicData("patients");

  const [pacienteId, setPacienteId] = useState<string>("");
  const paciente = useMemo(
    () => (pacientes || []).find((p) => p.id === pacienteId),
    [pacientes, pacienteId]
  );

  // GO ficha
  const [dum, setDum] = useState("");
  const [refDate, setRefDate] = useState(new Date().toISOString().slice(0, 10));
  const [g, setG] = useState("0");
  const [p, setP] = useState("0");
  const [a, setA] = useState("0");
  const [c, setC] = useState("0");
  const [tipoSanguineo, setTipoSanguineo] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const ig = calcIG(dum, refDate);
  const dpp = calcDPP(dum);
  const igClass = ig ? classificarIG(ig.semanas) : null;

  // Pré-natal
  const [consultas, setConsultas] = useState<ConsultaPN[]>([]);
  const [novaConsulta, setNovaConsulta] = useState<ConsultaPN>({
    id: "", data: new Date().toISOString().slice(0, 10), ig: "", peso: "", pa: "", au: "", bcf: "", edema: "ausente", obs: "",
  });

  // Procedimentos
  const [procs, setProcs] = useState<Procedimento[]>([]);
  const [novoProc, setNovoProc] = useState<Procedimento>({
    id: "", data: new Date().toISOString().slice(0, 10), tipo: TIPOS_PROCEDIMENTO[0], obs: "",
  });

  // Protocolo
  const [protocolo, setProtocolo] = useState("pre-natal");

  const addConsulta = () => {
    if (!novaConsulta.pa) {
      toast.error("Informe pelo menos a PA");
      return;
    }
    const c = { ...novaConsulta, id: crypto.randomUUID(), ig: ig ? `${ig.semanas}s ${ig.dias}d` : novaConsulta.ig };
    setConsultas([c, ...consultas]);
    setNovaConsulta({ ...novaConsulta, peso: "", pa: "", au: "", bcf: "", obs: "" });
    toast.success("Consulta de pré-natal registrada");
  };

  const addProc = () => {
    setProcs([{ ...novoProc, id: crypto.randomUUID() }, ...procs]);
    setNovoProc({ ...novoProc, obs: "" });
    toast.success("Procedimento registrado");
  };

  const integrarProntuario = async () => {
    if (!pacienteId) {
      toast.error("Selecione um paciente");
      return;
    }
    if (!clinicId) return;

    const linhas: string[] = [];
    linhas.push(`=== Avaliação Ginecológica/Obstétrica — ${new Date().toLocaleDateString("pt-BR")} ===`);
    if (dum) linhas.push(`DUM: ${dum}`);
    if (ig) linhas.push(`IG: ${ig.semanas}s ${ig.dias}d (${igClass?.label})`);
    if (dpp) linhas.push(`DPP: ${dpp}`);
    linhas.push(`G${g} P${p} A${a} C${c}`);
    if (tipoSanguineo) linhas.push(`Tipo sanguíneo: ${tipoSanguineo}`);
    if (observacoes) linhas.push(`Obs: ${observacoes}`);

    if (consultas.length) {
      linhas.push("");
      linhas.push("--- Consultas de pré-natal ---");
      consultas.forEach((co) => {
        linhas.push(`${co.data} | IG ${co.ig} | Peso ${co.peso}kg | PA ${co.pa} | AU ${co.au}cm | BCF ${co.bcf}bpm | Edema ${co.edema}${co.obs ? " | " + co.obs : ""}`);
      });
    }
    if (procs.length) {
      linhas.push("");
      linhas.push("--- Procedimentos ---");
      procs.forEach((pr) => linhas.push(`${pr.data} | ${pr.tipo}${pr.obs ? " | " + pr.obs : ""}`));
    }

    const content = linhas.join("\n");

    try {
      const { error } = await supabase.from("evolutions").insert({
        clinic_id: clinicId,
        patient_id: pacienteId,
        date: new Date().toISOString().slice(0, 10),
        subjective: "",
        objective: content,
        assessment: igClass?.label || "Avaliação ginecológica",
        plan: "Conforme protocolo de pré-natal/ginecológico",
        procedure: "Consulta GO",
        professional: "",
      });
      if (error) throw error;
      toast.success("Integrado ao prontuário (evoluções).");
    } catch (e) {
      toast.error("Falha ao integrar: " + (e as Error).message);
    }
  };

  const imprimir = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>Ficha GO</title>
      <style>body{font-family:Arial;padding:30px;line-height:1.6}h1{color:#be185d}h2{color:#9d174d;margin-top:18px;border-bottom:1px solid #fbcfe8;padding-bottom:4px}.row{margin:4px 0}</style>
      </head><body>
      <h1>Ficha Ginecológica / Obstétrica</h1>
      ${paciente ? `<div class="row"><b>Paciente:</b> ${paciente.name}</div>` : ""}
      <div class="row"><b>DUM:</b> ${dum || "—"} &nbsp; <b>IG:</b> ${ig ? ig.semanas + "s " + ig.dias + "d" : "—"} &nbsp; <b>DPP:</b> ${dpp || "—"}</div>
      <div class="row"><b>G</b>${g} <b>P</b>${p} <b>A</b>${a} <b>C</b>${c} &nbsp; <b>ABO/Rh:</b> ${tipoSanguineo || "—"}</div>
      ${observacoes ? `<div class="row"><b>Obs:</b> ${observacoes}</div>` : ""}
      <h2>Consultas de pré-natal</h2>
      <table border="1" cellpadding="4" style="border-collapse:collapse;width:100%;font-size:12px">
        <tr><th>Data</th><th>IG</th><th>Peso</th><th>PA</th><th>AU</th><th>BCF</th><th>Edema</th><th>Obs</th></tr>
        ${consultas.map(c => `<tr><td>${c.data}</td><td>${c.ig}</td><td>${c.peso}</td><td>${c.pa}</td><td>${c.au}</td><td>${c.bcf}</td><td>${c.edema}</td><td>${c.obs}</td></tr>`).join("")}
      </table>
      <h2>Procedimentos</h2>
      <ul>${procs.map(p => `<li>${p.data} — ${p.tipo}${p.obs ? " — " + p.obs : ""}</li>`).join("")}</ul>
      </body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <div className="container max-w-6xl mx-auto p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Heart className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Ginecologia & Obstetrícia</h1>
          <p className="text-sm text-muted-foreground">
            Pré-natal, calculadora de IG/DPP, procedimentos, protocolos FEBRASGO/MS e receituário GO.
          </p>
        </div>
      </div>

      {/* Paciente */}
      <Card>
        <CardContent className="pt-4 grid md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <Label>Paciente</Label>
            <Select value={pacienteId} onValueChange={setPacienteId}>
              <SelectTrigger><SelectValue placeholder="Selecionar paciente para integrar ao prontuário" /></SelectTrigger>
              <SelectContent>
                {(pacientes || []).map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{String(p.name)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={integrarProntuario} disabled={!pacienteId}>
              <Stethoscope className="h-4 w-4 mr-1" />Integrar ao Prontuário
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="ficha">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
          <TabsTrigger value="ficha"><FileText className="h-4 w-4 mr-1" />Ficha GO</TabsTrigger>
          <TabsTrigger value="prenatal"><Baby className="h-4 w-4 mr-1" />Pré-natal</TabsTrigger>
          <TabsTrigger value="proc"><Plus className="h-4 w-4 mr-1" />Procedimentos</TabsTrigger>
          <TabsTrigger value="prot"><Calculator className="h-4 w-4 mr-1" />Protocolos</TabsTrigger>
          <TabsTrigger value="rx"><Pill className="h-4 w-4 mr-1" />Receituário</TabsTrigger>
        </TabsList>

        {/* FICHA */}
        <TabsContent value="ficha" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Idade Gestacional & DPP (Naegele)</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-4 gap-3">
              <div>
                <Label>DUM</Label>
                <Input type="date" value={dum} onChange={(e) => setDum(e.target.value)} />
              </div>
              <div>
                <Label>Data de referência</Label>
                <Input type="date" value={refDate} onChange={(e) => setRefDate(e.target.value)} />
              </div>
              <div className="md:col-span-2 flex items-end gap-2 flex-wrap">
                {ig && igClass ? (
                  <>
                    <Badge className={igClass.color}>IG {ig.semanas}s {ig.dias}d — {igClass.label}</Badge>
                    <Badge variant="outline">DPP: {dpp}</Badge>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">Informe a DUM para calcular.</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Antecedentes obstétricos</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-5 gap-3">
              <div><Label>G (gestações)</Label><Input value={g} onChange={(e) => setG(e.target.value)} /></div>
              <div><Label>P (partos)</Label><Input value={p} onChange={(e) => setP(e.target.value)} /></div>
              <div><Label>A (abortos)</Label><Input value={a} onChange={(e) => setA(e.target.value)} /></div>
              <div><Label>C (cesáreas)</Label><Input value={c} onChange={(e) => setC(e.target.value)} /></div>
              <div>
                <Label>ABO / Rh</Label>
                <Input value={tipoSanguineo} onChange={(e) => setTipoSanguineo(e.target.value)} placeholder="Ex: A+ / O-" />
              </div>
              <div className="md:col-span-5">
                <Label>Observações (queixas, ciclo, comorbidades, vacinas, hábitos)</Label>
                <Textarea rows={3} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Button onClick={imprimir}><Printer className="h-4 w-4 mr-1" />Imprimir ficha</Button>
        </TabsContent>

        {/* PRENATAL */}
        <TabsContent value="prenatal" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Nova consulta de pré-natal</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-4 gap-3">
                <div><Label>Data</Label><Input type="date" value={novaConsulta.data} onChange={(e) => setNovaConsulta({ ...novaConsulta, data: e.target.value })} /></div>
                <div><Label>Peso (kg)</Label><Input value={novaConsulta.peso} onChange={(e) => setNovaConsulta({ ...novaConsulta, peso: e.target.value })} /></div>
                <div><Label>PA (mmHg)</Label><Input value={novaConsulta.pa} onChange={(e) => setNovaConsulta({ ...novaConsulta, pa: e.target.value })} placeholder="120/80" /></div>
                <div><Label>Altura uterina (cm)</Label><Input value={novaConsulta.au} onChange={(e) => setNovaConsulta({ ...novaConsulta, au: e.target.value })} /></div>
                <div><Label>BCF (bpm)</Label><Input value={novaConsulta.bcf} onChange={(e) => setNovaConsulta({ ...novaConsulta, bcf: e.target.value })} placeholder="140-160" /></div>
                <div className="md:col-span-3">
                  <Label>Edema</Label>
                  <Select value={novaConsulta.edema} onValueChange={(v) => setNovaConsulta({ ...novaConsulta, edema: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ausente">Ausente (-)</SelectItem>
                      <SelectItem value="+">+ (tornozelo)</SelectItem>
                      <SelectItem value="++">++ (MMII)</SelectItem>
                      <SelectItem value="+++">+++ (generalizado)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Textarea placeholder="Queixas, condutas, prescrições..." value={novaConsulta.obs} onChange={(e) => setNovaConsulta({ ...novaConsulta, obs: e.target.value })} />
              <Button onClick={addConsulta}><Plus className="h-4 w-4 mr-1" />Registrar consulta</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Histórico ({consultas.length})</CardTitle></CardHeader>
            <CardContent>
              {consultas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma consulta registrada.</p>
              ) : (
                <div className="space-y-2">
                  {consultas.map((c) => (
                    <div key={c.id} className="border rounded p-3 text-sm">
                      <div className="flex justify-between flex-wrap gap-2">
                        <strong>{c.data} — IG {c.ig}</strong>
                        <span>Peso {c.peso}kg | PA {c.pa} | AU {c.au}cm | BCF {c.bcf}bpm | Edema {c.edema}</span>
                      </div>
                      {c.obs && <div className="text-muted-foreground mt-1">{c.obs}</div>}
                      <Button size="icon" variant="ghost" className="h-6 w-6 float-right" onClick={() => setConsultas(consultas.filter(x => x.id !== c.id))}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PROCEDIMENTOS */}
        <TabsContent value="proc" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Registrar procedimento ginecológico</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-3 gap-3">
                <div><Label>Data</Label><Input type="date" value={novoProc.data} onChange={(e) => setNovoProc({ ...novoProc, data: e.target.value })} /></div>
                <div className="md:col-span-2">
                  <Label>Tipo</Label>
                  <Select value={novoProc.tipo} onValueChange={(v) => setNovoProc({ ...novoProc, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIPOS_PROCEDIMENTO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Textarea placeholder="Achados, lote do dispositivo, intercorrências..." value={novoProc.obs} onChange={(e) => setNovoProc({ ...novoProc, obs: e.target.value })} />
              <Button onClick={addProc}><Plus className="h-4 w-4 mr-1" />Registrar</Button>
            </CardContent>
          </Card>

          {procs.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Histórico ({procs.length})</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {procs.map((p) => (
                  <div key={p.id} className="border rounded p-3 text-sm">
                    <div className="flex justify-between"><strong>{p.tipo}</strong><span className="text-muted-foreground">{p.data}</span></div>
                    {p.obs && <div className="text-muted-foreground mt-1">{p.obs}</div>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* PROTOCOLOS */}
        <TabsContent value="prot">
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                {Object.keys(PROTOCOLOS).map((k) => (
                  <Button key={k} size="sm" variant={protocolo === k ? "default" : "outline"} onClick={() => setProtocolo(k)}>
                    {k.toUpperCase()}
                  </Button>
                ))}
              </div>
              <Textarea value={PROTOCOLOS[protocolo]} readOnly rows={22} className="font-mono text-xs" />
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(PROTOCOLOS[protocolo]); toast.success("Copiado"); }}>
                Copiar protocolo
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RX */}
        <TabsContent value="rx">
          <Card>
            <CardContent className="pt-6 text-center space-y-3">
              <Pill className="h-12 w-12 mx-auto text-primary" />
              <p className="text-sm">
                As medicações de Ginecologia & Obstetrícia (anticoncepcionais, suplementos gestacionais,
                ITU/IST, climatério, indução de parto, antieméticos seguros e ocitócicos) foram adicionadas ao Receituário.
              </p>
              <Button asChild><a href="/receituario">Abrir Receituário</a></Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Ginecologia;
