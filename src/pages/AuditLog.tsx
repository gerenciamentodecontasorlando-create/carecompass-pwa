import { useState } from "react";
import { useClinicData } from "@/hooks/useClinicData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, Search, Users, Calendar, FileText, DollarSign, Package, Settings } from "lucide-react";
import { format } from "date-fns";

const TABLE_LABELS: Record<string, { label: string; icon: typeof Users }> = {
  patients: { label: "Pacientes", icon: Users },
  appointments: { label: "Agenda", icon: Calendar },
  prescriptions: { label: "Receituários", icon: FileText },
  certificates: { label: "Atestados", icon: FileText },
  evolutions: { label: "Evoluções", icon: FileText },
  clinical_records: { label: "Fichas Clínicas", icon: FileText },
  transactions: { label: "Financeiro", icon: DollarSign },
  materials: { label: "Materiais", icon: Package },
  clinic_settings: { label: "Configurações", icon: Settings },
  notes: { label: "Notas", icon: FileText },
};

const AuditLog = () => {
  const [search, setSearch] = useState("");

  // Load recent data from key tables for audit trail
  const { data: patients } = useClinicData("patients", { orderBy: "updated_at", orderAsc: false });
  const { data: appointments } = useClinicData("appointments", { orderBy: "created_at", orderAsc: false });
  const { data: evolutions } = useClinicData("evolutions", { orderBy: "created_at", orderAsc: false });
  const { data: prescriptions } = useClinicData("prescriptions", { orderBy: "created_at", orderAsc: false });
  const { data: transactions } = useClinicData("transactions", { orderBy: "created_at", orderAsc: false });
  const { data: certificates } = useClinicData("certificates", { orderBy: "created_at", orderAsc: false });

  // Build a unified audit log from all tables
  const auditEntries = [
    ...patients.map((p) => ({
      table: "patients",
      action: "Registro de paciente",
      detail: String(p.name),
      date: String(p.updated_at || p.created_at),
    })),
    ...appointments.map((a) => ({
      table: "appointments",
      action: "Agendamento",
      detail: `${String(a.patient_name)} — ${String(a.date)} ${String(a.time)}`,
      date: String(a.created_at),
    })),
    ...evolutions.map((e) => ({
      table: "evolutions",
      action: "Evolução clínica",
      detail: `Paciente ID: ${String(e.patient_id).slice(0, 8)}... — ${String(e.procedure || e.subjective || "Evolução")}`,
      date: String(e.created_at),
    })),
    ...prescriptions.map((p) => ({
      table: "prescriptions",
      action: "Receituário emitido",
      detail: String(p.patient_name),
      date: String(p.created_at),
    })),
    ...transactions.map((t) => ({
      table: "transactions",
      action: `Transação ${String(t.type) === "receita" ? "Receita" : "Despesa"}`,
      detail: `${String(t.description)} — R$ ${Number(t.amount).toFixed(2)}`,
      date: String(t.created_at),
    })),
    ...certificates.map((c) => ({
      table: "certificates",
      action: "Atestado emitido",
      detail: String(c.patient_name),
      date: String(c.created_at),
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter((entry) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        entry.action.toLowerCase().includes(q) ||
        entry.detail.toLowerCase().includes(q) ||
        (TABLE_LABELS[entry.table]?.label || "").toLowerCase().includes(q)
      );
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Auditoria</h1>
          <p className="text-sm text-muted-foreground">Registro de atividades do sistema — LGPD</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por ação, paciente, módulo..."
          className="pl-10"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Atividades Recentes ({auditEntries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {auditEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma atividade encontrada.</p>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {auditEntries.slice(0, 200).map((entry, i) => {
                const tableInfo = TABLE_LABELS[entry.table];
                const Icon = tableInfo?.icon || FileText;
                let dateStr = "";
                try {
                  dateStr = format(new Date(entry.date), "dd/MM/yyyy HH:mm");
                } catch {
                  dateStr = entry.date;
                }
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 border-b last:border-0">
                    <div className="mt-0.5">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{entry.action}</span>
                        <Badge variant="outline" className="text-[10px]">{tableInfo?.label || entry.table}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{entry.detail}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{dateStr}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            <span>Os registros de auditoria são protegidos e não podem ser alterados. Conforme LGPD Art. 37 — o controlador deve manter registro das operações de tratamento de dados pessoais.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLog;
