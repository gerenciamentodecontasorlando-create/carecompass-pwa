import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, FileDown, Stethoscope, Beaker } from "lucide-react";
import { toast } from "sonner";
import { useClinicData } from "@/hooks/useClinicData";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, PageBreak,
} from "docx";
import { saveAs } from "file-saver";

const TIPOS_PROCEDIMENTO = [
  { id: "punch", label: "Punch (Biópsia por punch)" },
  { id: "incisional", label: "Biópsia incisional" },
  { id: "excisional", label: "Biópsia excisional / Exérese" },
  { id: "shaving", label: "Shaving (raspagem tangencial)" },
  { id: "curetagem", label: "Curetagem" },
  { id: "criocirurgia", label: "Criocirurgia (nitrogênio líquido)" },
  { id: "eletrocoagulacao", label: "Eletrocoagulação / Eletrodissecção" },
  { id: "cauterizacao_quimica", label: "Cauterização química (ATA / Podofilina)" },
  { id: "exerese_unha", label: "Exérese ungueal" },
  { id: "drenagem", label: "Drenagem de abscesso / cisto" },
  { id: "outro", label: "Outro" },
];

const FIXADORES = [
  "Formol tamponado 10%",
  "Soro fisiológico (microbiologia)",
  "Meio de Michel (imunofluorescência)",
  "A fresco (congelação)",
  "Álcool absoluto",
];

const EXAMES_SOLICITADOS = [
  "Histopatológico (rotina HE)",
  "Histopatológico + colorações especiais (PAS, Grocott, Ziehl-Neelsen)",
  "Imuno-histoquímica (especificar painel)",
  "Imunofluorescência direta",
  "Cultura para fungos / bactérias / micobactérias",
  "Pesquisa de células neoplásicas",
];

type LesaoBiopsia = {
  id: string;
  numeroAmostra: string;
  localizacao: string;
  lateralidade: "Direita" | "Esquerda" | "Linha média" | "";
  tamanho: string;
  cor: string;
  bordas: string;
  superficie: string;
  consistencia: string;
  evolucao: string;
  sintomas: string;
  hipotese: string;
  cid: string;
};

const emptyLesao = (): LesaoBiopsia => ({
  id: crypto.randomUUID(),
  numeroAmostra: "1",
  localizacao: "",
  lateralidade: "",
  tamanho: "",
  cor: "",
  bordas: "",
  superficie: "",
  consistencia: "",
  evolucao: "",
  sintomas: "",
  hipotese: "",
  cid: "",
});

const SUSPEITAS_FREQUENTES = [
  "Ceratose actínica (L57.0)",
  "Carcinoma basocelular (C44)",
  "Carcinoma espinocelular (C44)",
  "Nevo melanocítico (D22)",
  "Melanoma (C43)",
  "Ceratose seborreica (L82)",
  "Verruga viral (B07)",
  "Cisto epidérmico (L72.0)",
  "Lipoma (D17)",
  "Dermatofibroma (D23)",
  "Granuloma piogênico (L98.0)",
  "Líquen plano (L43)",
  "Psoríase (L40)",
  "Dermatite (L30)",
  "Vitiligo (L80)",
  "Outro / a esclarecer",
];

const FRASE_BORDER = { style: BorderStyle.SINGLE, size: 6, color: "0F766E" };
const CELL_BORDER = { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" };
const cellBorders = { top: CELL_BORDER, bottom: CELL_BORDER, left: CELL_BORDER, right: CELL_BORDER };

function cell(text: string, opts: { bold?: boolean; shaded?: boolean; width?: number } = {}) {
  return new TableCell({
    borders: cellBorders,
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
    shading: opts.shaded ? { fill: "E6F4F1", type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      children: [new TextRun({ text: text || "—", bold: opts.bold, size: 20 })],
    })],
  });
}

function row(label: string, value: string) {
  return new TableRow({
    children: [cell(label, { bold: true, shaded: true, width: 3000 }), cell(value, { width: 6360 })],
  });
}

function sectionHeading(text: string) {
  return new Paragraph({
    spacing: { before: 240, after: 120 },
    border: { bottom: { ...FRASE_BORDER, space: 1 } },
    children: [new TextRun({ text, bold: true, size: 26, color: "0F766E" })],
  });
}

