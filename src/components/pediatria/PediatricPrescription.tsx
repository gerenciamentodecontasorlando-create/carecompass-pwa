import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Info, Pill, Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useClinicData } from "@/hooks/useClinicData";

/* ============================================================
   Catálogo pediátrico — dose por kg com cálculo automático
   ============================================================ */
type Drug = {
  id: string;
  name: string;
  category: string;
  presentation: string;
  /** mg por mL da apresentação (para cálculo de volume) */
  mgPerMl?: number;
  /** gotas por mL, quando a apresentação é em gotas */
  dropsPerMl?: number;
  /** dose por tomada em mg/kg */
  dosePerTake: number;
  doseMax?: number; // mg por tomada
  interval: string;
  duration: string;
  minAge: string;
  route: string;
  /** orientação clínica exibida abaixo da prescrição */
  note: string;
  alert?: string;
};

const CATALOG: Drug[] = [
  {
    id: "paracetamol-gotas", name: "Paracetamol 200 mg/mL (gotas)", category: "Analgésico / Antitérmico",
    presentation: "Solução oral 200 mg/mL", mgPerMl: 200, dropsPerMl: 20,
    dosePerTake: 12.5, doseMax: 750, interval: "a cada 6 horas se dor ou febre ≥ 37,8 °C",
    duration: "por até 3 dias", minAge: "≥ 3 meses (uso liberado no RN sob orientação)", route: "Via oral",
    note: "Dose usual 10-15 mg/kg/dose, máximo 5 doses/dia (75 mg/kg/dia). Preferir dose única bem calculada a doses repetidas de curta interval. Cuidado com apresentações concentradas e com associações que também contenham paracetamol.",
    alert: "Hepatotóxico em superdose — nunca exceder 75 mg/kg/dia.",
  },
  {
    id: "dipirona-gotas", name: "Dipirona 500 mg/mL (gotas)", category: "Analgésico / Antitérmico",
    presentation: "Solução oral 500 mg/mL", mgPerMl: 500, dropsPerMl: 20,
    dosePerTake: 15, doseMax: 1000, interval: "a cada 6 horas se dor ou febre",
    duration: "por até 3 dias", minAge: "≥ 3 meses ou > 5 kg", route: "Via oral",
    note: "Dose 10-20 mg/kg/dose (1 gota/kg equivale a ~25 mg/kg — evitar essa regra antiga). Máximo 4 tomadas ao dia.",
    alert: "Risco raro de agranulocitose — orientar retorno em caso de febre com dor de garganta e aftas.",
  },
  {
    id: "ibuprofeno-100", name: "Ibuprofeno 100 mg/5 mL (suspensão)", category: "Anti-inflamatório",
    presentation: "Suspensão oral 100 mg/5 mL (20 mg/mL)", mgPerMl: 20,
    dosePerTake: 7.5, doseMax: 400, interval: "a cada 8 horas",
    duration: "por 3 a 5 dias", minAge: "≥ 6 meses", route: "Via oral, após alimentação",
    note: "Antitérmico/analgésico 5-10 mg/kg/dose; anti-inflamatório 30-40 mg/kg/dia dividido em 3-4 tomadas. Sempre administrar com alimento.",
    alert: "Evitar em desidratação, suspeita de dengue, sangramento, doença renal ou varicela.",
  },
  {
    id: "amoxicilina-250", name: "Amoxicilina 250 mg/5 mL", category: "Antibiótico",
    presentation: "Suspensão 250 mg/5 mL (50 mg/mL)", mgPerMl: 50,
    dosePerTake: 16.6, doseMax: 1000, interval: "a cada 8 horas",
    duration: "por 7 a 10 dias", minAge: "qualquer idade", route: "Via oral",
    note: "Dose habitual 50 mg/kg/dia em 3 tomadas; otite média/pneumonia: 80-90 mg/kg/dia (dose alta) dividida em 2-3 tomadas. Manter frasco reconstituído refrigerado por até 14 dias.",
  },
  {
    id: "amoxi-clav", name: "Amoxicilina + Clavulanato 400/57 mg/5 mL", category: "Antibiótico",
    presentation: "Suspensão 400 mg/5 mL (80 mg/mL de amoxicilina)", mgPerMl: 80,
    dosePerTake: 22.5, doseMax: 875, interval: "a cada 12 horas",
    duration: "por 7 a 10 dias", minAge: "≥ 2 meses", route: "Via oral, junto às refeições",
    note: "Dose calculada pelo componente amoxicilina: 45 mg/kg/dia (padrão) a 90 mg/kg/dia (dose alta) em 2 tomadas.",
    alert: "Diarreia é o efeito mais comum — administrar com alimento.",
  },
  {
    id: "azitromicina", name: "Azitromicina 200 mg/5 mL", category: "Antibiótico",
    presentation: "Suspensão 200 mg/5 mL (40 mg/mL)", mgPerMl: 40,
    dosePerTake: 10, doseMax: 500, interval: "1 vez ao dia",
    duration: "por 3 a 5 dias", minAge: "≥ 6 meses", route: "Via oral, 1 h antes ou 2 h após alimentação",
    note: "10 mg/kg/dia por 3 dias, ou 10 mg/kg no 1º dia e 5 mg/kg do 2º ao 5º dia. Boa opção em pneumonia atípica e coqueluche.",
  },
  {
    id: "prednisolona", name: "Prednisolona 3 mg/mL", category: "Corticoide",
    presentation: "Solução oral 3 mg/mL", mgPerMl: 3,
    dosePerTake: 1, doseMax: 40, interval: "1 vez ao dia, pela manhã",
    duration: "por 3 a 5 dias", minAge: "qualquer idade", route: "Via oral",
    note: "1-2 mg/kg/dia (máx. 40-60 mg/dia) na crise de asma/sibilância; cursos curtos até 5 dias não exigem desmame.",
  },
  {
    id: "salbutamol", name: "Salbutamol spray 100 mcg/jato", category: "Broncodilatador",
    presentation: "Aerossol dosimetrado com espaçador", dosePerTake: 0,
    interval: "a cada 4-6 horas na crise", duration: "conforme sintomas", minAge: "qualquer idade", route: "Inalatório",
    note: "2 a 4 jatos com espaçador (com máscara em < 4 anos), 1 jato por vez com 5-6 respirações. Na crise: até 3 séries a cada 20 min na 1ª hora.",
    alert: "Tremor e taquicardia são esperados. Piora ou esforço respiratório: procurar emergência.",
  },
  {
    id: "sro", name: "Sais de reidratação oral (SRO)", category: "Hidratação",
    presentation: "Sachê diluído em 1 litro de água tratada", dosePerTake: 10,
    interval: "após cada evacuação líquida", duration: "enquanto durar a diarreia", minAge: "qualquer idade", route: "Via oral",
    note: "Plano A: 10 mL/kg após cada perda. Ofertar em colheradas fracionadas. Manter aleitamento materno e alimentação.",
    alert: "Sinais de alerta: olhos fundos, choro sem lágrimas, letargia, urina escassa — reavaliação imediata.",
  },
  {
    id: "vitd", name: "Vitamina D3 (colecalciferol) gotas", category: "Suplementação",
    presentation: "200 UI por gota", dosePerTake: 0,
    interval: "1 vez ao dia", duration: "uso contínuo até 24 meses", minAge: "1ª semana de vida", route: "Via oral",
    note: "400 UI/dia (2 gotas) do nascimento aos 12 meses e 600 UI/dia (3 gotas) dos 12 aos 24 meses, conforme SBP.",
  },
  {
    id: "ferro", name: "Sulfato ferroso 25 mg Fe/mL", category: "Suplementação",
    presentation: "Solução oral 25 mg de ferro elementar/mL", mgPerMl: 25,
    dosePerTake: 1, interval: "1 vez ao dia, longe das refeições",
    duration: "profilaxia até 24 meses / tratamento por 3 a 6 meses", minAge: "≥ 3 meses (ou 30 dias se prematuro)", route: "Via oral",
    note: "Profilaxia 1-2 mg/kg/dia; anemia ferropriva 3-5 mg/kg/dia de ferro elementar. Administrar com suco de fruta cítrica, evitar leite no horário.",
    alert: "Escurecimento das fezes e dos dentes é esperado — higiene oral após a dose.",
  },
  {
    id: "loratadina", name: "Loratadina 1 mg/mL", category: "Anti-histamínico",
    presentation: "Xarope 1 mg/mL", mgPerMl: 1,
    dosePerTake: 0, interval: "1 vez ao dia", duration: "por 7 a 14 dias", minAge: "≥ 2 anos", route: "Via oral",
    note: "2 a 5 anos: 5 mg/dia (5 mL). Acima de 5 anos: 10 mg/dia (10 mL). Não sedativo, boa opção para rinite e urticária.",
  },
  {
    id: "ondansetrona", name: "Ondansetrona 4 mg comprimido orodispersível", category: "Antiemético",
    presentation: "Comprimido de dissolução oral 4 mg", dosePerTake: 0.15, doseMax: 8,
    interval: "dose única (repetir apenas se necessário após 8 h)", duration: "uso pontual", minAge: "≥ 6 meses / > 8 kg", route: "Via oral",
    note: "0,15 mg/kg (prática: 8-15 kg = 2 mg; 15-30 kg = 4 mg; > 30 kg = 8 mg). Facilita a reidratação oral em gastroenterite.",
  },
];

