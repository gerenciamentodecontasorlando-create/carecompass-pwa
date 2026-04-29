import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { BcLogo } from "@/components/BcLogo";
import { LgpdSeal } from "@/components/LgpdSeal";
import { SupportModal } from "@/components/SupportModal";

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
    <div className="min-h-screen flex flex-col items-center justify-between bg-gradient-to-br from-background via-background to-primary/5 px-4 py-8">
      <div className="flex-1 w-full flex items-center justify-center">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex flex-col items-center gap-3">
            <BcLogo size={92} />
            <h1 className="text-2xl font-bold tracking-tight">Btx CliniCos</h1>
            <p className="text-xs text-muted-foreground text-center">
              Gestão para clínicas e consultórios de saúde
            </p>
            <p className="text-sm text-muted-foreground mt-1">Digite o PIN para acessar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
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

          <SupportModal />
        </div>
      </div>

      <div className="w-full max-w-sm pt-6">
        <LgpdSeal />
      </div>
    </div>
  );
};

export default PinLock;
