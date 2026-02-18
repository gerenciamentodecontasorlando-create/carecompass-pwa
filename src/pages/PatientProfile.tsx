import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { Patient } from "./Patients";
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
  Stethoscope, Calendar, ImageIcon, Save
} from "lucide-react";

export interface Evolution {
  id: string;
  date: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  procedure: string;
  toothNumber: string;
  professional: string;
}

export interface PatientFile {
  id: string;
  name: string;
  type: string;
  data: string;
  date: string;
  description: string;
}

export interface ClinicalRecord {
  chiefComplaint: string;
  medicalHistory: string;
  allergies: string;
  currentMedications: string;
  familyHistory: string;
  dentalHistory: string;
  habits: string;
  extraOralExam: string;
  intraOralExam: string;
  diagnosis: string;
  treatmentPlan: string;
  prognosis: string;
}

const emptyClinical: ClinicalRecord = {
  chiefComplaint: "", medicalHistory: "", allergies: "", currentMedications: "",
  familyHistory: "", dentalHistory: "", habits: "", extraOralExam: "",
  intraOralExam: "", diagnosis: "", treatmentPlan: "", prognosis: "",
};

const emptyEvolution: Omit<Evolution, "id"> = {
  date: new Date().toISOString().slice(0, 10),
  subjective: "", objective: "", assessment: "", plan: "",
  procedure: "", toothNumber: "", professional: "",
};

const PatientProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const [patients] = useLocalStorage<Patient[]>("patients", []);
  const [clinicalRecords, setClinicalRecords] = useLocalStorage<Record<string, ClinicalRecord>>("clinicalRecords", {});
  const [evolutions, setEvolutions] = useLocalStorage<Record<string, Evolution[]>>("evolutions", {});
  const [patientFiles, setPatientFiles] = useLocalStorage<Record<string, PatientFile[]>>("patientFiles", {});
  const [settings] = useLocalStorage("clinicSettings", { professionalName: "", specialty: "", registrationNumber: "", clinicName: "", address: "", phone: "", email: "" });

  const patient = patients.find((p) => p.id === id);
  const clinical = clinicalRecords[id || ""] || emptyClinical;
  const patientEvolutions = evolutions[id || ""] || [];
  const files = patientFiles[id || ""] || [];

  const [clinicalForm, setClinicalForm] = useState<ClinicalRecord>(clinical);
  const [evoForm, setEvoForm] = useState(emptyEvolution);
  const [evoOpen, setEvoOpen] = useState(false);
  const [editingEvoId, setEditingEvoId] = useState<string | null>(null);
  const [printMode, setPrintMode] = useState<"clinical" | "evolution" | "file" | null>(null);
  const [printEvoId, setPrintEvoId] = useState<string | null>(null);
  const [printFileId, setPrintFileId] = useState<string | null>(null);

  if (!patient || !id) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p>Paciente não encontrado</p>
        <Button variant="link" onClick={() => navigate("/pacientes")}>Voltar</Button>
      </div>
    );
  }

  const handleSaveClinical = () => {
    setClinicalRecords((prev) => ({ ...prev, [id]: clinicalForm }));
    toast.success("Ficha clínica salva!");
  };

  const handleSaveEvolution = () => {
    if (!evoForm.procedure.trim() && !evoForm.subjective.trim()) {
      toast.error("Preencha ao menos a queixa ou o procedimento");
      return;
    }
    const updatedEvo = editingEvoId
      ? patientEvolutions.map((e) => (e.id === editingEvoId ? { ...evoForm, id: editingEvoId } : e))
      : [...patientEvolutions, { ...evoForm, id: crypto.randomUUID() }];
    setEvolutions((prev) => ({ ...prev, [id]: updatedEvo }));
    setEvoForm(emptyEvolution);
    setEditingEvoId(null);
    setEvoOpen(false);
    toast.success(editingEvoId ? "Evolução atualizada!" : "Evolução registrada!");
  };

  const handleDeleteEvolution = (evoId: string) => {
    setEvolutions((prev) => ({ ...prev, [id]: patientEvolutions.filter((e) => e.id !== evoId) }));
    toast.success("Evolução removida");
  };

  const handleEditEvolution = (evo: Evolution) => {
    setEvoForm(evo);
    setEditingEvoId(evo.id);
    setEvoOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    Array.from(fileList).forEach((file) => {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`${file.name} excede 2MB. Reduza o tamanho.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const newFile: PatientFile = {
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          data: ev.target?.result as string,
          date: new Date().toISOString().slice(0, 10),
          description: "",
        };
        setPatientFiles((prev) => ({ ...prev, [id]: [...(prev[id] || []), newFile] }));
        toast.success(`${file.name} anexado!`);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleDeleteFile = (fileId: string) => {
    setPatientFiles((prev) => ({ ...prev, [id]: files.filter((f) => f.id !== fileId) }));
    toast.success("Arquivo removido");
  };

  const handleUpdateFileDescription = (fileId: string, description: string) => {
    setPatientFiles((prev) => ({
      ...prev,
      [id]: files.map((f) => (f.id === fileId ? { ...f, description } : f)),
    }));
  };

  const handlePrint = (mode: "clinical" | "evolution" | "file", itemId?: string) => {
    setPrintMode(mode);
    if (mode === "evolution") setPrintEvoId(itemId || null);
    if (mode === "file") setPrintFileId(itemId || null);
    setTimeout(() => window.print(), 300);
    setTimeout(() => setPrintMode(null), 1000);
  };

  const selectedEvo = patientEvolutions.find((e) => e.id === printEvoId);
  const selectedFile = files.find((f) => f.id === printFileId);

  const PrintHeader = () => (
    <div className="text-center border-b-2 border-foreground pb-4 mb-6">
      <h1 className="text-xl font-bold">{settings.clinicName || "Clínica"}</h1>
      <p className="text-sm">{settings.professionalName} {settings.specialty && `— ${settings.specialty}`}</p>
      <p className="text-sm">{settings.registrationNumber}</p>
    </div>
  );

  const PrintFooter = () => (
    <div className="border-t-2 border-foreground pt-4 mt-8 text-center text-sm">
      <p>{settings.address}</p>
      <p>{[settings.phone, settings.email].filter(Boolean).join(" • ")}</p>
    </div>
  );

  const PatientHeader = () => (
    <div className="mb-4 border-b pb-3">
      <p><strong>Paciente:</strong> {patient.name}</p>
      <div className="flex gap-6 text-sm">
        {patient.birthDate && <span><strong>Nasc.:</strong> {patient.birthDate.split("-").reverse().join("/")}</span>}
        {patient.cpf && <span><strong>CPF:</strong> {patient.cpf}</span>}
        {patient.phone && <span><strong>Tel.:</strong> {patient.phone}</span>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Screen UI */}
      <div className="no-print">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/pacientes")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{patient.name}</h1>
            <p className="text-sm text-muted-foreground">
              {patient.phone || "Sem telefone"} {patient.cpf && `• CPF: ${patient.cpf}`}
            </p>
          </div>
        </div>

        <Tabs defaultValue="clinical" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="clinical" className="text-xs sm:text-sm">
              <ClipboardList className="h-4 w-4 mr-1 hidden sm:inline" />Ficha
            </TabsTrigger>
            <TabsTrigger value="evolutions" className="text-xs sm:text-sm">
              <Stethoscope className="h-4 w-4 mr-1 hidden sm:inline" />Evoluções
            </TabsTrigger>
            <TabsTrigger value="files" className="text-xs sm:text-sm">
              <FileImage className="h-4 w-4 mr-1 hidden sm:inline" />Arquivos
            </TabsTrigger>
            <TabsTrigger value="print" className="text-xs sm:text-sm">
              <Printer className="h-4 w-4 mr-1 hidden sm:inline" />Imprimir
            </TabsTrigger>
          </TabsList>

          {/* CLINICAL TAB */}
          <TabsContent value="clinical" className="space-y-4 mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Anamnese / SOAP</CardTitle></CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Queixa Principal (S - Subjetivo)</Label>
                  <Textarea value={clinicalForm.chiefComplaint} onChange={(e) => setClinicalForm({ ...clinicalForm, chiefComplaint: e.target.value })} rows={3} placeholder="Relato do paciente sobre o motivo da consulta..." />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Histórico Médico</Label>
                    <Textarea value={clinicalForm.medicalHistory} onChange={(e) => setClinicalForm({ ...clinicalForm, medicalHistory: e.target.value })} rows={3} placeholder="Doenças prévias, cirurgias, internações..." />
                  </div>
                  <div className="grid gap-2">
                    <Label>Histórico Familiar</Label>
                    <Textarea value={clinicalForm.familyHistory} onChange={(e) => setClinicalForm({ ...clinicalForm, familyHistory: e.target.value })} rows={3} placeholder="Doenças hereditárias, condições familiares..." />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Alergias</Label>
                    <Textarea value={clinicalForm.allergies} onChange={(e) => setClinicalForm({ ...clinicalForm, allergies: e.target.value })} rows={2} placeholder="Medicamentos, materiais, alimentos..." />
                  </div>
                  <div className="grid gap-2">
                    <Label>Medicamentos em Uso</Label>
                    <Textarea value={clinicalForm.currentMedications} onChange={(e) => setClinicalForm({ ...clinicalForm, currentMedications: e.target.value })} rows={2} placeholder="Nome, dosagem, frequência..." />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Histórico Odontológico</Label>
                    <Textarea value={clinicalForm.dentalHistory} onChange={(e) => setClinicalForm({ ...clinicalForm, dentalHistory: e.target.value })} rows={2} placeholder="Tratamentos anteriores, traumas..." />
                  </div>
                  <div className="grid gap-2">
                    <Label>Hábitos</Label>
                    <Textarea value={clinicalForm.habits} onChange={(e) => setClinicalForm({ ...clinicalForm, habits: e.target.value })} rows={2} placeholder="Tabagismo, bruxismo, onicofagia..." />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Exame Extraoral (O - Objetivo)</Label>
                  <Textarea value={clinicalForm.extraOralExam} onChange={(e) => setClinicalForm({ ...clinicalForm, extraOralExam: e.target.value })} rows={2} placeholder="Assimetrias, linfonodos, ATM..." />
                </div>
                <div className="grid gap-2">
                  <Label>Exame Intraoral (O - Objetivo)</Label>
                  <Textarea value={clinicalForm.intraOralExam} onChange={(e) => setClinicalForm({ ...clinicalForm, intraOralExam: e.target.value })} rows={3} placeholder="Mucosas, periodonto, oclusão, dentes..." />
                </div>
                <div className="grid gap-2">
                  <Label>Diagnóstico (A - Avaliação)</Label>
                  <Textarea value={clinicalForm.diagnosis} onChange={(e) => setClinicalForm({ ...clinicalForm, diagnosis: e.target.value })} rows={2} placeholder="Diagnóstico clínico e hipóteses..." />
                </div>
                <div className="grid gap-2">
                  <Label>Plano de Tratamento (P - Plano)</Label>
                  <Textarea value={clinicalForm.treatmentPlan} onChange={(e) => setClinicalForm({ ...clinicalForm, treatmentPlan: e.target.value })} rows={3} placeholder="Procedimentos planejados, sequência, prioridades..." />
                </div>
                <div className="grid gap-2">
                  <Label>Prognóstico</Label>
                  <Textarea value={clinicalForm.prognosis} onChange={(e) => setClinicalForm({ ...clinicalForm, prognosis: e.target.value })} rows={2} placeholder="Favorável, reservado, desfavorável..." />
                </div>
                <Button onClick={handleSaveClinical} className="w-full">
                  <Save className="h-4 w-4 mr-2" />Salvar Ficha Clínica
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* EVOLUTIONS TAB */}
          <TabsContent value="evolutions" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Evoluções Clínicas</h2>
              <Dialog open={evoOpen} onOpenChange={(v) => { setEvoOpen(v); if (!v) { setEvoForm(emptyEvolution); setEditingEvoId(null); } }}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-2" />Nova Evolução</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingEvoId ? "Editar Evolução" : "Nova Evolução"}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Data</Label>
                        <Input type="date" value={evoForm.date} onChange={(e) => setEvoForm({ ...evoForm, date: e.target.value })} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Dente / Região</Label>
                        <Input value={evoForm.toothNumber} onChange={(e) => setEvoForm({ ...evoForm, toothNumber: e.target.value })} placeholder="Ex: 36, arco sup..." />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Queixa / Subjetivo (S)</Label>
                      <Textarea value={evoForm.subjective} onChange={(e) => setEvoForm({ ...evoForm, subjective: e.target.value })} rows={2} placeholder="O que o paciente relata hoje..." />
                    </div>
                    <div className="grid gap-2">
                      <Label>Exame / Objetivo (O)</Label>
                      <Textarea value={evoForm.objective} onChange={(e) => setEvoForm({ ...evoForm, objective: e.target.value })} rows={2} placeholder="Achados clínicos do dia..." />
                    </div>
                    <div className="grid gap-2">
                      <Label>Avaliação (A)</Label>
                      <Textarea value={evoForm.assessment} onChange={(e) => setEvoForm({ ...evoForm, assessment: e.target.value })} rows={2} placeholder="Diagnóstico / interpretação..." />
                    </div>
                    <div className="grid gap-2">
                      <Label>Plano (P)</Label>
                      <Textarea value={evoForm.plan} onChange={(e) => setEvoForm({ ...evoForm, plan: e.target.value })} rows={2} placeholder="Próximos passos, orientações..." />
                    </div>
                    <div className="grid gap-2">
                      <Label>Procedimento Realizado</Label>
                      <Textarea value={evoForm.procedure} onChange={(e) => setEvoForm({ ...evoForm, procedure: e.target.value })} rows={2} placeholder="Descreva o que foi feito hoje..." />
                    </div>
                    <div className="grid gap-2">
                      <Label>Profissional Responsável</Label>
                      <Input value={evoForm.professional} onChange={(e) => setEvoForm({ ...evoForm, professional: e.target.value })} placeholder={settings.professionalName || "Nome do profissional"} />
                    </div>
                    <Button onClick={handleSaveEvolution} className="w-full">Salvar Evolução</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {patientEvolutions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mb-4 opacity-40" />
                  <p>Nenhuma evolução registrada</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {[...patientEvolutions].sort((a, b) => b.date.localeCompare(a.date)).map((evo) => (
                  <Card key={evo.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{evo.date.split("-").reverse().join("/")}</p>
                          {evo.toothNumber && <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">{evo.toothNumber}</span>}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handlePrint("evolution", evo.id)} title="Imprimir">
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEditEvolution(evo)} title="Editar">
                            <ClipboardList className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteEvolution(evo.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      {evo.subjective && <p className="text-sm"><strong>S:</strong> {evo.subjective}</p>}
                      {evo.objective && <p className="text-sm"><strong>O:</strong> {evo.objective}</p>}
                      {evo.assessment && <p className="text-sm"><strong>A:</strong> {evo.assessment}</p>}
                      {evo.plan && <p className="text-sm"><strong>P:</strong> {evo.plan}</p>}
                      {evo.procedure && <p className="text-sm"><strong>Procedimento:</strong> {evo.procedure}</p>}
                      {evo.professional && <p className="text-xs text-muted-foreground mt-1">Prof.: {evo.professional}</p>}
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
            <p className="text-xs text-muted-foreground">Radiografias, fotos intraorais, documentos (máx. 2MB por arquivo).</p>

            {files.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mb-4 opacity-40" />
                  <p>Nenhum arquivo anexado</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {files.map((f) => (
                  <Card key={f.id}>
                    <CardContent className="p-3 space-y-2">
                      {f.type.startsWith("image/") ? (
                        <img src={f.data} alt={f.name} className="w-full h-48 object-cover rounded-md" />
                      ) : (
                        <div className="w-full h-48 flex items-center justify-center bg-muted rounded-md">
                          <FileImage className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{f.name}</p>
                          <p className="text-xs text-muted-foreground">{f.date.split("-").reverse().join("/")}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handlePrint("file", f.id)} title="Imprimir">
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteFile(f.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <Input
                        placeholder="Descrição do arquivo..."
                        value={f.description}
                        onChange={(e) => handleUpdateFileDescription(f.id, e.target.value)}
                        className="text-xs"
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* PRINT TAB */}
          <TabsContent value="print" className="space-y-4 mt-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-lg font-semibold">Impressão Individualizada</h2>
                <p className="text-sm text-muted-foreground">Escolha o que deseja imprimir. Cada impressão sai formatada com cabeçalho e rodapé profissional.</p>
                <div className="grid gap-3">
                  <Button variant="outline" onClick={() => handlePrint("clinical")} className="justify-start">
                    <ClipboardList className="h-4 w-4 mr-2" />Imprimir Ficha Clínica Completa
                  </Button>
                  {patientEvolutions.length > 0 && (
                    <>
                      <p className="text-sm font-medium mt-2">Evoluções:</p>
                      {[...patientEvolutions].sort((a, b) => b.date.localeCompare(a.date)).map((evo) => (
                        <Button key={evo.id} variant="outline" onClick={() => handlePrint("evolution", evo.id)} className="justify-start text-left">
                          <Stethoscope className="h-4 w-4 mr-2 shrink-0" />
                          <span className="truncate">{evo.date.split("-").reverse().join("/")} — {evo.procedure || evo.subjective || "Evolução"}</span>
                        </Button>
                      ))}
                    </>
                  )}
                  {files.length > 0 && (
                    <>
                      <p className="text-sm font-medium mt-2">Arquivos:</p>
                      {files.map((f) => (
                        <Button key={f.id} variant="outline" onClick={() => handlePrint("file", f.id)} className="justify-start text-left">
                          <FileImage className="h-4 w-4 mr-2 shrink-0" />
                          <span className="truncate">{f.name} — {f.date.split("-").reverse().join("/")}</span>
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
          <PrintHeader />
          <PatientHeader />
          <h2 className="text-lg font-bold text-center mb-4">FICHA CLÍNICA</h2>
          <div className="space-y-3">
            {clinical.chiefComplaint && <div><strong>Queixa Principal (S):</strong><p className="ml-4">{clinical.chiefComplaint}</p></div>}
            {clinical.medicalHistory && <div><strong>Histórico Médico:</strong><p className="ml-4">{clinical.medicalHistory}</p></div>}
            {clinical.familyHistory && <div><strong>Histórico Familiar:</strong><p className="ml-4">{clinical.familyHistory}</p></div>}
            {clinical.allergies && <div><strong>Alergias:</strong><p className="ml-4">{clinical.allergies}</p></div>}
            {clinical.currentMedications && <div><strong>Medicamentos em Uso:</strong><p className="ml-4">{clinical.currentMedications}</p></div>}
            {clinical.dentalHistory && <div><strong>Histórico Odontológico:</strong><p className="ml-4">{clinical.dentalHistory}</p></div>}
            {clinical.habits && <div><strong>Hábitos:</strong><p className="ml-4">{clinical.habits}</p></div>}
            {clinical.extraOralExam && <div><strong>Exame Extraoral (O):</strong><p className="ml-4">{clinical.extraOralExam}</p></div>}
            {clinical.intraOralExam && <div><strong>Exame Intraoral (O):</strong><p className="ml-4">{clinical.intraOralExam}</p></div>}
            {clinical.diagnosis && <div><strong>Diagnóstico (A):</strong><p className="ml-4">{clinical.diagnosis}</p></div>}
            {clinical.treatmentPlan && <div><strong>Plano de Tratamento (P):</strong><p className="ml-4">{clinical.treatmentPlan}</p></div>}
            {clinical.prognosis && <div><strong>Prognóstico:</strong><p className="ml-4">{clinical.prognosis}</p></div>}
          </div>
          <PrintFooter />
        </div>
      )}

      {printMode === "evolution" && selectedEvo && (
        <div ref={printRef} className="print-area p-8 text-sm leading-relaxed" style={{ fontFamily: "serif" }}>
          <PrintHeader />
          <PatientHeader />
          <h2 className="text-lg font-bold text-center mb-4">EVOLUÇÃO CLÍNICA</h2>
          <p className="mb-2"><strong>Data:</strong> {selectedEvo.date.split("-").reverse().join("/")}</p>
          {selectedEvo.toothNumber && <p className="mb-2"><strong>Dente/Região:</strong> {selectedEvo.toothNumber}</p>}
          <div className="space-y-2 mt-4">
            {selectedEvo.subjective && <div><strong>S — Subjetivo:</strong><p className="ml-4">{selectedEvo.subjective}</p></div>}
            {selectedEvo.objective && <div><strong>O — Objetivo:</strong><p className="ml-4">{selectedEvo.objective}</p></div>}
            {selectedEvo.assessment && <div><strong>A — Avaliação:</strong><p className="ml-4">{selectedEvo.assessment}</p></div>}
            {selectedEvo.plan && <div><strong>P — Plano:</strong><p className="ml-4">{selectedEvo.plan}</p></div>}
            {selectedEvo.procedure && <div><strong>Procedimento Realizado:</strong><p className="ml-4">{selectedEvo.procedure}</p></div>}
          </div>
          {selectedEvo.professional && (
            <div className="mt-12 text-center">
              <div className="border-t border-foreground w-64 mx-auto pt-2">
                <p>{selectedEvo.professional}</p>
                <p className="text-xs">{settings.registrationNumber}</p>
              </div>
            </div>
          )}
          <PrintFooter />
        </div>
      )}

      {printMode === "file" && selectedFile && (
        <div ref={printRef} className="print-area p-8 text-sm leading-relaxed" style={{ fontFamily: "serif" }}>
          <PrintHeader />
          <PatientHeader />
          <h2 className="text-lg font-bold text-center mb-4">DOCUMENTAÇÃO CLÍNICA</h2>
          <p className="mb-2"><strong>Arquivo:</strong> {selectedFile.name}</p>
          <p className="mb-2"><strong>Data:</strong> {selectedFile.date.split("-").reverse().join("/")}</p>
          {selectedFile.description && <p className="mb-4"><strong>Descrição:</strong> {selectedFile.description}</p>}
          {selectedFile.type.startsWith("image/") && (
            <div className="flex justify-center">
              <img src={selectedFile.data} alt={selectedFile.name} className="max-w-full max-h-[60vh] object-contain" />
            </div>
          )}
          <PrintFooter />
        </div>
      )}
    </div>
  );
};

export default PatientProfile;