const drops = (ml: number) => Math.round(ml * 20);

type Item = { drug: Drug; mgDose: number | null; volume: string; custom: string };

export function PediatricPrescription() {
  const { data: settingsRows } = useClinicData("clinic_settings");
  const settings = (settingsRows?.[0] as Record<string, string> | undefined) || {};

  const [child, setChild] = useState("");
  const [ageMonths, setAgeMonths] = useState("");
  const [weight, setWeight] = useState("");
  const [selected, setSelected] = useState<string>("");
  const [items, setItems] = useState<Item[]>([]);
  const [extra, setExtra] = useState("");

  const w = parseFloat(weight);

  const compute = (d: Drug): Item => {
    let mgDose: number | null = null;
    let volume = "";
    if (d.dosePerTake > 0 && w > 0) {
      mgDose = Math.round(w * d.dosePerTake * 100) / 100;
      if (d.doseMax && mgDose > d.doseMax) mgDose = d.doseMax;
      if (d.mgPerMl) {
        const ml = Math.round((mgDose / d.mgPerMl) * 10) / 10;
        volume = d.dropsPerMl
          ? `${ml.toString().replace(".", ",")} mL (${drops(ml)} gotas)`
          : `${ml.toString().replace(".", ",")} mL`;
      } else if (d.id === "sro") {
        volume = `${Math.round(mgDose)} mL`;
        mgDose = null;
      }
    }
    return { drug: d, mgDose, volume, custom: "" };
  };

  const addItem = () => {
    const d = CATALOG.find((x) => x.id === selected);
    if (!d) { toast.error("Selecione uma medicação"); return; }
    if (!(w > 0)) { toast.error("Informe o peso da criança para calcular a dose"); return; }
    setItems((p) => [...p, compute(d)]);
    setSelected("");
  };

  const recalculated = useMemo(() => items.map((it) => ({ ...compute(it.drug), custom: it.custom })), [items, weight]);

  const doseLine = (it: Item) => {
    const parts: string[] = [];
    if (it.volume) parts.push(`Administrar ${it.volume}${it.mgDose ? ` (${it.mgDose} mg)` : ""}`);
    else if (it.mgDose) parts.push(`Administrar ${it.mgDose} mg`);
    else parts.push("Administrar conforme orientação abaixo");
    parts.push(it.drug.interval);
    parts.push(it.drug.duration);
    return `${parts.join(", ")}. ${it.drug.route}.`;
  };

  const print = () => {
    if (recalculated.length === 0) { toast.error("Adicione ao menos uma medicação"); return; }
    const win = window.open("", "_blank");
    if (!win) return;
    const body = recalculated.map((it, i) => `
      <div class="item">
        <div class="drug">${i + 1}. ${it.drug.name} — ${it.drug.presentation}</div>
        <div class="dose">${doseLine(it)}</div>
        ${it.custom ? `<div class="dose">${it.custom}</div>` : ""}
        <div class="note"><strong>Orientação ao profissional:</strong> ${it.drug.note}${it.drug.alert ? ` <em>Atenção: ${it.drug.alert}</em>` : ""}</div>
      </div>`).join("");
    win.document.write(`<html><head><title>Receita Pediátrica</title><style>
      body{font-family:Arial,Helvetica,sans-serif;padding:28px;color:#111}
      h1{font-size:16px;margin:0 0 2px}
      .header{text-align:center;border-bottom:2px solid #0f766e;padding-bottom:8px;margin-bottom:14px}
      .header small{color:#444}
      .patient{background:#f4f7f7;border:1px solid #ddd;padding:8px 10px;margin-bottom:14px;font-size:13px}
      .item{margin-bottom:16px;padding-bottom:10px;border-bottom:1px dashed #ccc}
      .drug{font-weight:bold;font-size:14px}
      .dose{font-size:13px;margin-top:3px}
      .note{font-size:11px;color:#444;margin-top:5px;border-left:3px solid #0f766e;padding-left:7px}
      .extra{font-size:12px;white-space:pre-wrap;margin-top:10px}
      .sign{margin-top:60px;text-align:center;font-size:12px}
      .sign hr{width:280px;border:none;border-top:1px solid #111;margin:0 auto 4px}
    </style></head><body>
      <div class="header">
        <h1>${settings.clinic_name || "Receita Pediátrica"}</h1>
        <small>${settings.professional_name || ""}${settings.registration_number ? " — " + settings.registration_number : ""}<br>
        ${settings.address || ""} ${settings.phone ? " • " + settings.phone : ""}</small>
      </div>
      <div class="patient">
        <strong>Paciente:</strong> ${child || "_______________________"} &nbsp;|&nbsp;
        <strong>Idade:</strong> ${ageMonths ? `${ageMonths} meses` : "____"} &nbsp;|&nbsp;
        <strong>Peso:</strong> ${weight ? `${weight} kg` : "____"} &nbsp;|&nbsp;
        <strong>Data:</strong> ${new Date().toLocaleDateString("pt-BR")}
      </div>
      ${body}
      ${extra ? `<div class="extra"><strong>Orientações gerais:</strong>\n${extra}</div>` : ""}
      <div class="sign"><hr>${settings.professional_name || ""}<br>${settings.registration_number || ""}</div>
    </body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Pill className="h-5 w-5" />Receita pediátrica automática</CardTitle>
          <p className="text-xs text-muted-foreground">
            Informe o peso e escolha a medicação: a dose, o volume em mL/gotas e o intervalo são calculados automaticamente,
            com uma orientação técnica abaixo de cada item.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <Label>Nome da criança</Label>
              <Input value={child} onChange={(e) => setChild(e.target.value)} />
            </div>
            <div>
              <Label>Idade (meses)</Label>
              <Input type="number" value={ageMonths} onChange={(e) => setAgeMonths(e.target.value)} />
            </div>
            <div>
              <Label>Peso (kg) *</Label>
              <Input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Ex: 12,5" />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-2 md:items-end">
            <div className="flex-1">
              <Label>Medicação</Label>
              <Select value={selected} onValueChange={setSelected}>
                <SelectTrigger><SelectValue placeholder="Selecione a medicação" /></SelectTrigger>
                <SelectContent>
                  {CATALOG.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.category} — {d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={addItem}><Plus className="h-4 w-4 mr-1" />Adicionar à receita</Button>
          </div>

          {!(w > 0) && (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Info className="h-4 w-4" /> Informe o peso para liberar o cálculo automático das doses.
            </div>
          )}

          {recalculated.length > 0 && (
            <div className="space-y-3 border-t pt-3">
              {recalculated.map((it, idx) => (
                <div key={`${it.drug.id}-${idx}`} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-sm">{idx + 1}. {it.drug.name}</div>
                      <div className="text-xs text-muted-foreground">{it.drug.presentation} • {it.drug.minAge}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{it.drug.category}</Badge>
                      <Button variant="ghost" size="icon"
                        onClick={() => setItems((p) => p.filter((_, i) => i !== idx))}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm">{doseLine(it)}</div>
                  <Input
                    placeholder="Complemento livre (opcional): ex. diluir em 20 mL de água"
                    value={items[idx]?.custom || ""}
                    onChange={(e) => setItems((p) => p.map((x, i) => (i === idx ? { ...x, custom: e.target.value } : x)))}
                  />
                  <div className="text-xs text-muted-foreground border-l-4 border-primary pl-3">
                    <strong>Orientação ao profissional:</strong> {it.drug.note}
                  </div>
                  {it.drug.alert && (
                    <div className="text-xs text-destructive flex gap-2 items-start">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />{it.drug.alert}
                    </div>
                  )}
                </div>
              ))}

              <div>
                <Label>Orientações gerais aos responsáveis</Label>
                <Textarea rows={4} value={extra} onChange={(e) => setExtra(e.target.value)}
                  placeholder="Sinais de alerta, retorno, medidas gerais..." />
              </div>

              <div className="flex gap-2">
                <Button onClick={print}><Printer className="h-4 w-4 mr-1" />Imprimir receita</Button>
                <Button variant="outline" onClick={() => { setItems([]); setExtra(""); }}>Limpar</Button>
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground border-t pt-3">
            Doses de referência SBP / Ministério da Saúde. A conferência final da dose, das contraindicações e das
            interações é responsabilidade do profissional prescritor.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PediatricPrescription;
