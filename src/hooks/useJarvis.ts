import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

export interface JarvisVoiceSettings {
  speed: number;
  pitch: number;
  volume: number;
  voiceGender: "male" | "female";
  alwaysListening: boolean;
}

interface UseJarvisOptions {
  professionalName: string;
  voiceSettings?: JarvisVoiceSettings;
  onGreetingDone?: () => void;
}

const NAVIGATION_MAP: Record<string, string> = {
  dashboard: "/",
  inicio: "/",
  "pagina inicial": "/",
  "tela inicial": "/",
  pacientes: "/pacientes",
  paciente: "/pacientes",
  agenda: "/agenda",
  agendamento: "/agenda",
  agendamentos: "/agenda",
  receituario: "/receituario",
  receituário: "/receituario",
  receita: "/receituario",
  receitas: "/receituario",
  atestados: "/atestados",
  atestado: "/atestados",
  odontograma: "/odontograma",
  assistente: "/assistente-ia",
  "assistente ia": "/assistente-ia",
  ia: "/assistente-ia",
  notas: "/notas",
  nota: "/notas",
  financeiro: "/financeiro",
  financas: "/financeiro",
  finanças: "/financeiro",
  materiais: "/materiais",
  material: "/materiais",
  estoque: "/materiais",
  configuracoes: "/configuracoes",
  configurações: "/configuracoes",
  config: "/configuracoes",
};

const NAV_TRIGGERS = [
  "abrir", "abra", "abre",
  "ir para", "ir pra", "ir pro",
  "vai para", "vai pra", "vai pro",
  "vá para", "va para",
  "navegar", "navegue",
  "mostrar", "mostra", "mostre",
  "acessar", "acesse", "acessa",
  "entrar", "entre", "entra",
  "carregar", "carregue",
];

function getVoiceByGender(gender: "male" | "female"): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const ptBrVoices = voices.filter((v) => v.lang === "pt-BR");
  const ptVoices = voices.filter((v) => v.lang.startsWith("pt"));
  const allPt = ptBrVoices.length > 0 ? ptBrVoices : ptVoices;

  const maleKeywords = ["male", "masculin", "daniel", "ricardo", "marcos", "paulo", "jorge", "pedro", "google brasil", "microsoft daniel"];
  const femaleKeywords = ["female", "femin", "maria", "luciana", "francisca", "vitoria", "microsoft maria"];

  if (gender === "male") {
    for (const keyword of maleKeywords) {
      const found = allPt.find((v) => v.name.toLowerCase().includes(keyword));
      if (found) return found;
    }
    const nonFemale = allPt.filter((v) => {
      const n = v.name.toLowerCase();
      return !femaleKeywords.some((k) => n.includes(k));
    });
    return nonFemale[0] || allPt[0] || voices[0] || null;
  } else {
    for (const keyword of femaleKeywords) {
      const found = allPt.find((v) => v.name.toLowerCase().includes(keyword));
      if (found) return found;
    }
    return allPt[0] || voices[0] || null;
  }
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

const DEFAULT_VOICE: JarvisVoiceSettings = {
  speed: 1.0,
  pitch: 0.7,
  volume: 1.0,
  voiceGender: "male",
  alwaysListening: false,
};

