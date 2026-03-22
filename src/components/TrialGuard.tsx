import { useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Clock, Crown, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface TrialInfo {
  trialEndsAt: string | null;
  plan: string;
  daysLeft: number;
  isExpired: boolean;
  isActive: boolean;
}

export function TrialGuard({ children }: { children: ReactNode }) {
  const { clinicId, user } = useAuth();
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clinicId) return;

    const fetchTrial = async () => {
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
  }, [clinicId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Verificando assinatura...</div>
      </div>
    );
  }

  // Paid plans always have access
  if (trialInfo && trialInfo.plan !== "free") {
    return <>{children}</>;
  }

  // Trial expired - block access
  if (trialInfo?.isExpired) {
    return <TrialExpiredScreen daysLeft={0} />;
  }

  // Trial active - show banner + allow access
  return (
    <>
      {trialInfo && trialInfo.daysLeft <= 15 && (
        <TrialBanner daysLeft={trialInfo.daysLeft} />
      )}
      {children}
    </>
  );
}

function TrialBanner({ daysLeft }: { daysLeft: number }) {
  const progress = ((15 - daysLeft) / 15) * 100;
  const urgent = daysLeft <= 3;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[60] px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 no-print ${
        urgent
          ? "bg-destructive text-destructive-foreground"
          : "bg-primary/10 text-primary border-b border-primary/20"
      }`}
    >
      <Clock className="h-4 w-4" />
      <span>
        {daysLeft === 0
          ? "Último dia do período gratuito!"
          : `${daysLeft} dia${daysLeft > 1 ? "s" : ""} restante${daysLeft > 1 ? "s" : ""} do teste gratuito`}
      </span>
      <div className="w-20 hidden sm:block">
        <Progress value={progress} className="h-1.5" />
      </div>
      <a
        href="https://wa.me/5500000000000?text=Quero%20assinar%20o%20Btx%20CliniCos"
        target="_blank"
        rel="noopener noreferrer"
        className="ml-2 underline font-bold"
      >
        Assinar agora
      </a>
    </div>
  );
}

function TrialExpiredScreen({ daysLeft }: { daysLeft: number }) {
  const plans = [
    {
      name: "Básico",
      price: "R$ 89",
      period: "/mês",
      features: ["Até 200 pacientes", "Prontuário completo", "Receituário", "Atestados", "Agenda"],
      highlight: false,
    },
    {
      name: "Profissional",
      price: "R$ 149",
      period: "/mês",
      features: [
        "Pacientes ilimitados",
        "Tudo do Básico",
        "Assistente IA (Nando)",
        "Odontograma",
        "Financeiro",
        "Exportação de dados",
      ],
      highlight: true,
    },
    {
      name: "Clínica",
      price: "R$ 249",
      period: "/mês",
      features: [
        "Tudo do Profissional",
        "Multi-usuários",
        "Backup prioritário",
        "Suporte dedicado",
        "Relatórios avançados",
      ],
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Período gratuito encerrado</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Seus 15 dias de teste terminaram. Escolha um plano para continuar usando o Btx CliniCos
            e manter todos os seus dados seguros.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
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
                  href={`https://wa.me/5500000000000?text=Quero%20assinar%20o%20plano%20${plan.name}%20do%20Btx%20CliniCos`}
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
