import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BcLogo } from "@/components/BcLogo";
import { LgpdSeal } from "@/components/LgpdSeal";
import {
  Calendar,
  FileText,
  DollarSign,
  Package,
  Users,
  Stethoscope,
  Bot,
  WifiOff,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Check,
  Smartphone,
  Lock,
  MessageCircle,
  ClipboardList,
  Activity,
  Bell,
  Menu as MenuIcon,
  Home,
  Pill,
  FileSignature,
  PiggyBank,
  Boxes,
  Settings,
  StickyNote,
  Receipt,
  Trash2,
} from "lucide-react";

const WHATSAPP =
  "https://wa.me/5591999873835?text=" +
  encodeURIComponent(
    "Olá! Vi a página do Btx CliniCos e gostaria de saber mais."
  );

export default function Landing() {
  const navigate = useNavigate();
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    document.title = "Btx CliniCos — Prontuário, Agenda e Financeiro para Clínicas";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "Sistema completo para clínicas e consultórios: prontuário, agenda, receituário, financeiro, estoque e IA clínica. Funciona offline. Teste 15 dias grátis."
      );
    }
  }, []);

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("demo-signin");
      if (error || !data?.email) throw error || new Error("Falha ao preparar demo");
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (signErr) throw signErr;
      // Bypass PIN lock for demo session
      try {
        localStorage.setItem("clinicapro-pin-unlocked", String(Date.now()));
        sessionStorage.setItem("demo_mode", "true");
      } catch {}
      toast.success("Bem-vindo ao modo demonstração!");
      navigate("/");
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao entrar no modo demo: " + (err?.message || "tente novamente"));
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header className="sticky top-0 z-30 backdrop-blur bg-background/80 border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="#topo" className="flex items-center gap-2">
            <BcLogo size={36} />
            <span className="font-bold tracking-tight text-lg">Btx CliniCos</span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#funcionalidades" className="hover:text-foreground">Funcionalidades</a>
            <a href="#offline" className="hover:text-foreground">Offline</a>
            <a href="#ia" className="hover:text-foreground">IA Clínica</a>
            <a href="#planos" className="hover:text-foreground">Planos</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={WHATSAPP} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp
              </a>
            </Button>
            <Button size="sm" asChild>
              <Link to="/">Entrar</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section id="topo" className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-accent/40" />
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <Badge className="mb-4" variant="secondary">
              <Sparkles className="h-3 w-3 mr-1" /> Novo: assistente Roma com IA clínica
            </Badge>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
              A clínica inteira em um só sistema —{" "}
              <span className="text-primary">funciona até sem internet.</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Prontuário, agenda, receituário, financeiro, estoque e assinatura digital
              em uma plataforma feita para profissionais de saúde. Acesse de qualquer
              dispositivo, com seus dados criptografados.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" onClick={handleDemoLogin} disabled={demoLoading}>
                {demoLoading ? "Preparando demo…" : (<>Entrar no Modo Demo <ArrowRight className="h-4 w-4 ml-1" /></>)}
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/">Teste grátis por 15 dias</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href={WHATSAPP} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
                </a>
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              👀 Modo Demo: entre sem cadastro, com pacientes e dados de exemplo já preenchidos.
            </p>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success" /> Sem cartão para testar</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success" /> Conformidade LGPD</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success" /> Funciona offline</span>
            </div>
          </div>

          {/* Mockup do Dashboard */}
          <DashboardMock />
        </div>
      </section>

      {/* DESTAQUES */}
      <section className="border-y bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: WifiOff, title: "Modo Offline", desc: "Atenda sem internet" },
            { icon: ShieldCheck, title: "LGPD", desc: "Criptografia AES-256" },
            { icon: Smartphone, title: "PWA", desc: "Instala no celular" },
            { icon: Bot, title: "IA Roma", desc: "Assistente clínico" },
          ].map((b, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <b.icon className="h-5 w-5" />
              </div>
              <div className="font-semibold text-sm">{b.title}</div>
              <div className="text-xs text-muted-foreground">{b.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FUNCIONALIDADES com mockups */}
      <section id="funcionalidades" className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="secondary" className="mb-3">Funcionalidades</Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Tudo o que sua clínica precisa, sem complicação
          </h2>
          <p className="mt-3 text-muted-foreground">
            Módulos pensados para a rotina real de quem atende pacientes todos os dias.
          </p>
        </div>

        {/* Bloco 1 - Agenda */}
        <FeatureRow
          title="Agenda inteligente"
          description="Visualize sua semana inteira, gerencie horários, envie lembretes por WhatsApp e nunca perca um atendimento."
          bullets={[
            "Visão diária e semanal",
            "Lembretes automáticos por WhatsApp",
            "Cores por status do atendimento",
            "Agendamento recorrente",
          ]}
          mock={<AgendaMock />}
          icon={Calendar}
        />

        {/* Bloco 2 - Receituário */}
        <FeatureRow
          reverse
          title="Receituário digital"
          description="Catálogo de medicamentos, doses pré-preenchidas, calculadora pediátrica em mg/kg/dia e impressão com timbre da clínica."
          bullets={[
            "Catálogo inteligente de medicamentos",
            "Calculadora de dose pediátrica",
            "Carimbo profissional configurável",
            "Reimpressão e edição de receitas anteriores",
          ]}
          mock={<PrescriptionMock />}
          icon={FileText}
        />

        {/* Bloco 3 - Financeiro */}
        <FeatureRow
          title="Livro caixa e financeiro"
          description="Controle entradas e saídas, saldo do mês, contas a receber e relatórios para fechar o caixa sem dor de cabeça."
          bullets={[
            "Entradas e saídas categorizadas",
            "Saldo em tempo real",
            "Relatórios mensais",
            "Exportação para CSV",
          ]}
          mock={<FinancialMock />}
          icon={DollarSign}
        />

        {/* Bloco 4 - Menu completo */}
        <FeatureRow
          reverse
          title="Tudo a um clique no menu"
          description="Pacientes, agenda, prontuário SOAP, odontologia, receituário, atestados, financeiro, estoque, notas, assinatura digital e mais."
          bullets={[
            "Mais de 15 módulos integrados",
            "Acesso rápido pela barra lateral",
            "Bloqueio por PIN para segurança local",
            "Lixeira com recuperação de dados",
          ]}
          mock={<MenuMock />}
          icon={MenuIcon}
        />
      </section>

      {/* OFFLINE */}
      <section id="offline" className="border-y bg-gradient-to-br from-accent/30 to-background">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <OfflineMock />
          <div>
            <Badge variant="secondary" className="mb-3">
              <WifiOff className="h-3 w-3 mr-1" /> Funciona sem internet
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              A internet caiu? O atendimento continua.
            </h2>
            <p className="mt-3 text-muted-foreground">
              O Btx CliniCos guarda tudo localmente no seu dispositivo e sincroniza
              automaticamente quando a conexão voltar. Você atende, prescreve e
              consulta o prontuário mesmo offline.
            </p>
            <ul className="mt-5 space-y-2 text-sm">
              {[
                "Cache local seguro (IndexedDB)",
                "Fila de sincronização automática",
                "Sessão válida por 30 dias offline",
                "PWA instalável no celular e tablet",
              ].map((t, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-success mt-0.5" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* IA */}
      <section id="ia" className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <Badge variant="secondary" className="mb-3">
              <Bot className="h-3 w-3 mr-1" /> IA Clínica — Roma
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Um assistente clínico que pensa com você.
            </h2>
            <p className="mt-3 text-muted-foreground">
              A Roma é uma assistente por voz e texto que ajuda a tirar dúvidas
              clínicas, revisa prescrições, transcreve consultas e analisa exames
              de imagem. Toda ação sugerida pela IA precisa da sua confirmação
              antes de salvar — você sempre tem o controle.
            </p>
            <ul className="mt-5 space-y-2 text-sm">
              {[
                "Revisão automática de prescrições",
                "Transcrição de consulta para SOAP",
                "Análise de radiografias e exames",
                "Confirmação manual obrigatória",
              ].map((t, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-success mt-0.5" /> {t}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              * IA disponível no plano Enterprise (R$ 199/mês).
            </p>
          </div>
          <AIMock />
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="border-t bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <Badge variant="secondary" className="mb-3">Planos</Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Escolha o plano ideal para você
            </h2>
            <p className="mt-3 text-muted-foreground">
              Comece com 15 dias grátis. Sem cartão de crédito.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <PlanCard
              name="Estudante"
              price="R$ 25"
              tag="para quem está começando"
              features={[
                "Todos os módulos clínicos",
                "Agenda e financeiro",
                "Receituário e atestados",
                "Funciona offline",
              ]}
            />
            <PlanCard
              name="Profissional"
              price="R$ 49,90"
              tag="o mais popular"
              highlight
              features={[
                "Tudo do Estudante",
                "Suporte prioritário",
                "Backup automático",
                "Múltiplos dispositivos",
              ]}
            />
            <PlanCard
              name="Enterprise + IA"
              price="R$ 199"
              tag="com IA Roma"
              features={[
                "Tudo do Profissional",
                "IA Roma completa",
                "Análise de exames por IA",
                "Transcrição de consultas",
              ]}
            />
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Pronto para modernizar sua clínica?
        </h2>
        <p className="mt-3 text-muted-foreground">
          Teste grátis por 15 dias. Sem compromisso, sem cartão.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Button size="lg" asChild>
            <Link to="/">
              Começar agora <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href={WHATSAPP} target="_blank" rel="noreferrer">
              <MessageCircle className="h-4 w-4 mr-2" /> Falar no WhatsApp
            </a>
          </Button>
        </div>

        <div className="mt-10 max-w-md mx-auto">
          <LgpdSeal />
        </div>
      </section>

      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Btx CliniCos — Todos os direitos reservados.
      </footer>
    </div>
  );
}

/* ============== Helpers ============== */

function FeatureRow({
  title,
  description,
  bullets,
  mock,
  icon: Icon,
  reverse,
}: {
  title: string;
  description: string;
  bullets: string[];
  mock: React.ReactNode;
  icon: React.ElementType;
  reverse?: boolean;
}) {
  return (
    <div className={`grid md:grid-cols-2 gap-10 items-center py-12 ${reverse ? "md:[&>*:first-child]:order-2" : ""}`}>
      <div>
        <div className="inline-flex h-10 w-10 rounded-lg bg-primary/10 text-primary items-center justify-center mb-3">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h3>
        <p className="mt-3 text-muted-foreground">{description}</p>
        <ul className="mt-5 space-y-2 text-sm">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-success mt-0.5" /> {b}
            </li>
          ))}
        </ul>
      </div>
      <div>{mock}</div>
    </div>
  );
}

function PlanCard({
  name,
  price,
  tag,
  features,
  highlight,
}: {
  name: string;
  price: string;
  tag: string;
  features: string[];
  highlight?: boolean;
}) {
  return (
    <Card className={`p-6 relative ${highlight ? "border-primary shadow-lg scale-[1.02]" : ""}`}>
      {highlight && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Mais popular</Badge>
      )}
      <div className="text-sm text-muted-foreground">{tag}</div>
      <div className="text-2xl font-bold mt-1">{name}</div>
      <div className="mt-3">
        <span className="text-4xl font-extrabold">{price}</span>
        <span className="text-muted-foreground">/mês</span>
      </div>
      <ul className="mt-5 space-y-2 text-sm">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2">
            <Check className="h-4 w-4 text-success mt-0.5" /> {f}
          </li>
        ))}
      </ul>
      <Button className="w-full mt-6" variant={highlight ? "default" : "outline"} asChild>
        <Link to="/">Começar teste grátis</Link>
      </Button>
    </Card>
  );
}

