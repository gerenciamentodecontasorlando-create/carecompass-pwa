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
}

export function DentalChartForm({ value, onSave }: DentalChartFormProps) {
  const [chart, setChart] = useState<DentalChart>(value);
  const [saving, setSaving] = useState(false);

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

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" /> Salvar prontuário odontológico
        </Button>
      </div>
    </div>
  );
}
