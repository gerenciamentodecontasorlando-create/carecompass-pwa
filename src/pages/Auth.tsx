import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Lock, UserPlus, LogIn, Shield, Globe, Phone, Mail, MessageCircle } from "lucide-react";

const PRIVACY_POLICY = `POLÍTICA DE PRIVACIDADE — Btx CliniCos

Em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018), informamos:

1. DADOS COLETADOS
Coletamos dados pessoais do profissional (nome, email, telefone, registro profissional) e dados de pacientes (nome, CPF, telefone, endereço, dados clínicos) inseridos pelo profissional responsável.

2. FINALIDADE DO TRATAMENTO
Os dados são tratados exclusivamente para:
• Gestão de prontuários clínicos e evolução dos pacientes;
• Agendamento de consultas;
• Emissão de receituários e atestados;
• Controle financeiro e de materiais da clínica.

3. BASE LEGAL
O tratamento dos dados é fundamentado no cumprimento de obrigação legal/regulatória (art. 7º, II) e na execução de contrato (art. 7º, V) da LGPD.

4. ARMAZENAMENTO E SEGURANÇA
Os dados são armazenados em servidores seguros com criptografia em trânsito (TLS) e em repouso. O acesso é restrito ao profissional e à equipe da clínica cadastrada.

5. COMPARTILHAMENTO
Os dados NÃO são compartilhados com terceiros, exceto quando exigido por lei ou autoridade competente.

6. DIREITOS DO TITULAR
O titular dos dados pode solicitar: acesso, correção, exclusão, portabilidade e revogação do consentimento, mediante contato com o responsável pela clínica.

7. RETENÇÃO
Os dados clínicos são mantidos pelo prazo mínimo legal de 20 anos (CFM Resolução nº 1.821/2007). Dados de conta podem ser excluídos a pedido, respeitando obrigações legais.

8. RESPONSÁVEL
O profissional de saúde cadastrado é o controlador dos dados de seus pacientes, nos termos da LGPD.`;

const TERMS_OF_USE = `TERMOS DE USO — Btx CliniCos

1. ACEITE
Ao criar uma conta, o usuário aceita integralmente estes Termos e a Política de Privacidade.

2. LICENÇA DE USO
O Btx CliniCos é licenciado como Software como Serviço (SaaS). É vedada a cópia, redistribuição, engenharia reversa ou sublicenciamento.

3. RESPONSABILIDADES DO USUÁRIO
• Manter suas credenciais de acesso em sigilo;
• Inserir dados verdadeiros e atualizados;
• Garantir o consentimento dos pacientes para coleta de dados;
• Cumprir as regulamentações do seu conselho profissional;
• Realizar backup periódico de informações críticas.

4. DADOS DE PACIENTES
O profissional é o CONTROLADOR dos dados dos pacientes inseridos no sistema, conforme a LGPD. O Btx CliniCos atua como OPERADOR.

5. LIMITAÇÃO DE RESPONSABILIDADE
O Btx CliniCos não se responsabiliza por:
• Decisões clínicas baseadas nas informações do sistema;
• Perdas decorrentes de uso indevido;
• Indisponibilidade temporária por manutenção.

6. PROPRIEDADE INTELECTUAL
Todo o software, marca, interface e algoritmos são protegidos por direitos autorais. Registro INPI em andamento.`;

