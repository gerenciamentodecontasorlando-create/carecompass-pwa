import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useClinicData } from "@/hooks/useClinicData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft, Printer, Plus, Trash2, FileImage, ClipboardList,
  Stethoscope, Calendar, ImageIcon, Save, MessageCircle
} from "lucide-react";
import { ConsultationRecorder } from "@/components/ConsultationRecorder";

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

const PatientProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clinicId } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);

  const { data: patients } = useClinicData("patients");
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

  if (!patient || !id) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p>Paciente não encontrado</p>
        <Button variant="link" onClick={() => navigate("/pacientes")}>Voltar</Button>
      </div>
    );
  }

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
    await removeEvo(evoId);
    toast.success("Evolução removida");
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
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} excede 5MB.`); continue;
      }
      const path = `${clinicId}/${id}/${crypto.randomUUID()}-${file.name}`;
      const { error } = await supabase.storage.from("patient-files").upload(path, file);
      if (error) { toast.error(`Erro ao enviar ${file.name}`); continue; }
      await insertFile({
        patient_id: id,
        name: file.name,
        type: file.type,
        storage_path: path,
        date: new Date().toISOString().slice(0, 10),
        description: "",
      });
      toast.success(`${file.name} anexado!`);
    }
    e.target.value = "";
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

  const selectedEvo = evolutions.find((e) => String(e.id) === printEvoId);
  const selectedFile = files.find((f) => String(f.id) === printFileId);

  const getFileUrl = (path: string) => {
    const { data } = supabase.storage.from("patient-files").getPublicUrl(path);
    return data.publicUrl;
  };

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
          <div>
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
                  <div className="grid gap-2"><Label>Histórico Odontológico</Label><Textarea value={clinicalForm.dental_history} onChange={(e) => setClinicalForm({ ...clinicalForm, dental_history: e.target.value })} rows={2} /></div>
                  <div className="grid gap-2"><Label>Hábitos</Label><Textarea value={clinicalForm.habits} onChange={(e) => setClinicalForm({ ...clinicalForm, habits: e.target.value })} rows={2} /></div>
                </div>
                <div className="grid gap-2"><Label>Exame Extraoral (O)</Label><Textarea value={clinicalForm.extra_oral_exam} onChange={(e) => setClinicalForm({ ...clinicalForm, extra_oral_exam: e.target.value })} rows={2} /></div>
                <div className="grid gap-2"><Label>Exame Intraoral (O)</Label><Textarea value={clinicalForm.intra_oral_exam} onChange={(e) => setClinicalForm({ ...clinicalForm, intra_oral_exam: e.target.value })} rows={3} /></div>
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
                      <div className="grid gap-2"><Label>Dente / Região</Label><Input value={evoForm.tooth_number} onChange={(e) => setEvoForm({ ...evoForm, tooth_number: e.target.value })} placeholder="Ex: 36" /></div>
                    </div>
                    <div className="grid gap-2"><Label>Queixa (S)</Label><Textarea value={evoForm.subjective} onChange={(e) => setEvoForm({ ...evoForm, subjective: e.target.value })} rows={2} /></div>
                    <div className="grid gap-2"><Label>Exame (O)</Label><Textarea value={evoForm.objective} onChange={(e) => setEvoForm({ ...evoForm, objective: e.target.value })} rows={2} /></div>
                    <div className="grid gap-2"><Label>Avaliação (A)</Label><Textarea value={evoForm.assessment} onChange={(e) => setEvoForm({ ...evoForm, assessment: e.target.value })} rows={2} /></div>
                    <div className="grid gap-2"><Label>Plano (P)</Label><Textarea value={evoForm.plan} onChange={(e) => setEvoForm({ ...evoForm, plan: e.target.value })} rows={2} /></div>
                    <div className="grid gap-2"><Label>Procedimento</Label><Textarea value={evoForm.procedure} onChange={(e) => setEvoForm({ ...evoForm, procedure: e.target.value })} rows={2} /></div>
                    <div className="grid gap-2"><Label>Profissional</Label><Input value={evoForm.professional} onChange={(e) => setEvoForm({ ...evoForm, professional: e.target.value })} placeholder={String(settings.professional_name || "Nome")} /></div>
                    <Button onClick={handleSaveEvolution} className="w-full">Salvar Evolução</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {evolutions.length === 0 ? (
              <Card><CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground"><Calendar className="h-12 w-12 mb-4 opacity-40" /><p>Nenhuma evolução registrada</p></CardContent></Card>
            ) : (
              <div className="space-y-3">
                {[...evolutions].sort((a, b) => String(b.date).localeCompare(String(a.date))).map((evo) => (
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
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Arquivos e Imagens</h2>
              <Button asChild>
                <label className="cursor-pointer">
                  <Plus className="h-4 w-4 mr-2" />Anexar Arquivo
                  <input type="file" accept="image/*,.pdf" multiple className="sr-only" onChange={handleFileUpload} />
                </label>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Radiografias, fotos, documentos (máx. 5MB).</p>

            {files.length === 0 ? (
              <Card><CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground"><ImageIcon className="h-12 w-12 mb-4 opacity-40" /><p>Nenhum arquivo anexado</p></CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {files.map((f) => {
                  const isImage = String(f.type).startsWith("image/");
                  const url = f.storage_path ? getFileUrl(String(f.storage_path)) : "";
                  return (
                    <Card key={String(f.id)}>
                      <CardContent className="p-3 space-y-2">
                        {isImage && url ? (
                          <img src={url} alt={String(f.name)} className="w-full h-48 object-cover rounded-md" />
                        ) : (
                          <div className="w-full h-48 flex items-center justify-center bg-muted rounded-md">
                            <FileImage className="h-16 w-16 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{String(f.name)}</p>
                            <p className="text-xs text-muted-foreground">{String(f.date).split("-").reverse().join("/")}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handlePrint("file", String(f.id))}><Printer className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteFile(String(f.id), String(f.storage_path || ""))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </div>
                        <Input placeholder="Descrição..." value={String(f.description || "")} onChange={(e) => updateFile(String(f.id), { description: e.target.value })} className="text-xs" />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* PRINT TAB */}
          <TabsContent value="print" className="space-y-4 mt-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-lg font-semibold">Impressão</h2>
                <div className="grid gap-3">
                  <Button variant="outline" onClick={() => handlePrint("clinical")} className="justify-start">
                    <ClipboardList className="h-4 w-4 mr-2" />Imprimir Ficha Clínica
                  </Button>
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
            {clinicalForm.dental_history && <div><strong>Histórico Odontológico:</strong><p className="ml-4">{clinicalForm.dental_history}</p></div>}
            {clinicalForm.habits && <div><strong>Hábitos:</strong><p className="ml-4">{clinicalForm.habits}</p></div>}
            {clinicalForm.extra_oral_exam && <div><strong>Exame Extraoral:</strong><p className="ml-4">{clinicalForm.extra_oral_exam}</p></div>}
            {clinicalForm.intra_oral_exam && <div><strong>Exame Intraoral:</strong><p className="ml-4">{clinicalForm.intra_oral_exam}</p></div>}
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
          {selectedEvo.tooth_number && <p className="mb-2"><strong>Dente:</strong> {String(selectedEvo.tooth_number)}</p>}
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
