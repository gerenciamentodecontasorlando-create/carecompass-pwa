import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { Printer } from "lucide-react";
import { useClinicData } from "@/hooks/useClinicData";

export interface DentalProcedure {
  id: string;
  date: string;
  tooth: string;
  procedure: string;
  value: string;
  notes: string;
}

export interface DentalChart {
  negatives: string[];      // doenças/condições que NÃO tem
  customNegative: string;   // texto livre extra de negativas
  complaint: string;        // queixa principal
  observations: string;     // observações gerais
  procedures: DentalProcedure[];
}

const DEFAULT_NEGATIVES = [
  "Diabetes",
  "Hipertensão",
  "Cardiopatia",
  "Alergias",
  "Anticoagulantes",
  "Gravidez",
  "Bruxismo",
  "Tabagismo",
  "Hepatite",
  "HIV",
];

export const emptyDentalChart = (): DentalChart => ({
  negatives: [],
  customNegative: "",
  complaint: "",
  observations: "",
  procedures: [],
});

interface DentalChartFormProps {
  value: DentalChart;
  onSave: (chart: DentalChart) => Promise<void> | void;
  patientName: string;
}

export function DentalChartForm({ value, onSave, patientName }: DentalChartFormProps) {
  const [chart, setChart] = useState<DentalChart>(value);
  const [saving, setSaving] = useState(false);
  const { data: clinicSettings } = useClinicData("clinic_settings");
  const settings = clinicSettings[0] || {};

  useEffect(() => { setChart(value); }, [value]);

  const toggleNegative = (item: string) => {
    setChart((c) => ({
      ...c,
      negatives: c.negatives.includes(item)
        ? c.negatives.filter((n) => n !== item)
        : [...c.negatives, item],
    }));
  };

  const addProcedure = () => {
    const today = new Date().toISOString().slice(0, 10);
    setChart((c) => ({
      ...c,
      procedures: [
        { id: crypto.randomUUID(), date: today, tooth: "", procedure: "", value: "", notes: "" },
        ...c.procedures,
      ],
    }));
  };

  const updateProcedure = (id: string, patch: Partial<DentalProcedure>) => {
    setChart((c) => ({
      ...c,
      procedures: c.procedures.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  };

  const removeProcedure = (id: string) => {
    setChart((c) => ({ ...c, procedures: c.procedures.filter((p) => p.id !== id) }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(chart);
      toast.success("Prontuário odontológico salvo");
    } catch {
      toast.error("Erro ao salvar prontuário");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4" /> Anamnese rápida — o paciente NÃO possui:
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {DEFAULT_NEGATIVES.map((item) => {
              const checked = chart.negatives.includes(item);
              return (
                <label
                  key={item}
                  className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 cursor-pointer text-sm transition-colors ${
                    checked ? "border-primary/50 bg-primary/5" : "border-border hover:bg-accent/40"
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleNegative(item)}
                  />
                  <span>{item}</span>
                </label>
              );
            })}
          </div>
          <div>
            <Label className="text-xs">Outras negativas (texto livre)</Label>
            <Input
              value={chart.customNegative}
              onChange={(e) => setChart({ ...chart, customNegative: e.target.value })}
              placeholder="Ex: nenhuma cirurgia prévia, sem medicação contínua..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div>
            <Label className="text-xs">Queixa principal</Label>
            <Textarea
              value={chart.complaint}
              onChange={(e) => setChart({ ...chart, complaint: e.target.value })}
              placeholder="O que motivou a consulta..."
              rows={2}
            />
          </div>
          <div>
            <Label className="text-xs">Observações</Label>
            <Textarea
              value={chart.observations}
              onChange={(e) => setChart({ ...chart, observations: e.target.value })}
              placeholder="Higiene, hábitos, considerações clínicas..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Procedimentos executados</CardTitle>
          <Button size="sm" variant="outline" onClick={addProcedure}>
            <Plus className="h-4 w-4 mr-1" /> Novo
          </Button>
        </CardHeader>
        <CardContent>
          {chart.procedures.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum procedimento registrado. Clique em "Novo" para adicionar.
            </p>
          ) : (
            <div className="space-y-2">
              {chart.procedures.map((p) => (
                <div key={p.id} className="grid grid-cols-12 gap-2 items-start border rounded-md p-2 bg-card">
                  <Input
                    type="date"
                    value={p.date}
                    onChange={(e) => updateProcedure(p.id, { date: e.target.value })}
                    className="col-span-6 sm:col-span-2 h-9 text-xs"
                  />
                  <Input
                    placeholder="Dente"
                    value={p.tooth}
                    onChange={(e) => updateProcedure(p.id, { tooth: e.target.value })}
                    className="col-span-3 sm:col-span-1 h-9 text-xs"
                  />
                  <Input
                    placeholder="Procedimento"
                    value={p.procedure}
                    onChange={(e) => updateProcedure(p.id, { procedure: e.target.value })}
                    className="col-span-12 sm:col-span-4 h-9 text-xs"
                  />
                  <Input
                    placeholder="Observação"
                    value={p.notes}
                    onChange={(e) => updateProcedure(p.id, { notes: e.target.value })}
                    className="col-span-9 sm:col-span-3 h-9 text-xs"
                  />
                  <Input
                    placeholder="R$"
                    value={p.value}
                    onChange={(e) => updateProcedure(p.id, { value: e.target.value })}
                    className="col-span-2 sm:col-span-1 h-9 text-xs"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeProcedure(p.id)}
                    className="col-span-1 h-9 w-9 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="text-xs text-muted-foreground pt-1">
                Total: <Badge variant="secondary">{chart.procedures.length}</Badge> procedimentos
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 no-print">
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" /> Imprimir prontuário
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" /> Salvar prontuário odontológico
        </Button>
      </div>
      <section className="print-only print-area text-foreground p-6 space-y-6">
        <header className="border-b-2 border-primary pb-4">
          <h1 className="text-xl font-bold">{String(settings.clinic_name || "Clínica")}</h1>
          {settings.print_header && <p className="whitespace-pre-wrap text-sm">{String(settings.print_header)}</p>}
          <h2 className="text-lg font-semibold mt-4">Prontuário odontológico</h2>
          <p className="text-sm"><strong>Paciente:</strong> {patientName}</p>
          <p className="text-sm"><strong>Data de emissão:</strong> {new Date().toLocaleDateString("pt-BR")}</p>
        </header>
        <div className="space-y-3 text-sm">
          <p><strong>Negativas informadas:</strong> {chart.negatives.length ? chart.negatives.join(", ") : "Nenhuma registrada"}</p>
          {chart.customNegative && <p className="whitespace-pre-wrap"><strong>Outras negativas:</strong> {chart.customNegative}</p>}
          <p className="whitespace-pre-wrap"><strong>Queixa principal:</strong> {chart.complaint || "Não informada"}</p>
          <p className="whitespace-pre-wrap"><strong>Observações:</strong> {chart.observations || "Não informadas"}</p>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Procedimentos registrados</h3>
          {chart.procedures.length ? (
            <table className="w-full border-collapse text-xs">
              <thead><tr className="border-b border-foreground"><th className="text-left p-2">Data</th><th className="text-left p-2">Dente</th><th className="text-left p-2">Procedimento</th><th className="text-left p-2">Observação</th><th className="text-right p-2">Valor</th></tr></thead>
              <tbody>{chart.procedures.map((p) => (
                <tr key={p.id} className="border-b border-border">
                  <td className="p-2">{p.date ? p.date.split("-").reverse().join("/") : "—"}</td>
                  <td className="p-2">{p.tooth || "—"}</td>
                  <td className="p-2 break-words">{p.procedure || "—"}</td>
                  <td className="p-2 break-words whitespace-pre-wrap">{p.notes || "—"}</td>
                  <td className="p-2 text-right">{p.value || "—"}</td>
                </tr>
              ))}</tbody>
            </table>
          ) : <p className="text-sm">Nenhum procedimento registrado.</p>}
        </div>
        <footer className="pt-12 text-center text-sm break-inside-avoid">
          <div className="border-t border-foreground w-56 mx-auto pt-2">{String(settings.professional_name || "Profissional responsável")}</div>
          {settings.registration_number && <p>{String(settings.registration_number)}</p>}
          {settings.print_footer && <p className="whitespace-pre-wrap mt-6">{String(settings.print_footer)}</p>}
        </footer>
      </section>
    </div>
  );
}
