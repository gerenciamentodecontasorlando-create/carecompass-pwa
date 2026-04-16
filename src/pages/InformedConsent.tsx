import { useState } from "react";
import { useClinicData } from "@/hooks/useClinicData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Printer } from "lucide-react";
import { format } from "date-fns";
import { useFormDraft } from "@/hooks/useFormDraft";
import { SignaturePad } from "@/components/SignaturePad";


const DEFAULT_CONSENT_TEXT = `Eu, abaixo identificado(a) e firmado(a), declaro para os devidos fins que fui devidamente informado(a) pelo(a) profissional responsável sobre:

• O meu estado de saúde atual e o diagnóstico clínico apresentado;
• O(s) procedimento(s) proposto(s), incluindo sua natureza, objetivos e técnica a ser utilizada;
• Os benefícios esperados, bem como os riscos, complicações e efeitos colaterais possíveis;
• As alternativas de tratamento disponíveis;
• As consequências da não realização do(s) procedimento(s).

Declaro que tive a oportunidade de esclarecer todas as minhas dúvidas, que compreendi as informações recebidas e que, de forma livre, consciente e voluntária, AUTORIZO a realização do(s) procedimento(s) descrito(s) acima.

Estou ciente de que poderei revogar este consentimento a qualquer momento antes da realização do procedimento, sem qualquer prejuízo ao meu atendimento.`;

const InformedConsent = () => {
  const { data: settingsArr } = useClinicData("clinic_settings");
  const settings = settingsArr[0] || {};
  const [form, setForm] = useFormDraft("consent-form", {
    patientName: "",
    procedure: "",
    consentText: DEFAULT_CONSENT_TEXT,
  });
  const [patientSignature, setPatientSignature] = useState<string | null>(null);
  

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Termo de Consentimento Livre e Esclarecido</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid gap-2">
                <Label>Paciente *</Label>
                <Input
                  value={form.patientName}
                  onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                  placeholder="Nome completo do paciente"
                />
              </div>
              <div className="grid gap-2">
                <Label>Procedimento(s)</Label>
                <Input
                  value={form.procedure}
                  onChange={(e) => setForm({ ...form, procedure: e.target.value })}
                  placeholder="Ex: Exodontia do elemento 38"
                />
              </div>
              <div className="grid gap-2">
                <Label>Texto do Termo (editável)</Label>
                <Textarea
                  value={form.consentText}
                  onChange={(e) => setForm({ ...form, consentText: e.target.value })}
                  rows={14}
                  className="text-sm leading-relaxed"
                />
              </div>
              <SignaturePad value={patientSignature} onChange={setPatientSignature} label="Assinatura do Paciente" />
              <Button
                variant="outline"
                onClick={() => setForm({ ...form, consentText: DEFAULT_CONSENT_TEXT })}
                size="sm"
              >
                Restaurar texto padrão
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Preview & Print */}
        <div>
          <div className="flex justify-end gap-2 mb-2 no-print">
            <Button variant="outline" size="sm" onClick={() => window.print()} disabled={!form.patientName}>
              <Printer className="h-4 w-4 mr-2" />Imprimir
            </Button>
          </div>
          <div className="print-area">
            <div className="bg-card border border-border rounded-xl shadow-sm" style={{ padding: "2.5rem 3rem", minHeight: "700px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div className="text-center pb-5 mb-6" style={{ borderBottom: "2px solid hsl(var(--primary) / 0.25)" }}>
                  <h2 className="text-xl font-bold text-primary">{String(settings.professional_name || "Dr(a). Nome")}</h2>
                  <p className="text-sm text-muted-foreground">{String(settings.specialty || "Especialidade")} — {String(settings.registration_number || "Registro Profissional")}</p>
                  {settings.clinic_name && <p className="text-sm font-medium mt-1">{String(settings.clinic_name)}</p>}
                </div>

                <h3 className="font-semibold mb-5 text-center text-base tracking-wide uppercase">
                  Termo de Consentimento Livre e Esclarecido
                </h3>

                <div className="space-y-4 text-sm leading-7" style={{ paddingLeft: "0.5rem", paddingRight: "0.5rem" }}>
                  {form.procedure && (
                    <p><strong>Procedimento(s):</strong> {form.procedure}</p>
                  )}
                  <div className="whitespace-pre-wrap">{form.consentText}</div>
                </div>
              </div>

              <div className="mt-12 space-y-8">
                <p className="text-sm text-center">Data: {format(new Date(), "dd/MM/yyyy")}</p>

                <div className="flex justify-between gap-8 mt-8">
                  {/* Patient signature */}
                  <div className="flex-1 text-center">
                    {patientSignature ? (
                      <img src={patientSignature} alt="Assinatura do paciente" className="mx-auto max-h-16 mb-1" />
                    ) : (
                      <div className="mt-12" />
                    )}
                    <div className="w-full mx-auto mb-1" style={{ borderTop: "1px solid hsl(var(--foreground))" }} />
                    <p className="text-sm font-medium">{form.patientName || "Paciente"}</p>
                    <p className="text-xs text-muted-foreground">Paciente / Responsável Legal</p>
                  </div>

                  {/* Professional signature */}
                  <div className="flex-1 text-center">
                    <div className="w-48 mx-auto mb-2" style={{ borderTop: "1px solid hsl(var(--foreground))" }} />
                    <p className="text-sm font-semibold text-primary">{String(settings.professional_name || "Assinatura")}</p>
                    <p className="text-xs text-muted-foreground">{String(settings.registration_number || "Registro Profissional")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InformedConsent;