const Auth = () => {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentLang = i18n.language?.startsWith("es") ? "es" : "pt";

  const toggleLanguage = () => {
    const newLang = currentLang === "pt" ? "es" : "pt";
    i18n.changeLanguage(newLang);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message === "Invalid login credentials"
        ? t("auth.errors.wrongCredentials")
        : error.message);
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { toast.error(t("auth.errors.nameRequired")); return; }
    if (password.length < 6) { toast.error(t("auth.errors.shortPassword")); return; }
    if (!lgpdConsent) { toast.error(t("auth.errors.acceptTerms")); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, clinic_name: clinicName || "Minha Clínica", lgpd_consent: true, lgpd_consent_date: new Date().toISOString() },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("auth.accountCreated"));
      setMode("login");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      {/* Language Toggle - Top Right */}
      <button
        onClick={toggleLanguage}
        className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium transition-all hover:scale-105 shadow-sm border border-border"
      >
        <Globe className="h-4 w-4" />
        <span>{currentLang === "pt" ? "🇧🇷 PT" : "🇪🇸 ES"}</span>
      </button>

      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
            <Lock className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Btx CliniCos</h1>
          <p className="text-xs text-muted-foreground mb-1">{t("auth.title")}</p>
          <p className="text-sm text-muted-foreground">
            {mode === "login" ? t("auth.login") : t("auth.signup")}
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-4">
              {mode === "signup" && (
                <>
                  <div className="grid gap-2">
                    <Label>{t("auth.fullName")}</Label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t("auth.fullNamePlaceholder")} required />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("auth.clinicName")}</Label>
                    <Input value={clinicName} onChange={(e) => setClinicName(e.target.value)} placeholder={t("auth.clinicNamePlaceholder")} />
                  </div>
                </>
              )}
              <div className="grid gap-2">
                <Label>{t("auth.email")}</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("auth.emailPlaceholder")} required />
              </div>
              <div className="grid gap-2">
                <Label>{t("auth.password")}</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("auth.passwordPlaceholder")} required minLength={6} />
              </div>

              {mode === "signup" && (
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <Checkbox id="lgpd-consent" checked={lgpdConsent} onCheckedChange={(checked) => setLgpdConsent(checked === true)} className="mt-1" />
                    <label htmlFor="lgpd-consent" className="text-xs text-muted-foreground leading-relaxed">
                      {t("auth.lgpdAccept")}{" "}
                      <Dialog>
                        <DialogTrigger asChild>
                          <button type="button" className="text-primary underline hover:no-underline">{t("auth.termsOfUse")}</button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader><DialogTitle>{t("auth.termsOfUse")}</DialogTitle></DialogHeader>
                          <ScrollArea className="h-[400px] pr-4"><pre className="whitespace-pre-wrap text-sm">{TERMS_OF_USE}</pre></ScrollArea>
                        </DialogContent>
                      </Dialog>
                      {" "}{t("auth.and")}{" "}
                      <Dialog>
                        <DialogTrigger asChild>
                          <button type="button" className="text-primary underline hover:no-underline">{t("auth.privacyPolicy")}</button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader><DialogTitle>{t("auth.privacyPolicy")}</DialogTitle></DialogHeader>
                          <ScrollArea className="h-[400px] pr-4"><pre className="whitespace-pre-wrap text-sm">{PRIVACY_POLICY}</pre></ScrollArea>
                        </DialogContent>
                      </Dialog>
                    </label>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Shield className="h-3.5 w-3.5" />
                    <span>{t("auth.lgpdShield")}</span>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full h-12" disabled={loading || (mode === "signup" && !lgpdConsent)}>
                {mode === "login" ? (
                  <><LogIn className="h-4 w-4 mr-2" />{t("auth.loginBtn")}</>
                ) : (
                  <><UserPlus className="h-4 w-4 mr-2" />{t("auth.signupBtn")}</>
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button type="button" className="text-sm text-primary hover:underline" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
                {mode === "login" ? t("auth.noAccount") : t("auth.hasAccount")}
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          <Shield className="h-3 w-3 inline mr-1" />
          {t("auth.lgpdProtected")}
        </p>

        <Card className="border-primary/20 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 space-y-2.5">
            <p className="text-xs font-semibold text-center text-foreground/80 mb-2">
              {currentLang === "pt" ? "Suporte e Contato" : "Soporte y Contacto"}
            </p>
            <a
              href="https://wa.me/5591999873835"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="font-medium">WhatsApp:</span>
              <span>(91) 99987-3835</span>
            </a>
            <a
              href="https://wa.me/5591992980333"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="font-medium">Tel:</span>
              <span>(91) 99298-0333</span>
            </a>
            <a
              href="mailto:orlandoprogramador80@gmail.com"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors break-all"
            >
              <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>orlandoprogramador80@gmail.com</span>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
