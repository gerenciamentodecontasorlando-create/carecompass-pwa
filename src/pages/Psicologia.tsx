import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { HeartHandshake, ClipboardList, Activity, FileText, Save, Printer, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useClinicData } from "@/hooks/useClinicData";

type Patient = { id: string; name: string };

const DASS_ITENS = [
  { t: "Ansiedade", q: "Senti minha boca seca" },
  { t: "Depressão", q: "Não consegui vivenciar sentimentos positivos" },
  { t: "Ansiedade", q: "Senti dificuldade em respirar" },
  { t: "Depressão", q: "Achei difícil ter iniciativa para fazer as coisas" },
  { t: "Estresse", q: "Tive tendência a reagir de forma exagerada" },
  { t: "Ansiedade", q: "Senti tremores (ex.: nas mãos)" },
  { t: "Estresse", q: "Senti que estava sempre nervoso(a)" },
  { t: "Ansiedade", q: "Preocupei-me com situações de pânico" },
  { t: "Depressão", q: "Senti que não tinha nada a esperar do futuro" },
  { t: "Estresse", q: "Senti-me agitado(a)" },
  { t: "Depressão", q: "Senti-me desanimado(a) e melancólico(a)" },
  { t: "Estresse", q: "Foi difícil me acalmar" },
  { t: "Depressão", q: "Senti que não tinha valor como pessoa" },
  { t: "Estresse", q: "Fui intolerante com interrupções" },
  { t: "Ansiedade", q: "Senti meu coração alterado sem esforço físico" },
  { t: "Depressão", q: "Senti que a vida não tinha sentido" },
  { t: "Ansiedade", q: "Senti medo sem razão aparente" },
  { t: "Estresse", q: "Achei difícil relaxar" },
  { t: "Depressão", q: "Não consegui me entusiasmar com nada" },
  { t: "Estresse", q: "Fui irritável" },
  { t: "Depressão", q: "Senti-me triste e deprimido(a)" },
];

const PSS10 = [
  "Com que frequência ficou triste por algo inesperado?",
  "Sentiu que não conseguia controlar as coisas importantes da sua vida?",
  "Sentiu-se nervoso(a) e estressado(a)?",
  "Sentiu confiança na sua capacidade de lidar com problemas pessoais? (inverso)",
  "Sentiu que as coisas estavam acontecendo como você desejava? (inverso)",
  "Achou que não conseguiria lidar com todas as suas obrigações?",
  "Conseguiu controlar as irritações da sua vida? (inverso)",
  "Sentiu que tinha tudo sob controle? (inverso)",
  "Ficou irritado(a) por coisas fora do seu controle?",
  "Sentiu que as dificuldades se acumulavam a ponto de não conseguir superá-las?",
];
const PSS_INVERSOS = [3, 4, 6, 7];

const WHO5 = [
  "Senti-me alegre e de bom humor",
  "Senti-me calmo(a) e relaxado(a)",
  "Senti-me ativo(a) e cheio(a) de energia",
  "Acordei sentindo-me fresco(a) e descansado(a)",
  "Meu dia a dia foi preenchido por coisas que me interessam",
];

const ROSENBERG = [
  "Sinto que sou uma pessoa de valor, ao menos igual às outras",
  "Sinto que tenho boas qualidades",
  "Levando tudo em conta, penso que sou um fracasso (inverso)",
  "Sou capaz de fazer as coisas tão bem quanto a maioria",
  "Sinto que não tenho muito do que me orgulhar (inverso)",
  "Tenho uma atitude positiva em relação a mim mesmo(a)",
  "No conjunto, estou satisfeito(a) comigo",
  "Gostaria de ter mais respeito por mim mesmo(a) (inverso)",
  "Às vezes me sinto inútil (inverso)",
  "Às vezes penso que não presto para nada (inverso)",
];
const ROSENBERG_INVERSOS = [2, 4, 7, 8, 9];

