import { useState } from "react";
import { useClinicData } from "@/hooks/useClinicData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import OdontogramChart from "@/components/OdontogramChart";
import { Smile, ListChecks } from "lucide-react";
import { toast } from "sonner";

interface ToothRecord {
  toothNumber: number;
  condition: string;
  notes: string;
}

const conditions = [
  { value: "healthy", label: "Saudável", color: "bg-success" },
  { value: "cavity", label: "Cárie", color: "bg-destructive" },
  { value: "filling", label: "Restauração", color: "bg-primary" },
  { value: "crown", label: "Coroa", color: "bg-warning" },
  { value: "missing", label: "Ausente", color: "bg-muted-foreground" },
  { value: "implant", label: "Implante", color: "bg-accent-foreground" },
  { value: "root_canal", label: "Canal", color: "bg-destructive/70" },
];

const OdontogramPage = () => {
  const { data: patients } = useClinicData("patients");
  const { data: odontograms, insert, update } = useClinicData("odontograms");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [selectedCondition, setSelectedCondition] = useState("healthy");
  const [toothNote, setToothNote] = useState("");

  // Procedures for the selected patient (only odonto-related — those with tooth_number)
  const { data: evolutions } = useClinicData("evolutions", { filter: { patient_id: selectedPatientId || "__none__" } });

  const currentOdontogram = odontograms.find((o) => String(o.patient_id) === selectedPatientId);
  const records = (currentOdontogram?.records || {}) as Record<string, ToothRecord>;

  const dentalProcedures = (evolutions || [])
    .filter((e) => !e.deleted_at && (String(e.tooth_number || "").trim() || String(e.procedure || "").trim()))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const handleToothClick = (toothNumber: number) => {
    setSelectedTooth(toothNumber);
    const record = records[String(toothNumber)];
    if (record) {
      setSelectedCondition(record.condition);
      setToothNote(record.notes);
    } else {
      setSelectedCondition("healthy");
      setToothNote("");
    }
  };

  const handleSave = async () => {
    if (!selectedPatientId) { toast.error("Selecione um paciente"); return; }
    if (selectedTooth === null) { toast.error("Selecione um dente"); return; }

    const updatedRecords = {
      ...records,
      [String(selectedTooth)]: { toothNumber: selectedTooth, condition: selectedCondition, notes: toothNote },
    };

    if (currentOdontogram) {
      await update(String(currentOdontogram.id), { records: updatedRecords });
    } else {
      await insert({ patient_id: selectedPatientId, records: updatedRecords });
    }
    toast.success(`Dente ${selectedTooth} atualizado`);
  };

  const getToothConditions = (): Record<number, string> => {
    const result: Record<number, string> = {};
    Object.entries(records).forEach(([num, rec]) => {
      if (rec && typeof rec === "object") result[parseInt(num)] = (rec as ToothRecord).condition;
    });
    return result;
  };

  const markedTeeth = Object.values(records).filter(r => r && typeof r === "object") as ToothRecord[];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Smile className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Odontologia</h1>
          <p className="text-sm text-muted-foreground">Odontograma interativo e histórico de procedimentos odontológicos</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label>Paciente</Label>
          <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
            <SelectTrigger><SelectValue placeholder="Selecione um paciente" /></SelectTrigger>
            <SelectContent>
              {patients.map((p) => (
                <SelectItem key={String(p.id)} value={String(p.id)}>{String(p.name)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedPatientId && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Smile className="h-4 w-4" /> Odontograma
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <OdontogramChart
                onToothClick={handleToothClick}
                selectedTooth={selectedTooth}
                toothConditions={getToothConditions()}
              />
            </CardContent>
          </Card>

          {selectedTooth !== null && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold">Dente {selectedTooth}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Condição</Label>
                    <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {conditions.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${c.color}`} />
                              {c.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Anotação</Label>
                    <Input value={toothNote} onChange={(e) => setToothNote(e.target.value)} placeholder="Observações..." />
                  </div>
                </div>
                <Button onClick={handleSave}>Salvar Dente {selectedTooth}</Button>
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  {conditions.map((c) => (
                    <div key={c.value} className="flex items-center gap-1 text-xs">
                      <div className={`w-2.5 h-2.5 rounded-full ${c.color}`} />
                      <span className="text-muted-foreground">{c.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resumo de marcações no odontograma */}
          {markedTeeth.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resumo das marcações ({markedTeeth.length} {markedTeeth.length === 1 ? "dente" : "dentes"})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {markedTeeth.map((r) => {
                    const cfg = conditions.find(c => c.value === r.condition);
                    return (
                      <Badge key={r.toothNumber} variant="outline" className="gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${cfg?.color || "bg-muted"}`} />
                        Dente {r.toothNumber} — {cfg?.label || r.condition}
                        {r.notes && <span className="text-muted-foreground">• {r.notes}</span>}
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Procedimentos odontológicos realizados */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ListChecks className="h-4 w-4" /> Procedimentos Odontológicos Realizados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dentalProcedures.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum procedimento registrado para este paciente.</p>
              ) : (
                <div className="space-y-2">
                  {dentalProcedures.map((evo) => (
                    <div key={String(evo.id)} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 py-2 px-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
                      <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {String(evo.date).split("-").reverse().join("/")}
                      </span>
                      {evo.tooth_number && (
                        <Badge variant="secondary" className="w-fit">Dente {String(evo.tooth_number)}</Badge>
                      )}
                      <span className="text-sm flex-1">
                        {String(evo.procedure || evo.plan || evo.assessment || "—")}
                      </span>
                      {evo.professional && (
                        <span className="text-xs text-muted-foreground">{String(evo.professional)}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!selectedPatientId && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Smile className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>Selecione um paciente acima para ver o odontograma e procedimentos odontológicos.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OdontogramPage;
