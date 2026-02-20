import { useState, useEffect } from "react";
import { useJarvis } from "@/hooks/useJarvis";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Mic, MicOff, Volume2, Loader2, Power } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClinicSettings {
  professionalName: string;
  specialty: string;
  registrationNumber: string;
  clinicName: string;
  address: string;
  phone: string;
  email: string;
}

export function JarvisButton() {
  const [settings] = useLocalStorage<ClinicSettings>("clinicSettings", {
    professionalName: "",
    specialty: "",
    registrationNumber: "",
    clinicName: "",
    address: "",
    phone: "",
    email: "",
  });

  const [jarvisSettings] = useLocalStorage<{ enabled: boolean }>("jarvisSettings", { enabled: true });

  const {
    isListening,
    isSpeaking,
    isProcessing,
    isActive,
    transcript,
    lastResponse,
    activate,
    deactivate,
    startListening,
  } = useJarvis({ professionalName: settings.professionalName });

  const [showPanel, setShowPanel] = useState(false);

  // Auto-hide panel after response
  useEffect(() => {
    if (lastResponse) setShowPanel(true);
  }, [lastResponse]);

  if (!jarvisSettings.enabled) return null;

  const getStatusText = () => {
    if (isProcessing) return "Processando...";
    if (isSpeaking) return "Falando...";
    if (isListening) return "Ouvindo...";
    if (isActive) return "Jarvis ativo — toque para falar";
    return "Toque para ativar Jarvis";
  };

  const getStatusIcon = () => {
    if (isProcessing) return <Loader2 className="h-6 w-6 animate-spin" />;
    if (isSpeaking) return <Volume2 className="h-6 w-6 animate-pulse" />;
    if (isListening) return <Mic className="h-6 w-6 animate-pulse" />;
    if (isActive) return <Mic className="h-6 w-6" />;
    return <MicOff className="h-6 w-6" />;
  };

  const handleMainClick = () => {
    if (!isActive) {
      activate();
    } else if (!isListening && !isSpeaking && !isProcessing) {
      startListening();
    }
  };

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 no-print">
        {/* Status panel */}
        {isActive && showPanel && (transcript || lastResponse) && (
          <div className="bg-card border border-border rounded-2xl shadow-lg p-4 max-w-xs w-72 animate-in slide-in-from-bottom-2">
            {transcript && (
              <div className="mb-2">
                <p className="text-xs text-muted-foreground font-medium">Você disse:</p>
                <p className="text-sm text-foreground">{transcript}</p>
              </div>
            )}
            {lastResponse && (
              <div>
                <p className="text-xs text-muted-foreground font-medium">Jarvis:</p>
                <p className="text-sm text-foreground line-clamp-6">{lastResponse.replace(/[#*_`]/g, "")}</p>
              </div>
            )}
            <button
              onClick={() => setShowPanel(false)}
              className="text-xs text-muted-foreground mt-2 hover:text-foreground"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Status label */}
        {isActive && (
          <span className="text-xs bg-card border border-border text-muted-foreground px-3 py-1.5 rounded-full shadow-sm">
            {getStatusText()}
          </span>
        )}

        <div className="flex items-center gap-2">
          {/* Deactivate button */}
          {isActive && (
            <button
              onClick={deactivate}
              className="w-10 h-10 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
              title="Desativar Jarvis"
            >
              <Power className="h-4 w-4" />
            </button>
          )}

          {/* Main mic button */}
          <button
            onClick={handleMainClick}
            disabled={isSpeaking || isProcessing}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all",
              "hover:scale-105 active:scale-95 disabled:opacity-70",
              isActive
                ? isListening
                  ? "bg-primary text-primary-foreground ring-4 ring-primary/30 animate-pulse"
                  : "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground"
            )}
            title={isActive ? "Falar com Jarvis" : "Ativar Jarvis"}
          >
            {getStatusIcon()}
          </button>
        </div>
      </div>
    </>
  );
}
