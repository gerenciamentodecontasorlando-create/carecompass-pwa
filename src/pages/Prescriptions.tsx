import { useState, useRef } from "react";
import { useClinicData } from "@/hooks/useClinicData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Printer, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useFormDraft } from "@/hooks/useFormDraft";

const Prescriptions = () => {
  const { data: settingsArr } = useClinicData("clinic_settings");
  const settings = settingsArr[0] || {};
  const { data: prescriptions, insert, remove } = useClinicData("prescriptions");
  const [form, setForm, clearDraft] = useFormDraft("prescriptions-form", { patientName: "", medications: "" });
  const [previewId, setPreviewId] = useFormDraft<string | null>("prescriptions-preview", null);

  const handleSave = async () => {
    if (!form.patientName.trim() || !form.medications.trim()) {
      toast.error("Preencha paciente e medicamentos"); return;
    }
    const result = await insert({
      patient_name: form.patientName,
      date: format(new Date(), "yyyy-MM-dd"),
      medications: form.medications,
    });
    if (result) {
      clearDraft();
      setPreviewId(String(result.id));
      toast.success("Receituário salvo");
    }
  };

  const previewPrescription = previewId ? prescriptions.find((p) => String(p.id) === previewId) : null;

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
                  placeholder={"1) Amoxicilina 500mg\n   Tomar 1 comprimido de 8 em 8 horas por 7 dias"}
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
                    <div key={String(p.id)} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => setPreviewId(String(p.id))}>
                      <div>
                        <p className="text-sm font-medium">{String(p.patient_name)}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(String(p.date)), "dd/MM/yyyy")}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={async (e) => {
                        e.stopPropagation();
                        await remove(String(p.id));
                        if (previewId === String(p.id)) setPreviewId(null);
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

        <div>
          <div className="flex justify-end mb-2 no-print">
            <Button variant="outline" size="sm" onClick={() => window.print()} disabled={!previewPrescription}>
              <Printer className="h-4 w-4 mr-2" />Imprimir
            </Button>
          </div>
          <div className="print-area">
            <div className="bg-card border-2 border-border rounded-xl p-8 min-h-[700px] flex flex-col justify-between shadow-sm">
              <div>
                <div className="text-center border-b-2 border-primary/30 pb-4 mb-6">
                  <h2 className="text-xl font-bold text-primary">{String(settings.professional_name || "Dr(a). Nome")}</h2>
                  <p className="text-sm text-muted-foreground">{String(settings.specialty || "Especialidade")} — {String(settings.registration_number || "CRO/CRM")}</p>
                  {settings.clinic_name && <p className="text-sm font-medium mt-1">{String(settings.clinic_name)}</p>}
                </div>
                {previewPrescription ? (
                  <div className="space-y-6">
                    <div className="flex justify-between text-sm">
                      <span><strong>Paciente:</strong> {String(previewPrescription.patient_name)}</span>
                      <span><strong>Data:</strong> {format(new Date(String(previewPrescription.date)), "dd/MM/yyyy")}</span>
                    </div>
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3 text-center text-lg">RECEITUÁRIO</h3>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">{String(previewPrescription.medications)}</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-20">Selecione ou crie um receituário.</p>
                )}
              </div>
              <div className="border-t-2 border-primary/30 pt-4 mt-8 text-center space-y-1">
                <div className="w-48 border-t border-foreground mx-auto mb-2 mt-12" />
                <p className="text-sm font-semibold">{String(settings.professional_name || "Assinatura")}</p>
                <p className="text-xs text-muted-foreground">{String(settings.registration_number || "CRO/CRM")}</p>
                <p className="text-xs text-muted-foreground mt-3">{String(settings.address || "Endereço")} {settings.phone ? `• ${settings.phone}` : ""}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Prescriptions;