const RISCO_ITENS = [
  { id: "ideacao", label: "Ideação suicida ou de autolesão atual" },
  { id: "plano", label: "Plano ou método definido" },
  { id: "autolesao", label: "Autolesão recente" },
  { id: "tentativa", label: "Tentativa prévia" },
  { id: "isolamento", label: "Isolamento / ausência de rede de apoio" },
  { id: "substancias", label: "Uso abusivo de substâncias" },
  { id: "violencia", label: "Exposição a violência ou abuso" },
  { id: "perda", label: "Perda ou crise recente significativa" },
];

const ABORDAGENS: Record<string, string> = {
  tcc: `## Terapia Cognitivo-Comportamental (TCC)

**Estrutura da sessão:** check-in de humor → revisão da tarefa → agenda → intervenção → resumo → nova tarefa.
**Técnicas centrais:**
- Registro de Pensamentos Disfuncionais (RPD)
- Reestruturação cognitiva e questionamento socrático
- Ativação comportamental (agenda de atividades prazerosas/domínio)
- Exposição gradual com hierarquia de medo (ansiedade/fobias/TOC)
- Treino de habilidades sociais e assertividade
- Prevenção de recaída nas últimas 2-3 sessões
**Duração média:** 12-20 sessões semanais.`,

  ansiedade: `## Protocolo — Ansiedade e Pânico

1. Psicoeducação: ciclo pensamento-emoção-comportamento; fisiologia da ansiedade.
2. Respiração diafragmática e relaxamento muscular progressivo.
3. Identificação de interpretações catastróficas de sensações corporais.
4. Exposição interoceptiva (hiperventilação, giro, corrida no lugar).
5. Exposição in vivo gradual + redução de comportamentos de segurança.
6. Prevenção de recaída e plano de enfrentamento escrito.`,

  depressao: `## Protocolo — Depressão

1. Ativação comportamental: monitoramento de atividades × humor.
2. Programação de atividades de prazer e domínio (graduadas).
3. Identificação de crenças centrais de desvalor e desesperança.
4. Resolução de problemas em etapas.
5. Higiene do sono e regulação de rotina.
6. Avaliação contínua de risco de suicídio a cada sessão.
7. Encaminhamento psiquiátrico se sintomas moderados/graves ou risco.`,

  luto: `## Protocolo — Luto

Tarefas do luto (Worden): aceitar a realidade da perda • processar a dor • adaptar-se ao novo mundo • reposicionar o vínculo.
**Intervenções:** narrativa da perda, cartas não enviadas, rituais de despedida, resgate de rede de apoio.
**Alerta para luto complicado:** >12 meses com saudade intensa incapacitante, negação persistente, ideação de morte.`,

  infantil: `## Psicologia Infantil e Adolescente

**Avaliação:** entrevista com responsáveis, escola, observação lúdica, desenho da família, jogos.
**Intervenções:** ludoterapia, treino parental (reforço positivo, consequência lógica),
economia de fichas, regulação emocional com termômetro das emoções, habilidades sociais.
**Sempre:** contrato de sigilo adaptado à idade, envolvimento familiar e escolar.`,

  casal: `## Terapia de Casal / Família

**Foco:** padrões de comunicação, ciclo de demanda-retraimento, acordos e limites.
**Técnicas:** comunicação não violenta, escuta em espelho, negociação de acordos,
genograma familiar, rituais de conexão, mapeamento de papéis.
**Contraindicação relativa:** violência doméstica ativa — atender separadamente e ativar rede de proteção.`,

  crise: `## Manejo de Crise e Risco

1. Acolher sem julgamento e avaliar diretamente ideação, plano, meio e intenção.
2. Restringir acesso a meios letais com a família.
3. Construir plano de segurança escrito (sinais de alerta, estratégias, contatos, serviços).
4. Aumentar frequência de sessões e contato entre sessões.
5. Acionar rede: família, CAPS, CVV 188, SAMU 192, emergência.
6. Registrar tudo detalhadamente no prontuário.`,
};