/* ============== Mockups ============== */

function BrowserFrame({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="rounded-xl border bg-card shadow-2xl overflow-hidden">
      <div className="h-8 flex items-center gap-1.5 px-3 border-b bg-muted/50">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
        {label && (
          <span className="ml-3 text-[10px] text-muted-foreground truncate">{label}</span>
        )}
      </div>
      <div className="p-4 bg-background">{children}</div>
    </div>
  );
}

function DashboardMock() {
  return (
    <BrowserFrame label="btxclinicos.com.br/dashboard">
      <div className="grid grid-cols-3 gap-3 mb-3">
        {[
          { label: "Pacientes", value: "248", icon: Users, color: "text-primary" },
          { label: "Hoje", value: "12", icon: Calendar, color: "text-success" },
          { label: "Receita", value: "R$ 8.4k", icon: DollarSign, color: "text-warning" },
        ].map((s, i) => (
          <div key={i} className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <Activity className="h-3 w-3 text-muted-foreground" />
            </div>
            <div className="text-lg font-bold mt-2">{s.value}</div>
            <div className="text-[10px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="rounded-lg border p-3">
        <div className="text-xs font-semibold mb-2">Próximos atendimentos</div>
        {[
          ["09:00", "Maria Silva", "Consulta"],
          ["10:30", "João Pereira", "Retorno"],
          ["14:00", "Ana Costa", "Avaliação"],
        ].map(([h, n, t], i) => (
          <div key={i} className="flex items-center gap-3 py-1.5 border-b last:border-0">
            <div className="text-[10px] font-mono text-primary w-10">{h}</div>
            <div className="flex-1 text-xs">{n}</div>
            <Badge variant="outline" className="text-[9px] h-4">{t}</Badge>
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
}

function AgendaMock() {
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex"];
  const slots = [
    [1, 0, 1, 1, 0],
    [1, 1, 0, 1, 1],
    [0, 1, 1, 0, 1],
    [1, 1, 1, 1, 0],
  ];
  const colors = ["bg-primary/80", "bg-success/80", "bg-warning/80", "bg-accent-foreground/60"];
  return (
    <BrowserFrame label="Agenda — Semana">
      <div className="grid grid-cols-6 gap-1 text-[10px]">
        <div></div>
        {days.map((d) => (
          <div key={d} className="text-center font-semibold text-muted-foreground">{d}</div>
        ))}
        {["09h", "10h", "11h", "12h"].map((h, i) => (
          <div key={h} className="contents">
            <div className="text-right pr-1 text-muted-foreground">{h}</div>
            {slots[i].map((v, j) => (
              <div
                key={j}
                className={`h-10 rounded ${v ? colors[(i + j) % colors.length] : "bg-muted"}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary/80" /> Consulta</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success/80" /> Retorno</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning/80" /> Procedimento</span>
      </div>
    </BrowserFrame>
  );
}

function PrescriptionMock() {
  return (
    <BrowserFrame label="Receituário">
      <div className="border rounded-lg p-4 bg-card">
        <div className="text-center pb-2 border-b">
          <div className="text-xs font-bold">CLÍNICA SAÚDE +</div>
          <div className="text-[9px] text-muted-foreground">CRM 12345 · Rua das Flores, 100</div>
        </div>
        <div className="mt-3 text-[10px]">
          <div className="flex justify-between">
            <span><strong>Paciente:</strong> Maria Silva</span>
            <span className="text-muted-foreground">Nº 0142</span>
          </div>
        </div>
        <div className="mt-3 space-y-1.5">
          {[
            ["Amoxicilina 500mg", "1 comp 8/8h por 7 dias"],
            ["Dipirona 500mg", "1 comp se dor"],
            ["Omeprazol 20mg", "1 cáps em jejum"],
          ].map(([m, p], i) => (
            <div key={i} className="text-[10px] border-l-2 border-primary pl-2">
              <div className="font-semibold">{i + 1}. {m}</div>
              <div className="text-muted-foreground">{p}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t flex justify-between items-end">
          <div className="text-[9px] text-muted-foreground">Belém, hoje</div>
          <div className="text-right">
            <div className="border-t border-foreground w-24 text-[9px] text-center pt-0.5">Dr. Responsável</div>
          </div>
        </div>
      </div>
      <div className="mt-2 flex gap-1.5">
        <Badge variant="outline" className="text-[9px]">Catálogo PT</Badge>
        <Badge variant="outline" className="text-[9px]">Pediátrico</Badge>
        <Badge variant="outline" className="text-[9px]">Carimbo</Badge>
      </div>
    </BrowserFrame>
  );
}

function FinancialMock() {
  return (
    <BrowserFrame label="Financeiro · Livro Caixa">
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-lg border p-2 bg-success/5">
          <div className="text-[9px] text-muted-foreground">Entradas</div>
          <div className="text-sm font-bold text-success">R$ 12.430</div>
        </div>
        <div className="rounded-lg border p-2 bg-destructive/5">
          <div className="text-[9px] text-muted-foreground">Saídas</div>
          <div className="text-sm font-bold text-destructive">R$ 4.018</div>
        </div>
        <div className="rounded-lg border p-2 bg-primary/5">
          <div className="text-[9px] text-muted-foreground">Saldo</div>
          <div className="text-sm font-bold text-primary">R$ 8.412</div>
        </div>
      </div>
      <div className="rounded-lg border overflow-hidden">
        <div className="grid grid-cols-12 text-[9px] font-semibold bg-muted/50 px-2 py-1.5">
          <div className="col-span-2">Data</div>
          <div className="col-span-6">Descrição</div>
          <div className="col-span-2">Tipo</div>
          <div className="col-span-2 text-right">Valor</div>
        </div>
        {[
          ["12/04", "Consulta — Maria S.", "Entrada", "+R$ 250", "text-success"],
          ["12/04", "Compra material", "Saída", "-R$ 180", "text-destructive"],
          ["13/04", "Procedimento — João", "Entrada", "+R$ 800", "text-success"],
          ["14/04", "Aluguel sala", "Saída", "-R$ 1.200", "text-destructive"],
          ["15/04", "Consulta — Ana C.", "Entrada", "+R$ 250", "text-success"],
        ].map(([d, desc, t, v, c], i) => (
          <div key={i} className="grid grid-cols-12 text-[10px] px-2 py-1.5 border-t">
            <div className="col-span-2 text-muted-foreground">{d}</div>
            <div className="col-span-6 truncate">{desc}</div>
            <div className="col-span-2 text-muted-foreground">{t}</div>
            <div className={`col-span-2 text-right font-semibold ${c}`}>{v}</div>
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
}

function MenuMock() {
  const items = [
    { icon: Home, label: "Dashboard" },
    { icon: Users, label: "Pacientes" },
    { icon: Calendar, label: "Agenda" },
    { icon: ClipboardList, label: "Prontuário" },
    { icon: Stethoscope, label: "Odontologia" },
    { icon: Pill, label: "Receituário" },
    { icon: FileSignature, label: "Atestados" },
    { icon: PiggyBank, label: "Financeiro" },
    { icon: Boxes, label: "Estoque" },
    { icon: StickyNote, label: "Notas" },
    { icon: Receipt, label: "Orçamento" },
    { icon: Bot, label: "IA Roma" },
    { icon: Trash2, label: "Lixeira" },
    { icon: Settings, label: "Config." },
  ];
  return (
    <BrowserFrame label="Menu lateral · Btx CliniCos">
      <div className="flex gap-3">
        <div className="w-44 bg-sidebar text-sidebar-foreground rounded-lg p-2 space-y-0.5">
          <div className="flex items-center gap-2 px-2 py-2 border-b border-sidebar-border mb-1">
            <BcLogo size={20} />
            <span className="text-[11px] font-bold">Btx CliniCos</span>
          </div>
          {items.map((it, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 px-2 py-1.5 rounded text-[10px] ${
                i === 2 ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent"
              }`}
            >
              <it.icon className="h-3 w-3" />
              <span>{it.label}</span>
            </div>
          ))}
        </div>
        <div className="flex-1 rounded-lg border p-3 bg-muted/20 flex items-center justify-center text-[10px] text-muted-foreground text-center">
          15+ módulos integrados<br />em uma única plataforma
        </div>
      </div>
    </BrowserFrame>
  );
}

function OfflineMock() {
  return (
    <BrowserFrame label="Modo offline ativo">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/15 text-warning-foreground border border-warning/30 text-[10px] font-medium w-fit mb-3">
        <WifiOff className="h-3 w-3" />
        <span>Modo offline · 3 alterações pendentes</span>
      </div>

      <div className="rounded-lg border p-3 space-y-2">
        <div className="flex items-center gap-2 text-[10px]">
          <div className="h-6 w-6 rounded-full bg-success/15 text-success flex items-center justify-center">
            <Check className="h-3 w-3" />
          </div>
          <div className="flex-1">
            <div className="font-semibold">Consulta salva localmente</div>
            <div className="text-muted-foreground">Maria Silva · há 2 min</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <div className="h-6 w-6 rounded-full bg-success/15 text-success flex items-center justify-center">
            <Check className="h-3 w-3" />
          </div>
          <div className="flex-1">
            <div className="font-semibold">Receita gerada</div>
            <div className="text-muted-foreground">Aguardando sincronização</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <div className="h-6 w-6 rounded-full bg-success/15 text-success flex items-center justify-center">
            <Check className="h-3 w-3" />
          </div>
          <div className="flex-1">
            <div className="font-semibold">Lançamento financeiro</div>
            <div className="text-muted-foreground">+ R$ 250 — Consulta</div>
          </div>
        </div>
      </div>

      <div className="mt-3 text-[10px] text-muted-foreground flex items-center gap-1.5">
        <Lock className="h-3 w-3" /> Dados criptografados localmente — sincroniza ao reconectar
      </div>
    </BrowserFrame>
  );
}

function AIMock() {
  return (
    <BrowserFrame label="Assistente Roma · IA Clínica">
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <Bot className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="rounded-lg rounded-tl-none bg-muted px-3 py-2 text-[11px]">
              Olá! Posso revisar uma prescrição, transcrever consulta ou tirar dúvidas
              clínicas. O que você precisa?
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-row-reverse">
          <div className="h-8 w-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shrink-0 text-[10px] font-bold">
            Dr
          </div>
          <div className="flex-1 text-right">
            <div className="inline-block rounded-lg rounded-tr-none bg-primary text-primary-foreground px-3 py-2 text-[11px]">
              Revise a receita do paciente João, 6 anos, 22kg.
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <Bot className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="rounded-lg rounded-tl-none bg-muted px-3 py-2 text-[11px] space-y-1.5">
              <div>
                <strong>Amoxicilina:</strong> dose para 22kg = 50mg/kg/dia →{" "}
                <span className="text-primary">1.100mg/dia (367mg 8/8h)</span>
              </div>
              <div className="flex items-center gap-1 text-warning text-[10px]">
                <Bell className="h-3 w-3" /> Alergia registrada: penicilina. Verifique antes de prescrever.
              </div>
            </div>
            <div className="mt-1.5 flex gap-1.5">
              <Button size="sm" variant="outline" className="h-6 text-[10px]">Confirmar</Button>
              <Button size="sm" variant="ghost" className="h-6 text-[10px]">Editar</Button>
            </div>
          </div>
        </div>

        <div className="text-[9px] text-center text-muted-foreground border-t pt-2">
          Toda ação da IA precisa da sua confirmação manual antes de salvar.
        </div>
      </div>
    </BrowserFrame>
  );
}
