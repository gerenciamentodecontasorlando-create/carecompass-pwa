import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Shield, Users, Building2, TrendingUp, Database,
  AlertTriangle, Crown, Sparkles, BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ClinicInfo {
  id: string;
  name: string;
  plan: string;
  created_at: string;
  patient_count: number;
  appointment_count: number;
}

interface PlatformStats {
  total_clinics: number;
  total_patients: number;
  total_appointments: number;
  total_evolutions: number;
  total_prescriptions: number;
  total_transactions: number;
  plan_distribution: { plan: string; count: number }[] | null;
  clinics: ClinicInfo[] | null;
  monthly_signups: { month: string; count: number }[] | null;
}

const PLAN_CONFIG: Record<string, { label: string; price: string; color: string; icon: typeof Crown; limits: { patients: number; storageMb: number } }> = {
  free: { label: "Gratuito", price: "R$ 0", color: "bg-muted text-muted-foreground", icon: Sparkles, limits: { patients: 50, storageMb: 100 } },
  basic: { label: "Básico", price: "R$ 59/mês", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", icon: BarChart3, limits: { patients: 5000, storageMb: 2000 } },
  enterprise: { label: "Enterprise", price: "R$ 119/mês", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200", icon: Building2, limits: { patients: 99999, storageMb: 10000 } },
};

const AdminPanel = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadStats();
  }, [user]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_platform_stats");
      if (error) throw error;
      if (data && typeof data === "object" && Object.keys(data).length > 0) {
        setStats(data as unknown as PlatformStats);
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (err) {
      console.error("Failed to load platform stats:", err);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = async (clinicId: string, newPlan: string) => {
    const planLimits: Record<string, { max_patients: number; max_storage_mb: number }> = {
      free: { max_patients: 50, max_storage_mb: 100 },
      basic: { max_patients: 5000, max_storage_mb: 2000 },
      enterprise: { max_patients: 99999, max_storage_mb: 10000 },
    };
    const limits = planLimits[newPlan] || planLimits.free;
    const { error, count } = await supabase
      .from("clinics")
      .update({ plan: newPlan, max_patients: limits.max_patients, max_storage_mb: limits.max_storage_mb })
      .eq("id", clinicId)
      .select("id", { count: "exact" });
    if (error) {
      console.error("Plan update error:", error);
      toast.error("Erro ao alterar plano: " + error.message);
      return;
    }
    if (count === 0) {
      toast.error("Falha: nenhum registro atualizado. Verifique permissões de administrador.");
      return;
    }
    toast.success("Plano atualizado com sucesso!");
    loadStats();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Verificando permissões...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Shield className="h-16 w-16 text-muted-foreground/30" />
        <h2 className="text-xl font-semibold text-muted-foreground">Acesso Restrito</h2>
        <p className="text-sm text-muted-foreground">
          Este painel é exclusivo para administradores da plataforma.
        </p>
      </div>
    );
  }

  // Estimate total DB usage (rough: ~1KB per record)
  const totalRecords = (stats?.total_patients || 0) + (stats?.total_appointments || 0) +
    (stats?.total_evolutions || 0) + (stats?.total_prescriptions || 0) + (stats?.total_transactions || 0);
  const estimatedUsageMb = Math.round((totalRecords * 1.2) / 1024 * 100) / 100;
  const maxDbMb = 500; // nano plan
  const usagePercent = Math.min((estimatedUsageMb / maxDbMb) * 100, 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Painel Administrativo</h1>
          <p className="text-sm text-muted-foreground">Gestão da plataforma Btx CliniCos</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center">
            <Building2 className="h-8 w-8 text-primary mb-2" />
            <span className="text-2xl font-bold">{stats?.total_clinics || 0}</span>
            <span className="text-xs text-muted-foreground">Clínicas Ativas</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center">
            <Users className="h-8 w-8 text-primary mb-2" />
            <span className="text-2xl font-bold">{stats?.total_patients || 0}</span>
            <span className="text-xs text-muted-foreground">Pacientes Total</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center">
            <TrendingUp className="h-8 w-8 text-primary mb-2" />
            <span className="text-2xl font-bold">{stats?.total_appointments || 0}</span>
            <span className="text-xs text-muted-foreground">Agendamentos</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center">
            <Database className="h-8 w-8 text-primary mb-2" />
            <span className="text-2xl font-bold">{estimatedUsageMb} MB</span>
            <span className="text-xs text-muted-foreground">Uso Estimado</span>
          </CardContent>
        </Card>
      </div>

      {/* Storage Monitor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" />
            Monitoramento de Armazenamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Banco de Dados</span>
            <span className="font-medium">{estimatedUsageMb} MB / {maxDbMb} MB</span>
          </div>
          <Progress value={usagePercent} className="h-3" />
          {usagePercent > 80 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                {usagePercent > 95
                  ? "⚠️ CRÍTICO: Armazenamento quase cheio! Faça upgrade imediatamente."
                  : "Atenção: Uso acima de 80%. Considere fazer upgrade do plano."}
              </span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>Total de registros: {totalRecords.toLocaleString()}</div>
            <div>Evoluções: {stats?.total_evolutions || 0}</div>
            <div>Receituários: {stats?.total_prescriptions || 0}</div>
            <div>Transações: {stats?.total_transactions || 0}</div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Distribution */}
      {stats?.plan_distribution && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição de Planos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {stats.plan_distribution.map((p) => {
                const cfg = PLAN_CONFIG[p.plan] || PLAN_CONFIG.free;
                return (
                  <div key={p.plan} className="flex items-center gap-2 p-3 rounded-lg border min-w-[120px]">
                    <cfg.icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-lg font-bold">{p.count}</div>
                      <Badge className={cfg.color}>{cfg.label}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Signups */}
      {stats?.monthly_signups && stats.monthly_signups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Cadastros Mensais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {stats.monthly_signups.map((m) => (
                <div key={m.month} className="text-center p-2 rounded-lg border min-w-[80px]">
                  <div className="text-lg font-bold">{m.count}</div>
                  <div className="text-[10px] text-muted-foreground">{m.month}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clinics Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Clínicas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.clinics && stats.clinics.length > 0 ? (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {stats.clinics.map((clinic) => {
                const cfg = PLAN_CONFIG[clinic.plan] || PLAN_CONFIG.free;
                const patientLimit = cfg.limits.patients;
                const patientPercent = Math.min((clinic.patient_count / patientLimit) * 100, 100);
                return (
                  <div key={clinic.id} className="flex flex-col gap-2 p-3 rounded-lg border">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{clinic.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          Desde {(() => { try { return format(new Date(clinic.created_at), "dd/MM/yyyy"); } catch { return clinic.created_at; } })()}
                          {" • "}{clinic.patient_count} pacientes • {clinic.appointment_count} agendamentos
                        </div>
                      </div>
                      <Select
                        value={clinic.plan}
                        onValueChange={(val) => handlePlanChange(clinic.id, val)}
                      >
                        <SelectTrigger className="w-[130px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Gratuito</SelectItem>
                          <SelectItem value="basic">Básico (R$ 59/mês)</SelectItem>
                          <SelectItem value="enterprise">Enterprise (R$ 119/mês)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={patientPercent} className="h-1.5 flex-1" />
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {clinic.patient_count}/{patientLimit === 99999 ? "∞" : patientLimit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma clínica encontrada.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanel;