const Psicologia = () => {
  const { data: patients } = useClinicData("patients");
  const { insert: insertEvolution } = useClinicData("evolutions");
  const { data: clinicSettings } = useClinicData("clinic_settings");
  const clinic = ((clinicSettings as any[]) || [])[0] || {};

  const [selectedPatientId, setSelectedPatientId] = useState("");
  const selectedPatient = useMemo(
    () => ((patients as unknown as Patient[]) || []).find((p) => p.id === selectedPatientId),
    [patients, selectedPatientId]
  );

  // Anamnese
  const [queixa, setQueixa] = useState("");
  const [historia, setHistoria] = useState("");
  const [historico, setHistorico] = useState("");
  const [familiar, setFamiliar] = useState("");
  const [socialTrabalho, setSocialTrabalho] = useState("");
  const [exameObs, setExameObs] = useState("");
  const [hipotese, setHipotese] = useState("");
  const [objetivosTerapeuticos, setObjetivosTerapeuticos] = useState("");
  const [abordagem, setAbordagem] = useState("tcc");
  const [frequencia, setFrequencia] = useState("Semanal (50 min)");

  // Sessão (SOAP)
  const [sessaoNumero, setSessaoNumero] = useState("");
  const [relato, setRelato] = useState("");
  const [observado, setObservado] = useState("");
  const [analise, setAnalise] = useState("");
  const [planoSessao, setPlanoSessao] = useState("");
  const [tarefa, setTarefa] = useState("");

  // Escalas
  const [dass, setDass] = useState<number[]>(Array(21).fill(0));
  const [pss, setPss] = useState<number[]>(Array(10).fill(0));
  const [who5, setWho5] = useState<number[]>(Array(5).fill(0));
  const [rosenberg, setRosenberg] = useState<number[]>(Array(10).fill(0));

  const dassSub = (t: string) =>
    DASS_ITENS.reduce((acc, it, i) => (it.t === t ? acc + dass[i] : acc), 0) * 2;
  const dassDep = dassSub("Depressão");
  const dassAns = dassSub("Ansiedade");
  const dassEst = dassSub("Estresse");
  const classDep = dassDep >= 28 ? "Extremamente grave" : dassDep >= 21 ? "Grave" : dassDep >= 14 ? "Moderada" : dassDep >= 10 ? "Leve" : "Normal";
  const classAns = dassAns >= 20 ? "Extremamente grave" : dassAns >= 15 ? "Grave" : dassAns >= 10 ? "Moderada" : dassAns >= 8 ? "Leve" : "Normal";
  const classEst = dassEst >= 34 ? "Extremamente grave" : dassEst >= 26 ? "Grave" : dassEst >= 19 ? "Moderado" : dassEst >= 15 ? "Leve" : "Normal";

  const pssTotal = pss.reduce((a, v, i) => a + (PSS_INVERSOS.includes(i) ? 4 - v : v), 0);
  const pssLabel = pssTotal >= 27 ? "Estresse alto" : pssTotal >= 14 ? "Estresse moderado" : "Estresse baixo";

  const who5Total = who5.reduce((a, b) => a + b, 0) * 4;
  const who5Label = who5Total <= 50 ? "Bem-estar reduzido — investigar depressão" : "Bem-estar adequado";

  const rosenbergTotal = rosenberg.reduce((a, v, i) => a + (ROSENBERG_INVERSOS.includes(i) ? 3 - v : v), 0);
  const rosenbergLabel = rosenbergTotal < 15 ? "Autoestima baixa" : rosenbergTotal <= 25 ? "Autoestima média" : "Autoestima elevada";

  // Risco
  const [risco, setRisco] = useState<string[]>([]);
  const toggleRisco = (id: string) =>
    setRisco((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]));
  const nivelRisco =
    risco.includes("plano") || risco.includes("tentativa") ? "ALTO" :
    risco.includes("ideacao") || risco.length >= 3 ? "MODERADO" :
    risco.length >= 1 ? "BAIXO" : "AUSENTE";
  const [planoSeguranca, setPlanoSeguranca] = useState("");

  const buildResumo = () => {
    const l: string[] = [];
    l.push("=== ATENDIMENTO PSICOLÓGICO ===");
    if (queixa) l.push(`\nQueixa / demanda: ${queixa}`);
    if (historia) l.push(`\nHistória da demanda:\n${historia}`);
    if (historico) l.push(`\nHistórico de tratamentos e medicações: ${historico}`);
    if (familiar) l.push(`\nContexto familiar: ${familiar}`);
    if (socialTrabalho) l.push(`\nContexto social / escolar / laboral: ${socialTrabalho}`);
    if (exameObs) l.push(`\nObservação clínica: ${exameObs}`);

    l.push("\n--- Instrumentos ---");
    if (dassDep + dassAns + dassEst > 0) {
      l.push(`DASS-21 → Depressão ${dassDep} (${classDep}) | Ansiedade ${dassAns} (${classAns}) | Estresse ${dassEst} (${classEst})`);
    }
    if (pssTotal > 0) l.push(`PSS-10: ${pssTotal}/40 (${pssLabel})`);
    if (who5Total > 0) l.push(`WHO-5: ${who5Total}/100 (${who5Label})`);
    if (rosenbergTotal > 0) l.push(`Rosenberg: ${rosenbergTotal}/30 (${rosenbergLabel})`);

    l.push(`\nAvaliação de risco: ${nivelRisco}`);
    if (risco.length) l.push(`Fatores: ${risco.map((r) => RISCO_ITENS.find((x) => x.id === r)?.label).join("; ")}`);
    if (planoSeguranca) l.push(`Plano de segurança: ${planoSeguranca}`);

    if (hipotese) l.push(`\nHipótese / formulação de caso: ${hipotese}`);
    if (objetivosTerapeuticos) l.push(`\nObjetivos terapêuticos:\n${objetivosTerapeuticos}`);
    l.push(`\nAbordagem: ${abordagem.toUpperCase()} • Frequência: ${frequencia}`);

    if (relato || observado || analise || planoSesEmpty()) {
      // noop
    }
    if (relato || observado || analise || planoSessao || tarefa) {
      l.push(`\n--- Registro de sessão ${sessaoNumero ? "nº " + sessaoNumero : ""} ---`);
      if (relato) l.push(`Relato do paciente (S): ${relato}`);
      if (observado) l.push(`Observado (O): ${observado}`);
      if (analise) l.push(`Análise (A): ${analise}`);
      if (planoSessao) l.push(`Plano (P): ${planoSessao}`);
      if (tarefa) l.push(`Tarefa de casa: ${tarefa}`);
    }
    return l.join("\n");
  };

  const planoSesEmpty = () => false;

  const salvarNoProntuario = async () => {
    if (!selectedPatientId) {
      toast.error("Selecione um paciente para integrar ao prontuário");
      return;
    }
    const ok = await insertEvolution({
      patient_id: selectedPatientId,
      date: new Date().toISOString().slice(0, 10),
      subjective: [queixa, relato].filter(Boolean).join("\n"),
      objective: [exameObs, observado].filter(Boolean).join("\n"),
      assessment: [
        hipotese || analise,
        dassDep + dassAns + dassEst > 0 ? `DASS-21: D ${dassDep} / A ${dassAns} / E ${dassEst}` : "",
        `Risco: ${nivelRisco}`,
      ].filter(Boolean).join(" | "),
      plan: [planoSessao || objetivosTerapeuticos, tarefa ? `Tarefa: ${tarefa}` : "", planoSeguranca ? `Plano de segurança: ${planoSeguranca}` : ""].filter(Boolean).join("\n"),
      procedure: sessaoNumero ? `Sessão de psicologia nº ${sessaoNumero}` : "Atendimento psicológico",
      professional: "Psicologia",
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
      .sigilo{font-size:10px;margin-top:20px;border-left:3px solid #0f766e;padding-left:8px}
      .ass{margin-top:50px;text-align:center}
      .linha{width:60%;border-bottom:1px solid #000;margin:0 auto 4px}</style>
      </head><body>
      <div class="clinic"><strong>${clinic.clinic_name || "Clínica"}</strong><br/>${clinic.address || ""}<br/>${clinic.phone ? "Tel: " + clinic.phone : ""}</div>
      <h1>${titulo}</h1>
      ${selectedPatient ? `<p><strong>Paciente:</strong> ${selectedPatient.name}</p>` : ""}
      <p><strong>Data:</strong> ${new Date().toLocaleDateString("pt-BR")}</p>
      <pre>${corpo.replace(/</g, "&lt;")}</pre>
      <div class="ass"><div class="linha"></div>
      <div>${clinic.professional_name || "Psicólogo(a)"}<br/>${clinic.registration_number || "CRP ____________"}</div></div>
      <div class="sigilo">Documento sigiloso, elaborado conforme a Resolução CFP nº 06/2019. As informações aqui contidas
      são protegidas por sigilo profissional (Código de Ética Profissional do Psicólogo, art. 9º).</div>
      </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  const renderEscala = (
    titulo: string,
    perguntas: string[],
    valores: number[],
    setValores: (v: number[]) => void,
    opts: string[],
    resumo: string
  ) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between gap-2 flex-wrap">
          <span>{titulo}</span>
          <Badge variant="secondary">{resumo}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {perguntas.map((p, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center text-sm border-b pb-2">
            <div className="md:col-span-8">{i + 1}. {p}</div>
            <div className="md:col-span-4">
              <Select
                value={String(valores[i])}
                onValueChange={(v) => {
                  const next = [...valores];
                  next[i] = parseInt(v);
                  setValores(next);
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
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <HeartHandshake className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Psicologia</h1>
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
          <Button onClick={salvarNoProntuario}><Save className="h-4 w-4 mr-1" /> Salvar no prontuário</Button>
          <Button variant="outline" onClick={() => imprimir("Atendimento Psicológico", buildResumo())}>
            <Printer className="h-4 w-4 mr-1" /> Imprimir
          </Button>
        </CardContent>
      </Card>

      {nivelRisco === "ALTO" && (
        <div className="p-3 rounded border border-destructive bg-destructive/10 text-sm flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 text-destructive" />
          <span><strong>Risco ALTO identificado.</strong> Construa plano de segurança, acione a rede de apoio e considere
          encaminhamento imediato (CAPS, emergência, CVV 188).</span>
        </div>
      )}

      <Tabs defaultValue="anamnese">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="anamnese"><ClipboardList className="h-4 w-4 mr-1" /> Anamnese</TabsTrigger>
          <TabsTrigger value="sessao"><FileText className="h-4 w-4 mr-1" /> Sessão</TabsTrigger>
          <TabsTrigger value="escalas"><Activity className="h-4 w-4 mr-1" /> Escalas</TabsTrigger>
          <TabsTrigger value="risco"><AlertTriangle className="h-4 w-4 mr-1" /> Risco</TabsTrigger>
          <TabsTrigger value="abordagens"><HeartHandshake className="h-4 w-4 mr-1" /> Protocolos</TabsTrigger>
        </TabsList>

        <TabsContent value="anamnese" className="space-y-3 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Anamnese psicológica</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Queixa / demanda principal</Label><Textarea rows={2} value={queixa} onChange={(e) => setQueixa(e.target.value)} /></div>
              <div><Label>História da demanda (início, evolução, fatores desencadeantes)</Label><Textarea rows={3} value={historia} onChange={(e) => setHistoria(e.target.value)} /></div>
              <div><Label>Histórico de tratamentos, internações e medicações</Label><Textarea rows={2} value={historico} onChange={(e) => setHistorico(e.target.value)} /></div>
              <div><Label>Contexto familiar e vínculos</Label><Textarea rows={2} value={familiar} onChange={(e) => setFamiliar(e.target.value)} /></div>
              <div><Label>Contexto social, escolar / laboral e rede de apoio</Label><Textarea rows={2} value={socialTrabalho} onChange={(e) => setSocialTrabalho(e.target.value)} /></div>
              <div><Label>Observação clínica (aparência, discurso, afeto, insight)</Label><Textarea rows={3} value={exameObs} onChange={(e) => setExameObs(e.target.value)} /></div>
              <div><Label>Hipótese / formulação de caso</Label><Textarea rows={2} value={hipotese} onChange={(e) => setHipotese(e.target.value)} /></div>
              <div><Label>Objetivos terapêuticos</Label><Textarea rows={3} value={objetivosTerapeuticos} onChange={(e) => setObjetivosTerapeuticos(e.target.value)} /></div>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label>Abordagem</Label>
                  <Select value={abordagem} onValueChange={setAbordagem}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tcc">TCC</SelectItem>
                      <SelectItem value="psicanalise">Psicanálise / Psicodinâmica</SelectItem>
                      <SelectItem value="humanista">Humanista / Centrada na pessoa</SelectItem>
                      <SelectItem value="act">ACT / Terapias contextuais</SelectItem>
                      <SelectItem value="sistemica">Sistêmica / Familiar</SelectItem>
                      <SelectItem value="analise">Análise do comportamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Frequência / duração</Label>
                  <Input value={frequencia} onChange={(e) => setFrequencia(e.target.value)} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Button onClick={salvarNoProntuario}><Save className="h-4 w-4 mr-1" /> Salvar no prontuário</Button>
                <Button variant="outline" onClick={() => imprimir("Anamnese Psicológica", buildResumo())}>
                  <Printer className="h-4 w-4 mr-1" /> Imprimir anamnese
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessao" className="space-y-3 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Registro de sessão (SOAP)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="md:w-48">
                <Label>Nº da sessão</Label>
                <Input value={sessaoNumero} onChange={(e) => setSessaoNumero(e.target.value)} placeholder="Ex.: 7" />
              </div>
              <div><Label>S — Relato do paciente</Label><Textarea rows={3} value={relato} onChange={(e) => setRelato(e.target.value)} /></div>
              <div><Label>O — Observado em sessão</Label><Textarea rows={3} value={observado} onChange={(e) => setObservado(e.target.value)} /></div>
              <div><Label>A — Análise / evolução</Label><Textarea rows={3} value={analise} onChange={(e) => setAnalise(e.target.value)} /></div>
              <div><Label>P — Plano para a próxima sessão</Label><Textarea rows={3} value={planoSessao} onChange={(e) => setPlanoSessao(e.target.value)} /></div>
              <div><Label>Tarefa de casa</Label><Textarea rows={2} value={tarefa} onChange={(e) => setTarefa(e.target.value)} /></div>
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Button onClick={salvarNoProntuario}><Save className="h-4 w-4 mr-1" /> Salvar sessão no prontuário</Button>
                <Button variant="outline" onClick={() => imprimir(`Registro de Sessão${sessaoNumero ? " nº " + sessaoNumero : ""}`, buildResumo())}>
                  <Printer className="h-4 w-4 mr-1" /> Imprimir
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="escalas" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-4 gap-3">
            <div className="p-3 rounded bg-muted"><div className="text-xs text-muted-foreground">DASS-21 Depressão</div><div className="text-lg font-bold">{dassDep}</div><div className="text-xs">{classDep}</div></div>
            <div className="p-3 rounded bg-muted"><div className="text-xs text-muted-foreground">DASS-21 Ansiedade</div><div className="text-lg font-bold">{dassAns}</div><div className="text-xs">{classAns}</div></div>
            <div className="p-3 rounded bg-muted"><div className="text-xs text-muted-foreground">DASS-21 Estresse</div><div className="text-lg font-bold">{dassEst}</div><div className="text-xs">{classEst}</div></div>
            <div className="p-3 rounded bg-muted"><div className="text-xs text-muted-foreground">WHO-5 Bem-estar</div><div className="text-lg font-bold">{who5Total}/100</div><div className="text-xs">{who5Label}</div></div>
          </div>

          {renderEscala(
            "DASS-21 — Depressão, Ansiedade e Estresse (última semana)",
            DASS_ITENS.map((i) => `[${i.t}] ${i.q}`),
            dass, setDass,
            ["0 - Não se aplicou", "1 - Aplicou-se um pouco", "2 - Aplicou-se bastante", "3 - Aplicou-se muito"],
            `D ${dassDep} • A ${dassAns} • E ${dassEst}`
          )}

          {renderEscala(
            "PSS-10 — Escala de Estresse Percebido (último mês)",
            PSS10, pss, setPss,
            ["0 - Nunca", "1 - Quase nunca", "2 - Às vezes", "3 - Com frequência", "4 - Muito frequente"],
            `${pssTotal}/40 — ${pssLabel}`
          )}

          {renderEscala(
            "WHO-5 — Índice de Bem-estar (últimas 2 semanas)",
            WHO5, who5, setWho5,
            ["0 - Nunca", "1 - Raramente", "2 - Menos da metade do tempo", "3 - Mais da metade do tempo", "4 - Maior parte do tempo", "5 - Todo o tempo"],
            `${who5Total}/100 — ${who5Label}`
          )}

          {renderEscala(
            "Escala de Autoestima de Rosenberg",
            ROSENBERG, rosenberg, setRosenberg,
            ["0 - Discordo totalmente", "1 - Discordo", "2 - Concordo", "3 - Concordo totalmente"],
            `${rosenbergTotal}/30 — ${rosenbergLabel}`
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={salvarNoProntuario}><Save className="h-4 w-4 mr-1" /> Salvar resultados no prontuário</Button>
            <Button variant="outline" onClick={() => imprimir("Resultado de Instrumentos Psicológicos", buildResumo())}>
              <Printer className="h-4 w-4 mr-1" /> Imprimir resultados
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Instrumentos de triagem — não substituem avaliação psicológica completa nem constituem diagnóstico isolado.
          </p>
        </TabsContent>

        <TabsContent value="risco" className="space-y-3 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between gap-2 flex-wrap">
                <span>Avaliação de risco (suicídio / autolesão)</span>
                <Badge variant={nivelRisco === "ALTO" ? "destructive" : "secondary"}>Nível: {nivelRisco}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {RISCO_ITENS.map((r) => (
                <label key={r.id} className="flex items-center gap-2 text-sm border-b pb-2 cursor-pointer">
                  <input type="checkbox" checked={risco.includes(r.id)} onChange={() => toggleRisco(r.id)} />
                  {r.label}
                </label>
              ))}
              <div className="pt-2">
                <Label>Plano de segurança (sinais de alerta, estratégias, contatos, serviços)</Label>
                <Textarea rows={4} value={planoSeguranca} onChange={(e) => setPlanoSeguranca(e.target.value)} />
              </div>
              <div className="text-xs text-muted-foreground border-l-4 border-primary pl-3">
                Contatos de emergência: CVV 188 • SAMU 192 • CAPS de referência do território.
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Button onClick={salvarNoProntuario}><Save className="h-4 w-4 mr-1" /> Registrar no prontuário</Button>
                <Button variant="outline" onClick={() => imprimir("Plano de Segurança", planoSeguranca || buildResumo())}>
                  <Printer className="h-4 w-4 mr-1" /> Imprimir plano de segurança
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="abordagens" className="space-y-3 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Protocolos e técnicas</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select value={abordagem === "tcc" ? "tcc" : abordagem} onValueChange={() => {}}>
                <SelectTrigger className="hidden"><SelectValue /></SelectTrigger>
              </Select>
              <ProtocoloSelector onPrint={(titulo, corpo) => imprimir(titulo, corpo)} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const ProtocoloSelector = ({ onPrint }: { onPrint: (t: string, c: string) => void }) => {
  const [key, setKey] = useState("tcc");
  const labels: Record<string, string> = {
    tcc: "Terapia Cognitivo-Comportamental",
    ansiedade: "Ansiedade e pânico",
    depressao: "Depressão",
    luto: "Luto",
    infantil: "Infantil e adolescente",
    casal: "Casal e família",
    crise: "Manejo de crise e risco",
  };
  return (
    <div className="space-y-3">
      <Select value={key} onValueChange={setKey}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {Object.keys(labels).map((k) => <SelectItem key={k} value={k}>{labels[k]}</SelectItem>)}
        </SelectContent>
      </Select>
      <pre className="text-sm whitespace-pre-wrap p-3 rounded bg-muted">{ABORDAGENS[key]}</pre>
      <Button variant="outline" onClick={() => onPrint(labels[key], ABORDAGENS[key])}>
        <Printer className="h-4 w-4 mr-1" /> Imprimir protocolo
      </Button>
    </div>
  );
};

export default Psicologia;
