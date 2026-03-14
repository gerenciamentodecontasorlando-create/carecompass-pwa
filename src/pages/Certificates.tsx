import { useState } from "react";
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
import { SignaturePad } from "@/components/SignaturePad";

const Certificates = () => {
  const { data: settingsArr } = useClinicData("clinic_settings");
  const settings = settingsArr[0] || {};
  const { data: certificates, insert, remove } = useClinicData("certificates");
  const [form, setForm, clearDraft] = useFormDraft("certificates-form", { patientName: "", content: "", days: "1" });
  const [previewId, setPreviewId] = useFormDraft<string | null>("certificates-preview", null);

  const handleSave = async () => {
    if (!form.patientName.trim()) { toast.error("Preencha o nome do paciente"); return; }
    const result = await insert({
      patient_name: form.patientName,
      date: format(new Date(), "yyyy-MM-dd"),
      content: form.content || `Atesto para os devidos fins que o(a) paciente ${form.patientName} esteve sob meus cuidados profissionais nesta data, necessitando de ${form.days} dia(s) de afastamento de suas atividades.`,
      days: form.days,
    });
    if (result) {
      clearDraft();
      setPreviewId(String(result.id));
      toast.success("Atestado gerado");
    }
  };

  const previewCert = previewId ? certificates.find((c) => String(c.id) === previewId) : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Atestados</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid gap-2">
                <Label>Paciente *</Label>
                <Input value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} />
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
                        <p className="text-xs text-muted-foreground">{format(new Date(String(c.date)), "dd/MM/yyyy")}</p>
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
          <div className="flex justify-end mb-2 no-print">
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
                    <h3 className="font-semibold text-center text-lg">ATESTADO</h3>
                    <p className="text-sm leading-relaxed">{String(previewCert.content)}</p>
                    <p className="text-sm text-right mt-8">
                      {settings.address ? `${settings.address}, ` : ""}{format(new Date(String(previewCert.date)), "dd/MM/yyyy")}
                    </p>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-20">Selecione ou crie um atestado.</p>
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

export default Certificates;
