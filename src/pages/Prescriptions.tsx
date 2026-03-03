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
    { name: "Cefalexina 500mg", posology: "Tomar 1 comprimido de 6 em 6 horas por 7 dias." },
    { name: "Clindamicina 300mg", posology: "Tomar 1 cápsula de 8 em 8 horas por 7 dias." },
    { name: "Metronidazol 400mg", posology: "Tomar 1 comprimido de 8 em 8 horas por 7 dias." },
  ],
  "Analgésicos": [
    { name: "Dipirona Sódica 500mg", posology: "Tomar 1 comprimido de 6 em 6 horas se dor." },
    { name: "Paracetamol 750mg", posology: "Tomar 1 comprimido de 6 em 6 horas se dor. Máximo 4 comprimidos/dia." },
    { name: "Tramadol 50mg", posology: "Tomar 1 cápsula de 8 em 8 horas se dor intensa. Uso por no máximo 5 dias." },
  ],
  "Anti-inflamatórios": [
    { name: "Ibuprofeno 600mg", posology: "Tomar 1 comprimido de 8 em 8 horas por 5 dias, após as refeições." },
    { name: "Nimesulida 100mg", posology: "Tomar 1 comprimido de 12 em 12 horas por 5 dias, após as refeições." },
    { name: "Dexametasona 4mg comprimido", posology: "Tomar 1 comprimido ao dia por 3 dias, pela manhã após o café." },
    { name: "Prednisolona 20mg", posology: "Tomar 1 comprimido ao dia por 5 dias, pela manhã." },
    { name: "Diclofenaco Sódico 50mg", posology: "Tomar 1 comprimido de 8 em 8 horas por 5 dias, após as refeições." },
  ],
  "Antivirais": [
    { name: "Aciclovir 200mg comprimido", posology: "Tomar 1 comprimido de 4 em 4 horas (5x/dia) por 5 dias." },
    { name: "Aciclovir 400mg comprimido", posology: "Tomar 1 comprimido de 8 em 8 horas por 5 dias." },
    { name: "Aciclovir Pomada 5%", posology: "Aplicar na lesão 5 vezes ao dia, a cada 4 horas, por 5 a 10 dias." },
    { name: "Valaciclovir 500mg", posology: "Tomar 1 comprimido de 12 em 12 horas por 5 dias." },
  ],
  "Pomadas e Tópicos Orais": [
    { name: "Oncilon-A Orabase (Triancinolona Acetonida)", posology: "Aplicar pequena quantidade sobre a lesão oral 2 a 3 vezes ao dia, após as refeições e ao deitar, sem friccionar." },
    { name: "Dexametasona Pomada Oral (Omcilon-AM)", posology: "Aplicar sobre a lesão oral 3 vezes ao dia, após alimentação e higiene bucal." },
    { name: "Miconazol Gel Oral 2%", posology: "Aplicar na região afetada 4 vezes ao dia por 14 dias." },
    { name: "Nistatina Suspensão Oral 100.000 UI/mL", posology: "Bochechar e engolir 5mL, 4 vezes ao dia por 14 dias." },
    { name: "Digluconato de Clorexidina 0,12% (Periogard)", posology: "Bochechar 15mL por 1 minuto, 2 vezes ao dia, por 7 dias. Não engolir." },
    { name: "Rifocina Spray", posology: "Aplicar sobre a lesão 2 a 3 vezes ao dia." },
  ],
  "Antifúngicos": [
    { name: "Fluconazol 150mg", posology: "Tomar 1 cápsula em dose única. Repetir após 7 dias se necessário." },
    { name: "Cetoconazol Creme 2%", posology: "Aplicar na área afetada 1 a 2 vezes ao dia por 2 a 4 semanas." },
    { name: "Cetoconazol Shampoo 2%", posology: "Aplicar no couro cabeludo, deixar agir 5 minutos e enxaguar. Usar 2 vezes por semana por 4 semanas." },
  ],
  "Gripes e Resfriados": [
    { name: "Loratadina 10mg", posology: "Tomar 1 comprimido ao dia." },
    { name: "Desloratadina 5mg", posology: "Tomar 1 comprimido ao dia." },
    { name: "Cloridrato de Fenilefrina + Paracetamol + Clorfeniramina (Resfenol)", posology: "Tomar 1 cápsula de 6 em 6 horas. Máximo 4 cápsulas/dia." },
    { name: "Ambroxol Xarope 30mg/5mL", posology: "Tomar 10mL (1 colher de sopa) de 8 em 8 horas." },
    { name: "Acetilcisteína 600mg", posology: "Dissolver 1 envelope em água e tomar 1 vez ao dia." },
    { name: "Dexclorfeniramina 2mg (Polaramine)", posology: "Tomar 1 comprimido de 8 em 8 horas." },
  ],
  "Asma e Broncodilatadores": [
    { name: "Salbutamol Spray 100mcg/dose (Aerolin)", posology: "Fazer 2 jatos por via inalatória a cada 6 horas, ou conforme necessidade (SOS)." },
    { name: "Budesonida Spray Nasal 50mcg", posology: "Aplicar 2 jatos em cada narina, 2 vezes ao dia." },
    { name: "Prednisolona 3mg/mL Solução Oral", posology: "Tomar conforme peso corporal (1mg/kg/dia) por 3 a 5 dias." },
    { name: "Formoterol + Budesonida 6/200mcg (Alenia)", posology: "Inalar 1 cápsula de 12 em 12 horas." },
    { name: "Brometo de Ipratrópio 0,025% (Atrovent) Solução para inalação", posology: "Fazer inalação com 20 a 40 gotas diluídas em 3mL de soro fisiológico, 3 vezes ao dia." },
  ],
  "Antidiarreicos e Gastrointestinais": [
    { name: "Loperamida 2mg (Imosec)", posology: "Tomar 2 comprimidos na primeira dose, depois 1 comprimido após cada evacuação líquida. Máximo 8 comprimidos/dia." },
    { name: "Racecadotrila 100mg", posology: "Tomar 1 cápsula de 8 em 8 horas, antes das refeições, por até 7 dias." },
    { name: "Sais de Reidratação Oral (SRO)", posology: "Dissolver 1 envelope em 1 litro de água filtrada ou fervida. Tomar em pequenos goles após cada evacuação." },
    { name: "Omeprazol 20mg", posology: "Tomar 1 cápsula ao dia, em jejum, 30 minutos antes do café da manhã." },
    { name: "Metoclopramida 10mg (Plasil)", posology: "Tomar 1 comprimido de 8 em 8 horas, 30 minutos antes das refeições." },
    { name: "Buscopan Composto (Escopolamina + Dipirona)", posology: "Tomar 1 a 2 comprimidos de 6 em 6 horas se cólica/dor abdominal." },
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
  "Antiparasitários": [
    { name: "Albendazol 400mg", posology: "Tomar 1 comprimido em dose única." },
    { name: "Ivermectina 6mg", posology: "Tomar conforme peso corporal (200mcg/kg), em dose única, em jejum." },
  ],
  "Shampoos Medicamentosos": [
    { name: "Cetoconazol Shampoo 2%", posology: "Aplicar no couro cabeludo, deixar agir 5 minutos e enxaguar. Usar 2 vezes por semana por 4 semanas." },
    { name: "Sulfeto de Selênio Shampoo 2,5% (Selsun)", posology: "Aplicar no couro cabeludo, massagear, deixar agir 3 minutos e enxaguar. Usar 2 vezes por semana." },
    { name: "Piritionato de Zinco Shampoo 1%", posology: "Usar 3 vezes por semana, deixar agir 3 a 5 minutos antes de enxaguar." },
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
