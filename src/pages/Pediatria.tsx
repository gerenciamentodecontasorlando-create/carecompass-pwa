import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Baby, Activity, Syringe, Calculator, Printer, Ruler } from "lucide-react";
import { toast } from "sonner";

/* ------------------ WHO Z-SCORE (LMS) ------------------ */
/* Tabela LMS resumida da OMS para peso-para-idade (0-60 meses).
   Fonte: WHO Child Growth Standards (subset).  L,M,S por mês/sexo. */
type LMS = { L: number; M: number; S: number };
const WHO_WFA_BOYS: Record<number, LMS> = {
  0: { L: 0.3487, M: 3.3464, S: 0.14602 },
  1: { L: 0.2297, M: 4.4709, S: 0.13395 },
  2: { L: 0.197, M: 5.5675, S: 0.12385 },
  3: { L: 0.1738, M: 6.3762, S: 0.11727 },
  6: { L: 0.1336, M: 7.934, S: 0.11080 },
  12: { L: 0.0402, M: 9.6479, S: 0.10661 },
  24: { L: -0.1506, M: 12.1515, S: 0.10750 },
  36: { L: -0.2622, M: 14.3, S: 0.10750 },
  48: { L: -0.3402, M: 16.3, S: 0.10800 },
  60: { L: -0.3979, M: 18.3, S: 0.10900 },
};
const WHO_WFA_GIRLS: Record<number, LMS> = {
  0: { L: 0.3809, M: 3.2322, S: 0.14171 },
  1: { L: 0.1714, M: 4.1873, S: 0.13724 },
  2: { L: 0.0962, M: 5.1282, S: 0.13 },
  3: { L: 0.0402, M: 5.8458, S: 0.12619 },
  6: { L: -0.0756, M: 7.2971, S: 0.11806 },
  12: { L: -0.1733, M: 8.9481, S: 0.11261 },
  24: { L: -0.2546, M: 11.4775, S: 0.11475 },
  36: { L: -0.3, M: 13.9, S: 0.115 },
  48: { L: -0.33, M: 15.9, S: 0.116 },
  60: { L: -0.36, M: 17.9, S: 0.117 },
};

function nearestLMS(table: Record<number, LMS>, ageMonths: number): LMS {
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
  let prev = keys[0];
  for (const k of keys) {
    if (k <= ageMonths) prev = k;
    else break;
  }
  return table[prev];
}

function zscore(value: number, lms: LMS): number {
  const { L, M, S } = lms;
  if (L === 0) return Math.log(value / M) / S;
  return (Math.pow(value / M, L) - 1) / (L * S);
}

