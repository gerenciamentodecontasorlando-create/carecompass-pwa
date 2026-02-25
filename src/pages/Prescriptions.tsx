import { useState } from "react";
import { useClinicData } from "@/hooks/useClinicData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Printer, Plus, Trash2, Pill, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useFormDraft } from "@/hooks/useFormDraft";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const MEDICATION_CATALOG: Record<string, { name: string; posology: string }[]> = {
  "Antibióticos": [
    { name: "Amoxicilina + Clavulanato (Clavulin) 875/125mg", posology: "Tomar 1 comprimido de 12 em 12 horas por 7 dias." },
    { name: "Amoxicilina 500mg", posology: "Tomar 1 cápsula de 8 em 8 horas por 7 dias." },
    { name: "Azitromicina 500mg", posology: "Tomar 1 comprimido ao dia por 3 dias." },
  ],
  "Analgésicos": [
    { name: "Dipirona Sódica 500mg", posology: "Tomar 1 comprimido de 6 em 6 horas se dor." },
    { name: "Paracetamol 750mg", posology: "Tomar 1 comprimido de 6 em 6 horas se dor. Máximo 4 comprimidos/dia." },
    { name: "Tramadol 50mg", posology: "Tomar 1 cápsula de 8 em 8 horas se dor intensa. Uso por no máximo 5 dias." },
  ],
  "Anti-inflamatórios": [
    { name: "Ibuprofeno 600mg", posology: "Tomar 1 comprimido de 8 em 8 horas por 5 dias, após as refeições." },
    { name: "Nimesulida 100mg", posology: "Tomar 1 comprimido de 12 em 12 horas por 5 dias, após as refeições." },
    { name: "Dexametasona 4mg", posology: "Tomar 1 comprimido ao dia por 3 dias, pela manhã após o café." },
  ],
  "Anti-hipertensivos": [
    { name: "Losartana Potássica 50mg", posology: "Tomar 1 comprimido ao dia, pela manhã." },
    { name: "Anlodipino 5mg", posology: "Tomar 1 comprimido ao dia, pela manhã." },
    { name: "Enalapril 10mg", posology: "Tomar 1 comprimido de 12 em 12 horas." },
  ],
  "Antidiabéticos": [
    { name: "Metformina 850mg", posology: "Tomar 1 comprimido de 12 em 12 horas, durante as refeições." },
    { name: "Glibenclamida 5mg", posology: "Tomar 1 comprimido ao dia, antes do café da manhã." },
    { name: "Gliclazida 30mg MR", posology: "Tomar 1 comprimido ao dia, antes do café da manhã." },
    { name: "Sitagliptina 100mg", posology: "Tomar 1 comprimido ao dia, com ou sem alimento." },
  ],
  "Antifúngicos": [
    { name: "Fluconazol 150mg", posology: "Tomar 1 cápsula em dose única. Repetir após 7 dias se necessário." },
    { name: "Nistatina Suspensão Oral 100.000 UI/mL", posology: "Bochechar e engolir 5mL, 4 vezes ao dia por 14 dias." },
    { name: "Miconazol Gel Oral 2%", posology: "Aplicar na região afetada 4 vezes ao dia por 14 dias." },
  ],
  "Antiparasitários": [
    { name: "Albendazol 400mg", posology: "Tomar 1 comprimido em dose única." },
    { name: "Ivermectina 6mg", posology: "Tomar conforme peso corporal (200mcg/kg), em dose única, em jejum." },
    { name: "Metronidazol 400mg", posology: "Tomar 1 comprimido de 8 em 8 horas por 7 dias." },
  ],
};

const Prescriptions = () => {
  const { data: settingsArr } = useClinicData("clinic_settings");
  const settings = settingsArr[0] || {};
  const { data: prescriptions, insert, remove } = useClinicData("prescriptions");
  const [form, setForm, clearDraft] = useFormDraft("prescriptions-form", { patientName: "", medications: "" });
  const [previewId, setPreviewId] = useFormDraft<string | null>("prescriptions-preview", null);

  const addMedication = (med: { name: string; posology: string }) => {
    const current = form.medications.trim();
    const lines = current ? current.split("\n").filter(l => l.match(/^\d+\)/)) : [];
    const nextNum = lines.length + 1;
    const entry = `${nextNum}) ${med.name}\n   ${med.posology}`;
    const newMeds = current ? `${current}\n\n${entry}` : entry;
    setForm({ ...form, medications: newMeds });
    toast.success(`${med.name} adicionado`);
  };

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

              {/* Medication catalog */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Prescrição *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Pill className="h-3.5 w-3.5" />Adicionar Medicamento
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 max-h-[420px] overflow-y-auto p-2" align="end">
                      {Object.entries(MEDICATION_CATALOG).map(([category, meds]) => (
                        <Collapsible key={category}>
                          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted/50">
                            {category}
                            <ChevronDown className="h-4 w-4" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="pl-2">
                            {meds.map((med) => (
                              <button
                                key={med.name}
                                onClick={() => addMedication(med)}
                                className="w-full text-left rounded-md px-3 py-2 text-sm hover:bg-primary/10 transition-colors"
                              >
                                <span className="font-medium">{med.name}</span>
                                <span className="block text-xs text-muted-foreground mt-0.5">{med.posology}</span>
                              </button>
                            ))}
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </PopoverContent>
                  </Popover>
                </div>
                <Textarea
                  value={form.medications}
                  onChange={(e) => setForm({ ...form, medications: e.target.value })}
                  placeholder={"1) Amoxicilina 500mg\n   Tomar 1 comprimido de 8 em 8 horas por 7 dias"}
                  rows={10}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />Gerar Receituário
                </Button>
                {form.medications.trim() && (
                  <Button variant="outline" onClick={() => setForm({ ...form, medications: "" })}>
                    Limpar
                  </Button>
                )}
              </div>
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
                   <p className="text-sm text-muted-foreground">{String(settings.specialty || "Especialidade")} — {String(settings.registration_number || "Registro Profissional")}</p>
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
                <p className="text-xs text-muted-foreground">{String(settings.registration_number || "Registro Profissional")}</p>
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
