import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";

/* ============================================================
   Referência OMS (LMS) — pontos-chave de 0 a 60 meses
   Indicadores: Peso/Idade, Estatura/Idade, Perímetro Cefálico/Idade
   ============================================================ */
type LMS = { L: number; M: number; S: number };
const AGES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 18, 21, 24, 30, 36, 42, 48, 54, 60];

function buildTable(L: number[], M: number[], S: number[]): Record<number, LMS> {
  const t: Record<number, LMS> = {};
  AGES.forEach((a, i) => (t[a] = { L: L[i], M: M[i], S: S[i] }));
  return t;
}

const WEIGHT_BOYS = buildTable(
  [0.349, 0.230, 0.197, 0.174, 0.157, 0.144, 0.134, 0.125, 0.117, 0.110, 0.104, 0.098, 0.040, 0.020, 0.000, -0.050, -0.151, -0.210, -0.262, -0.300, -0.340, -0.370, -0.398],
  [3.35, 4.47, 5.57, 6.38, 7.00, 7.51, 7.93, 8.30, 8.62, 8.90, 9.17, 9.41, 9.65, 10.31, 10.94, 11.53, 12.15, 13.30, 14.30, 15.30, 16.30, 17.30, 18.30],
  [0.146, 0.134, 0.124, 0.117, 0.112, 0.109, 0.108, 0.107, 0.107, 0.106, 0.106, 0.107, 0.107, 0.108, 0.109, 0.110, 0.108, 0.107, 0.108, 0.108, 0.108, 0.109, 0.109],
);
const WEIGHT_GIRLS = buildTable(
  [0.381, 0.171, 0.096, 0.040, -0.006, -0.045, -0.076, -0.102, -0.124, -0.144, -0.161, -0.176, -0.173, -0.200, -0.220, -0.240, -0.255, -0.280, -0.300, -0.320, -0.330, -0.350, -0.360],
  [3.23, 4.19, 5.13, 5.85, 6.42, 6.90, 7.30, 7.64, 7.95, 8.23, 8.49, 8.73, 8.95, 9.60, 10.20, 10.90, 11.48, 12.70, 13.90, 14.90, 15.90, 16.90, 17.90],
  [0.142, 0.137, 0.130, 0.126, 0.124, 0.122, 0.118, 0.117, 0.116, 0.116, 0.116, 0.116, 0.113, 0.114, 0.114, 0.114, 0.115, 0.115, 0.115, 0.116, 0.116, 0.117, 0.117],
);
const HEIGHT_S = [0.0379, 0.0355, 0.0342, 0.0334, 0.0328, 0.0324, 0.0321, 0.0319, 0.0318, 0.0317, 0.0316, 0.0316, 0.0316, 0.0330, 0.0340, 0.0350, 0.0360, 0.0370, 0.0380, 0.0390, 0.0400, 0.0405, 0.0410];
const ONES = AGES.map(() => 1);
const HEIGHT_BOYS = buildTable(ONES,
  [49.9, 54.7, 58.4, 61.4, 63.9, 65.9, 67.6, 69.2, 70.6, 72.0, 73.3, 74.5, 75.7, 79.1, 82.3, 85.1, 87.8, 91.9, 96.1, 99.9, 103.3, 106.7, 110.0], HEIGHT_S);
const HEIGHT_GIRLS = buildTable(ONES,
  [49.1, 53.7, 57.1, 59.8, 62.1, 64.0, 65.7, 67.3, 68.7, 70.1, 71.5, 72.8, 74.0, 77.5, 80.7, 83.7, 86.4, 91.2, 95.1, 99.0, 102.7, 106.2, 109.4], HEIGHT_S);
const HC_S = [0.0322, 0.0316, 0.0311, 0.0307, 0.0304, 0.0302, 0.0300, 0.0299, 0.0298, 0.0297, 0.0296, 0.0296, 0.0295, 0.0294, 0.0293, 0.0293, 0.0292, 0.0292, 0.0291, 0.0291, 0.0291, 0.0290, 0.0290];
const HC_BOYS = buildTable(ONES,
  [34.5, 37.3, 39.1, 40.5, 41.6, 42.6, 43.3, 44.0, 44.5, 45.0, 45.4, 45.8, 46.1, 46.9, 47.4, 47.9, 48.3, 48.9, 49.5, 49.9, 50.2, 50.5, 50.7], HC_S);
