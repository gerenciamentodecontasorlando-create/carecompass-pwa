import { useClinicData } from "@/hooks/useClinicData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarDays, DollarSign, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Dashboard = () => {
  const { data: patients } = useClinicData("patients");
  const { data: appointments } = useClinicData("appointments");
  const { data: transactions } = useClinicData("transactions");
  const { data: materials } = useClinicData("materials");

  const today = format(new Date(), "yyyy-MM-dd");
  const todayAppointments = appointments.filter((a) => a.date === today);
  const monthPrefix = format(new Date(), "yyyy-MM");
  const monthTransactions = transactions.filter((t) =>
    String(t.date).startsWith(monthPrefix)
  );
  const monthIncome = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount || 0), 0);
  const lowStockMaterials = materials.filter(
    (m) => Number(m.quantity) <= Number(m.min_quantity)
  );

  const stats = [
    { label: "Pacientes", value: patients.length, icon: Users, color: "text-primary" },
    { label: "Consultas Hoje", value: todayAppointments.length, icon: CalendarDays, color: "text-accent-foreground" },
    { label: "Receita do Mês", value: `R$ ${monthIncome.toFixed(2)}`, icon: DollarSign, color: "text-success" },
    { label: "Estoque Baixo", value: lowStockMaterials.length, icon: AlertTriangle, color: "text-warning" },
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
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Consultas de Hoje</CardTitle></CardHeader>
          <CardContent>
            {todayAppointments.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhuma consulta agendada para hoje.</p>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((a) => (
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
            {lowStockMaterials.length === 0 ? (
              <p className="text-muted-foreground text-sm">Todos os materiais estão em estoque adequado.</p>
            ) : (
              <div className="space-y-3">
                {lowStockMaterials.map((m) => (
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
