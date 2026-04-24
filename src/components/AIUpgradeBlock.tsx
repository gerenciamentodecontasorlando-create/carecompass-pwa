import { Crown, Sparkles, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AIUpgradeBlockProps {
  feature?: string;
  compact?: boolean;
}

const WHATSAPP_URL =
  "https://wa.me/5591999873835?text=" +
  encodeURIComponent(
    "Olá! Tenho interesse em fazer upgrade para o plano Enterprise do Btx CliniCos para liberar os recursos de Inteligência Artificial."
  );

export function AIUpgradeBlock({ feature = "Inteligência Artificial", compact = false }: AIUpgradeBlockProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs bg-warning/10 border border-warning/30 text-warning px-3 py-2 rounded-lg">
        <Crown className="h-3.5 w-3.5 shrink-0" />
        <span>Recurso Premium — disponível no plano Enterprise</span>
      </div>
    );
  }

  return (
    <Card className="border-warning/30 bg-gradient-to-br from-warning/5 to-warning/10">
      <CardContent className="p-8 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-warning/20 flex items-center justify-center">
          <Sparkles className="h-8 w-8 text-warning" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Crown className="h-5 w-5 text-warning" />
            <h2 className="text-xl font-bold text-foreground">Recurso Premium</h2>
          </div>
          <p className="text-muted-foreground max-w-md mx-auto">
            <strong>{feature}</strong> está disponível apenas no plano <strong>Enterprise</strong>.
            Faça upgrade para liberar análise de exames por IA, assistente Roma, geração automática de SOAP, revisão de prescrições e muito mais.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto text-left text-sm text-foreground">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <span>Assistente Roma com voz</span>
          </div>
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <span>Análise de radiografias</span>
          </div>
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <span>SOAP automático</span>
          </div>
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <span>Revisão de prescrições</span>
          </div>
        </div>
        <Button asChild size="lg" className="bg-warning text-warning-foreground hover:bg-warning/90">
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4 mr-2" />
            Fazer upgrade pelo WhatsApp
          </a>
        </Button>
        <p className="text-xs text-muted-foreground">
          Plano Enterprise — R$ 119/mês
        </p>
      </CardContent>
    </Card>
  );
}