const HC_GIRLS = buildTable(ONES,
  [33.9, 36.5, 38.3, 39.5, 40.6, 41.5, 42.2, 42.8, 43.4, 43.8, 44.2, 44.6, 44.9, 45.7, 46.2, 46.7, 47.2, 47.8, 48.3, 48.7, 49.1, 49.3, 49.6], HC_S);

const Z_LINES = [
  { z: -3, key: "p01", label: "-3 DP", color: "hsl(0 72% 45%)", dash: "4 3" },
  { z: -2, key: "p3", label: "-2 DP (P3)", color: "hsl(30 90% 45%)", dash: "6 3" },
  { z: 0, key: "p50", label: "P50 (mediana)", color: "hsl(150 60% 35%)", dash: "" },
  { z: 2, key: "p97", label: "+2 DP (P97)", color: "hsl(30 90% 45%)", dash: "6 3" },
  { z: 3, key: "p999", label: "+3 DP", color: "hsl(0 72% 45%)", dash: "4 3" },
];

function valueFromZ(lms: LMS, z: number): number {
  const { L, M, S } = lms;
  const v = L === 0 ? M * Math.exp(S * z) : M * Math.pow(1 + L * S * z, 1 / L);
  return Math.round(v * 100) / 100;
}
function interpLMS(table: Record<number, LMS>, age: number): LMS {
  const keys = AGES;
  if (age <= keys[0]) return table[keys[0]];
  if (age >= keys[keys.length - 1]) return table[keys[keys.length - 1]];
  let lo = keys[0], hi = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (age >= keys[i] && age <= keys[i + 1]) { lo = keys[i]; hi = keys[i + 1]; break; }
  }
  const f = (age - lo) / (hi - lo);
  const a = table[lo], b = table[hi];
  return { L: a.L + (b.L - a.L) * f, M: a.M + (b.M - a.M) * f, S: a.S + (b.S - a.S) * f };
}
function zscore(value: number, lms: LMS): number {
  const { L, M, S } = lms;
  const z = L === 0 ? Math.log(value / M) / S : (Math.pow(value / M, L) - 1) / (L * S);
  return Math.round(z * 100) / 100;
}

type Measure = { id: string; age: number; weight?: number; height?: number; hc?: number };

const INDICATORS = [
  { id: "weight", label: "Peso para a idade", unit: "kg", boys: WEIGHT_BOYS, girls: WEIGHT_GIRLS, field: "weight" as const },
  { id: "height", label: "Estatura para a idade", unit: "cm", boys: HEIGHT_BOYS, girls: HEIGHT_GIRLS, field: "height" as const },
  { id: "hc", label: "Perímetro cefálico (encefálico)", unit: "cm", boys: HC_BOYS, girls: HC_GIRLS, field: "hc" as const },
];

function classify(z: number, ind: string) {
  if (ind === "hc") {
    if (z < -2) return { label: "Microcefalia (investigar)", variant: "destructive" as const };
    if (z > 2) return { label: "Macrocefalia (investigar)", variant: "destructive" as const };
    return { label: "Adequado", variant: "default" as const };
  }
  if (ind === "height") {
    if (z < -3) return { label: "Muito baixa estatura", variant: "destructive" as const };
    if (z < -2) return { label: "Baixa estatura", variant: "secondary" as const };
    return { label: "Estatura adequada", variant: "default" as const };
  }
  if (z < -3) return { label: "Peso muito baixo", variant: "destructive" as const };
  if (z < -2) return { label: "Peso baixo", variant: "secondary" as const };
  if (z > 3) return { label: "Peso elevado", variant: "destructive" as const };
  if (z > 2) return { label: "Peso acima do esperado", variant: "secondary" as const };
  return { label: "Peso adequado", variant: "default" as const };
}

