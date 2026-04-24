import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Mic, Square, Pause, Play, Loader2, FileText, Clock, Shield } from "lucide-react";
import { useAIAccess } from "@/hooks/useAIAccess";

const RECORDING_CONSENT_TEXT = `TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO — GRAVAÇÃO DE CONSULTA

Em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018) e o Código de Ética Médica, declaro que:

1. FINALIDADE DA GRAVAÇÃO
A gravação de áudio desta consulta será utilizada exclusivamente para:
• Transcrição automática da consulta para registro no prontuário eletrônico;
• Geração de evolução clínica no formato SOAP (Subjetivo, Objetivo, Avaliação, Plano);
• Melhoria da qualidade do atendimento e documentação clínica.

2. PROCESSAMENTO
O áudio será processado por inteligência artificial para transcrição e será descartado após o processamento. Apenas o texto transcrito e a evolução gerada serão armazenados no prontuário.

3. CONFIDENCIALIDADE
Todo o conteúdo da gravação é protegido pelo sigilo profissional e pela LGPD. Os dados não serão compartilhados com terceiros.

4. DIREITO DE RECUSA
O paciente pode recusar a gravação a qualquer momento, sem qualquer prejuízo ao atendimento.

5. REVOGAÇÃO
O consentimento pode ser revogado a qualquer momento, mediante solicitação ao profissional responsável.`;

interface Segment {
  speaker: string;
  text: string;
}

interface SOAPResult {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  procedure: string;
  tooth_number: string;
}

