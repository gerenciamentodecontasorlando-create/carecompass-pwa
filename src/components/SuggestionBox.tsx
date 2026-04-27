import { useState } from "react";
import { Lightbulb, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const WHATSAPP_NUMBER = "5591999873835";

export function SuggestionBox() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) {
      toast.error("Escreva sua sugestão antes de enviar");
      return;
    }
    const msg = `*Sugestão Btx CliniCos:*\n\n${text.trim()}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
    setText("");
    setOpen(false);
    toast.success("Obrigado pela sua sugestão!");
  };

  return (
    <>
      {/* Floating button — bottom-left to avoid Roma assistant on the right */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-50 w-12 h-12 rounded-full bg-accent text-accent-foreground border border-border shadow-lg flex items-center justify-center hover:scale-105 transition-transform no-print"
        title="Enviar sugestão"
      >
        <Lightbulb className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                Caixa de Sugestões
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Sua sugestão será enviada direto para o WhatsApp do desenvolvedor. Conte o que pode melhorar!
              </p>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                placeholder="Ex: Seria ótimo se a agenda permitisse arrastar consultas..."
                autoFocus
              />
              <Button onClick={handleSend} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Enviar via WhatsApp
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