export const BiopsiaForm = () => {
  const { data: settingsArr } = useClinicData("clinic_settings");
  const settings: any = settingsArr?.[0] || {};

  const [paciente, setPaciente] = useState({
    nome: "", nascimento: "", sexo: "", cpf: "", telefone: "",
  });
  const [historia, setHistoria] = useState({
    queixa: "", duracao: "", medicacoes: "", alergias: "", comorbidades: "",
    fototipo: "", fotossensibilidade: "", historicoCancer: "",
  });
  const [procedimento, setProcedimento] = useState({
    data: new Date().toISOString().slice(0, 10),
    tipo: "punch",
    tamanhoPunch: "",
    margens: "",
    anestesia: "Lidocaína 2% com vasoconstritor",
    volumeAnestesico: "",
    sutura: "",
    hemostasia: "",
    curativo: "",
    intercorrencias: "",
    orientacoes: "Manter curativo seco 24h. Retornar para retirada de pontos em 7-14 dias. Procurar atendimento se dor intensa, sangramento, secreção purulenta ou febre.",
  });
  const [amostra, setAmostra] = useState({
    fixador: FIXADORES[0],
    exame: EXAMES_SOLICITADOS[0],
    numFrascos: "1",
    laboratorio: "",
    observacoesLab: "",
  });
  const [lesoes, setLesoes] = useState<LesaoBiopsia[]>([emptyLesao()]);

  const addLesao = () => setLesoes([...lesoes, { ...emptyLesao(), numeroAmostra: String(lesoes.length + 1) }]);
  const removeLesao = (id: string) => setLesoes(lesoes.filter(l => l.id !== id));
  const updateLesao = (id: string, patch: Partial<LesaoBiopsia>) =>
    setLesoes(lesoes.map(l => l.id === id ? { ...l, ...patch } : l));

  const calcIdade = (nasc: string) => {
    if (!nasc) return "";
    const d = new Date(nasc);
    if (isNaN(d.getTime())) return "";
    const diff = Date.now() - d.getTime();
    return String(Math.floor(diff / (365.25 * 24 * 3600 * 1000)));
  };

  const generateDocx = async () => {
    if (!paciente.nome.trim()) {
      toast.error("Informe o nome do paciente");
      return;
    }
    if (lesoes.length === 0 || !lesoes.some(l => l.localizacao.trim())) {
      toast.error("Descreva ao menos uma lesão com localização");
      return;
    }

    const tipoLabel = TIPOS_PROCEDIMENTO.find(t => t.id === procedimento.tipo)?.label || procedimento.tipo;
    const clinicName = String(settings.clinic_name || "Clínica");
    const professional = String(settings.professional_name || "");
    const registration = String(settings.registration_number || "");
    const specialty = String(settings.specialty || "Dermatologia");
    const address = String(settings.address || "");
    const phone = String(settings.phone || "");
    const email = String(settings.email || "");

    const headerParagraphs = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: clinicName, bold: true, size: 32, color: "0F766E" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: `${professional}${specialty ? " — " + specialty : ""}`, size: 22 })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [new TextRun({ text: registration, size: 20 })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        border: { bottom: { ...FRASE_BORDER, space: 6 } },
        children: [new TextRun({ text: [address, phone, email].filter(Boolean).join(" • "), size: 18, color: "555555" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [new TextRun({
          text: "SOLICITAÇÃO DE EXAME ANATOMOPATOLÓGICO",
          bold: true, size: 28,
        })],
      }),
    ];

    const pacienteTable = new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [3000, 6360],
      rows: [
        row("Paciente", paciente.nome),
        row("Data de nascimento", `${paciente.nascimento || "—"}${paciente.nascimento ? `  (${calcIdade(paciente.nascimento)} anos)` : ""}`),
        row("Sexo", paciente.sexo),
        row("CPF", paciente.cpf),
        row("Telefone", paciente.telefone),
        row("Data do procedimento", procedimento.data),
      ],
    });

    const historiaTable = new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [3000, 6360],
      rows: [
        row("Queixa principal", historia.queixa),
        row("Tempo de evolução", historia.duracao),
        row("Comorbidades", historia.comorbidades),
        row("Medicações em uso", historia.medicacoes),
        row("Alergias", historia.alergias),
        row("Fototipo (Fitzpatrick)", historia.fototipo),
        row("Fotoexposição / fotossensibilidade", historia.fotossensibilidade),
        row("Antecedente de câncer de pele", historia.historicoCancer),
      ],
    });

    const procedimentoTable = new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [3000, 6360],
      rows: [
        row("Tipo de procedimento", tipoLabel),
        ...(procedimento.tipo === "punch" ? [row("Diâmetro do punch", procedimento.tamanhoPunch)] : []),
        ...(procedimento.tipo === "excisional" || procedimento.tipo === "incisional"
          ? [row("Margens cirúrgicas", procedimento.margens)] : []),
        row("Anestésico", procedimento.anestesia),
        row("Volume infiltrado", procedimento.volumeAnestesico),
        row("Sutura", procedimento.sutura),
        row("Hemostasia", procedimento.hemostasia),
        row("Curativo", procedimento.curativo),
        row("Intercorrências", procedimento.intercorrencias),
      ],
    });

    const amostraTable = new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [3000, 6360],
      rows: [
        row("Número de frascos", amostra.numFrascos),
        row("Fixador", amostra.fixador),
        row("Exame solicitado", amostra.exame),
        row("Laboratório destino", amostra.laboratorio),
        row("Observações ao patologista", amostra.observacoesLab),
      ],
    });

    const lesoesBlocks = lesoes.flatMap((l, idx) => [
      new Paragraph({
        spacing: { before: 200, after: 80 },
        children: [new TextRun({
          text: `Amostra ${l.numeroAmostra || idx + 1} — ${l.localizacao || "Localização não informada"}${l.lateralidade ? " (" + l.lateralidade + ")" : ""}`,
          bold: true, size: 22, color: "0F766E",
        })],
      }),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [3000, 6360],
        rows: [
          row("Tamanho (mm)", l.tamanho),
          row("Cor", l.cor),
          row("Bordas", l.bordas),
          row("Superfície", l.superficie),
          row("Consistência", l.consistencia),
          row("Tempo de evolução", l.evolucao),
          row("Sintomas (prurido, dor, sangramento)", l.sintomas),
          row("Hipótese diagnóstica", l.hipotese),
          row("CID-10", l.cid),
        ],
      }),
    ]);

    const assinatura = [
      new Paragraph({ spacing: { before: 600 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "_____________________________________________", size: 22 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: professional || "Médico responsável", bold: true, size: 22 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: registration, size: 20 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60 },
        children: [new TextRun({ text: `Emitido em ${new Date().toLocaleDateString("pt-BR")}`, size: 18, color: "777777" })] }),
    ];

    const doc = new Document({
      styles: {
        default: { document: { run: { font: "Arial", size: 22 } } },
      },
      sections: [{
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
          },
        },
        children: [
          ...headerParagraphs,
          sectionHeading("Identificação do paciente"),
          pacienteTable,
          sectionHeading("História clínica"),
          historiaTable,
          sectionHeading("Descrição das lesões"),
          ...lesoesBlocks,
          sectionHeading("Procedimento realizado"),
          procedimentoTable,
          sectionHeading("Amostra encaminhada"),
          amostraTable,
          sectionHeading("Orientações pós-operatórias entregues ao paciente"),
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: procedimento.orientacoes, size: 22 })],
          }),
          ...assinatura,
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    const safeName = paciente.nome.replace(/[^a-zA-Z0-9-_ ]/g, "").trim().replace(/\s+/g, "_");
    saveAs(blob, `Biopsia_${safeName || "paciente"}_${procedimento.data}.docx`);
    toast.success("Documento Word gerado");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Stethoscope className="h-5 w-5 text-primary" />
          <CardTitle>Identificação do paciente</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <Label>Nome completo</Label>
            <Input value={paciente.nome} onChange={(e) => setPaciente({ ...paciente, nome: e.target.value })} />
          </div>
          <div>
            <Label>Data de nascimento</Label>
            <Input type="date" value={paciente.nascimento} onChange={(e) => setPaciente({ ...paciente, nascimento: e.target.value })} />
          </div>
          <div>
            <Label>Sexo</Label>
            <Select value={paciente.sexo} onValueChange={(v) => setPaciente({ ...paciente, sexo: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Feminino">Feminino</SelectItem>
                <SelectItem value="Masculino">Masculino</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>CPF</Label>
            <Input value={paciente.cpf} onChange={(e) => setPaciente({ ...paciente, cpf: e.target.value })} />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input value={paciente.telefone} onChange={(e) => setPaciente({ ...paciente, telefone: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>História clínica</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <Label>Queixa principal</Label>
            <Input value={historia.queixa} onChange={(e) => setHistoria({ ...historia, queixa: e.target.value })} placeholder="Lesão que cresce há 3 meses no nariz..." />
          </div>
          <div>
            <Label>Tempo de evolução</Label>
            <Input value={historia.duracao} onChange={(e) => setHistoria({ ...historia, duracao: e.target.value })} placeholder="Ex: 6 meses" />
          </div>
          <div>
            <Label>Fototipo (Fitzpatrick)</Label>
            <Input value={historia.fototipo} onChange={(e) => setHistoria({ ...historia, fototipo: e.target.value })} placeholder="Ex: III" />
          </div>
          <div className="md:col-span-2">
            <Label>Comorbidades</Label>
            <Input value={historia.comorbidades} onChange={(e) => setHistoria({ ...historia, comorbidades: e.target.value })} placeholder="HAS, DM, imunossupressão..." />
          </div>
          <div>
            <Label>Medicações em uso</Label>
            <Textarea rows={2} value={historia.medicacoes} onChange={(e) => setHistoria({ ...historia, medicacoes: e.target.value })} />
          </div>
          <div>
            <Label>Alergias</Label>
            <Textarea rows={2} value={historia.alergias} onChange={(e) => setHistoria({ ...historia, alergias: e.target.value })} />
          </div>
          <div>
            <Label>Fotoexposição / fotossensibilidade</Label>
            <Input value={historia.fotossensibilidade} onChange={(e) => setHistoria({ ...historia, fotossensibilidade: e.target.value })} placeholder="Exposição solar ocupacional, queimaduras prévias..." />
          </div>
          <div>
            <Label>Antecedente de câncer de pele</Label>
            <Input value={historia.historicoCancer} onChange={(e) => setHistoria({ ...historia, historicoCancer: e.target.value })} placeholder="CBC tratado em 2022..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Lesões a biopsiar</CardTitle>
            <Button size="sm" onClick={addLesao}><Plus className="h-4 w-4 mr-1" />Lesão</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {lesoes.map((l, idx) => (
            <div key={l.id} className="border-l-4 border-primary/50 pl-3 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline">Amostra {l.numeroAmostra || idx + 1}</Badge>
                {lesoes.length > 1 && (
                  <Button size="icon" variant="ghost" onClick={() => removeLesao(l.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
              <div className="grid md:grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Nº amostra/frasco</Label>
                  <Input value={l.numeroAmostra} onChange={(e) => updateLesao(l.id, { numeroAmostra: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Localização anatômica</Label>
                  <Input value={l.localizacao} onChange={(e) => updateLesao(l.id, { localizacao: e.target.value })} placeholder="Ex: dorso nasal, asa nasal direita" />
                </div>
                <div>
                  <Label className="text-xs">Lateralidade</Label>
                  <Select value={l.lateralidade} onValueChange={(v) => updateLesao(l.id, { lateralidade: v as any })}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Direita">Direita</SelectItem>
                      <SelectItem value="Esquerda">Esquerda</SelectItem>
                      <SelectItem value="Linha média">Linha média</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Tamanho (mm)</Label>
                  <Input value={l.tamanho} onChange={(e) => updateLesao(l.id, { tamanho: e.target.value })} placeholder="Ex: 8 x 6 mm" />
                </div>
                <div>
                  <Label className="text-xs">Cor</Label>
                  <Input value={l.cor} onChange={(e) => updateLesao(l.id, { cor: e.target.value })} placeholder="Eritematosa, perolada, hipercrômica..." />
                </div>
                <div>
                  <Label className="text-xs">Bordas</Label>
                  <Input value={l.bordas} onChange={(e) => updateLesao(l.id, { bordas: e.target.value })} placeholder="Regulares / irregulares / mal definidas" />
                </div>
                <div>
                  <Label className="text-xs">Superfície</Label>
                  <Input value={l.superficie} onChange={(e) => updateLesao(l.id, { superficie: e.target.value })} placeholder="Lisa, ulcerada, descamativa, crostosa" />
                </div>
                <div>
                  <Label className="text-xs">Consistência</Label>
                  <Input value={l.consistencia} onChange={(e) => updateLesao(l.id, { consistencia: e.target.value })} placeholder="Firme, fibroelástica, amolecida" />
                </div>
                <div>
                  <Label className="text-xs">Evolução</Label>
                  <Input value={l.evolucao} onChange={(e) => updateLesao(l.id, { evolucao: e.target.value })} placeholder="Há quanto tempo, crescimento" />
                </div>
                <div className="md:col-span-3">
                  <Label className="text-xs">Sintomas associados</Label>
                  <Input value={l.sintomas} onChange={(e) => updateLesao(l.id, { sintomas: e.target.value })} placeholder="Prurido, dor, sangramento espontâneo..." />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Hipótese diagnóstica</Label>
                  <Select value={l.hipotese} onValueChange={(v) => updateLesao(l.id, { hipotese: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione ou digite" /></SelectTrigger>
                    <SelectContent>
                      {SUSPEITAS_FREQUENTES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">CID-10</Label>
                  <Input value={l.cid} onChange={(e) => updateLesao(l.id, { cid: e.target.value })} placeholder="Ex: C44.3" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Procedimento cirúrgico</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-3">
          <div>
            <Label>Data</Label>
            <Input type="date" value={procedimento.data} onChange={(e) => setProcedimento({ ...procedimento, data: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Tipo de procedimento</Label>
            <Select value={procedimento.tipo} onValueChange={(v) => setProcedimento({ ...procedimento, tipo: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS_PROCEDIMENTO.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {procedimento.tipo === "punch" && (
            <div>
              <Label>Diâmetro do punch</Label>
              <Input value={procedimento.tamanhoPunch} onChange={(e) => setProcedimento({ ...procedimento, tamanhoPunch: e.target.value })} placeholder="3 mm / 4 mm / 5 mm" />
            </div>
          )}
          {(procedimento.tipo === "excisional" || procedimento.tipo === "incisional") && (
            <div className="md:col-span-2">
              <Label>Margens cirúrgicas</Label>
              <Input value={procedimento.margens} onChange={(e) => setProcedimento({ ...procedimento, margens: e.target.value })} placeholder="Ex: 3 mm de margem lateral, fundo até subcutâneo" />
            </div>
          )}
          <div className="md:col-span-2">
            <Label>Anestésico</Label>
            <Input value={procedimento.anestesia} onChange={(e) => setProcedimento({ ...procedimento, anestesia: e.target.value })} />
          </div>
          <div>
            <Label>Volume infiltrado</Label>
            <Input value={procedimento.volumeAnestesico} onChange={(e) => setProcedimento({ ...procedimento, volumeAnestesico: e.target.value })} placeholder="Ex: 1,5 mL" />
          </div>
          <div>
            <Label>Sutura</Label>
            <Input value={procedimento.sutura} onChange={(e) => setProcedimento({ ...procedimento, sutura: e.target.value })} placeholder="Nylon 5-0, 3 pontos simples" />
          </div>
          <div>
            <Label>Hemostasia</Label>
            <Input value={procedimento.hemostasia} onChange={(e) => setProcedimento({ ...procedimento, hemostasia: e.target.value })} placeholder="Compressão / eletrocoagulação" />
          </div>
          <div>
            <Label>Curativo</Label>
            <Input value={procedimento.curativo} onChange={(e) => setProcedimento({ ...procedimento, curativo: e.target.value })} placeholder="Micropore + gaze" />
          </div>
          <div className="md:col-span-3">
            <Label>Intercorrências</Label>
            <Input value={procedimento.intercorrencias} onChange={(e) => setProcedimento({ ...procedimento, intercorrencias: e.target.value })} placeholder="Sem intercorrências" />
          </div>
          <div className="md:col-span-3">
            <Label>Orientações pós-operatórias</Label>
            <Textarea rows={3} value={procedimento.orientacoes} onChange={(e) => setProcedimento({ ...procedimento, orientacoes: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Beaker className="h-5 w-5 text-primary" />
          <CardTitle>Encaminhamento ao laboratório de patologia</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-3">
          <div>
            <Label>Fixador</Label>
            <Select value={amostra.fixador} onValueChange={(v) => setAmostra({ ...amostra, fixador: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FIXADORES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Exame solicitado</Label>
            <Select value={amostra.exame} onValueChange={(v) => setAmostra({ ...amostra, exame: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXAMES_SOLICITADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Número de frascos</Label>
            <Input value={amostra.numFrascos} onChange={(e) => setAmostra({ ...amostra, numFrascos: e.target.value })} />
          </div>
          <div>
            <Label>Laboratório destino</Label>
            <Input value={amostra.laboratorio} onChange={(e) => setAmostra({ ...amostra, laboratorio: e.target.value })} placeholder="Nome do laboratório de patologia" />
          </div>
          <div className="md:col-span-2">
            <Label>Observações ao patologista</Label>
            <Textarea rows={3} value={amostra.observacoesLab} onChange={(e) => setAmostra({ ...amostra, observacoesLab: e.target.value })} placeholder="Solicito avaliação das margens, descartar melanoma..." />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 pt-2">
        <Button size="lg" onClick={generateDocx}>
          <FileDown className="h-4 w-4 mr-2" />
          Gerar documento Word personalizado
        </Button>
      </div>
    </div>
  );
};
