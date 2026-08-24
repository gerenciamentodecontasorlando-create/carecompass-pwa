import { useState } from "react";
import { useClinicData } from "@/hooks/useClinicData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Printer, Plus, Trash2, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useFormDraft } from "@/hooks/useFormDraft";
import { SignaturePad } from "@/components/SignaturePad";

const COMP_FLAG = "COMP";

const Certificates = () => {
  const { data: settingsArr } = useClinicData("clinic_settings");
  const settings = settingsArr[0] || {};
  const { data: certificates, insert, remove } = useClinicData("certificates");
  const { data: patients } = useClinicData("patients");
  const [form, setForm, clearDraft] = useFormDraft("certificates-form", { patientName: "", content: "", days: "1" });
  const [compForm, setCompForm, clearCompDraft] = useFormDraft("certificates-comp-form", {
    patientName: "",
    content: "",
    date: format(new Date(), "yyyy-MM-dd"),
    from: "",
    to: "",
  });
  const [previewId, setPreviewId] = useFormDraft<string | null>("certificates-preview", null);
  const [patientSignature, setPatientSignature] = useState<string | null>(null);

  const handleSave = async () => {
    if (!form.patientName.trim()) { toast.error("Preencha o nome do paciente"); return; }
    const result = await insert({
      patient_name: form.patientName.trim(),
      date: format(new Date(), "yyyy-MM-dd"),
      content: form.content || `Atesto para os devidos fins que o(a) paciente ${form.patientName.trim()} esteve sob meus cuidados profissionais nesta data, necessitando de ${form.days} dia(s) de afastamento de suas atividades.`,
      days: form.days,
    });
    if (result) {
      clearDraft();
      setPreviewId(String(result.id));
      toast.success("Atestado gerado");
    }
  };

  const handleSaveComparecimento = async () => {
    if (!compForm.patientName.trim()) { toast.error("Preencha o nome do paciente"); return; }
    const periodo = compForm.from && compForm.to ? `, no período das ${compForm.from} às ${compForm.to}` : "";
    const dataFmt = format(new Date(`${compForm.date}T12:00:00`), "dd/MM/yyyy");
    const result = await insert({
      patient_name: compForm.patientName.trim(),
      date: compForm.date,
      content: compForm.content || `Atesto para os devidos fins que o(a) paciente ${compForm.patientName.trim()} compareceu a esta unidade para atendimento profissional no dia ${dataFmt}${periodo}.`,
      days: COMP_FLAG,
    });
    if (result) {
      clearCompDraft();
      setPreviewId(String(result.id));
      toast.success("Atestado de comparecimento gerado");
    }
  };

  const previewCert = previewId ? certificates.find((c) => String(c.id) === previewId) : null;
  const isComp = previewCert ? String(previewCert.days) === COMP_FLAG : false;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Atestados</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <Tabs defaultValue="afastamento">
                <TabsList className="w-full">
                  <TabsTrigger value="afastamento" className="flex-1">Afastamento</TabsTrigger>
                  <TabsTrigger value="comparecimento" className="flex-1">Comparecimento</TabsTrigger>
                </TabsList>

                <TabsContent value="afastamento" className="space-y-4 mt-4">
                  <div className="grid gap-2">
                    <Label>Paciente *</Label>
                    <Input
                      list="pacientes-atestado"
                      value={form.patientName}
                      onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                      placeholder="Nome completo do paciente"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Dias de afastamento</Label>
                    <Input type="number" min="1" value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Texto personalizado (opcional)</Label>
                    <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} placeholder="Deixe em branco para usar o modelo padrão" />
                  </div>
                  <Button onClick={handleSave} className="w-full"><Plus className="h-4 w-4 mr-2" />Gerar Atestado</Button>
                </TabsContent>

                <TabsContent value="comparecimento" className="space-y-4 mt-4">
                  <div className="grid gap-2">
                    <Label>Paciente *</Label>
                    <Input
                      list="pacientes-atestado"
                      value={compForm.patientName}
                      onChange={(e) => setCompForm({ ...compForm, patientName: e.target.value })}
                      placeholder="Nome completo do paciente"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Data do comparecimento</Label>
                    <Input type="date" value={compForm.date} onChange={(e) => setCompForm({ ...compForm, date: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label>Das</Label>
                      <Input type="time" value={compForm.from} onChange={(e) => setCompForm({ ...compForm, from: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Às</Label>
                      <Input type="time" value={compForm.to} onChange={(e) => setCompForm({ ...compForm, to: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Texto personalizado (opcional)</Label>
                    <Textarea value={compForm.content} onChange={(e) => setCompForm({ ...compForm, content: e.target.value })} rows={4} placeholder="Deixe em branco para usar o modelo padrão" />
                  </div>
                  <Button onClick={handleSaveComparecimento} className="w-full"><Plus className="h-4 w-4 mr-2" />Gerar Comparecimento</Button>
                </TabsContent>
              </Tabs>

              <datalist id="pacientes-atestado">
                {patients.map((p) => (
                  <option key={String(p.id)} value={String(p.name)} />
                ))}
              </datalist>

              <div className="mt-4">
                <SignaturePad value={patientSignature} onChange={setPatientSignature} label="Assinatura do Paciente" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Atestados anteriores</h3>
              {certificates.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum atestado emitido.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {[...certificates].reverse().map((c) => (
                    <div key={String(c.id)} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => setPreviewId(String(c.id))}>
                      <div>
                        <p className="text-sm font-medium">{String(c.patient_name)}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(`${String(c.date)}T12:00:00`), "dd/MM/yyyy")} • {String(c.days) === COMP_FLAG ? "Comparecimento" : `Afastamento ${String(c.days || "")} dia(s)`}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={async (e) => {
                        e.stopPropagation();
                        await remove(String(c.id));
                        if (previewId === String(c.id)) setPreviewId(null);
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
          <div className="flex justify-end gap-2 mb-2 no-print">
            <Button variant="outline" size="sm" disabled={!previewCert} onClick={() => {
              if (!previewCert) return;
              const matchedP = patients.find(p => String(p.name).toLowerCase() === String(previewCert.patient_name).toLowerCase());
              const phone = matchedP ? String(matchedP.phone || "").replace(/\D/g, "") : "";
              if (!phone) { toast.error("Telefone do paciente não encontrado"); return; }
              const text = `Olá ${String(previewCert.patient_name)}!\n\nSegue seu atestado:\n\n${String(previewCert.content)}\n\n${String(settings.professional_name || "")}\n${String(settings.registration_number || "")}`;
              window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(text)}`, "_blank");
            }}>
              <MessageCircle className="h-4 w-4 mr-2 text-green-600" />WhatsApp
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()} disabled={!previewCert}>
              <Printer className="h-4 w-4 mr-2" />Imprimir
            </Button>
          </div>
          <div className="print-area">
            <div className="bg-card border-2 border-border rounded-xl p-8 min-h-[700px] flex flex-col justify-between shadow-sm">
              <div>
                <div className="text-center border-b-2 border-primary/30 pb-4 mb-6">
                  <h2 className="text-xl font-bold text-primary">{String(settings.professional_name || "Dr(a). Nome")}</h2>
                  <p className="text-sm text-muted-foreground">{String(settings.specialty || "Especialidade")} — {String(settings.registration_number || "Registro Profissional")}</p>
                </div>
                {previewCert ? (
                  <div className="space-y-6">
                    <h3 className="font-semibold text-center text-lg tracking-wide">
                      {isComp ? "ATESTADO DE COMPARECIMENTO" : "ATESTADO MÉDICO"}
                    </h3>
                    <div className="rounded-lg border border-border p-3 space-y-1">
                      <p className="text-sm"><span className="font-semibold">Paciente:</span> {String(previewCert.patient_name)}</p>
                      <p className="text-sm">
                        <span className="font-semibold">Data:</span> {format(new Date(`${String(previewCert.date)}T12:00:00`), "dd/MM/yyyy")}
                      </p>
                      {!isComp && previewCert.days ? (
                        <p className="text-sm"><span className="font-semibold">Afastamento:</span> {String(previewCert.days)} dia(s)</p>
                      ) : null}
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{String(previewCert.content)}</p>
                    <p className="text-sm text-right mt-8">
                      {settings.address ? `${settings.address}, ` : ""}{format(new Date(`${String(previewCert.date)}T12:00:00`), "dd/MM/yyyy")}
                    </p>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-20">Selecione ou crie um atestado.</p>
                )}
              </div>
              {patientSignature && (
                <div className="mt-8 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Assinatura do Paciente:</p>
                  <img src={patientSignature} alt="Assinatura do paciente" className="mx-auto max-h-20 border-b border-foreground" />
                </div>
              )}
              <div className="border-t-2 border-primary/30 pt-4 mt-8">
                <div className="text-center">
                  <div className="w-48 mx-auto mb-2" style={{ borderTop: "1px solid hsl(var(--foreground))" }} />
                  <p className="text-sm font-semibold text-primary">{String(settings.professional_name || "Assinatura")}</p>
                  <p className="text-xs text-muted-foreground">{String(settings.registration_number || "Registro Profissional")}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">{String(settings.address || "Endereço")} {settings.phone ? `• ${settings.phone}` : ""}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Certificates;
