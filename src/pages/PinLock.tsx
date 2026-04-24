import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, MessageCircle, Phone, Mail } from "lucide-react";

const CORRECT_PIN = "212963";

interface PinLockProps {
  onUnlock: () => void;
}

const PinLock = ({ onUnlock }: PinLockProps) => {
  const [pin, setPin] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === CORRECT_PIN) {
      onUnlock();
    } else {
      toast.error("PIN incorreto");
      setPin("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
            <Lock className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Btx CliniCos</h1>
          <p className="text-xs text-muted-foreground">Gestão para clínicas e consultórios de saúde</p>
          <p className="text-sm text-muted-foreground mt-1">Digite o PIN para acessar</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="••••••"
            className="text-center text-2xl tracking-[0.5em] h-14"
            autoFocus
          />
          <Button type="submit" className="w-full h-12" disabled={pin.length < 6}>
            Entrar
          </Button>
        </form>

        <Card className="border-primary/20 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 space-y-2.5">
            <p className="text-xs font-semibold text-center text-foreground/80 mb-2">
              Suporte e Contato
            </p>
            <a
              href="https://wa.me/559199987335"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="font-medium">WhatsApp:</span>
              <span>(91) 99998-7335</span>
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

export default PinLock;
