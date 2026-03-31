import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarDays, DollarSign, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardStats {
  patientCount: number;
  todayAppointments: Record<string, unknown>[];
  monthIncome: number;
  lowStockMaterials: Record<string, unknown>[];
}

const Dashboard = () => {
  const { clinicId } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    patientCount: 0,
    todayAppointments: [],
    monthIncome: 0,
    lowStockMaterials: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clinicId) return;
    
    const fetchDashboard = async () => {
      setLoading(true);
      const today = format(new Date(), "yyyy-MM-dd");
      const monthStart = format(new Date(), "yyyy-MM-01");
      const monthEnd = format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), "yyyy-MM-dd");

      const [patientsRes, apptRes, transRes, matsRes] = await Promise.all([
        // Count patients (not fetch all)
        supabase.from("patients").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId),
        // Only today's appointments
        supabase.from("appointments").select("*").eq("clinic_id", clinicId).eq("date", today).order("time", { ascending: true }),
        // Only this month's income
        supabase.from("transactions").select("amount").eq("clinic_id", clinicId).eq("type", "income").gte("date", monthStart).lte("date", monthEnd),
        // Only low stock materials
        supabase.from("materials").select("id, name, quantity, min_quantity").eq("clinic_id", clinicId),
      ]);

      const monthIncome = (transRes.data || []).reduce((s, t) => s + Number(t.amount || 0), 0);
      const lowStock = (matsRes.data || []).filter(m => Number(m.quantity) <= Number(m.min_quantity));

      setStats({
        patientCount: patientsRes.count || 0,
        todayAppointments: apptRes.data || [],
        monthIncome,
        lowStockMaterials: lowStock,
      });
      setLoading(false);
    };

    fetchDashboard();
  }, [clinicId]);

  const statCards = [
    { label: "Pacientes", value: stats.patientCount, icon: Users, color: "text-primary" },
    { label: "Consultas Hoje", value: stats.todayAppointments.length, icon: CalendarDays, color: "text-accent-foreground" },
    { label: "Receita do Mês", value: `R$ ${stats.monthIncome.toFixed(2)}`, icon: DollarSign, color: "text-success" },
    { label: "Estoque Baixo", value: stats.lowStockMaterials.length, icon: AlertTriangle, color: "text-warning" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Consultas de Hoje</CardTitle></CardHeader>
          <CardContent>
            {stats.todayAppointments.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhuma consulta agendada para hoje.</p>
            ) : (
              <div className="space-y-3">
                {stats.todayAppointments.map((a) => (
                  <div key={String(a.id)} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{String(a.patient_name)}</p>
                      <p className="text-sm text-muted-foreground">{String(a.type)}</p>
                    </div>
                    <span className="text-sm font-semibold text-primary">{String(a.time)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Alertas de Estoque</CardTitle></CardHeader>
          <CardContent>
            {stats.lowStockMaterials.length === 0 ? (
              <p className="text-muted-foreground text-sm">Todos os materiais estão em estoque adequado.</p>
            ) : (
              <div className="space-y-3">
                {stats.lowStockMaterials.map((m) => (
                  <div key={String(m.id)} className="flex items-center justify-between p-3 rounded-lg bg-destructive/10">
                    <span className="font-medium">{String(m.name)}</span>
                    <span className="text-sm font-semibold text-destructive">
                      {String(m.quantity)} / {String(m.min_quantity)} min
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