function zToPercentile(z: number): number {
  // Approximation
  const p = 0.5 * (1 + erf(z / Math.SQRT2));
  return Math.round(p * 1000) / 10;
}
function erf(x: number) {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const t = 1 / (1 + p * x);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

function classifyZ(z: number, indicator: "weight" | "height" | "bmi"): { label: string; color: string } {
  if (indicator === "weight") {
    if (z < -3) return { label: "Muito baixo peso (grave)", color: "destructive" };
    if (z < -2) return { label: "Baixo peso", color: "destructive" };
    if (z <= 2) return { label: "Peso adequado", color: "default" };
    return { label: "Peso elevado", color: "secondary" };
  }
  if (indicator === "bmi") {
    if (z < -2) return { label: "Magreza", color: "destructive" };
    if (z <= 1) return { label: "Eutrofia", color: "default" };
    if (z <= 2) return { label: "Risco de sobrepeso", color: "secondary" };
    if (z <= 3) return { label: "Sobrepeso", color: "secondary" };
    return { label: "Obesidade", color: "destructive" };
  }
  if (z < -3) return { label: "Estatura muito baixa", color: "destructive" };
  if (z < -2) return { label: "Estatura baixa", color: "destructive" };
  return { label: "Estatura adequada", color: "default" };
}

/* ------------------ Faixas etárias ------------------ */
const AGE_GROUPS = [
  { id: "neonato", label: "Neonato (0-28d)" },
  { id: "lactente", label: "Lactente (1m-2a)" },
  { id: "preescolar", label: "Pré-escolar (2-5a)" },
  { id: "escolar", label: "Escolar (6-10a)" },
  { id: "adolescente", label: "Adolescente (11-19a)" },
];

const ANAMNESE_TEMPLATES: Record<string, string> = {
  neonato: `IDADE GESTACIONAL: ___ semanas
TIPO DE PARTO: (vaginal/cesárea)
APGAR: 1' ___ / 5' ___
PESO AO NASCER: ___ g | ESTATURA: ___ cm | PC: ___ cm
INTERCORRÊNCIAS NEONATAIS: ___
TESTES DO PEZINHO/OLHINHO/ORELHINHA/CORAÇÃOZINHO: ___
ALEITAMENTO: (materno exclusivo / misto / fórmula)
ELIMINAÇÕES: diurese ___ / evacuações ___
ICTERÍCIA: (não / zona ___) | COTO UMBILICAL: ___`,

  lactente: `ALIMENTAÇÃO: (AME até ___m / introdução alimentar a partir de ___m)
SONO: ___ horas/dia | DESPERTARES: ___
DESENVOLVIMENTO: sustento cefálico ___m, sentar ___m, andar ___m, primeiras palavras ___m
VACINAÇÃO: em dia (S/N) - faltam: ___
SUPLEMENTAÇÃO: vit D ___ UI/dia | Fe ___mg/kg/dia
INTERCORRÊNCIAS: (IVAS, GECA, alergias)
PESO/ALTURA ANTERIOR: ___`,

  preescolar: `ALIMENTAÇÃO: (variada/seletiva)
SONO: ___ h | CONTROLE ESFINCTERIANO: diurno ___ / noturno ___
LINGUAGEM: frases completas (S/N), entendimento (S/N)
SOCIALIZAÇÃO: creche/escola
ATIVIDADE FÍSICA: ___
TRIAGEM VISUAL/AUDITIVA: ___
COMPORTAMENTO: ___`,

  escolar: `RENDIMENTO ESCOLAR: ___
ATIVIDADE FÍSICA: ___ h/semana
SCREEN TIME: ___ h/dia
ALIMENTAÇÃO: (refeições estruturadas / ultraprocessados)
DOR / CEFALEIA / DOR ABDOMINAL RECORRENTE: ___
ENURESE: ___
SAÚDE BUCAL: ___`,

  adolescente: `MENARCA / TELARCA / PUBARCA: ___
TANNER: M___ P___ G___
SEXARCA / IST / CONTRACEPÇÃO: ___
USO DE SUBSTÂNCIAS (HEEADSSS): álcool ___, tabaco ___, outras ___
HUMOR / SONO / ESCOLA: ___
ATIVIDADE FÍSICA E ALIMENTAÇÃO: ___
IMAGEM CORPORAL / TRANSTORNOS ALIMENTARES: ___`,
};

/* ------------------ Vacinas PNI/SBP ------------------ */
const VACINAS = [
  { age: "Ao nascer", items: ["BCG", "Hepatite B (1ª dose)"] },
  { age: "2 meses", items: ["Penta (DTP+Hib+HepB)", "VIP", "Pneumo 10V", "Rotavírus"] },
  { age: "3 meses", items: ["Meningo C"] },
  { age: "4 meses", items: ["Penta", "VIP", "Pneumo 10V", "Rotavírus"] },
  { age: "5 meses", items: ["Meningo C"] },
  { age: "6 meses", items: ["Penta", "VIP", "Influenza (anual)"] },
  { age: "9 meses", items: ["Febre Amarela"] },
  { age: "12 meses", items: ["Tríplice Viral (SCR)", "Pneumo 10V (reforço)", "Meningo C (reforço)"] },
  { age: "15 meses", items: ["DTP (1º reforço)", "VOP", "Hep A", "Tetra Viral (SCRV)"] },
  { age: "4 anos", items: ["DTP (2º reforço)", "VOP", "Varicela", "Febre Amarela (reforço)"] },
  { age: "9-14 anos", items: ["HPV (2 doses)", "Meningo ACWY", "dT", "dTpa adolescente"] },
];

const MARCOS = [
  { age: "2 meses", items: ["Sorri socialmente", "Segue objetos com olhar", "Sustenta cabeça por segundos"] },
  { age: "4 meses", items: ["Sustento cefálico firme", "Risadas", "Mãos na linha média"] },
  { age: "6 meses", items: ["Senta com apoio", "Balbucia", "Pega objetos"] },
  { age: "9 meses", items: ["Senta sem apoio", "Engatinha", "Sílabas (mama, papa)"] },
  { age: "12 meses", items: ["Fica em pé com apoio", "1ª palavra com sentido", "Pinça polegar-indicador"] },
  { age: "18 meses", items: ["Anda sozinho", "10 palavras", "Aponta partes do corpo"] },
  { age: "24 meses", items: ["Corre", "Frases de 2 palavras", "Imita adultos"] },
  { age: "3 anos", items: ["Pedala triciclo", "Frases completas", "Conta até 3"] },
  { age: "4 anos", items: ["Pula em 1 pé", "Conta histórias", "Veste-se com supervisão"] },
];

/* ------------------ Calculadoras ------------------ */
function holidaySegar(weight: number): { ml24: number; mlh: number; detail: string } {
  let total = 0;
  let detail = "";
  if (weight <= 10) {
    total = weight * 100;
    detail = "100 mL/kg (até 10kg)";
  } else if (weight <= 20) {
    total = 1000 + (weight - 10) * 50;
    detail = "1000 + 50 mL/kg (10-20kg)";
  } else {
    total = 1500 + (weight - 20) * 20;
    detail = "1500 + 20 mL/kg (>20kg)";
  }
  return { ml24: Math.round(total), mlh: Math.round(total / 24), detail };
}

function bsa(weight: number, height: number): number {
  // Mosteller
  return Math.round(Math.sqrt((weight * height) / 3600) * 100) / 100;
}

/* ------------------ Tabela de medidas de referência por fase (P50 OMS / SBP) ------------------ */
type RefRow = {
  faixa: string;
  pesoM: string; pesoF: string;
  altM: string; altF: string;
  pc: string;
  imc: string;
  fc: string;
  fr: string;
  pas: string;
  observ: string;
};

const REF_MEDIDAS: RefRow[] = [
  { faixa: "RN a termo (0d)", pesoM: "3,3 kg", pesoF: "3,2 kg", altM: "49,9 cm", altF: "49,1 cm",
    pc: "34-35 cm", imc: "13,4", fc: "100-160", fr: "30-60", pas: "60-90 / 30-60",
    observ: "Perda fisiológica até 10% na 1ª sem; recupera até 15º dia" },
  { faixa: "1 mês",  pesoM: "4,5 kg", pesoF: "4,2 kg", altM: "54,7 cm", altF: "53,7 cm",
    pc: "37 cm", imc: "14,9", fc: "100-150", fr: "30-50", pas: "70-95 / 35-65",
    observ: "Ganho ~30 g/dia (1º trim.)" },
  { faixa: "3 meses", pesoM: "6,4 kg", pesoF: "5,8 kg", altM: "61,4 cm", altF: "59,8 cm",
    pc: "40 cm", imc: "16,9", fc: "90-150", fr: "30-45", pas: "75-100 / 40-70",
    observ: "Sustenta cabeça; sorri" },
  { faixa: "6 meses", pesoM: "7,9 kg", pesoF: "7,3 kg", altM: "67,6 cm", altF: "65,7 cm",
    pc: "43 cm", imc: "17,3", fc: "80-140", fr: "25-40", pas: "80-100 / 40-70",
    observ: "Dobra peso de nascimento; início alimentação complementar" },
  { faixa: "9 meses", pesoM: "8,9 kg", pesoF: "8,2 kg", altM: "72,0 cm", altF: "70,1 cm",
    pc: "45 cm", imc: "17,2", fc: "80-140", fr: "25-40", pas: "85-105 / 45-70",
    observ: "Senta sem apoio; engatinha" },
  { faixa: "12 meses", pesoM: "9,6 kg", pesoF: "8,9 kg", altM: "75,7 cm", altF: "74,0 cm",
    pc: "46 cm", imc: "16,8", fc: "80-130", fr: "20-35", pas: "85-105 / 45-70",
    observ: "Triplica peso de nascimento; primeiras palavras" },
  { faixa: "18 meses", pesoM: "10,9 kg", pesoF: "10,2 kg", altM: "82,3 cm", altF: "80,7 cm",
    pc: "47-48 cm", imc: "16,1", fc: "80-130", fr: "20-30", pas: "90-105 / 50-70",
    observ: "Anda firme; ~10 palavras" },
  { faixa: "2 anos", pesoM: "12,2 kg", pesoF: "11,5 kg", altM: "87,8 cm", altF: "86,4 cm",
    pc: "48-49 cm", imc: "15,7", fc: "80-120", fr: "20-30", pas: "90-110 / 50-75",
    observ: "Frases de 2 palavras; corre" },
  { faixa: "3 anos", pesoM: "14,3 kg", pesoF: "13,9 kg", altM: "96,1 cm", altF: "95,1 cm",
    pc: "49-50 cm", imc: "15,4", fc: "75-115", fr: "20-30", pas: "95-110 / 55-75",
    observ: "Frases completas; controle esfincteriano" },
  { faixa: "4 anos", pesoM: "16,3 kg", pesoF: "16,1 kg", altM: "103,3 cm", altF: "102,7 cm",
    pc: "50 cm", imc: "15,3", fc: "75-115", fr: "20-25", pas: "95-110 / 55-75",
    observ: "Pula em 1 pé; conta histórias" },
  { faixa: "5 anos", pesoM: "18,3 kg", pesoF: "18,2 kg", altM: "110,0 cm", altF: "109,4 cm",
    pc: "50-51 cm", imc: "15,2", fc: "70-110", fr: "18-25", pas: "95-110 / 55-75",
    observ: "Início escolar" },
  { faixa: "6 anos", pesoM: "20,5 kg", pesoF: "20,2 kg", altM: "116,0 cm", altF: "115,1 cm",
    pc: "51 cm", imc: "15,3", fc: "70-110", fr: "18-25", pas: "95-115 / 55-75",
    observ: "Erupção 1º molar permanente" },
  { faixa: "8 anos", pesoM: "25,4 kg", pesoF: "25,0 kg", altM: "127,3 cm", altF: "126,6 cm",
    pc: "52 cm", imc: "15,7", fc: "70-110", fr: "16-22", pas: "100-115 / 60-80",
    observ: "Pico de crescimento próximo" },
  { faixa: "10 anos", pesoM: "31,2 kg", pesoF: "31,9 kg", altM: "138,6 cm", altF: "138,6 cm",
    pc: "53 cm", imc: "16,2", fc: "60-100", fr: "16-20", pas: "100-120 / 60-80",
    observ: "Início puberal feminino (telarca)" },
  { faixa: "12 anos", pesoM: "39,9 kg", pesoF: "41,5 kg", altM: "149,1 cm", altF: "151,2 cm",
    pc: "54 cm", imc: "17,8", fc: "60-100", fr: "14-20", pas: "105-125 / 65-85",
    observ: "Estirão feminino; menarca em ~12-13a" },
  { faixa: "14 anos", pesoM: "50,8 kg", pesoF: "49,4 kg", altM: "163,0 cm", altF: "159,0 cm",
    pc: "55 cm", imc: "19,3", fc: "60-100", fr: "12-20", pas: "110-130 / 65-85",
    observ: "Estirão masculino; Tanner III-IV" },
  { faixa: "16 anos", pesoM: "60,9 kg", pesoF: "53,7 kg", altM: "172,0 cm", altF: "162,1 cm",
    pc: "55-56 cm", imc: "20,6", fc: "60-100", fr: "12-18", pas: "110-130 / 65-85",
    observ: "Menarca já ocorrida; Tanner IV-V" },
  { faixa: "18 anos", pesoM: "67,3 kg", pesoF: "55,6 kg", altM: "176,5 cm", altF: "163,1 cm",
    pc: "56 cm", imc: "21,6", fc: "60-100", fr: "12-18", pas: "110-130 / 65-85",
    observ: "Estatura final próxima" },
  { faixa: "19 anos", pesoM: "68,9 kg", pesoF: "56,3 kg", altM: "176,9 cm", altF: "163,2 cm",
    pc: "56 cm", imc: "22,0", fc: "60-100", fr: "12-18", pas: "110-130 / 65-85",
    observ: "Transição para adulto" },
];

const Pediatria = () => {
  // Z-score state
  const [sex, setSex] = useState<"M" | "F">("M");
  const [ageMonths, setAgeMonths] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");

  const zResult = useMemo(() => {
    const a = parseFloat(ageMonths);
    const w = parseFloat(weightKg);
    if (!a || !w || a > 60) return null;
    const table = sex === "M" ? WHO_WFA_BOYS : WHO_WFA_GIRLS;
    const lms = nearestLMS(table, a);
    const z = zscore(w, lms);
    return { z: Math.round(z * 100) / 100, p: zToPercentile(z), cls: classifyZ(z, "weight") };
  }, [sex, ageMonths, weightKg]);

  const bmiResult = useMemo(() => {
    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm) / 100;
    if (!w || !h) return null;
    const bmi = w / (h * h);
    return Math.round(bmi * 10) / 10;
  }, [weightKg, heightCm]);

  // Anamnese
  const [ageGroup, setAgeGroup] = useState("lactente");
  const [anamneseText, setAnamneseText] = useState(ANAMNESE_TEMPLATES.lactente);

  // Calculadoras
  const [calcWeight, setCalcWeight] = useState("");
  const [calcHeight, setCalcHeight] = useState("");
  const [doseMgKg, setDoseMgKg] = useState("");
  const [apgar, setApgar] = useState({ fc: 0, resp: 0, tonus: 0, irrit: 0, cor: 0 });

  const hidratacao = calcWeight ? holidaySegar(parseFloat(calcWeight)) : null;
  const sc = calcWeight && calcHeight ? bsa(parseFloat(calcWeight), parseFloat(calcHeight)) : null;
  const doseTotal = calcWeight && doseMgKg ? Math.round(parseFloat(calcWeight) * parseFloat(doseMgKg) * 100) / 100 : null;
  const apgarTotal = apgar.fc + apgar.resp + apgar.tonus + apgar.irrit + apgar.cor;

  const printAnamnese = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>Anamnese Pediátrica</title>
      <style>body{font-family:Arial;padding:30px;white-space:pre-wrap;line-height:1.6}h1{color:#0f766e}</style>
      </head><body><h1>Anamnese Pediátrica - ${AGE_GROUPS.find(g => g.id === ageGroup)?.label}</h1>
      <pre style="white-space:pre-wrap;font-family:Arial">${anamneseText}</pre></body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <div className="container max-w-6xl mx-auto p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Baby className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Pediatria</h1>
          <p className="text-sm text-muted-foreground">
            Curvas OMS, anamnese por faixa etária, calendário SBP/PNI e calculadoras pediátricas
          </p>
        </div>
      </div>

      <Tabs defaultValue="referencias">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
          <TabsTrigger value="referencias"><Ruler className="h-4 w-4 mr-1" />Referências</TabsTrigger>
          <TabsTrigger value="curvas"><Activity className="h-4 w-4 mr-1" />Curvas OMS</TabsTrigger>
          <TabsTrigger value="anamnese"><Baby className="h-4 w-4 mr-1" />Anamnese</TabsTrigger>
          <TabsTrigger value="vacinas"><Syringe className="h-4 w-4 mr-1" />Vacinas/Marcos</TabsTrigger>
          <TabsTrigger value="calc"><Calculator className="h-4 w-4 mr-1" />Calculadoras</TabsTrigger>
        </TabsList>

        {/* REFERÊNCIAS */}
        <TabsContent value="referencias">
          <Card>
            <CardHeader>
              <CardTitle>Medidas de referência por fase (P50 - OMS / SBP)</CardTitle>
              <p className="text-xs text-muted-foreground">
                Peso, estatura, perímetro cefálico, IMC e sinais vitais (FC, FR, PA) esperados em cada faixa etária.
                Valores aproximados (mediana) para orientação clínica — sempre correlacionar com curvas individuais.
              </p>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="border p-2 text-left">Fase</th>
                    <th className="border p-2">Peso ♂</th>
                    <th className="border p-2">Peso ♀</th>
                    <th className="border p-2">Altura ♂</th>
                    <th className="border p-2">Altura ♀</th>
                    <th className="border p-2">PC</th>
                    <th className="border p-2">IMC</th>
                    <th className="border p-2">FC (bpm)</th>
                    <th className="border p-2">FR (irpm)</th>
                    <th className="border p-2">PA (mmHg)</th>
                    <th className="border p-2 text-left">Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {REF_MEDIDAS.map((r) => (
                    <tr key={r.faixa} className="hover:bg-accent/40">
                      <td className="border p-2 font-medium">{r.faixa}</td>
                      <td className="border p-2 text-center">{r.pesoM}</td>
                      <td className="border p-2 text-center">{r.pesoF}</td>
                      <td className="border p-2 text-center">{r.altM}</td>
                      <td className="border p-2 text-center">{r.altF}</td>
                      <td className="border p-2 text-center">{r.pc}</td>
                      <td className="border p-2 text-center">{r.imc}</td>
                      <td className="border p-2 text-center">{r.fc}</td>
                      <td className="border p-2 text-center">{r.fr}</td>
                      <td className="border p-2 text-center">{r.pas}</td>
                      <td className="border p-2 text-muted-foreground">{r.observ}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-xs text-muted-foreground mt-3 border-l-4 border-primary pl-3">
                <strong>Regras práticas de peso:</strong> RN ~3,3 kg • Dobra aos 4-6m • Triplica aos 12m • Quadruplica aos 24m •
                Após 2a: peso (kg) = idade × 2 + 8. <br />
                <strong>Estatura:</strong> +25 cm no 1º ano • +12 cm no 2º • +8 cm no 3º • depois ~5-6 cm/ano até puberdade. <br />
                <strong>PA:</strong> PAS mínima esperada = 70 + (idade × 2) mmHg em &gt;1 ano.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CURVAS */}
        <TabsContent value="curvas">
          <Card>
            <CardHeader><CardTitle>Antropometria - Z-score OMS</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label>Sexo</Label>
                  <Select value={sex} onValueChange={(v) => setSex(v as "M" | "F")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="F">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Idade (meses)</Label>
                  <Input type="number" value={ageMonths} onChange={(e) => setAgeMonths(e.target.value)} placeholder="0-60" />
                </div>
                <div>
                  <Label>Peso (kg)</Label>
                  <Input type="number" step="0.1" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
                </div>
                <div>
                  <Label>Estatura (cm)</Label>
                  <Input type="number" step="0.1" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
                </div>
              </div>

              {zResult && (
                <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge>Peso/Idade</Badge>
                    <span className="text-sm">Z = <strong>{zResult.z}</strong> | Percentil <strong>{zResult.p}</strong></span>
                    <Badge variant={zResult.cls.color as any}>{zResult.cls.label}</Badge>
                  </div>
                  {bmiResult && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">IMC</Badge>
                      <span className="text-sm"><strong>{bmiResult}</strong> kg/m²</span>
                    </div>
                  )}
                </div>
              )}

              <div className="text-xs text-muted-foreground border-l-4 border-primary pl-3">
                Baseado nos padrões OMS de crescimento infantil (LMS) e diretrizes da SBP/Ministério da Saúde para 0-5 anos.
                Para crianças &gt;5 anos, complementar com curvas CDC/OMS específicas.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANAMNESE */}
        <TabsContent value="anamnese">
          <Card>
            <CardHeader><CardTitle>Anamnese por Faixa Etária</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {AGE_GROUPS.map((g) => (
                  <Button
                    key={g.id}
                    variant={ageGroup === g.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => { setAgeGroup(g.id); setAnamneseText(ANAMNESE_TEMPLATES[g.id]); }}
                  >
                    {g.label}
                  </Button>
                ))}
              </div>
              <Textarea
                value={anamneseText}
                onChange={(e) => setAnamneseText(e.target.value)}
                rows={18}
                className="font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button onClick={printAnamnese}><Printer className="h-4 w-4 mr-1" />Imprimir</Button>
                <Button variant="outline" onClick={() => { navigator.clipboard.writeText(anamneseText); toast.success("Copiado"); }}>
                  Copiar texto
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* VACINAS / MARCOS */}
        <TabsContent value="vacinas">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Calendário Vacinal (PNI / SBP)</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {VACINAS.map((v) => (
                  <div key={v.age} className="border-l-4 border-primary pl-3">
                    <div className="font-semibold text-sm">{v.age}</div>
                    <div className="space-y-1 mt-1">
                      {v.items.map((it) => (
                        <label key={it} className="flex items-center gap-2 text-sm">
                          <Checkbox /> {it}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Marcos do Desenvolvimento</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {MARCOS.map((m) => (
                  <div key={m.age} className="border-l-4 border-secondary pl-3">
                    <div className="font-semibold text-sm">{m.age}</div>
                    <ul className="text-sm list-disc ml-4">
                      {m.items.map((it) => <li key={it}>{it}</li>)}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* CALCULADORAS */}
        <TabsContent value="calc">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Dados da criança</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Peso (kg)</Label>
                  <Input type="number" step="0.1" value={calcWeight} onChange={(e) => setCalcWeight(e.target.value)} />
                </div>
                <div>
                  <Label>Estatura (cm)</Label>
                  <Input type="number" step="0.1" value={calcHeight} onChange={(e) => setCalcHeight(e.target.value)} />
                </div>
                <div>
                  <Label>Dose desejada (mg/kg)</Label>
                  <Input type="number" step="0.1" value={doseMgKg} onChange={(e) => setDoseMgKg(e.target.value)} />
                </div>
                <div className="space-y-2 pt-2 border-t">
                  {hidratacao && (
                    <div className="text-sm">
                      <strong>Hidratação (Holliday-Segar):</strong> {hidratacao.ml24} mL/24h ({hidratacao.mlh} mL/h)
                      <div className="text-xs text-muted-foreground">{hidratacao.detail}</div>
                    </div>
                  )}
                  {sc && <div className="text-sm"><strong>Superfície Corporal (Mosteller):</strong> {sc} m²</div>}
                  {doseTotal !== null && <div className="text-sm"><strong>Dose total:</strong> {doseTotal} mg</div>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Apgar</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {[
                  { k: "fc", label: "FC (0=ausente, 1=<100, 2=≥100)" },
                  { k: "resp", label: "Respiração (0=ausente, 1=irregular, 2=choro forte)" },
                  { k: "tonus", label: "Tônus (0=flácido, 1=alguma flexão, 2=ativo)" },
                  { k: "irrit", label: "Irritabilidade (0=ausente, 1=careta, 2=tosse/espirro)" },
                  { k: "cor", label: "Cor (0=cianose/pálido, 1=acrocianose, 2=rosado)" },
                ].map(({ k, label }) => (
                  <div key={k}>
                    <Label className="text-xs">{label}</Label>
                    <Select value={String((apgar as any)[k])} onValueChange={(v) => setApgar({ ...apgar, [k]: parseInt(v) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0</SelectItem>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2">
                  <span className="font-bold">Total: {apgarTotal}/10</span>
                  <Badge variant={apgarTotal >= 7 ? "default" : apgarTotal >= 4 ? "secondary" : "destructive"} className="ml-2">
                    {apgarTotal >= 7 ? "Boas condições" : apgarTotal >= 4 ? "Depressão moderada" : "Depressão grave"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Pediatria;