interface ConsultationRecorderProps {
  patientName: string;
  onSoapGenerated: (soap: SOAPResult) => void;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export function ConsultationRecorder({ patientName, onSoapGenerated }: ConsultationRecorderProps) {
  const { hasAIAccess } = useAIAccess();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGeneratingSoap, setIsGeneratingSoap] = useState(false);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [fullText, setFullText] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingChunks, setRecordingChunks] = useState<Blob[]>([]);
  const [showConsent, setShowConsent] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const startTimer = () => {
    timerRef.current = window.setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleStartRecording = useCallback(() => {
    if (!consentAccepted) {
      setShowConsent(true);
      return;
    }
    doStartRecording();
  }, [consentAccepted]);

  const doStartRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      setSegments([]);
      setFullText("");
      startTimer();
    } catch {
      toast.error("Não foi possível acessar o microfone. Verifique as permissões.");
    }
  }, []);

  const acceptConsentAndRecord = useCallback(() => {
    setConsentAccepted(true);
    setShowConsent(false);
    // Start recording after consent
    setTimeout(() => doStartRecording(), 100);
  }, [doStartRecording]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      stopTimer();
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startTimer();
    }
  }, []);

  const stopAndTranscribe = useCallback(async () => {
    if (!mediaRecorderRef.current) return;
    stopTimer();

    return new Promise<void>((resolve) => {
      const recorder = mediaRecorderRef.current!;
      const originalOnStop = recorder.onstop;

      recorder.onstop = async (ev) => {
        if (originalOnStop && typeof originalOnStop === "function") {
          (originalOnStop as (ev: Event) => void)(ev);
        }

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordingChunks([...chunksRef.current]);
        setIsRecording(false);
        setIsPaused(false);

        await transcribeAudio(blob);
        resolve();
      };

      recorder.stop();
    });
  }, []);

  const saveSegmentAndContinue = useCallback(async () => {
    if (!mediaRecorderRef.current) return;
    stopTimer();

    const recorder = mediaRecorderRef.current;
    const stream = recorder.stream;

    return new Promise<void>((resolve) => {
      recorder.onstop = async (ev) => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setIsRecording(false);
        setIsPaused(false);

        await transcribeAudio(blob);
        resolve();
      };

      recorder.stop();
    });
  }, []);

  const transcribeAudio = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("audio", blob, "consultation.webm");

      const response = await fetch(`${SUPABASE_URL}/functions/v1/transcribe-consultation`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Erro" }));
        throw new Error(err.error || "Erro na transcrição");
      }

      const data = await response.json();
      setSegments((prev) => [...prev, ...(data.segments || [])]);
      setFullText((prev) => (prev ? prev + " " : "") + (data.text || ""));
      toast.success("Transcrição concluída!");
    } catch (e) {
      console.error("Transcription error:", e);
      toast.error(e instanceof Error ? e.message : "Erro ao transcrever áudio");
    }
    setIsTranscribing(false);
  };

  const generateSoap = async () => {
    if (!fullText && segments.length === 0) {
      toast.error("Nenhuma transcrição disponível");
      return;
    }

    setIsGeneratingSoap(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-soap`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          transcript: fullText,
          segments,
          patientName,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Erro" }));
        throw new Error(err.error || "Erro ao gerar SOAP");
      }

      const soap = await response.json();
      onSoapGenerated(soap);
      toast.success("Rascunho SOAP gerado! Revise e salve a evolução.");
    } catch (e) {
      console.error("SOAP generation error:", e);
      toast.error(e instanceof Error ? e.message : "Erro ao gerar SOAP");
    }
    setIsGeneratingSoap(false);
  };

  const getSpeakerLabel = (speaker: string) => {
    if (speaker === "speaker_0") return "Falante 1";
    if (speaker === "speaker_1") return "Falante 2";
    return speaker;
  };

  const getSpeakerColor = (speaker: string) => {
    if (speaker === "speaker_0") return "default";
    if (speaker === "speaker_1") return "secondary";
    return "outline";
  };

  const isProcessing = isTranscribing || isGeneratingSoap;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Mic className="h-4 w-4" />
          Transcrição de Consulta
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recording controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isRecording ? (
            <Button
              onClick={handleStartRecording}
              disabled={isProcessing}
              variant="default"
              size="sm"
            >
              <Mic className="h-4 w-4 mr-2" />
              {segments.length > 0 ? "Gravar Mais" : "Iniciar Gravação"}
            </Button>
          ) : (
            <>
              {isPaused ? (
                <Button onClick={resumeRecording} size="sm" variant="outline">
                  <Play className="h-4 w-4 mr-2" />Continuar
                </Button>
              ) : (
                <Button onClick={pauseRecording} size="sm" variant="outline">
                  <Pause className="h-4 w-4 mr-2" />Pausar
                </Button>
              )}
              <Button onClick={stopAndTranscribe} size="sm" variant="destructive">
                <Square className="h-4 w-4 mr-2" />Parar e Transcrever
              </Button>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatTime(recordingTime)}
                {!isPaused && (
                  <span className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                )}
              </span>
            </>
          )}

          {segments.length > 0 && !isRecording && (
            <Button
              onClick={generateSoap}
              disabled={isProcessing}
              size="sm"
              variant="secondary"
            >
              {isGeneratingSoap ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Gerar SOAP
            </Button>
          )}

          {isTranscribing && (
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />Transcrevendo...
            </span>
          )}
        </div>

        {/* Transcription display */}
        {segments.length > 0 && (
          <div className="border rounded-lg p-3 max-h-60 overflow-y-auto space-y-2 bg-muted/30">
            <p className="text-xs text-muted-foreground font-medium mb-2">
              Transcrição ({segments.length} segmentos)
            </p>
            {segments.map((seg, i) => (
              <div key={i} className="flex gap-2 items-start">
                <Badge variant={getSpeakerColor(seg.speaker) as any} className="shrink-0 text-[10px]">
                  {getSpeakerLabel(seg.speaker)}
                </Badge>
                <p className="text-sm">{seg.text}</p>
              </div>
            ))}
          </div>
        )}

        {segments.length === 0 && !isRecording && (
          <p className="text-xs text-muted-foreground">
            Grave a consulta para transcrever automaticamente a conversa entre profissional e paciente.
            A IA irá gerar um rascunho SOAP para revisão.
          </p>
        )}
      </CardContent>

      {/* Consent Dialog */}
      <Dialog open={showConsent} onOpenChange={setShowConsent}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Termo de Consentimento — Gravação
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[350px] pr-4">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed">{RECORDING_CONSENT_TEXT}</pre>
          </ScrollArea>
          <div className="space-y-4 pt-2">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="recording-consent"
                checked={consentChecked}
                onCheckedChange={(checked) => setConsentChecked(checked === true)}
                className="mt-1"
              />
              <label htmlFor="recording-consent" className="text-sm text-muted-foreground leading-relaxed">
                O paciente foi informado e autorizou a gravação desta consulta para fins de transcrição e registro em prontuário.
              </label>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setShowConsent(false); setConsentChecked(false); }} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={acceptConsentAndRecord} disabled={!consentChecked} className="flex-1">
                <Mic className="h-4 w-4 mr-2" />Aceitar e Gravar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
