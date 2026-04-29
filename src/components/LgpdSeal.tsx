import { ShieldCheck, Lock } from "lucide-react";

/**
 * Selo LGPD elegante para rodapé das telas de entrada.
 * Visual: gradient sutil, dois ícones (escudo + cadeado), texto compacto e refinado.
 */
export function LgpdSeal() {
  return (
    <div className="relative">
      <div
        className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-primary/[0.03] p-3 shadow-sm backdrop-blur-sm"
      >
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md shadow-primary/20">
              <ShieldCheck className="h-5 w-5 text-primary-foreground" strokeWidth={2.2} />
            </div>
            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-card border border-primary/30 flex items-center justify-center">
              <Lock className="h-2.5 w-2.5 text-primary" strokeWidth={2.5} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold tracking-wide text-foreground uppercase">
              Conformidade LGPD
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Lei nº 13.709/2018 · Dados criptografados AES-256 · TLS/SSL
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