export function GrowthCharts() {
  const [sex, setSex] = useState<"M" | "F">("M");
  const [patientName, setPatientName] = useState("");
  const [measures, setMeasures] = useState<Measure[]>([]);
  const [form, setForm] = useState({ age: "", weight: "", height: "", hc: "" });

  const addMeasure = () => {
    const age = parseFloat(form.age);
    if (isNaN(age) || age < 0 || age > 60) { toast.error("Informe a idade em meses (0 a 60)"); return; }
    const m: Measure = {
      id: crypto.randomUUID(),
      age,
      weight: form.weight ? parseFloat(form.weight) : undefined,
      height: form.height ? parseFloat(form.height) : undefined,
      hc: form.hc ? parseFloat(form.hc) : undefined,
    };
    if (m.weight === undefined && m.height === undefined && m.hc === undefined) {
      toast.error("Informe ao menos uma medida"); return;
    }
    setMeasures((p) => [...p, m].sort((a, b) => a.age - b.age));
    setForm({ age: "", weight: "", height: "", hc: "" });
  };

  const chartData = useMemo(() => {
    return INDICATORS.map((ind) => {
      const table = sex === "M" ? ind.boys : ind.girls;
      const rows: Record<string, number | null>[] = [];
      for (let age = 0; age <= 60; age++) {
        const lms = interpLMS(table, age);
        const row: Record<string, number | null> = { age };
        Z_LINES.forEach((z) => (row[z.key] = valueFromZ(lms, z.z)));
        const m = measures.find((x) => Math.round(x.age) === age && x[ind.field] !== undefined);
        row.paciente = m ? (m[ind.field] as number) : null;
        rows.push(row);
      }
      return { ind, rows };
    });
  }, [sex, measures]);

  const evaluations = useMemo(() => {
    return measures.map((m) => ({
      m,
      items: INDICATORS.filter((i) => m[i.field] !== undefined).map((i) => {
        const table = sex === "M" ? i.boys : i.girls;
        const z = zscore(m[i.field] as number, interpLMS(table, m.age));
        return { ind: i, z, cls: classify(z, i.id) };
      }),
    }));
  }, [measures, sex]);

  const print = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <Card className="no-print">
        <CardHeader><CardTitle>Registrar medidas (caderneta de saúde)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <Label>Nome da criança</Label>
              <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Opcional (impressão)" />
            </div>
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
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
            <div>
              <Label>Idade (meses)</Label>
              <Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="0-60" />
            </div>
            <div>
              <Label>Peso (kg)</Label>
              <Input type="number" step="0.01" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
            </div>
            <div>
              <Label>Estatura (cm)</Label>
              <Input type="number" step="0.1" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} />
            </div>
            <div>
              <Label>P. cefálico (cm)</Label>
              <Input type="number" step="0.1" value={form.hc} onChange={(e) => setForm({ ...form, hc: e.target.value })} />
            </div>
            <Button onClick={addMeasure}><Plus className="h-4 w-4 mr-1" />Adicionar ponto</Button>
          </div>

          {measures.length > 0 && (
            <div className="space-y-2 border-t pt-3">
              {evaluations.map(({ m, items }) => (
                <div key={m.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant="outline">{m.age} meses</Badge>
                  {items.map((it) => (
                    <span key={it.ind.id} className="flex items-center gap-1">
                      <span className="text-muted-foreground">{it.ind.label}:</span>
                      <strong>{m[it.ind.field]} {it.ind.unit}</strong>
                      <span className="text-xs text-muted-foreground">(Z {it.z})</span>
                      <Badge variant={it.cls.variant}>{it.cls.label}</Badge>
                    </span>
                  ))}
                  <Button variant="ghost" size="icon" onClick={() => setMeasures((p) => p.filter((x) => x.id !== m.id))}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={print}>
                <Printer className="h-4 w-4 mr-1" />Imprimir curvas
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="print-area space-y-4">
        {patientName && (
          <div className="hidden print:block text-sm">
            <strong>Criança:</strong> {patientName} — <strong>Sexo:</strong> {sex === "M" ? "Masculino" : "Feminino"}
          </div>
        )}
        {chartData.map(({ ind, rows }) => (
          <Card key={ind.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{ind.label} — 0 a 5 anos ({sex === "M" ? "meninos" : "meninas"})</CardTitle>
              <p className="text-xs text-muted-foreground">
                Curvas de referência OMS em escore-z, no mesmo padrão da Caderneta da Criança (Ministério da Saúde).
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 2" />
                    <XAxis dataKey="age" tick={{ fontSize: 11 }} label={{ value: "Idade (meses)", position: "insideBottom", offset: -4, fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} width={44} label={{ value: ind.unit, angle: -90, position: "insideLeft", fontSize: 11 }} domain={["auto", "auto"]} />
                    <Tooltip formatter={(v: number) => `${v} ${ind.unit}`} labelFormatter={(l) => `${l} meses`} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {Z_LINES.map((z) => (
                      <Line key={z.key} type="monotone" dataKey={z.key} name={z.label} stroke={z.color}
                        strokeDasharray={z.dash || undefined} dot={false} strokeWidth={z.z === 0 ? 2 : 1.2} />
                    ))}
                    <Line type="monotone" dataKey="paciente" name="Criança" stroke="hsl(var(--primary))"
                      strokeWidth={2.5} connectNulls dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default GrowthCharts;
