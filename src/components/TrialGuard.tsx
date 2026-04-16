import { useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Clock, Crown, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TrialInfo {
  trialEndsAt: string | null;
  plan: string;
  daysLeft: number;
  isExpired: boolean;
  isActive: boolean;
}

const TRIAL_DAYS = 14;
const WHATSAPP_NUMBER = "5591999873835";

export function TrialGuard({ children }: { children: ReactNode }) {
  const { clinicId, user } = useAuth();
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  useEffect(() => {
    if (!clinicId || !user) return;

    const fetchTrial = async () => {
      const { data: adminCheck } = await supabase.rpc("is_platform_admin", { _user_id: user.id });
      if (adminCheck === true) {
        setIsPlatformAdmin(true);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("clinics")
        .select("trial_ends_at, plan")
        .eq("id", clinicId)
        .single();

      if (data) {
        const trialEnd = data.trial_ends_at ? new Date(data.trial_ends_at) : null;
        const now = new Date();
        const daysLeft = trialEnd
          ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
          : 0;
        const isPaid = data.plan !== "free";

        setTrialInfo({
          trialEndsAt: data.trial_ends_at,
          plan: data.plan,
          daysLeft,
          isExpired: !isPaid && trialEnd !== null && now > trialEnd,
          isActive: isPaid || (trialEnd !== null && now <= trialEnd),
        });
      }
      setLoading(false);
    };

    fetchTrial();
  }, [clinicId, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Verificando assinatura...</div>
      </div>
    );
  }

  if (isPlatformAdmin) return <>{children}</>;
  if (trialInfo && trialInfo.plan !== "free") return <>{children}</>;
  if (trialInfo?.isExpired) return <TrialExpiredScreen />;

  return (
    <>
      {trialInfo && <TrialBadge daysLeft={trialInfo.daysLeft} />}
      {children}
    </>
  );
}

function TrialBadge({ daysLeft }: { daysLeft: number }) {
  const urgent = daysLeft <= 3;

  return (
    <div
      className={`fixed bottom-20 right-3 z-[50] px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-xs font-semibold no-print cursor-pointer transition-all hover:scale-105 ${
        urgent
          ? "bg-destructive text-destructive-foreground animate-pulse"
          : "bg-primary text-primary-foreground"
      }`}
      onClick={() =>
        window.open(
          `https://wa.me/${WHATSAPP_NUMBER}?text=Quero%20assinar%20o%20Btx%20CliniCos`,
          "_blank"
        )
      }
    >
      <Clock className="h-3.5 w-3.5" />
      <span>
        {daysLeft === 0
          ? "Último dia grátis!"
          : `Grátis por ${daysLeft} dia${daysLeft > 1 ? "s" : ""}`}
      </span>
    </div>
  );
}

function TrialExpiredScreen() {
  const plans = [
    {
      name: "Básico",
      price: "R$ 59",
      period: "/mês",
      features: [
        "Pacientes ilimitados",
        "Prontuário completo",
        "Receituário",
        "Atestados",
        "Agenda",
        "Odontograma",
        "Financeiro",
      ],
      highlight: false,
    },
    {
      name: "Enterprise",
      price: "R$ 119",
      period: "/mês",
      features: [
        "Tudo do Básico",
        "Assistente IA (Roma)",
        "Multi-usuários",
        "Backup prioritário",
        "Suporte dedicado",
        "Relatórios avançados",
        "Exportação de dados",
      ],
      highlight: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Período gratuito encerrado</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Seus {TRIAL_DAYS} dias de teste terminaram. Escolha um plano para continuar usando o Btx CliniCos
            e manter todos os seus dados seguros.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative ${
                plan.highlight
                  ? "border-primary shadow-lg ring-2 ring-primary/20"
                  : "border-border"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Crown className="h-3 w-3" /> Mais popular
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      <span className="text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=Quero%20assinar%20o%20plano%20${plan.name}%20do%20Btx%20CliniCos`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full block"
                >
                  <Button
                    className="w-full"
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Assinar via WhatsApp
                  </Button>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Seus dados estão seguros e serão mantidos. Ao assinar, você terá acesso imediato.
        </p>
      </div>
    </div>
  );
}