export function useJarvis({ professionalName, voiceSettings, onGreetingDone }: UseJarvisOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lastResponse, setLastResponse] = useState("");
  const [isActive, setIsActive] = useState(false);
  const recognitionRef = useRef<any>(null);
  const navigate = useNavigate();
  const hasGreetedRef = useRef(false);
  const voiceSettingsRef = useRef<JarvisVoiceSettings>(voiceSettings || DEFAULT_VOICE);

  // Keep ref in sync with latest props
  useEffect(() => {
    if (voiceSettings) {
      voiceSettingsRef.current = voiceSettings;
    }
  }, [voiceSettings]);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    window.speechSynthesis.cancel();
    
    const vs = voiceSettingsRef.current;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = vs.speed;
    utterance.pitch = vs.pitch;
    utterance.volume = vs.volume;
    
    const voice = getVoiceByGender(vs.voiceGender);
    if (voice) utterance.voice = voice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      onEnd?.();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const greet = useCallback(() => {
    if (hasGreetedRef.current) return;
    hasGreetedRef.current = true;

    const greeting = getGreeting();
    const name = professionalName || "Doutor";
    const title = name.toLowerCase().startsWith("dr") ? name : `Dr. ${name}`;
    const text = `${greeting}, ${title}. Sou o Nando, seu assistente. Vamos começar?`;

    speak(text, onGreetingDone);
  }, [professionalName, speak, onGreetingDone]);

  const tryNavigate = useCallback(
    (text: string): boolean => {
      const lower = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      // Check if any navigation trigger word is present
      const hasTrigger = NAV_TRIGGERS.some((t) => {
        const normalized = t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return lower.includes(normalized);
      });
      
      if (!hasTrigger) return false;

      // Find which page keyword matches
      for (const [keyword, path] of Object.entries(NAVIGATION_MAP)) {
        const normalizedKeyword = keyword.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (lower.includes(normalizedKeyword)) {
          navigate(path);
          const friendlyName = keyword.charAt(0).toUpperCase() + keyword.slice(1);
          speak(`Abrindo ${friendlyName}.`);
          return true;
        }
      }
      return false;
    },
    [navigate, speak]
  );

  const askAI = useCallback(
    async (text: string) => {
      setIsProcessing(true);
      try {
        const resp = await fetch(AI_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: text }],
            type: "jarvis",
          }),
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({ error: "Erro" }));
          speak(err.error || "Desculpe, ocorreu um erro.");
          setIsProcessing(false);
          return;
        }

        const reader = resp.body?.getReader();
        if (!reader) throw new Error("Sem stream");
        const decoder = new TextDecoder();
        let textBuffer = "";
        let fullResponse = "";

        let done = false;
        while (!done) {
          const { done: rd, value } = await reader.read();
          if (rd) break;
          textBuffer += decoder.decode(value, { stream: true });

          let nl: number;
          while ((nl = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, nl);
            textBuffer = textBuffer.slice(nl + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (json === "[DONE]") {
              done = true;
              break;
            }
            try {
              const parsed = JSON.parse(json);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) fullResponse += content;
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }

        setLastResponse(fullResponse);
        const spokenText = fullResponse.length > 500 
          ? fullResponse.slice(0, 500) + "... Resposta completa disponível no chat."
          : fullResponse;
        const cleanText = spokenText.replace(/[#*_`>\-\[\]()]/g, "").replace(/\n+/g, ". ");
        speak(cleanText);
      } catch (e) {
        console.error("Jarvis AI error:", e);
        speak("Desculpe, não consegui processar sua solicitação.");
      }
      setIsProcessing(false);
    },
    [speak]
  );

  const processCommand = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      setTranscript(text);
      if (tryNavigate(text)) return;
      askAI(text);
    },
    [tryNavigate, askAI]
  );

  const startListening = useCallback(() => {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      toast.error("Seu navegador não suporta reconhecimento de voz.");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[0][0].transcript;
      processCommand(result);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== "no-speech" && event.error !== "aborted") {
        toast.error("Erro no reconhecimento de voz");
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [processCommand]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const activate = useCallback(() => {
    if (!isActive) {
      setIsActive(true);
      greet();
    }
    if (!isListening && !isSpeaking && !isProcessing) {
      startListening();
    }
  }, [isActive, isListening, isSpeaking, isProcessing, greet, startListening]);

  const deactivate = useCallback(() => {
    stopListening();
    window.speechSynthesis.cancel();
    setIsActive(false);
    setIsSpeaking(false);
    hasGreetedRef.current = false;
  }, [stopListening]);

  // Load voices
  useEffect(() => {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }, []);

  return {
    isListening,
    isSpeaking,
    isProcessing,
    isActive,
    transcript,
    lastResponse,
    activate,
    deactivate,
    startListening,
    stopListening,
    speak,
  };
}
