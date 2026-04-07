import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useClinicData } from "@/hooks/useClinicData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft, Printer, Plus, Trash2, FileImage, ClipboardList,
  Stethoscope, Calendar, ImageIcon, Save, MessageCircle, Search,
  Brain, Loader2, ZoomIn, FlaskConical, X, AlertTriangle, ShieldAlert,
  Download, Share2, Link, ExternalLink
} from "lucide-react";
import { ConsultationRecorder } from "@/components/ConsultationRecorder";
import { MedicalAlerts } from "@/components/MedicalAlerts";
import { SignaturePad } from "@/components/SignaturePad";

type FileCategory = "radiografia" | "laboratorial" | "fotografia" | "documento" | "outro";
const FILE_CATEGORIES: { value: FileCategory; label: string }[] = [
  { value: "radiografia", label: "Radiografia / Imagem" },
  { value: "laboratorial", label: "Exame Laboratorial" },
  { value: "fotografia", label: "Foto Clínica" },
  { value: "documento", label: "Documento" },
  { value: "outro", label: "Outro" },
];

const emptyClinical = {
  chief_complaint: "", medical_history: "", allergies: "", current_medications: "",
  family_history: "", dental_history: "", habits: "", extra_oral_exam: "",
  intra_oral_exam: "", diagnosis: "", treatment_plan: "", prognosis: "",
};

const emptyEvolution = {
  date: new Date().toISOString().slice(0, 10),
  subjective: "", objective: "", assessment: "", plan: "",
  procedure: "", tooth_number: "", professional: "",
};

const emptyPatientForm = {
  name: "",
  phone: "",
  email: "",
  birth_date: "",
  cpf: "",
  address: "",
};

const PatientProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clinicId } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);

  const { data: patients, loading: patientsLoading, update: updatePatient } = useClinicData("patients");
  const { data: settingsArr } = useClinicData("clinic_settings");
  const settings = settingsArr[0] || {};

  // Clinical records for this patient
  const { data: clinicalArr, insert: insertClinical, update: updateClinical } = useClinicData("clinical_records", { filter: { patient_id: id || "" } });
  const clinical = clinicalArr[0] || null;

  // Evolutions
  const { data: evolutions, insert: insertEvo, update: updateEvo, remove: removeEvo } = useClinicData("evolutions", { filter: { patient_id: id || "" } });

  // Patient files
  const { data: files, insert: insertFile, update: updateFile, remove: removeFile } = useClinicData("patient_files", { filter: { patient_id: id || "" } });

  const patient = patients.find((p) => String(p.id) === id);

  const [clinicalForm, setClinicalForm] = useState(emptyClinical);
  const [evoForm, setEvoForm] = useState(emptyEvolution);
  const [evoOpen, setEvoOpen] = useState(false);
  const [editingEvoId, setEditingEvoId] = useState<string | null>(null);
  const [printMode, setPrintMode] = useState<"clinical" | "evolution" | "file" | null>(null);
  const [printEvoId, setPrintEvoId] = useState<string | null>(null);
  const [printFileId, setPrintFileId] = useState<string | null>(null);
  const [uploadCategory, setUploadCategory] = useState<FileCategory>("radiografia");
  const [fileFilter, setFileFilter] = useState<FileCategory | "all">("all");
  const [viewingImage, setViewingImage] = useState<{ url: string; name: string } | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [patientForm, setPatientForm] = useState(emptyPatientForm);
  const [savingPatient, setSavingPatient] = useState(false);
  const [evoSignature, setEvoSignature] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  useEffect(() => {
    if (!patient) return;
    setPatientForm({
      name: String(patient.name || ""),
      phone: String(patient.phone || ""),
      email: String(patient.email || ""),
      birth_date: String(patient.birth_date || ""),
      cpf: String(patient.cpf || ""),
      address: String(patient.address || ""),
    });
  }, [patient]);

  // Load clinical form when data arrives
  useEffect(() => {
    if (clinical) {
      setClinicalForm({
        chief_complaint: String(clinical.chief_complaint || ""),
        medical_history: String(clinical.medical_history || ""),
        allergies: String(clinical.allergies || ""),
        current_medications: String(clinical.current_medications || ""),
        family_history: String(clinical.family_history || ""),
        dental_history: String(clinical.dental_history || ""),
        habits: String(clinical.habits || ""),
        extra_oral_exam: String(clinical.extra_oral_exam || ""),
        intra_oral_exam: String(clinical.intra_oral_exam || ""),
        diagnosis: String(clinical.diagnosis || ""),
        treatment_plan: String(clinical.treatment_plan || ""),
        prognosis: String(clinical.prognosis || ""),
      });
    }
  }, [clinical]);

  // Generate signed URLs for private bucket files
  const refreshSignedUrls = useCallback(async () => {
    const imagePaths = files
      .filter((f) => String(f.storage_path))
      .map((f) => String(f.storage_path));
    if (imagePaths.length === 0) return;
    const { data, error } = await supabase.storage
      .from("patient-files")
      .createSignedUrls(imagePaths, 3600);
    if (!error && data) {
      const urls: Record<string, string> = {};
      data.forEach((item) => {
        if (item.signedUrl) urls[item.path || ""] = item.signedUrl;
      });
      setSignedUrls(urls);
    }
  }, [files]);

  useEffect(() => {
    refreshSignedUrls();
  }, [refreshSignedUrls]);

  if (!id) {
    return null;
  }

  if (patientsLoading && !patient) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p>Carregando paciente...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p>Paciente não encontrado</p>
        <Button variant="link" onClick={() => navigate("/pacientes")}>Voltar</Button>
      </div>
    );
  }

  const handleSavePatientData = async () => {
    if (!patientForm.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    setSavingPatient(true);
    const updated = await updatePatient(String(patient.id), patientForm);
    setSavingPatient(false);

    if (updated) {
      toast.success("Dados cadastrais atualizados");
    }
  };

  const handleSaveClinical = async () => {
    if (clinical) {
      await updateClinical(String(clinical.id), clinicalForm);
    } else {
      await insertClinical({ ...clinicalForm, patient_id: id });
    }
    toast.success("Ficha clínica salva!");
  };

  const handleSaveEvolution = async () => {
    if (!evoForm.procedure.trim() && !evoForm.subjective.trim()) {
      toast.error("Preencha ao menos a queixa ou o procedimento"); return;
    }
    if (editingEvoId) {
      await updateEvo(editingEvoId, evoForm);
      toast.success("Evolução atualizada!");
    } else {
      await insertEvo({ ...evoForm, patient_id: id });
      toast.success("Evolução registrada!");
    }
    setEvoForm(emptyEvolution);
    setEditingEvoId(null);
    setEvoOpen(false);
  };

  const handleDeleteEvolution = async (evoId: string) => {
    await updateEvo(evoId, { deleted_at: new Date().toISOString() } as any);
    toast.success("Evolução movida para a lixeira");
  };

  const handleEditEvolution = (evo: Record<string, unknown>) => {
    setEvoForm({
      date: String(evo.date || ""),
      subjective: String(evo.subjective || ""),
      objective: String(evo.objective || ""),
      assessment: String(evo.assessment || ""),
      plan: String(evo.plan || ""),
      procedure: String(evo.procedure || ""),
      tooth_number: String(evo.tooth_number || ""),
      professional: String(evo.professional || ""),
    });
    setEditingEvoId(String(evo.id));
    setEvoOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || !clinicId) return;
    for (const file of Array.from(fileList)) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} excede 10MB.`); continue;
      }
      // Compress images automatically
      const isImage = file.type.startsWith("image/");
      const processedFile = isImage ? await compressImage(file) : file;
      
      const path = `${clinicId}/${id}/${crypto.randomUUID()}-${processedFile.name}`;
      const { error } = await supabase.storage.from("patient-files").upload(path, processedFile);
      if (error) { toast.error(`Erro ao enviar ${processedFile.name}`); continue; }
      await insertFile({
        patient_id: id,
        name: processedFile.name,
        type: processedFile.type,
        storage_path: path,
        date: new Date().toISOString().slice(0, 10),
        description: `[${uploadCategory}]`,
      });
      const sizeKB = (processedFile.size / 1024).toFixed(0);
      toast.success(`${processedFile.name} anexado! (${sizeKB}KB)`);
    }
    e.target.value = "";
    setTimeout(() => refreshSignedUrls(), 1000);
  };

  const handleCameraCapture = async (file: File) => {
    if (!clinicId) return;
    const path = `${clinicId}/${id}/${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage.from("patient-files").upload(path, file);
    if (error) { toast.error("Erro ao enviar foto"); return; }
    await insertFile({
      patient_id: id,
      name: file.name,
      type: file.type,
      storage_path: path,
      date: new Date().toISOString().slice(0, 10),
      description: `[${uploadCategory}]`,
    });
    const sizeKB = (file.size / 1024).toFixed(0);
    toast.success(`Foto capturada! (${sizeKB}KB)`);
    setTimeout(() => refreshSignedUrls(), 1000);
  };

  const handleDeleteFile = async (fileId: string, storagePath: string) => {
    if (storagePath) {
      await supabase.storage.from("patient-files").remove([storagePath]);
    }
    await removeFile(fileId);
    toast.success("Arquivo removido");
  };

  const handlePrint = (mode: "clinical" | "evolution" | "file", itemId?: string) => {
    setPrintMode(mode);
    if (mode === "evolution") setPrintEvoId(itemId || null);
    if (mode === "file") setPrintFileId(itemId || null);
    setTimeout(() => window.print(), 300);
    setTimeout(() => setPrintMode(null), 1000);
  };

  const handleExportPDF = async () => {
    try {
      toast.info("Gerando PDF do prontuário...");
      const pdf = new jsPDF("p", "mm", "a4");
      const w = pdf.internal.pageSize.getWidth();
      let y = 15;

      const addLine = (text: string, bold = false, size = 10) => {
        pdf.setFontSize(size);
        pdf.setFont("helvetica", bold ? "bold" : "normal");
        const lines = pdf.splitTextToSize(text, w - 20);
        for (const line of lines) {
          if (y > 275) { pdf.addPage(); y = 15; }
          pdf.text(line, 10, y);
          y += size * 0.45;
        }
        y += 2;
      };

      // Header
      addLine(String(settings.clinic_name || "Clínica"), true, 16);
      addLine(`${String(settings.professional_name || "")} — ${String(settings.specialty || "")}`, false, 10);
      addLine(String(settings.registration_number || ""), false, 9);
      y += 4;
      pdf.setDrawColor(0); pdf.line(10, y, w - 10, y); y += 6;

      // Patient info
      addLine("DADOS DO PACIENTE", true, 12);
      addLine(`Nome: ${String(patient.name)}`);
      if (patient.birth_date) addLine(`Nascimento: ${String(patient.birth_date).split("-").reverse().join("/")}`);
      if (patient.cpf) addLine(`CPF: ${String(patient.cpf)}`);
      if (patient.phone) addLine(`Telefone: ${String(patient.phone)}`);
      if (patient.email) addLine(`Email: ${String(patient.email)}`);
      if (patient.address) addLine(`Endereço: ${String(patient.address)}`);
      y += 4;

      // Clinical record
      if (clinical) {
        pdf.line(10, y, w - 10, y); y += 6;
        addLine("FICHA CLÍNICA", true, 12);
        const fields = [
          ["Queixa Principal", clinicalForm.chief_complaint],
          ["Histórico Médico", clinicalForm.medical_history],
          ["Alergias", clinicalForm.allergies],
          ["Medicamentos em Uso", clinicalForm.current_medications],
          ["Histórico Familiar", clinicalForm.family_history],
          ["Histórico Clínico", clinicalForm.dental_history],
          ["Hábitos", clinicalForm.habits],
          ["Exame Físico Geral", clinicalForm.extra_oral_exam],
          ["Exame Específico", clinicalForm.intra_oral_exam],
          ["Diagnóstico", clinicalForm.diagnosis],
          ["Plano de Tratamento", clinicalForm.treatment_plan],
          ["Prognóstico", clinicalForm.prognosis],
        ];
        for (const [label, value] of fields) {
          if (value) { addLine(`${label}:`, true, 10); addLine(value); }
        }
      }

      // Evolutions
      if (evolutions.length > 0) {
        y += 2; pdf.line(10, y, w - 10, y); y += 6;
        addLine("EVOLUÇÕES CLÍNICAS", true, 12);
        for (const evo of [...evolutions].sort((a, b) => String(b.date).localeCompare(String(a.date)))) {
          addLine(`Data: ${String(evo.date).split("-").reverse().join("/")}${evo.tooth_number ? ` — ${String(evo.tooth_number)}` : ""}`, true);
          if (evo.subjective) addLine(`S: ${String(evo.subjective)}`);
          if (evo.objective) addLine(`O: ${String(evo.objective)}`);
          if (evo.assessment) addLine(`A: ${String(evo.assessment)}`);
          if (evo.plan) addLine(`P: ${String(evo.plan)}`);
          if (evo.procedure) addLine(`Procedimento: ${String(evo.procedure)}`);
          if (evo.professional) addLine(`Prof.: ${String(evo.professional)}`, false, 9);
          y += 3;
        }
      }

      // Footer
      y += 4; pdf.line(10, y, w - 10, y); y += 6;
      addLine(`${String(settings.address || "")}`, false, 9);
      addLine(`${[settings.phone, settings.email].filter(Boolean).join(" • ")}`, false, 9);

      pdf.save(`prontuario-${String(patient.name).replace(/\s+/g, "_")}.pdf`);
      toast.success("PDF exportado!");
    } catch {
      toast.error("Erro ao gerar PDF");
    }
  };

  const handleShareWhatsApp = (type: "prontuario" | "lembrete", appointmentData?: Record<string, unknown>) => {
    const phone = String(patient.phone || "").replace(/\D/g, "");
    if (!phone) { toast.error("Paciente sem telefone cadastrado"); return; }

    let text = "";
    if (type === "prontuario") {
      text = `Olá ${String(patient.name)}! Segue resumo do seu atendimento:\n\n`;
      if (clinicalForm.diagnosis) text += `*Diagnóstico:* ${clinicalForm.diagnosis}\n`;
      if (clinicalForm.treatment_plan) text += `*Plano de Tratamento:* ${clinicalForm.treatment_plan}\n`;
      const lastEvo = [...evolutions].sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
      if (lastEvo) {
        text += `\n*Última evolução (${String(lastEvo.date).split("-").reverse().join("/")})::*\n`;
        if (lastEvo.procedure) text += `Procedimento: ${String(lastEvo.procedure)}\n`;
        if (lastEvo.plan) text += `Plano: ${String(lastEvo.plan)}\n`;
      }
      text += `\n${String(settings.professional_name || "")}\n${String(settings.registration_number || "")}`;
    }

    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleAiAnalysis = async (fileId: string, fileName: string, description: string) => {
    setAiLoading((prev) => ({ ...prev, [fileId]: true }));
    try {
      const category = getFileCategory(description);
      const { data, error } = await supabase.functions.invoke("analyze-exam", {
        body: {
          description,
          fileName,
          category: FILE_CATEGORIES.find((c) => c.value === category)?.label || category,
          patientInfo: `Nome: ${String(patient.name)}${patient.birth_date ? `, Nasc: ${String(patient.birth_date)}` : ""}`,
        },
      });
      if (error) throw error;
      setAiAnalysis((prev) => ({ ...prev, [fileId]: data.analysis }));
    } catch (err) {
      console.error("AI analysis error:", err);
      toast.error("Erro ao analisar exame com IA");
    } finally {
      setAiLoading((prev) => ({ ...prev, [fileId]: false }));
    }
  };

  const getFileCategory = (desc: string): FileCategory => {
    const d = (desc || "").toLowerCase();
    if (d.includes("[radiografia]")) return "radiografia";
    if (d.includes("[laboratorial]")) return "laboratorial";
    if (d.includes("[fotografia]")) return "fotografia";
    if (d.includes("[documento]")) return "documento";
    return "outro";
  };

  const getFileUrl = (path: string) => signedUrls[path] || "";

  const filteredFiles = fileFilter === "all"
    ? files
    : files.filter((f) => getFileCategory(String(f.description || "")) === fileFilter);

  const selectedEvo = evolutions.find((e) => String(e.id) === printEvoId);
  const selectedFile = files.find((f) => String(f.id) === printFileId);

  const PrintHeader = () => (
    <div className="text-center border-b-2 border-foreground pb-4 mb-6">
      <h1 className="text-xl font-bold">{String(settings.clinic_name || "Clínica")}</h1>
      <p className="text-sm">{String(settings.professional_name)} {settings.specialty && `— ${settings.specialty}`}</p>
      <p className="text-sm">{String(settings.registration_number || "")}</p>
    </div>
  );

  const PrintFooter = () => (
    <div className="border-t-2 border-foreground pt-4 mt-8 text-center text-sm">
      <p>{String(settings.address || "")}</p>
      <p>{[settings.phone, settings.email].filter(Boolean).join(" • ")}</p>
    </div>
  );

  const PatientHeader = () => (
    <div className="mb-4 border-b pb-3">
      <p><strong>Paciente:</strong> {String(patient.name)}</p>
      <div className="flex gap-6 text-sm">
        {patient.birth_date && <span><strong>Nasc.:</strong> {String(patient.birth_date).split("-").reverse().join("/")}</span>}
        {patient.cpf && <span><strong>CPF:</strong> {String(patient.cpf)}</span>}
        {patient.phone && <span><strong>Tel.:</strong> {String(patient.phone)}</span>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="no-print">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/pacientes")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold">{String(patient.name)}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{String(patient.phone) || "Sem telefone"} {patient.cpf && `• CPF: ${patient.cpf}`}</span>
              {patient.phone && (
                <a href={`https://wa.me/55${String(patient.phone).replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 font-medium" title="WhatsApp">
                  <MessageCircle className="h-4 w-4" /><span className="text-xs">WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Medical Alert Badges */}
        <MedicalAlerts clinicalForm={clinicalForm} clinical={clinical} />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados cadastrais do paciente</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Nome completo *</Label>
                <Input value={patientForm.name} onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Telefone</Label>
                <Input value={patientForm.phone} onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input type="email" value={patientForm.email} onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Data de nascimento</Label>
                <Input type="date" value={patientForm.birth_date} onChange={(e) => setPatientForm({ ...patientForm, birth_date: e.target.value })} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>CPF</Label>
                <Input value={patientForm.cpf} onChange={(e) => setPatientForm({ ...patientForm, cpf: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Endereço</Label>
                <Input value={patientForm.address} onChange={(e) => setPatientForm({ ...patientForm, address: e.target.value })} />
              </div>
            </div>

            <Button onClick={handleSavePatientData} disabled={savingPatient} className="w-full sm:w-auto">
              <Save className="h-4 w-4 mr-2" />
              {savingPatient ? "Salvando..." : "Salvar dados cadastrais"}
            </Button>
          </CardContent>
        </Card>

        <Tabs defaultValue="clinical" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="clinical" className="text-xs sm:text-sm"><ClipboardList className="h-4 w-4 mr-1 hidden sm:inline" />Ficha</TabsTrigger>
            <TabsTrigger value="evolutions" className="text-xs sm:text-sm"><Stethoscope className="h-4 w-4 mr-1 hidden sm:inline" />Evoluções</TabsTrigger>
            <TabsTrigger value="files" className="text-xs sm:text-sm"><FileImage className="h-4 w-4 mr-1 hidden sm:inline" />Arquivos</TabsTrigger>
            <TabsTrigger value="print" className="text-xs sm:text-sm"><Printer className="h-4 w-4 mr-1 hidden sm:inline" />Imprimir</TabsTrigger>
          </TabsList>

          {/* CLINICAL TAB */}
          <TabsContent value="clinical" className="space-y-4 mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Anamnese / SOAP</CardTitle></CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Queixa Principal (S)</Label>
                  <Textarea value={clinicalForm.chief_complaint} onChange={(e) => setClinicalForm({ ...clinicalForm, chief_complaint: e.target.value })} rows={3} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="grid gap-2"><Label>Histórico Médico</Label><Textarea value={clinicalForm.medical_history} onChange={(e) => setClinicalForm({ ...clinicalForm, medical_history: e.target.value })} rows={3} /></div>
                  <div className="grid gap-2"><Label>Histórico Familiar</Label><Textarea value={clinicalForm.family_history} onChange={(e) => setClinicalForm({ ...clinicalForm, family_history: e.target.value })} rows={3} /></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="grid gap-2"><Label>Alergias</Label><Textarea value={clinicalForm.allergies} onChange={(e) => setClinicalForm({ ...clinicalForm, allergies: e.target.value })} rows={2} /></div>
                  <div className="grid gap-2"><Label>Medicamentos em Uso</Label><Textarea value={clinicalForm.current_medications} onChange={(e) => setClinicalForm({ ...clinicalForm, current_medications: e.target.value })} rows={2} /></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                   <div className="grid gap-2"><Label>Histórico Clínico Específico</Label><Textarea value={clinicalForm.dental_history} onChange={(e) => setClinicalForm({ ...clinicalForm, dental_history: e.target.value })} rows={2} placeholder="Histórico específico da área (odontológico, dermatológico, etc.)" /></div>
                   <div className="grid gap-2"><Label>Hábitos</Label><Textarea value={clinicalForm.habits} onChange={(e) => setClinicalForm({ ...clinicalForm, habits: e.target.value })} rows={2} /></div>
                </div>
                <div className="grid gap-2"><Label>Exame Físico Geral (O)</Label><Textarea value={clinicalForm.extra_oral_exam} onChange={(e) => setClinicalForm({ ...clinicalForm, extra_oral_exam: e.target.value })} rows={2} placeholder="Exame físico geral / extraoral" /></div>
                <div className="grid gap-2"><Label>Exame Específico (O)</Label><Textarea value={clinicalForm.intra_oral_exam} onChange={(e) => setClinicalForm({ ...clinicalForm, intra_oral_exam: e.target.value })} rows={3} placeholder="Exame específico da área / intraoral" /></div>
                <div className="grid gap-2"><Label>Diagnóstico (A)</Label><Textarea value={clinicalForm.diagnosis} onChange={(e) => setClinicalForm({ ...clinicalForm, diagnosis: e.target.value })} rows={2} /></div>
                <div className="grid gap-2"><Label>Plano de Tratamento (P)</Label><Textarea value={clinicalForm.treatment_plan} onChange={(e) => setClinicalForm({ ...clinicalForm, treatment_plan: e.target.value })} rows={3} /></div>
                <div className="grid gap-2"><Label>Prognóstico</Label><Textarea value={clinicalForm.prognosis} onChange={(e) => setClinicalForm({ ...clinicalForm, prognosis: e.target.value })} rows={2} /></div>
                <Button onClick={handleSaveClinical} className="w-full"><Save className="h-4 w-4 mr-2" />Salvar Ficha Clínica</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* EVOLUTIONS TAB */}
          <TabsContent value="evolutions" className="space-y-4 mt-4">
            {/* Consultation Recorder */}
            <ConsultationRecorder
              patientName={String(patient.name)}
              onSoapGenerated={(soap) => {
                setEvoForm({
                  ...emptyEvolution,
                  subjective: soap.subjective || "",
                  objective: soap.objective || "",
                  assessment: soap.assessment || "",
                  plan: soap.plan || "",
                  procedure: soap.procedure || "",
                  tooth_number: soap.tooth_number || "",
                  professional: String(settings.professional_name || ""),
                });
                setEditingEvoId(null);
                setEvoOpen(true);
              }}
            />

            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Evoluções Clínicas</h2>
              <Dialog open={evoOpen} onOpenChange={(v) => { setEvoOpen(v); if (!v) { setEvoForm(emptyEvolution); setEditingEvoId(null); } }}>
                <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nova Evolução</Button></DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>{editingEvoId ? "Editar Evolução" : "Nova Evolução"}</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2"><Label>Data</Label><Input type="date" value={evoForm.date} onChange={(e) => setEvoForm({ ...evoForm, date: e.target.value })} /></div>
                      <div className="grid gap-2"><Label>Região / Local</Label><Input value={evoForm.tooth_number} onChange={(e) => setEvoForm({ ...evoForm, tooth_number: e.target.value })} placeholder="Ex: região cervical, dente 36, MSD" /></div>
                    </div>
                    <div className="grid gap-2"><Label>Queixa (S)</Label><Textarea value={evoForm.subjective} onChange={(e) => setEvoForm({ ...evoForm, subjective: e.target.value })} rows={2} /></div>
                    <div className="grid gap-2"><Label>Exame (O)</Label><Textarea value={evoForm.objective} onChange={(e) => setEvoForm({ ...evoForm, objective: e.target.value })} rows={2} /></div>
                    <div className="grid gap-2"><Label>Avaliação (A)</Label><Textarea value={evoForm.assessment} onChange={(e) => setEvoForm({ ...evoForm, assessment: e.target.value })} rows={2} /></div>
                    <div className="grid gap-2"><Label>Plano (P)</Label><Textarea value={evoForm.plan} onChange={(e) => setEvoForm({ ...evoForm, plan: e.target.value })} rows={2} /></div>
                    <div className="grid gap-2"><Label>Procedimento</Label><Textarea value={evoForm.procedure} onChange={(e) => setEvoForm({ ...evoForm, procedure: e.target.value })} rows={2} /></div>
                    <div className="grid gap-2"><Label>Profissional</Label><Input value={evoForm.professional} onChange={(e) => setEvoForm({ ...evoForm, professional: e.target.value })} placeholder={String(settings.professional_name || "Nome")} /></div>
                    <SignaturePad value={evoSignature} onChange={setEvoSignature} label="Assinatura do Paciente" />
                    <Button onClick={handleSaveEvolution} className="w-full">Salvar Evolução</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {evolutions.filter(e => !e.deleted_at).length === 0 ? (
              <Card><CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground"><Calendar className="h-12 w-12 mb-4 opacity-40" /><p>Nenhuma evolução registrada</p></CardContent></Card>
            ) : (
              <div className="space-y-3">
                {[...evolutions].filter(e => !e.deleted_at).sort((a, b) => String(b.date).localeCompare(String(a.date))).map((evo) => (
                  <Card key={String(evo.id)} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{String(evo.date).split("-").reverse().join("/")}</p>
                          {evo.tooth_number && <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">{String(evo.tooth_number)}</span>}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handlePrint("evolution", String(evo.id))}><Printer className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEditEvolution(evo)}><ClipboardList className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteEvolution(String(evo.id))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </div>
                      {evo.subjective && <p className="text-sm"><strong>S:</strong> {String(evo.subjective)}</p>}
                      {evo.objective && <p className="text-sm"><strong>O:</strong> {String(evo.objective)}</p>}
                      {evo.assessment && <p className="text-sm"><strong>A:</strong> {String(evo.assessment)}</p>}
                      {evo.plan && <p className="text-sm"><strong>P:</strong> {String(evo.plan)}</p>}
                      {evo.procedure && <p className="text-sm"><strong>Procedimento:</strong> {String(evo.procedure)}</p>}
                      {evo.professional && <p className="text-xs text-muted-foreground mt-1">Prof.: {String(evo.professional)}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* FILES TAB */}
          <TabsContent value="files" className="space-y-4 mt-4">
            {/* Upload controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-lg font-semibold">Exames e Arquivos</h2>
              <div className="flex items-center gap-2">
                <Select value={uploadCategory} onValueChange={(v) => setUploadCategory(v as FileCategory)}>
                  <SelectTrigger className="w-[180px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FILE_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => setCameraOpen(true)}>
                  <Camera className="h-4 w-4 mr-2" />Câmera
                </Button>
                <Button asChild>
                  <label className="cursor-pointer">
                    <Plus className="h-4 w-4 mr-2" />Galeria
                    <input type="file" accept="image/*,.pdf,.doc,.docx" multiple className="sr-only" onChange={handleFileUpload} />
                  </label>
                </Button>
              </div>
            </div>

            <CameraCapture open={cameraOpen} onOpenChange={setCameraOpen} onCapture={handleCameraCapture} />

            {/* Category filter */}
            <div className="flex gap-2 flex-wrap">
              <Badge variant={fileFilter === "all" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFileFilter("all")}>Todos ({files.length})</Badge>
              {FILE_CATEGORIES.map((c) => {
                const count = files.filter((f) => getFileCategory(String(f.description || "")) === c.value).length;
                if (count === 0) return null;
                return (
                  <Badge key={c.value} variant={fileFilter === c.value ? "default" : "outline"} className="cursor-pointer" onClick={() => setFileFilter(c.value)}>
                    {c.value === "radiografia" && <FileImage className="h-3 w-3 mr-1" />}
                    {c.value === "laboratorial" && <FlaskConical className="h-3 w-3 mr-1" />}
                    {c.label} ({count})
                  </Badge>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground">📸 Fotos comprimidas automaticamente (~100KB). Imagens da galeria também são otimizadas.</p>

            {filteredFiles.length === 0 ? (
              <Card><CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground"><ImageIcon className="h-12 w-12 mb-4 opacity-40" /><p>Nenhum arquivo nesta categoria</p></CardContent></Card>
            ) : (
              <div className="space-y-4">
                {filteredFiles.map((f) => {
                  const isImage = String(f.type).startsWith("image/");
                  const url = f.storage_path ? getFileUrl(String(f.storage_path)) : "";
                  const fileId = String(f.id);
                  const category = getFileCategory(String(f.description || ""));
                  const catLabel = FILE_CATEGORIES.find((c) => c.value === category)?.label || "Outro";
                  const descText = String(f.description || "").replace(/\[\w+\]\s*/, "");
                  return (
                    <Card key={fileId} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex flex-col lg:flex-row">
                          {/* Image / Preview side */}
                          <div className="lg:w-1/2 relative">
                            {isImage && url ? (
                              <div className="relative group">
                                <img src={url} alt={String(f.name)} className="w-full h-64 lg:h-80 object-contain bg-black/5 cursor-pointer" onClick={() => setViewingImage({ url, name: String(f.name) })} />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                  <ZoomIn className="h-8 w-8 text-white drop-shadow-lg" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-64 lg:h-80 flex items-center justify-center bg-muted">
                                <FileImage className="h-20 w-20 text-muted-foreground" />
                              </div>
                            )}
                            <div className="absolute top-2 left-2">
                              <Badge variant="secondary" className="text-xs">{catLabel}</Badge>
                            </div>
                          </div>

                          {/* Info + AI side */}
                          <div className="lg:w-1/2 p-4 flex flex-col gap-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{String(f.name)}</p>
                                <p className="text-xs text-muted-foreground">{String(f.date).split("-").reverse().join("/")}</p>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                {url && <Button variant="ghost" size="icon" onClick={() => window.open(url, "_blank")}><Search className="h-4 w-4" /></Button>}
                                <Button variant="ghost" size="icon" onClick={() => handlePrint("file", fileId)}><Printer className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteFile(fileId, String(f.storage_path || ""))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                              </div>
                            </div>

                            <Input placeholder="Observações do profissional..." value={descText} onChange={(e) => updateFile(fileId, { description: `[${category}] ${e.target.value}` })} className="text-xs" />

                            {/* AI Analysis */}
                            <div className="border rounded-lg p-3 bg-muted/30 flex-1 flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                  <Brain className="h-4 w-4 text-primary" />
                                  Análise IA
                                </div>
                                <Button size="sm" variant="outline" disabled={aiLoading[fileId]} onClick={() => handleAiAnalysis(fileId, String(f.name), String(f.description || ""))}>
                                  {aiLoading[fileId] ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Brain className="h-3 w-3 mr-1" />}
                                  {aiLoading[fileId] ? "Analisando..." : "Analisar"}
                                </Button>
                              </div>
                              {aiAnalysis[fileId] ? (
                                <ScrollArea className="max-h-48 text-xs">
                                  <div className="prose prose-xs max-w-none text-xs">
                                    <ReactMarkdown>{aiAnalysis[fileId]}</ReactMarkdown>
                                  </div>
                                </ScrollArea>
                              ) : (
                                <p className="text-xs text-muted-foreground italic">Clique em "Analisar" para obter sugestões da IA sobre este exame.</p>
                              )}
                              {aiAnalysis[fileId] && (
                                <p className="text-[10px] text-muted-foreground mt-1">⚠️ Análise auxiliar — decisão final é do profissional.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Image Viewer Dialog */}
          <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-2">
              <DialogHeader>
                <DialogTitle className="text-sm">{viewingImage?.name}</DialogTitle>
              </DialogHeader>
              {viewingImage && (
                <img src={viewingImage.url} alt={viewingImage.name} className="w-full h-auto max-h-[80vh] object-contain" />
              )}
            </DialogContent>
          </Dialog>

          {/* PRINT TAB */}
          <TabsContent value="print" className="space-y-4 mt-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-lg font-semibold">Impressão e Exportação</h2>
                <div className="grid gap-3">
                  <Button variant="default" onClick={handleExportPDF} className="justify-start gap-2">
                    <Download className="h-4 w-4" />Exportar Prontuário Completo (PDF)
                  </Button>
                  <Button variant="outline" onClick={() => handlePrint("clinical")} className="justify-start">
                    <ClipboardList className="h-4 w-4 mr-2" />Imprimir Ficha Clínica
                  </Button>
                  {patient.phone && (
                    <Button variant="outline" onClick={() => handleShareWhatsApp("prontuario")} className="justify-start gap-2 text-green-700 hover:text-green-800 hover:bg-green-50">
                      <MessageCircle className="h-4 w-4" />Enviar Resumo via WhatsApp
                    </Button>
                  )}
                  {evolutions.length > 0 && (
                    <>
                      <p className="text-sm font-medium mt-2">Evoluções:</p>
                      {[...evolutions].sort((a, b) => String(b.date).localeCompare(String(a.date))).map((evo) => (
                        <Button key={String(evo.id)} variant="outline" onClick={() => handlePrint("evolution", String(evo.id))} className="justify-start text-left">
                          <Stethoscope className="h-4 w-4 mr-2 shrink-0" />
                          <span className="truncate">{String(evo.date).split("-").reverse().join("/")} — {String(evo.procedure || evo.subjective || "Evolução")}</span>
                        </Button>
                      ))}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* PRINT AREAS */}
      {printMode === "clinical" && (
        <div ref={printRef} className="print-area p-8 text-sm leading-relaxed" style={{ fontFamily: "serif" }}>
          <PrintHeader /><PatientHeader />
          <h2 className="text-lg font-bold text-center mb-4">FICHA CLÍNICA</h2>
          <div className="space-y-3">
            {clinicalForm.chief_complaint && <div><strong>Queixa Principal (S):</strong><p className="ml-4">{clinicalForm.chief_complaint}</p></div>}
            {clinicalForm.medical_history && <div><strong>Histórico Médico:</strong><p className="ml-4">{clinicalForm.medical_history}</p></div>}
            {clinicalForm.family_history && <div><strong>Histórico Familiar:</strong><p className="ml-4">{clinicalForm.family_history}</p></div>}
            {clinicalForm.allergies && <div><strong>Alergias:</strong><p className="ml-4">{clinicalForm.allergies}</p></div>}
            {clinicalForm.current_medications && <div><strong>Medicamentos:</strong><p className="ml-4">{clinicalForm.current_medications}</p></div>}
            {clinicalForm.dental_history && <div><strong>Histórico Clínico Específico:</strong><p className="ml-4">{clinicalForm.dental_history}</p></div>}
            {clinicalForm.habits && <div><strong>Hábitos:</strong><p className="ml-4">{clinicalForm.habits}</p></div>}
            {clinicalForm.extra_oral_exam && <div><strong>Exame Físico Geral:</strong><p className="ml-4">{clinicalForm.extra_oral_exam}</p></div>}
            {clinicalForm.intra_oral_exam && <div><strong>Exame Específico:</strong><p className="ml-4">{clinicalForm.intra_oral_exam}</p></div>}
            {clinicalForm.diagnosis && <div><strong>Diagnóstico:</strong><p className="ml-4">{clinicalForm.diagnosis}</p></div>}
            {clinicalForm.treatment_plan && <div><strong>Plano de Tratamento:</strong><p className="ml-4">{clinicalForm.treatment_plan}</p></div>}
            {clinicalForm.prognosis && <div><strong>Prognóstico:</strong><p className="ml-4">{clinicalForm.prognosis}</p></div>}
          </div>
          <PrintFooter />
        </div>
      )}

      {printMode === "evolution" && selectedEvo && (
        <div ref={printRef} className="print-area p-8 text-sm leading-relaxed" style={{ fontFamily: "serif" }}>
          <PrintHeader /><PatientHeader />
          <h2 className="text-lg font-bold text-center mb-4">EVOLUÇÃO CLÍNICA</h2>
          <p className="mb-2"><strong>Data:</strong> {String(selectedEvo.date).split("-").reverse().join("/")}</p>
          {selectedEvo.tooth_number && <p className="mb-2"><strong>Região/Local:</strong> {String(selectedEvo.tooth_number)}</p>}
          <div className="space-y-2 mt-4">
            {selectedEvo.subjective && <div><strong>S:</strong><p className="ml-4">{String(selectedEvo.subjective)}</p></div>}
            {selectedEvo.objective && <div><strong>O:</strong><p className="ml-4">{String(selectedEvo.objective)}</p></div>}
            {selectedEvo.assessment && <div><strong>A:</strong><p className="ml-4">{String(selectedEvo.assessment)}</p></div>}
            {selectedEvo.plan && <div><strong>P:</strong><p className="ml-4">{String(selectedEvo.plan)}</p></div>}
            {selectedEvo.procedure && <div><strong>Procedimento:</strong><p className="ml-4">{String(selectedEvo.procedure)}</p></div>}
          </div>
          <PrintFooter />
        </div>
      )}
    </div>
  );
};

export default PatientProfile;
