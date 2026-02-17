import { useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import OdontogramChart from "@/components/OdontogramChart";
import { toast } from "sonner";

interface ToothRecord {
  toothNumber: number;
  condition: string;
  notes: string;
}

interface PatientOdontogram {
  patientName: string;
  records: Record<number, ToothRecord>;
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
  const [odontograms, setOdontograms] = useLocalStorage<Record<string, PatientOdontogram>>("odontograms", {});
  const [currentPatient, setCurrentPatient] = useState("");
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [selectedCondition, setSelectedCondition] = useState("healthy");
  const [toothNote, setToothNote] = useState("");

  const currentData = currentPatient ? odontograms[currentPatient] : null;

  const handleToothClick = (toothNumber: number) => {
    setSelectedTooth(toothNumber);
    const record = currentData?.records[toothNumber];
    if (record) {
      setSelectedCondition(record.condition);
      setToothNote(record.notes);
    } else {
      setSelectedCondition("healthy");
      setToothNote("");
    }
  };

  const handleSave = () => {
    if (!currentPatient.trim()) { toast.error("Selecione um paciente"); return; }
    if (selectedTooth === null) { toast.error("Selecione um dente"); return; }
    setOdontograms((prev) => ({
      ...prev,
      [currentPatient]: {
        patientName: currentPatient,
        records: {
          ...(prev[currentPatient]?.records || {}),
          [selectedTooth]: { toothNumber: selectedTooth, condition: selectedCondition, notes: toothNote },
        },
      },
    }));
    toast.success(`Dente ${selectedTooth} atualizado`);
  };

  const getToothConditions = (): Record<number, string> => {
    if (!currentData) return {};
    const result: Record<number, string> = {};
    Object.entries(currentData.records).forEach(([num, rec]) => {
      result[parseInt(num)] = rec.condition;
    });
    return result;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Odontograma</h1>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label>Paciente</Label>
          <Input value={currentPatient} onChange={(e) => setCurrentPatient(e.target.value)} placeholder="Nome do paciente" />
        </div>
      </div>

      <Card>
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
    </div>
  );
};

export default OdontogramPage;
