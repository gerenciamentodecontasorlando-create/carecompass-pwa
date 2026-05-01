import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Shield, Users, Building2, TrendingUp, Database,
  AlertTriangle, Crown, Sparkles, BarChart3, GraduationCap, Stethoscope, Brain,
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
  ai_monthly_limit: number;
  ai_used_month: number;
}

interface PlatformStats {
  total_clinics: number;
  total_patients: number;
  total_appointments: number;
  total_evolutions: number;
  total_prescriptions: number;
  total_transactions: number;
  total_ai_usage_month: number;
  plan_distribution: { plan: string; count: number }[] | null;
  clinics: ClinicInfo[] | null;
  monthly_signups: { month: string; count: number }[] | null;
}

const PLAN_CONFIG: Record<string, { label: string; price: string; color: string; icon: typeof Crown; limits: { patients: number; storageMb: number } }> = {
  free: { label: "Gratuito", price: "R$ 0", color: "bg-muted text-muted-foreground", icon: Sparkles, limits: { patients: 50, storageMb: 100 } },
  student: { label: "Estudante", price: "R$ 25/mês", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200", icon: GraduationCap, limits: { patients: 200, storageMb: 500 } },
  professional: { label: "Profissional", price: "R$ 49,90/mês", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", icon: Stethoscope, limits: { patients: 5000, storageMb: 2000 } },
  basic: { label: "Básico (legado)", price: "R$ 59/mês", color: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200", icon: BarChart3, limits: { patients: 5000, storageMb: 2000 } },
  enterprise: { label: "Enterprise + IA", price: "R$ 199/mês", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200", icon: Brain, limits: { patients: 99999, storageMb: 10000 } },
};

const AdminPanel = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingLimit, setEditingLimit] = useState<Record<string, string>>({});

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
    const planLimits: Record<string, { max_patients: number; max_storage_mb: number; ai_monthly_limit: number }> = {
      free:         { max_patients: 50,    max_storage_mb: 100,   ai_monthly_limit: 0 },
      student:      { max_patients: 200,   max_storage_mb: 500,   ai_monthly_limit: 0 },
      professional: { max_patients: 5000,  max_storage_mb: 2000,  ai_monthly_limit: 0 },
      basic:        { max_patients: 5000,  max_storage_mb: 2000,  ai_monthly_limit: 0 },
      enterprise:   { max_patients: 99999, max_storage_mb: 10000, ai_monthly_limit: 500 },
    };
    const limits = planLimits[newPlan] || planLimits.free;
    const { error, data } = await (supabase as any).rpc("admin_update_clinic_plan", {
      _clinic_id: clinicId,
      _plan: newPlan,
      _max_patients: limits.max_patients,
      _max_storage_mb: limits.max_storage_mb,
      _ai_monthly_limit: limits.ai_monthly_limit,
    });
    if (error) {
      console.error("Plan update error:", error);
      const msg = error.message || error.details || error.hint || JSON.stringify(error);
      toast.error("Erro ao alterar plano: " + msg, { duration: 8000 });
      return;
    }
    if (!data) {
      toast.error("Falha: nenhum registro retornado. Você ainda é admin? Faça logout e entre novamente.", { duration: 8000 });
      return;
    }
    toast.success("Plano atualizado!");
    loadStats();
  };

  const handleLimitChange = async (clinicId: string) => {
    const raw = editingLimit[clinicId];
    const value = parseInt(raw, 10);
    if (isNaN(value) || value < 0) {
      toast.error("Informe um número válido (0 = ilimitado)");
      return;
    }
    const { error } = await (supabase as any).rpc("admin_update_clinic_ai_limit", {
      _clinic_id: clinicId,
      _ai_monthly_limit: value,
    });
    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }
    toast.success("Limite de IA atualizado");
    setEditingLimit((p) => ({ ...p, [clinicId]: "" }));
    loadStats();
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-pulse text-muted-foreground">Verificando permissões...</div></div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Shield className="h-16 w-16 text-muted-foreground/30" />
        <h2 className="text-xl font-semibold text-muted-foreground">Acesso Restrito</h2>
        <p className="text-sm text-muted-foreground">Este painel é exclusivo para administradores da plataforma.</p>
      </div>
    );
  }

  const totalRecords = (stats?.total_patients || 0) + (stats?.total_appointments || 0) +
    (stats?.total_evolutions || 0) + (stats?.total_prescriptions || 0) + (stats?.total_transactions || 0);
  const estimatedUsageMb = Math.round((totalRecords * 1.2) / 1024 * 100) / 100;
  const maxDbMb = 500;
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

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="p-4 flex flex-col items-center text-center">
          <Building2 className="h-7 w-7 text-primary mb-2" />
          <span className="text-2xl font-bold">{stats?.total_clinics || 0}</span>
          <span className="text-xs text-muted-foreground">Clínicas</span>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex flex-col items-center text-center">
          <Users className="h-7 w-7 text-primary mb-2" />
          <span className="text-2xl font-bold">{stats?.total_patients || 0}</span>
          <span className="text-xs text-muted-foreground">Pacientes</span>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex flex-col items-center text-center">
          <TrendingUp className="h-7 w-7 text-primary mb-2" />
          <span className="text-2xl font-bold">{stats?.total_appointments || 0}</span>
          <span className="text-xs text-muted-foreground">Agendamentos</span>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex flex-col items-center text-center">
          <Brain className="h-7 w-7 text-primary mb-2" />
          <span className="text-2xl font-bold">{stats?.total_ai_usage_month || 0}</span>
          <span className="text-xs text-muted-foreground">Chamadas IA (mês)</span>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex flex-col items-center text-center">
          <Database className="h-7 w-7 text-primary mb-2" />
          <span className="text-2xl font-bold">{estimatedUsageMb} MB</span>
          <span className="text-xs text-muted-foreground">Uso DB</span>
        </CardContent></Card>
      </div>

      {/* Storage */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Database className="h-4 w-4" />Armazenamento</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm"><span>Banco de Dados</span><span className="font-medium">{estimatedUsageMb} MB / {maxDbMb} MB</span></div>
          <Progress value={usagePercent} className="h-3" />
          {usagePercent > 80 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{usagePercent > 95 ? "⚠️ CRÍTICO: faça upgrade." : "Uso acima de 80%."}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {stats?.plan_distribution && (
        <Card>
          <CardHeader><CardTitle className="text-base">Distribuição de Planos</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {stats.plan_distribution.map((p) => {
                const cfg = PLAN_CONFIG[p.plan] || PLAN_CONFIG.free;
                return (
                  <div key={p.plan} className="flex items-center gap-2 p-3 rounded-lg border min-w-[140px]">
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

      <Card>
        <CardHeader><CardTitle className="text-base">Clínicas Cadastradas</CardTitle></CardHeader>
        <CardContent>
          {stats?.clinics && stats.clinics.length > 0 ? (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {stats.clinics.map((clinic) => {
                const cfg = PLAN_CONFIG[clinic.plan] || PLAN_CONFIG.free;
                const aiLimit = clinic.ai_monthly_limit || 0;
                const aiUsed = clinic.ai_used_month || 0;
                const aiPercent = aiLimit > 0 ? Math.min((aiUsed / aiLimit) * 100, 100) : 0;
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
                      <Select value={clinic.plan} onValueChange={(val) => handlePlanChange(clinic.id, val)}>
                        <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Gratuito</SelectItem>
                          <SelectItem value="student">Estudante (R$ 25)</SelectItem>
                          <SelectItem value="professional">Profissional (R$ 49,90)</SelectItem>
                          <SelectItem value="enterprise">Enterprise + IA (R$ 199)</SelectItem>
                          <SelectItem value="basic">Básico (legado)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Controle de IA */}
                    <div className="flex items-center gap-2 flex-wrap text-xs bg-muted/40 p-2 rounded-md">
                      <Brain className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">IA mês:</span>
                      <span className="font-medium">{aiUsed}{aiLimit > 0 ? ` / ${aiLimit}` : " (ilimitado)"}</span>
                      {aiLimit > 0 && <Progress value={aiPercent} className="h-1.5 flex-1 min-w-[80px]" />}
                      <Input
                        type="number" min="0" placeholder={String(aiLimit)}
                        className="h-7 w-20 text-xs"
                        value={editingLimit[clinic.id] ?? ""}
                        onChange={(e) => setEditingLimit((p) => ({ ...p, [clinic.id]: e.target.value }))}
                      />
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => handleLimitChange(clinic.id)}>
                        Salvar limite
                      </Button>
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
