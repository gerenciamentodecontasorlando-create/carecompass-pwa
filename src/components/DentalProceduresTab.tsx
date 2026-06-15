import { useMemo, useState } from "react";
import { useClinicData } from "@/hooks/useClinicData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Printer, Pencil, X, Check } from "lucide-react";
import { toast } from "sonner";

interface Props {
  patientId: string;
  patientName: string;
}

const PROCEDURE_OPTIONS = [
  "Limpeza / Profilaxia",
  "Restauração (Resina)",
  "Restauração (Amálgama)",
  "Extração simples",
  "Extração cirúrgica",
  "Tratamento de canal",
  "Coroa / Prótese fixa",
  "Prótese parcial removível",
  "Prótese total",
  "Prótese sobre implante",
  "Implante dentário",
  "Faceta de porcelana",
  "Faceta de resina",
  "Clareamento dental",
  "Aparelho ortodôntico (instalação)",
  "Manutenção ortodôntica",
  "Selante",
  "Aplicação de flúor",
  "Raspagem periodontal",
  "Enxerto ósseo",
  "Cirurgia gengival",
  "Radiografia",
  "Consulta / Avaliação",
];

const PAYMENT_METHODS = ["Dinheiro", "Pix", "Cartão débito", "Cartão crédito", "Convênio", "Boleto", "Outro"];
const STATUS_OPTIONS = [
  { value: "planejado", label: "Planejado" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluido", label: "Concluído" },
];

const today = () => new Date().toISOString().slice(0, 10);
const fmtBRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => (d ? d.split("-").reverse().join("/") : "");

export default function DentalProceduresTab({ patientId, patientName }: Props) {
  const { data: procedures, insert, update, remove, loading } = useClinicData("dental_procedures", {
    filter: { patient_id: patientId },
    orderBy: "date",
    orderAsc: false,
  });
  const { data: clinicSettings } = useClinicData("clinic_settings");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: today(),
    tooth_number: "",
    procedure: "",
    notes: "",
    value: "",
    paid_amount: "",
    payment_method: "",
    professional: "",
    status: "concluido",
  });

  const visible = (procedures || []).filter((p) => !p.deleted_at);

  const totals = useMemo(() => {
    const total = visible.reduce((acc, p) => acc + Number(p.value || 0), 0);
    const paid = visible.reduce((acc, p) => acc + Number(p.paid_amount || 0), 0);
    return { total, paid, due: total - paid };
  }, [visible]);

  const resetForm = () => {
    setForm({
      date: today(), tooth_number: "", procedure: "", notes: "",
      value: "", paid_amount: "", payment_method: "", professional: "", status: "concluido",
    });
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!form.procedure.trim()) { toast.error("Selecione ou informe o procedimento"); return; }
    const payload = {
      patient_id: patientId,
      date: form.date || today(),
      tooth_number: form.tooth_number.trim() || null,
      procedure: form.procedure.trim(),
      notes: form.notes.trim() || null,
      value: Number(form.value || 0),
      paid_amount: Number(form.paid_amount || 0),
      payment_method: form.payment_method || null,
      professional: form.professional.trim() || null,
      status: form.status,
    };
    if (editingId) {
      await update(editingId, payload);
      toast.success("Procedimento atualizado");
    } else {
      await insert(payload);
      toast.success("Procedimento registrado");
    }
    resetForm();
  };

  const handleEdit = (p: Record<string, unknown>) => {
    setEditingId(String(p.id));
    setForm({
      date: String(p.date || today()),
      tooth_number: String(p.tooth_number || ""),
      procedure: String(p.procedure || ""),
      notes: String(p.notes || ""),
      value: String(p.value ?? ""),
      paid_amount: String(p.paid_amount ?? ""),
      payment_method: String(p.payment_method || ""),
      professional: String(p.professional || ""),
      status: String(p.status || "concluido"),
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este procedimento?")) return;
    await update(id, { deleted_at: new Date().toISOString() });
    toast.success("Excluído");
  };

  const handlePrint = () => {
    const cfg = (clinicSettings?.[0] || {}) as Record<string, unknown>;
    const clinicName = String(cfg.clinic_name || cfg.name || "");
    const headerText = String(cfg.print_header || "");
    const footerText = String(cfg.print_footer || "");
    const logo = String(cfg.logo_url || "");

    const rows = visible
      .slice()
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .map((p) => `
        <tr>
          <td>${fmtDate(String(p.date || ""))}</td>
          <td>${p.tooth_number ? String(p.tooth_number) : "—"}</td>
          <td>${String(p.procedure || "")}</td>
          <td>${String(p.professional || "—")}</td>
          <td>${String(STATUS_OPTIONS.find(s => s.value === p.status)?.label || p.status || "")}</td>
          <td style="text-align:right">${fmtBRL(Number(p.value || 0))}</td>
          <td style="text-align:right">${fmtBRL(Number(p.paid_amount || 0))}</td>
          <td style="text-align:right">${fmtBRL(Number(p.value || 0) - Number(p.paid_amount || 0))}</td>
        </tr>
        ${p.notes ? `<tr><td colspan="8" style="font-size:11px;color:#555;padding:4px 8px 10px">Obs: ${String(p.notes)}</td></tr>` : ""}
      `).join("");

    const html = `<!doctype html><html><head><meta charset="utf-8" />
      <title>Procedimentos - ${patientName}</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;color:#111;padding:24px;}
        h1{font-size:18px;margin:0 0 4px;} h2{font-size:14px;margin:0 0 16px;color:#444;}
        table{width:100%;border-collapse:collapse;margin-top:12px;font-size:12px;}
        th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;}
        th{background:#f3f4f6;}
        .header{display:flex;align-items:center;gap:16px;border-bottom:2px solid #0f766e;padding-bottom:10px;margin-bottom:14px;}
        .header img{max-height:60px;}
        .totals{margin-top:16px;display:flex;gap:16px;justify-content:flex-end;font-size:13px;}
        .totals div{padding:6px 12px;border:1px solid #ddd;border-radius:6px;}
        .footer{margin-top:30px;border-top:1px solid #ddd;padding-top:10px;font-size:11px;color:#555;text-align:center;white-space:pre-wrap;}
        .meta{font-size:12px;color:#444;margin:4px 0;}
        @media print{ button{display:none;} }
      </style></head><body>
      <div class="header">
        ${logo ? `<img src="${logo}" alt="logo"/>` : ""}
        <div>
          <h1>${clinicName || "Clínica"}</h1>
          ${headerText ? `<div class="meta">${headerText.replace(/\n/g, "<br/>")}</div>` : ""}
        </div>
      </div>
      <h2>Histórico de Procedimentos Odontológicos</h2>
      <div class="meta"><b>Paciente:</b> ${patientName}</div>
      <div class="meta"><b>Emitido em:</b> ${new Date().toLocaleString("pt-BR")}</div>
      <table>
        <thead><tr>
          <th>Data</th><th>Dente</th><th>Procedimento</th><th>Profissional</th>
          <th>Status</th><th style="text-align:right">Valor</th>
          <th style="text-align:right">Pago</th><th style="text-align:right">Saldo</th>
        </tr></thead>
        <tbody>${rows || `<tr><td colspan="8" style="text-align:center;color:#888">Nenhum procedimento</td></tr>`}</tbody>
      </table>
      <div class="totals">
        <div><b>Total:</b> ${fmtBRL(totals.total)}</div>
        <div><b>Pago:</b> ${fmtBRL(totals.paid)}</div>
        <div><b>Saldo:</b> ${fmtBRL(totals.due)}</div>
      </div>
      ${footerText ? `<div class="footer">${footerText}</div>` : ""}
      <script>window.onload=()=>setTimeout(()=>window.print(),300);</script>
      </body></html>`;
    const w = window.open("", "_blank");
    if (!w) { toast.error("Pop-up bloqueado pelo navegador"); return; }
    w.document.write(html);
    w.document.close();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{editingId ? "Editar procedimento" : "Novo procedimento"}</CardTitle>
          {editingId && (
            <Button variant="ghost" size="sm" onClick={resetForm}><X className="h-4 w-4 mr-1" />Cancelar</Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="grid gap-1">
              <Label>Data</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="grid gap-1">
              <Label>Dente</Label>
              <Input placeholder="Ex: 26" value={form.tooth_number} onChange={(e) => setForm({ ...form, tooth_number: e.target.value })} />
            </div>
            <div className="grid gap-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Procedimento</Label>
              <Select value={form.procedure} onValueChange={(v) => setForm({ ...form, procedure: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {PROCEDURE_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input className="mt-1" placeholder="...ou digite outro procedimento" value={form.procedure} onChange={(e) => setForm({ ...form, procedure: e.target.value })} />
            </div>
            <div className="grid gap-1">
              <Label>Profissional</Label>
              <Input value={form.professional} onChange={(e) => setForm({ ...form, professional: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="grid gap-1">
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
            </div>
            <div className="grid gap-1">
              <Label>Valor pago (R$)</Label>
              <Input type="number" step="0.01" value={form.paid_amount} onChange={(e) => setForm({ ...form, paid_amount: e.target.value })} />
            </div>
            <div className="grid gap-1">
              <Label>Forma de pagamento</Label>
              <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1">
            <Label>Observações</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <Button onClick={handleSubmit} className="gap-2">
            {editingId ? <><Check className="h-4 w-4" />Salvar alterações</> : <><Plus className="h-4 w-4" />Adicionar procedimento</>}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base">Histórico ({visible.length})</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">Total: {fmtBRL(totals.total)}</Badge>
            <Badge variant="secondary">Pago: {fmtBRL(totals.paid)}</Badge>
            <Badge variant={totals.due > 0 ? "destructive" : "outline"}>Saldo: {fmtBRL(totals.due)}</Badge>
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1">
              <Printer className="h-4 w-4" />Imprimir
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Carregando...</p>
          ) : visible.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum procedimento registrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-2">Data</th>
                    <th className="py-2 pr-2">Dente</th>
                    <th className="py-2 pr-2">Procedimento</th>
                    <th className="py-2 pr-2">Status</th>
                    <th className="py-2 pr-2 text-right">Valor</th>
                    <th className="py-2 pr-2 text-right">Pago</th>
                    <th className="py-2 pr-2 text-right">Saldo</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((p) => {
                    const v = Number(p.value || 0);
                    const pd = Number(p.paid_amount || 0);
                    return (
                      <tr key={String(p.id)} className="border-b hover:bg-accent/30">
                        <td className="py-2 pr-2 whitespace-nowrap">{fmtDate(String(p.date || ""))}</td>
                        <td className="py-2 pr-2">{p.tooth_number ? <Badge variant="secondary">{String(p.tooth_number)}</Badge> : "—"}</td>
                        <td className="py-2 pr-2">
                          <div>{String(p.procedure || "")}</div>
                          {p.notes ? <div className="text-xs text-muted-foreground">{String(p.notes)}</div> : null}
                        </td>
                        <td className="py-2 pr-2">
                          <Badge variant={p.status === "concluido" ? "default" : p.status === "em_andamento" ? "secondary" : "outline"}>
                            {STATUS_OPTIONS.find(s => s.value === p.status)?.label || String(p.status || "")}
                          </Badge>
                        </td>
                        <td className="py-2 pr-2 text-right">{fmtBRL(v)}</td>
                        <td className="py-2 pr-2 text-right">{fmtBRL(pd)}</td>
                        <td className={`py-2 pr-2 text-right ${v - pd > 0 ? "text-destructive font-medium" : ""}`}>{fmtBRL(v - pd)}</td>
                        <td className="py-2 text-right whitespace-nowrap">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(String(p.id))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
