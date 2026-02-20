import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

interface UseJarvisOptions {
  professionalName: string;
  onGreetingDone?: () => void;
}

const NAVIGATION_MAP: Record<string, string> = {
  dashboard: "/",
  inicio: "/",
  pacientes: "/pacientes",
  agenda: "/agenda",
  receituario: "/receituario",
  receituário: "/receituario",
  atestados: "/atestados",
  atestado: "/atestados",
  odontograma: "/odontograma",
  assistente: "/assistente-ia",
  notas: "/notas",
  financeiro: "/financeiro",
  materiais: "/materiais",
  configuracoes: "/configuracoes",
  configurações: "/configuracoes",
};

function getMaleVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  // Try Portuguese male voices first
  const ptMale = voices.find(
    (v) =>
      v.lang.startsWith("pt") &&
      (v.name.toLowerCase().includes("male") ||
        v.name.toLowerCase().includes("masculin") ||
        v.name.toLowerCase().includes("daniel") ||
        v.name.toLowerCase().includes("ricardo") ||
        v.name.toLowerCase().includes("google") && v.name.toLowerCase().includes("português"))
  );
  if (ptMale) return ptMale;

  // Any Portuguese voice
  const ptAny = voices.find((v) => v.lang.startsWith("pt"));
  if (ptAny) return ptAny;

  // Fallback to any male-sounding voice
  const anyMale = voices.find(
    (v) =>
      v.name.toLowerCase().includes("male") ||
      v.name.toLowerCase().includes("daniel") ||
      v.name.toLowerCase().includes("ricardo")
  );
  return anyMale || voices[0] || null;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function useJarvis({ professionalName, onGreetingDone }: UseJarvisOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lastResponse, setLastResponse] = useState("");
  const [isActive, setIsActive] = useState(false);
  const recognitionRef = useRef<any>(null);
  const navigate = useNavigate();
  const hasGreetedRef = useRef(false);

  // Speak text using SpeechSynthesis
  const speak = useCallback((text: string, onEnd?: () => void) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 1.0;
    utterance.pitch = 0.9; // Slightly deeper for masculine tone
    utterance.volume = 1;
    
    const voice = getMaleVoice();
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

  // Greet when activated
  const greet = useCallback(() => {
    if (hasGreetedRef.current) return;
    hasGreetedRef.current = true;

    const greeting = getGreeting();
    const name = professionalName || "Doutor";
    const title = name.toLowerCase().startsWith("dr") ? name : `Dr. ${name}`;
    const text = `${greeting}, ${title}. Sou o Jarvis, seu assistente. Vamos começar?`;

    speak(text, onGreetingDone);
  }, [professionalName, speak, onGreetingDone]);

  // Try to detect navigation intent
  const tryNavigate = useCallback(
    (text: string): boolean => {
      const lower = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      // Check patterns like "abrir pacientes", "ir para agenda", "navegar para dashboard"
      for (const [keyword, path] of Object.entries(NAVIGATION_MAP)) {
        const normalizedKeyword = keyword.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (
          lower.includes(normalizedKeyword) &&
          (lower.includes("abrir") ||
            lower.includes("ir para") ||
            lower.includes("navegar") ||
            lower.includes("mostrar") ||
            lower.includes("abra") ||
            lower.includes("vai para") ||
            lower.includes("vá para") ||
            lower.includes("va para") ||
            lower.includes("mostra"))
        ) {
          navigate(path);
          speak(`Abrindo ${keyword}.`);
          return true;
        }
      }
      return false;
    },
    [navigate, speak]
  );

  // Send to AI for general questions
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

        // Read streaming response
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
        // Speak the response (limit length for voice)
        const spokenText = fullResponse.length > 500 
          ? fullResponse.slice(0, 500) + "... Resposta completa disponível no chat."
          : fullResponse;
        // Strip markdown for speech
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

  // Process voice input
  const processCommand = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      setTranscript(text);

      // Try navigation first
      if (tryNavigate(text)) return;

      // Otherwise send to AI
      askAI(text);
    },
    [tryNavigate, askAI]
  );

  // Start listening
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

  // Stop listening
  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  // Toggle active state
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
