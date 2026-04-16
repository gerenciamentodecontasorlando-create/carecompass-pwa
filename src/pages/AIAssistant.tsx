import { useState, useRef, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Bot, Send, Loader2, Trash2, Pill, Stethoscope, Building2, User, X, ImagePlus } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useClinicData } from "@/hooks/useClinicData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Msg = { role: "user" | "assistant"; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> };
type AssistantType = "diagnosis" | "prescription" | "clinic";

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

const AIAssistant = () => {
  const { clinicId } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [type, setType] = useState<AssistantType>("diagnosis");
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Temp image state
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const [tempImagePath, setTempImagePath] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Patient selection
  const { data: patients } = useClinicData("patients", { orderBy: "name", orderAsc: true });
  const [selectedPatient, setSelectedPatient] = useState<Record<string, unknown> | null>(null);
  const [patientContext, setPatientContext] = useState<Record<string, unknown> | null>(null);
  const [patientOpen, setPatientOpen] = useState(false);
  const [loadingContext, setLoadingContext] = useState(false);

  // Financial data for clinic mode
  const { data: transactions } = useClinicData("transactions", { orderBy: "date", orderAsc: false, limit: 50 });
  // Appointments data for clinic mode (agenda)
  const { data: appointments } = useClinicData("appointments", { orderBy: "date", orderAsc: true, limit: 100 });
  // Certificates data
  const { data: certificates } = useClinicData("certificates", { orderBy: "created_at", orderAsc: false, limit: 20 });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load full patient context when selected
  useEffect(() => {
    if (!selectedPatient?.id || !clinicId) {
      setPatientContext(null);
      return;
    }

    const loadContext = async () => {
      setLoadingContext(true);
      const patientId = String(selectedPatient.id);

      const [recordRes, evoRes, filesRes, rxRes] = await Promise.all([
        supabase.from("clinical_records").select("*").eq("patient_id", patientId).eq("clinic_id", clinicId).maybeSingle(),
        supabase.from("evolutions").select("*").eq("patient_id", patientId).eq("clinic_id", clinicId).order("date", { ascending: false }).limit(10),
        supabase.from("patient_files").select("*").eq("patient_id", patientId).eq("clinic_id", clinicId).order("created_at", { ascending: false }),
        supabase.from("prescriptions").select("*").eq("clinic_id", clinicId).eq("patient_name", String(selectedPatient.name)).order("date", { ascending: false }).limit(5),
      ]);

      setPatientContext({
        patient: selectedPatient,
        clinicalRecord: recordRes.data || null,
        evolutions: evoRes.data || [],
        files: filesRes.data || [],
        prescriptions: rxRes.data || [],
      });
      setLoadingContext(false);
    };

    loadContext();
  }, [selectedPatient?.id, clinicId]);

  // Build financial summary for clinic mode
  const financialSummary = useMemo(() => {
    if (type !== "clinic" || !transactions.length) return null;
    const totalRevenue = transactions
      .filter((t) => t.type === "receita")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const totalExpenses = transactions
      .filter((t) => t.type === "despesa")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    return {
      totalRevenue: totalRevenue.toFixed(2),
      totalExpenses: totalExpenses.toFixed(2),
      balance: (totalRevenue - totalExpenses).toFixed(2),
      recentCount: transactions.length,
    };
  }, [type, transactions]);

  // Handle image upload (paste or file select)
  const uploadTempImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Apenas imagens são aceitas");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx 10MB)");
      return;
    }

    setUploadingImage(true);
    const fileName = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}.${file.type.split("/")[1] || "png"}`;

    const { error } = await supabase.storage.from("temp-ai-images").upload(fileName, file, {
      contentType: file.type,
    });

    if (error) {
      toast.error("Erro ao enviar imagem");
      setUploadingImage(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("temp-ai-images").getPublicUrl(fileName);
    setTempImageUrl(urlData.publicUrl);
    setTempImagePath(fileName);
    setUploadingImage(false);

    // Schedule auto-delete after 10 minutes
    setTimeout(async () => {
      await supabase.storage.from("temp-ai-images").remove([fileName]);
    }, 10 * 60 * 1000);

    toast.success("Imagem carregada! Será excluída em 10 min.");
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          uploadTempImage(file);
          return;
        }
      }
    }
  };

  const removeTempImage = async () => {
    if (tempImagePath) {
      await supabase.storage.from("temp-ai-images").remove([tempImagePath]);
    }
    setTempImageUrl(null);
    setTempImagePath(null);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if ((!text && !tempImageUrl) || isLoading) return;

    // Build user message content
    let userContent: Msg["content"];
    let displayText = text;

    if (tempImageUrl) {
      userContent = [];
      if (text) userContent.push({ type: "text", text });
      userContent.push({ type: "image_url", image_url: { url: tempImageUrl } });
      displayText = text || "📷 Imagem enviada para análise";
    } else {
      userContent = text;
    }

    const userMsg: Msg = { role: "user", content: userContent };
    // For display we use text version
    const displayMsg: Msg = { role: "user", content: displayText + (tempImageUrl ? "\n📷 [Imagem anexada]" : "") };
    setMessages((prev) => [...prev, displayMsg]);
    setInput("");
    const sentImageUrl = tempImageUrl;
    setTempImageUrl(null);
    setTempImagePath(null);
    setIsLoading(true);

    let assistantSoFar = "";

    // Build context payload
    const contextPayload: Record<string, unknown> = {};
    if (patientContext && type !== "clinic") {
      Object.assign(contextPayload, patientContext);
    }
    if (type === "clinic") {
      if (financialSummary) contextPayload.financialSummary = financialSummary;
      if (appointments.length > 0) contextPayload.appointments = appointments;
      if (transactions.length > 0) contextPayload.transactions = transactions;
      if (certificates.length > 0) contextPayload.certificates = certificates;
    }

    try {
      // Build messages for API - convert display messages to proper format
      const apiMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const resp = await fetch(AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          type,
          patientContext: Object.keys(contextPayload).length > 0 ? contextPayload : undefined,
          imageUrl: sentImageUrl || undefined,
          language: localStorage.getItem("btx-language") || "pt",
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Erro na resposta" }));
        toast.error(err.error || "Erro ao consultar IA");
        setIsLoading(false);
        return;
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("Sem stream");
      const decoder = new TextDecoder();
      let textBuffer = "";

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

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
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro de conexão com a IA");
    }
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const getPlaceholder = () => {
    if (type === "clinic") return "Pergunte sobre finanças, agenda, organização...";
    if (type === "prescription") return selectedPatient ? `Prescrição para ${selectedPatient.name}...` : "Qual a situação clínica?";
    return selectedPatient ? `Diagnóstico para ${selectedPatient.name}...` : "Descreva os sintomas ou cole uma radiografia...";
  };

  const getEmptyText = () => {
    if (type === "clinic") return "Pergunte sobre finanças, gestão de agenda, organização da clínica ou análise de desempenho.";
    if (selectedPatient && patientContext) {
      const evoCount = (patientContext.evolutions as any[])?.length || 0;
      const fileCount = (patientContext.files as any[])?.length || 0;
      return `Paciente ${selectedPatient.name} carregado com ficha clínica${evoCount > 0 ? `, ${evoCount} evoluções` : ""}${fileCount > 0 ? `, ${fileCount} exames/arquivos` : ""}. Pergunte sobre diagnóstico diferencial, plano de tratamento ou cole uma radiografia para análise.`;
    }
    if (type === "diagnosis") return "Selecione um paciente para análise contextualizada, descreva os sinais/sintomas ou cole uma radiografia (Ctrl+V) para análise.";
    return "Selecione um paciente ou informe o diagnóstico para sugestão de prescrição.";
  };

  const getDisplayContent = (msg: Msg): string => {
    if (typeof msg.content === "string") return msg.content;
    return msg.content.map((c) => c.text || "📷 [Imagem]").join("\n");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Assistente IA</h1>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={type} onValueChange={(v) => { setType(v as AssistantType); setMessages([]); }}>
              <TabsList>
                <TabsTrigger value="diagnosis" className="text-xs">
                  <Stethoscope className="h-3.5 w-3.5 mr-1" />Diagnóstico
                </TabsTrigger>
                <TabsTrigger value="prescription" className="text-xs">
                  <Pill className="h-3.5 w-3.5 mr-1" />Prescrição
                </TabsTrigger>
                <TabsTrigger value="clinic" className="text-xs">
                  <Building2 className="h-3.5 w-3.5 mr-1" />Gestão
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {messages.length > 0 && (
              <Button variant="ghost" size="icon" onClick={() => setMessages([])}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Patient selector - only for diagnosis/prescription modes */}
        {type !== "clinic" && (
          <div className="flex items-center gap-2">
            <Popover open={patientOpen} onOpenChange={setPatientOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="h-3.5 w-3.5" />
                  {selectedPatient ? String(selectedPatient.name) : "Selecionar paciente"}
                  {loadingContext && <Loader2 className="h-3 w-3 animate-spin" />}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-72" align="start">
                <Command>
                  <CommandInput placeholder="Buscar paciente..." />
                  <CommandList>
                    <CommandEmpty>Nenhum paciente encontrado.</CommandEmpty>
                    <CommandGroup>
                      {patients.map((p) => (
                        <CommandItem
                          key={String(p.id)}
                          onSelect={() => {
                            setSelectedPatient(p);
                            setPatientOpen(false);
                            setMessages([]);
                          }}
                        >
                          {String(p.name)}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedPatient && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedPatient(null); setMessages([]); }}>
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
            {selectedPatient && patientContext && (
              <span className="text-xs text-muted-foreground">
                {(patientContext.clinicalRecord as any) ? "✓ Ficha" : ""} 
                {((patientContext.evolutions as any[])?.length || 0) > 0 ? ` • ${(patientContext.evolutions as any[]).length} evoluções` : ""}
                {((patientContext.files as any[])?.length || 0) > 0 ? ` • ${(patientContext.files as any[]).length} arquivos` : ""}
              </span>
            )}
          </div>
        )}
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
              <Bot className="h-16 w-16 opacity-30" />
              <p className="text-center max-w-md">{getEmptyText()}</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted rounded-bl-md"
              }`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{getDisplayContent(msg)}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{getDisplayContent(msg)}</p>
                )}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </CardContent>

        <div className="border-t p-4">
          {/* Temp image preview */}
          {tempImageUrl && (
            <div className="mb-2 flex items-center gap-2 p-2 rounded-lg border bg-muted/50">
              <img src={tempImageUrl} alt="Radiografia" className="h-16 w-16 object-cover rounded" />
              <span className="text-xs text-muted-foreground flex-1">Imagem anexada (auto-exclui em 10 min)</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={removeTempImage}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={getPlaceholder()}
                rows={2}
                className="resize-none pr-10"
                disabled={isLoading}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadTempImage(file);
                  e.target.value = "";
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 bottom-1 h-7 w-7"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || uploadingImage}
                title="Anexar imagem (radiografia, exame)"
              >
                {uploadingImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5 text-muted-foreground" />}
              </Button>
            </div>
            <Button onClick={sendMessage} disabled={isLoading || (!input.trim() && !tempImageUrl)} size="icon" className="h-auto">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            📷 Cole (Ctrl+V) ou anexe radiografias para análise. ⚠️ Sugestões são auxiliares.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AIAssistant;
