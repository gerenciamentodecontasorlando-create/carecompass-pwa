import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LifeBuoy, MessageCircle, Phone, Mail } from "lucide-react";

export function SupportModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full h-11 gap-2 border-primary/30 hover:border-primary/60 hover:bg-primary/5">
          <LifeBuoy className="h-4 w-4 text-primary" />
          <span className="font-medium">Precisa de ajuda? Falar com Suporte</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-primary" />
            Suporte Btx CliniCos
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 pt-2">
          <a
            href="https://wa.me/5591999873835"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3 hover:border-primary/40 hover:bg-primary/5 transition-colors"
          >
            <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center">
              <MessageCircle className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">WhatsApp</p>
              <p className="text-sm font-semibold">(91) 99987-3835</p>
            </div>
          </a>
          <a
            href="tel:+5591992980333"
            className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3 hover:border-primary/40 hover:bg-primary/5 transition-colors"
          >
            <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center">
              <Phone className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Telefone</p>
              <p className="text-sm font-semibold">(91) 99298-0333</p>
            </div>
          </a>
          <a
            href="mailto:orlandoprogramador80@gmail.com"
            className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3 hover:border-primary/40 hover:bg-primary/5 transition-colors"
          >
            <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">E-mail</p>
              <p className="text-sm font-semibold break-all">orlandoprogramador80@gmail.com</p>
            </div>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
