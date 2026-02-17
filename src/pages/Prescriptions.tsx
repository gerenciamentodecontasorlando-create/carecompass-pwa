import { useState, useRef } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Printer, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface ClinicSettings {
  professionalName: string;
  specialty: string;
  registrationNumber: string;
  clinicName: string;
  address: string;
  phone: string;
  email: string;
}

interface Prescription {
  id: string;
  patientName: string;
  date: string;
  medications: string;
}

const Prescriptions = () => {
  const [settings] = useLocalStorage<ClinicSettings>("clinicSettings", {
    professionalName: "", specialty: "", registrationNumber: "", clinicName: "", address: "", phone: "", email: "",
  });
  const [prescriptions, setPrescriptions] = useLocalStorage<Prescription[]>("prescriptions", []);
  const [form, setForm] = useState({ patientName: "", medications: "" });
  const [previewId, setPreviewId] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handleSave = () => {
    if (!form.patientName.trim() || !form.medications.trim()) {
      toast.error("Preencha paciente e medicamentos");
      return;
    }
    const p: Prescription = {
      id: crypto.randomUUID(),
      patientName: form.patientName,
      date: format(new Date(), "yyyy-MM-dd"),
      medications: form.medications,
    };
    setPrescriptions((prev) => [...prev, p]);
    setForm({ patientName: "", medications: "" });
    setPreviewId(p.id);
    toast.success("Receituário salvo");
  };

  const handlePrint = () => {
    window.print();
  };

  const previewPrescription = previewId ? prescriptions.find((p) => p.id === previewId) : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Receituário</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid gap-2">
                <Label>Paciente *</Label>
                <Input value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} placeholder="Nome do paciente" />
              </div>
              <div className="grid gap-2">
                <Label>Prescrição *</Label>
                <Textarea
                  value={form.medications}
                  onChange={(e) => setForm({ ...form, medications: e.target.value })}
                  placeholder={"1) Amoxicilina 500mg\n   Tomar 1 comprimido de 8 em 8 horas por 7 dias\n\n2) Ibuprofeno 600mg\n   Tomar 1 comprimido de 12 em 12 horas se dor"}
                  rows={8}
                />
              </div>
              <Button onClick={handleSave} className="w-full">
                <Plus className="h-4 w-4 mr-2" />Gerar Receituário
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Receituários anteriores</h3>
              {prescriptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum receituário emitido.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {[...prescriptions].reverse().map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => setPreviewId(p.id)}
                    >
                      <div>
                        <p className="text-sm font-medium">{p.patientName}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(p.date), "dd/MM/yyyy")}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={(e) => {
                        e.stopPropagation();
                        setPrescriptions((prev) => prev.filter((x) => x.id !== p.id));
                        if (previewId === p.id) setPreviewId(null);
                      }}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview / Print area */}
        <div>
          <div className="flex justify-end mb-2 no-print">
            <Button variant="outline" size="sm" onClick={handlePrint} disabled={!previewPrescription}>
              <Printer className="h-4 w-4 mr-2" />Imprimir
            </Button>
          </div>
          <div ref={printRef} className="print-area">
            <div className="bg-card border-2 border-border rounded-xl p-8 min-h-[700px] flex flex-col justify-between shadow-sm">
              {/* Header */}
              <div>
                <div className="text-center border-b-2 border-primary/30 pb-4 mb-6">
                  <h2 className="text-xl font-bold text-primary">
                    {settings.professionalName || "Dr(a). Nome do Profissional"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {settings.specialty || "Especialidade"} — {settings.registrationNumber || "CRO/CRM 00000"}
                  </p>
                  {settings.clinicName && (
                    <p className="text-sm font-medium mt-1">{settings.clinicName}</p>
                  )}
                </div>

                {previewPrescription ? (
                  <div className="space-y-6">
                    <div className="flex justify-between text-sm">
                      <span><strong>Paciente:</strong> {previewPrescription.patientName}</span>
                      <span><strong>Data:</strong> {format(new Date(previewPrescription.date), "dd/MM/yyyy")}</span>
                    </div>
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3 text-center text-lg">RECEITUÁRIO</h3>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {previewPrescription.medications}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-20">
                    Selecione ou crie um receituário para pré-visualizar.
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="border-t-2 border-primary/30 pt-4 mt-8 text-center space-y-1">
                <div className="w-48 border-t border-foreground mx-auto mb-2 mt-12" />
                <p className="text-sm font-semibold">
                  {settings.professionalName || "Assinatura do Profissional"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {settings.registrationNumber || "CRO/CRM 00000"}
                </p>
                <p className="text-xs text-muted-foreground mt-3">
                  {settings.address || "Endereço da clínica"} {settings.phone ? `• ${settings.phone}` : ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Prescriptions;
