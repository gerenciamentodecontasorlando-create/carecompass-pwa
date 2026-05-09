import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

type SpeechRecognitionAlternativeLike = { transcript: string };
type SpeechRecognitionResultLike = { isFinal: boolean; 0: SpeechRecognitionAlternativeLike };
type SpeechRecognitionResultsLike = { length: number; [index: number]: SpeechRecognitionResultLike };
type SpeechRecognitionEventLike = { resultIndex: number; results: SpeechRecognitionResultsLike };
type SpeechRecognitionErrorEventLike = { error: string };
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionConstructorLike = new () => SpeechRecognitionLike;

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
  orcamento: "/orcamento",
  orçamento: "/orcamento",
  "orçamento personalizado": "/orcamento",
  pediatria: "/pediatria",
  pediatrico: "/pediatria",
  pediátrico: "/pediatria",
  dermatologia: "/dermatologia",
  estetica: "/dermatologia",
  estética: "/dermatologia",
  psiquiatria: "/psiquiatria",
  psiquiatrico: "/psiquiatria",
  psiquiátrico: "/psiquiatria",
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

// Returns { voice, isForcedMale } — isForcedMale means we couldn't find a real male voice
// and the caller should lower pitch to simulate male timbre
function getVoiceByGender(gender: "male" | "female"): { voice: SpeechSynthesisVoice | null; isForcedMale: boolean } {
  const voices = window.speechSynthesis.getVoices();
  const ptBrVoices = voices.filter((v) => v.lang === "pt-BR");
  const ptVoices = voices.filter((v) => v.lang.startsWith("pt"));
  const allPt = ptBrVoices.length > 0 ? ptBrVoices : ptVoices;

  console.log("[Roma] Vozes disponíveis pt:", allPt.map(v => `${v.name} (${v.lang})`));

  const femaleKeywords = ["female", "femin", "maria", "luciana", "francisca", "vitoria", "microsoft maria", "google português do brasil"];
  const maleKeywords = ["male", "masculin", "daniel", "ricardo", "marcos", "paulo", "jorge", "pedro", "microsoft daniel"];

  if (gender === "male") {
    // Try explicit male voices first
    for (const keyword of maleKeywords) {
      const found = allPt.find((v) => v.name.toLowerCase().includes(keyword));
      if (found) {
        console.log("[Roma] Voz masculina encontrada:", found.name);
        return { voice: found, isForcedMale: false };
      }
    }
    // Filter out female voices
    const nonFemale = allPt.filter((v) => {
      const n = v.name.toLowerCase();
      return !femaleKeywords.some((k) => n.includes(k));
    });
    if (nonFemale.length > 0) {
      console.log("[Roma] Voz não-feminina selecionada:", nonFemale[0].name);
      return { voice: nonFemale[0], isForcedMale: false };
    }
    // No male voice available — use any pt voice but force low pitch
    console.warn("[Roma] Nenhuma voz masculina nativa, usando pitch grave para simular");
    const fallback = allPt[0] || voices[0] || null;
    return { voice: fallback, isForcedMale: true };
  } else {
    for (const keyword of femaleKeywords) {
      const found = allPt.find((v) => v.name.toLowerCase().includes(keyword));
      if (found) {
        console.log("[Roma] Voz feminina encontrada:", found.name);
        return { voice: found, isForcedMale: false };
      }
    }
    return { voice: allPt[0] || voices[0] || null, isForcedMale: false };
  }
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function getPeriodOfDay(hour = new Date().getHours()): string {
  if (hour < 6) return "madrugada";
  if (hour < 12) return "manhã";
  if (hour < 18) return "tarde";
  return "noite";
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
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const shouldListenRef = useRef(false);
  const isActiveRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const processCommandRef = useRef<(t: string) => void>(() => {});
  const restartTimerRef = useRef<number | null>(null);
  const navigate = useNavigate();
  const hasGreetedRef = useRef(false);
  const voiceSettingsRef = useRef<JarvisVoiceSettings>(voiceSettings || DEFAULT_VOICE);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);
  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);
  useEffect(() => { isProcessingRef.current = isProcessing; }, [isProcessing]);

  // Keep ref in sync with latest props
  useEffect(() => {
    if (voiceSettings) {
      voiceSettingsRef.current = voiceSettings;
    }
  }, [voiceSettings]);

  const speakWithElevenLabs = useCallback(async (text: string, speed: number, onEnd?: () => void) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tts-speak`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, speed }),
        }
      );

      if (!response.ok) throw new Error("TTS failed");

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        onEnd?.();
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        onEnd?.();
      };

      audioRef.current = audio;
      await audio.play();
    } catch (e) {
      console.warn("[Roma] ElevenLabs TTS falhou, usando voz do navegador:", e);
      speakWithBrowser(text, onEnd);
    }
  }, []);

  const speakWithBrowser = useCallback((text: string, onEnd?: () => void) => {
    window.speechSynthesis.cancel();
    const vs = voiceSettingsRef.current;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = vs.speed;
    utterance.volume = vs.volume;
    utterance.pitch = vs.pitch;
    
    const { voice } = getVoiceByGender(vs.voiceGender);
    if (voice) utterance.voice = voice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => { setIsSpeaking(false); onEnd?.(); };
    utterance.onerror = () => { setIsSpeaking(false); onEnd?.(); };
    window.speechSynthesis.speak(utterance);
  }, []);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    const vs = voiceSettingsRef.current;
    
    if (vs.voiceGender === "male") {
      speakWithElevenLabs(text, vs.speed, onEnd);
    } else {
      speakWithBrowser(text, onEnd);
    }
  }, [speakWithElevenLabs, speakWithBrowser]);

  const greet = useCallback(() => {
    if (hasGreetedRef.current) return;
    hasGreetedRef.current = true;

    const greeting = getGreeting();
    const namePart = professionalName ? `, ${professionalName}` : " doutor";
    const text = `${greeting}${namePart}. Estou aqui para ajudar. Pode falar.`;

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
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (!accessToken) {
          speak("Sua sessão expirou. Faça login novamente para usar o Roma.");
          setIsProcessing(false);
          return;
        }

        // Inject current local date/time so Roma knows day vs night, weekday, etc.
        const now = new Date();
        const dateStr = now.toLocaleString("pt-BR", {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
          hour: "2-digit", minute: "2-digit",
        });
        const periodo = getPeriodOfDay(now.getHours());
        const contextPrefix = `[Contexto: agora é ${dateStr}, período do dia: ${periodo}.] `;

        const resp = await fetch(AI_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: contextPrefix + text }],
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
      const command = text.trim();
      if (!command || isProcessingRef.current || isSpeakingRef.current) return;
      setTranscript(command);

      try { recognitionRef.current?.stop(); } catch { /* noop */ }
      setIsListening(false);

      if (tryNavigate(command)) return;
      askAI(command);
    },
    [tryNavigate, askAI]
  );

  // Keep stable ref to latest processCommand so the recognition handlers don't go stale
  useEffect(() => { processCommandRef.current = processCommand; }, [processCommand]);

  // Initialize SpeechRecognition ONCE so the user's gesture context is preserved
  // across awaits and so we can reliably auto-restart it (Alexa-like behavior).
  const ensureRecognition = useCallback(() => {
    if (recognitionRef.current) return recognitionRef.current;
    const Ctor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Ctor) {
      toast.error("Seu navegador não suporta reconhecimento de voz.");
      return null;
    }
    const recognition = new Ctor();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let finalBuffer = "";
    let interimBuffer = "";
    let silenceTimer: number | null = null;

    const flush = () => {
      const text = (finalBuffer || interimBuffer).trim();
      finalBuffer = "";
      interimBuffer = "";
      if (silenceTimer) {
        window.clearTimeout(silenceTimer);
        silenceTimer = null;
      }
      if (text) processCommandRef.current(text);
    };

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) {
          finalBuffer += " " + r[0].transcript;
        } else {
          interim += " " + r[0].transcript;
        }
      }
      interimBuffer = interim.trim();
      const previewText = (finalBuffer || interimBuffer).trim();
      if (previewText) setTranscript(previewText);

      if (silenceTimer) window.clearTimeout(silenceTimer);
      if (previewText) silenceTimer = window.setTimeout(flush, 1100);
    };

    recognition.onerror = (event: any) => {
      const err = event.error;
      console.warn("[Roma] recognition error:", err);
      if (err === "not-allowed" || err === "service-not-allowed") {
        toast.error("Permissão do microfone bloqueada. Habilite nas configurações do navegador.");
        shouldListenRef.current = false;
        setIsListening(false);
        return;
      }
      if (err === "audio-capture") {
        toast.error("Microfone não disponível.");
        shouldListenRef.current = false;
        setIsListening(false);
      }
      // 'no-speech', 'aborted', 'network' -> just let onend handle restart
    };

    recognition.onend = () => {
      setIsListening(false);
      if (silenceTimer) { window.clearTimeout(silenceTimer); silenceTimer = null; }
      if ((finalBuffer || interimBuffer).trim()) flush();
      // Auto-restart while Roma is active and not currently speaking
      if (
        shouldListenRef.current &&
        isActiveRef.current &&
        !isSpeakingRef.current &&
        !isProcessingRef.current
      ) {
        if (restartTimerRef.current) window.clearTimeout(restartTimerRef.current);
        restartTimerRef.current = window.setTimeout(() => {
          try {
            recognition.start();
            setIsListening(true);
          } catch (e) {
            console.warn("[Roma] restart failed:", e);
          }
        }, 250);
      }
    };

    recognitionRef.current = recognition;
    return recognition;
  }, []);

  const startListening = useCallback(() => {
    const recognition = ensureRecognition();
    if (!recognition) return;
    shouldListenRef.current = true;
    if (isSpeakingRef.current || isProcessingRef.current) return;
    try {
      recognition.start();
      setIsListening(true);
    } catch {
      // already started — ignore
      setIsListening(true);
    }
  }, [ensureRecognition]);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    if (restartTimerRef.current) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    try { recognitionRef.current?.stop(); } catch { /* noop */ }
    setIsListening(false);
  }, []);

  const activate = useCallback(() => {
    // Initialize recognition synchronously inside the user gesture to preserve permission context
    ensureRecognition();
    if (!isActive) {
      setIsActive(true);
      isActiveRef.current = true;
      greet();
    }
    if (!isListening && !isSpeaking && !isProcessing) {
      startListening();
    }
  }, [isActive, isListening, isSpeaking, isProcessing, greet, startListening, ensureRecognition]);

  const deactivate = useCallback(() => {
    stopListening();
    window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsActive(false);
    isActiveRef.current = false;
    setIsSpeaking(false);
    hasGreetedRef.current = false;
  }, [stopListening]);

  // When Roma finishes speaking/processing while active, auto-resume listening (Alexa-like)
  useEffect(() => {
    if (isActive && !isSpeaking && !isProcessing && !isListening && shouldListenRef.current) {
      const t = window.setTimeout(() => {
        try { recognitionRef.current?.start(); setIsListening(true); } catch { /* ignore */ }
      }, 300);
      return () => window.clearTimeout(t);
    }
  }, [isActive, isSpeaking, isProcessing, isListening]);

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
