import { useState } from "react";
import { useClinicData } from "@/hooks/useClinicData";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ProfessionalStamp } from "@/components/ProfessionalStamp";
import { Printer, Plus, Trash2, MessageCircle, FileText, Stamp, Mail } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface BudgetItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: string;
}

const Orcamento = () => {
  const { clinicId } = useAuth();
  const { data: settingsArr } = useClinicData("clinic_settings");
  const { data: patients } = useClinicData("patients");
  const settings = (settingsArr[0] || {}) as Record<string, unknown>;

  const [patientName, setPatientName] = useState("");
  const [items, setItems] = useState<BudgetItem[]>([
    { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: "" },
  ]);
  const [notes, setNotes] = useState("");
  const [showStamp, setShowStamp] = useState(true);
  const [validity, setValidity] = useState("30");

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: "" }]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: keyof BudgetItem, value: string | number) => {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const parsePrice = (v: string) => {
    const num = parseFloat(v.replace(",", "."));
    return isNaN(num) ? 0 : num;
  };

  const getTotal = () =>
    items.reduce((sum, i) => sum + i.quantity * parsePrice(i.unitPrice), 0);

  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handlePrint = () => window.print();

  const handleWhatsApp = () => {
    const matchedP = patients.find(
      (p) => String(p.name).toLowerCase() === patientName.trim().toLowerCase()
    );
    const phone = matchedP ? String(matchedP.phone || "").replace(/\D/g, "") : "";
    if (!phone) {
      toast.error("Telefone do paciente não encontrado");
      return;
    }
    const lines = items
      .filter((i) => i.description)
      .map(
        (i) =>
          `• ${i.description} (${i.quantity}x) — ${formatCurrency(i.quantity * parsePrice(i.unitPrice))}`
      );
    const text = `Olá ${patientName}!\n\nSegue seu orçamento:\n\n${lines.join("\n")}\n\n*Total: ${formatCurrency(getTotal())}*\n\nValidade: ${validity} dias\n\n${String(settings.professional_name || "")}\n${String(settings.registration_number || "")}`;
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Orçamento — ${String(settings.clinic_name || "Clínica")}`);
    const lines = items
      .filter((i) => i.description)
      .map(
        (i) =>
          `• ${i.description} (${i.quantity}x) — ${formatCurrency(i.quantity * parsePrice(i.unitPrice))}`
      );
    const body = encodeURIComponent(
      `Prezado(a) ${patientName},\n\nSegue o orçamento:\n\n${lines.join("\n")}\n\nTotal: ${formatCurrency(getTotal())}\nValidade: ${validity} dias\n\n${notes ? `Obs: ${notes}\n\n` : ""}${String(settings.professional_name || "")}\n${String(settings.registration_number || "")}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const isValid = patientName.trim() && items.some((i) => i.description.trim() && parsePrice(i.unitPrice) > 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Orçamento</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid gap-2">
                <Label>Paciente *</Label>
                <Input
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Nome do paciente"
                  list="patient-list-orc"
                />
                <datalist id="patient-list-orc">
                  {patients.map((p) => (
                    <option key={String(p.id)} value={String(p.name)} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-3">
                <Label className="flex items-center justify-between">
                  Procedimentos / Itens
                  <Button variant="ghost" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-1" /> Adicionar
                  </Button>
                </Label>
                {items.map((item, idx) => (
                  <div key={item.id} className="flex items-start gap-2">
                    <span className="text-xs text-muted-foreground mt-3 w-5 shrink-0">{idx + 1}.</span>
                    <div className="flex-1 grid grid-cols-[1fr_60px_100px] gap-2">
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(item.id, "description", e.target.value)}
                        placeholder="Descrição do procedimento"
                        className="text-sm"
                      />
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                        className="text-sm text-center"
                        title="Qtd"
                      />
                      <Input
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, "unitPrice", e.target.value)}
                        placeholder="Valor"
                        className="text-sm"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mt-0.5 shrink-0"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length <= 1}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="font-semibold text-sm">Total</span>
                <span className="font-bold text-lg text-primary">{formatCurrency(getTotal())}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Validade (dias)</Label>
                  <Input value={validity} onChange={(e) => setValidity(e.target.value)} placeholder="30" />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Observações</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Condições de pagamento, observações gerais..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview & actions */}
        <div>
          <div className="flex justify-end gap-2 mb-2 no-print flex-wrap">
            <div className="flex items-center gap-2 mr-auto">
              <Switch id="stamp-orc" checked={showStamp} onCheckedChange={setShowStamp} />
              <Label htmlFor="stamp-orc" className="text-xs text-muted-foreground flex items-center gap-1">
                <Stamp className="h-3 w-3" />
                Carimbo
              </Label>
            </div>
            <Button variant="outline" size="sm" onClick={handleWhatsApp} disabled={!isValid}>
              <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
              WhatsApp
            </Button>
            <Button variant="outline" size="sm" onClick={handleEmail} disabled={!isValid}>
              <Mail className="h-4 w-4 mr-2" />
              E-mail
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} disabled={!isValid}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>

          <div className="print-area">
            <div
              className="bg-card border border-border rounded-xl shadow-sm"
              style={{ padding: "2.5rem 3rem", minHeight: "700px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
            >
              <div>
                {/* Header */}
                <div className="text-center pb-5 mb-6" style={{ borderBottom: "2px solid hsl(var(--primary) / 0.25)" }}>
                  <h2 className="text-xl font-bold text-primary">{String(settings.professional_name || "Dr(a). Nome")}</h2>
                  <p className="text-sm text-muted-foreground">
                    {String(settings.specialty || "Especialidade")} — {String(settings.registration_number || "Registro Profissional")}
                  </p>
                  {settings.clinic_name && <p className="text-sm font-medium mt-1">{String(settings.clinic_name)}</p>}
                </div>

                <h3 className="font-semibold mb-6 text-center text-lg tracking-wide">ORÇAMENTO</h3>

                <div className="space-y-4 text-sm" style={{ paddingLeft: "1rem", paddingRight: "1rem" }}>
                  <div className="flex justify-between">
                    <span><strong>Paciente:</strong> {patientName || "_______________"}</span>
                    <span><strong>Data:</strong> {format(new Date(), "dd/MM/yyyy")}</span>
                  </div>

                  {/* Items table */}
                  <table className="w-full border-collapse mt-4">
                    <thead>
                      <tr className="border-b-2 border-foreground/20">
                        <th className="text-left py-2 text-xs font-semibold">#</th>
                        <th className="text-left py-2 text-xs font-semibold">Procedimento</th>
                        <th className="text-center py-2 text-xs font-semibold">Qtd</th>
                        <th className="text-right py-2 text-xs font-semibold">Unitário</th>
                        <th className="text-right py-2 text-xs font-semibold">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items
                        .filter((i) => i.description.trim())
                        .map((item, idx) => (
                          <tr key={item.id} className="border-b border-foreground/10">
                            <td className="py-2 text-xs">{idx + 1}</td>
                            <td className="py-2 text-xs">{item.description}</td>
                            <td className="py-2 text-xs text-center">{item.quantity}</td>
                            <td className="py-2 text-xs text-right">{formatCurrency(parsePrice(item.unitPrice))}</td>
                            <td className="py-2 text-xs text-right font-medium">
                              {formatCurrency(item.quantity * parsePrice(item.unitPrice))}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-foreground/20">
                        <td colSpan={4} className="py-3 text-sm font-bold text-right">
                          TOTAL
                        </td>
                        <td className="py-3 text-sm font-bold text-right text-primary">
                          {formatCurrency(getTotal())}
                        </td>
                      </tr>
                    </tfoot>
                  </table>

                  {notes && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold mb-1">Observações:</p>
                      <p className="text-xs leading-6 whitespace-pre-wrap">{notes}</p>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mt-4">
                    Validade deste orçamento: {validity || "30"} dias a partir da data de emissão.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-12" style={{ borderTop: "2px solid hsl(var(--primary) / 0.25)", paddingTop: "1.5rem" }}>
                <ProfessionalStamp
                  name={String(settings.professional_name || "")}
                  specialty={String(settings.specialty || "")}
                  registrationNumber={String(settings.registration_number || "")}
                  showStamp={showStamp}
                />
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  {String(settings.address || "Endereço")} {settings.phone ? `• ${settings.phone}` : ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Orcamento;
