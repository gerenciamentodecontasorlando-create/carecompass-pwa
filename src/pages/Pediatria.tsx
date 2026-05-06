import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Baby, AlertTriangle, CheckCircle2, Save, Calculator, Printer } from "lucide-react";
import { toast } from "sonner";
import {
  getWFA, getHFA, getBMI, getHC, type Sex,
} from "@/lib/whoGrowthData";
import {
  interpolateLMS, lmsToZ, classifyWeightForAge, classifyHeightForAge,
  classifyBMIForAge, classifyHCForAge, correctedAgeMonths,
} from "@/lib/whoZScore";
import { GrowthChart } from "@/components/pediatria/GrowthChart";
import {
  getAnamnesisSchema, getAgeGroupFromMonths, AGE_GROUP_LABELS, type AgeGroup,
} from "@/lib/pediatricAnamnesis";

interface Patient { id: string; name: string; birth_date: string; }
interface Assessment {
  id: string; patient_id: string; date: string; sex: string;
  age_months: number; weight_kg: number | null; height_cm: number | null;
  head_circumference_cm: number | null; gestational_age_weeks: number | null;
  indicators: Record<string, { z: number; percentile: number; classification: string; alert: string }>;
  classification: string; notes: string;
}

function calcAgeMonths(birthDate: string): number {
  if (!birthDate) return 0;
  const b = new Date(birthDate);
  if (isNaN(b.getTime())) return 0;
  const now = new Date();
  return (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth()) +
    (now.getDate() - b.getDate()) / 30.4375;
}

const Pediatria = () => {
  const { clinicId } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  // Antropometria form
  const [sex, setSex] = useState<Sex>("M");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [hc, setHc] = useState("");
  const [gestAge, setGestAge] = useState("");
  const [notes, setNotes] = useState("");

  // Anamnese form
  const [anamnesisData, setAnamnesisData] = useState<Record<string, string>>({});
  const [anamnesisId, setAnamnesisId] = useState<string | null>(null);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const ageMonths = selectedPatient ? calcAgeMonths(selectedPatient.birth_date) : 0;
  const correctedAge = correctedAgeMonths(ageMonths, gestAge ? +gestAge : undefined);
  const ageGroup: AgeGroup = getAgeGroupFromMonths(ageMonths);
  const anamnesisSchema = useMemo(() => getAnamnesisSchema(ageGroup), [ageGroup]);

  useEffect(() => {
    if (!clinicId) return;
    supabase.from("patients").select("id,name,birth_date").eq("clinic_id", clinicId)
      .order("name").then(({ data }) => setPatients((data || []) as Patient[]));
  }, [clinicId]);

  const loadPatientData = useCallback(async () => {
    if (!selectedPatientId || !clinicId) return;
    const { data: aData } = await supabase
      .from("pediatric_assessments")
      .select("*")
      .eq("clinic_id", clinicId)
      .eq("patient_id", selectedPatientId)
      .is("deleted_at", null)
      .order("date", { ascending: true });
    setAssessments((aData || []) as unknown as Assessment[]);

    const { data: anData } = await supabase
      .from("pediatric_anamnesis")
      .select("*")
      .eq("clinic_id", clinicId)
      .eq("patient_id", selectedPatientId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (anData) {
      setAnamnesisId(anData.id);
      setAnamnesisData((anData.form_data as Record<string, string>) || {});
    } else {
      setAnamnesisId(null);
      setAnamnesisData({});
    }
  }, [selectedPatientId, clinicId]);

  useEffect(() => { loadPatientData(); }, [loadPatientData]);

  // Live indicator calculation
  const indicators = useMemo(() => {
    const out: Record<string, ReturnType<typeof classifyWeightForAge> | null> = {
      wfa: null, hfa: null, bmi: null, hc: null,
    };
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const hcv = parseFloat(hc);

    if (w && correctedAge >= 0) {
      const lms = interpolateLMS(correctedAge, getWFA(sex));
      if (lms && correctedAge <= 60) out.wfa = classifyWeightForAge(lmsToZ(w, lms));
    }
    if (h && correctedAge >= 0) {
      const lms = interpolateLMS(correctedAge, getHFA(sex));
      if (lms) out.hfa = classifyHeightForAge(lmsToZ(h, lms));
    }
    if (w && h && correctedAge >= 0) {
      const bmiVal = w / Math.pow(h / 100, 2);
      const lms = interpolateLMS(correctedAge, getBMI(sex));
      if (lms) out.bmi = classifyBMIForAge(lmsToZ(bmiVal, lms), correctedAge / 12);
    }
    if (hcv && correctedAge >= 0 && correctedAge <= 60) {
      const lms = interpolateLMS(correctedAge, getHC(sex));
      if (lms) out.hc = classifyHCForAge(lmsToZ(hcv, lms));
    }
    return out;
  }, [weight, height, hc, sex, correctedAge]);

  const hasAlert = Object.values(indicators).some(i => i && (i.alert === "warning" || i.alert === "danger"));

  const handleSaveAssessment = async () => {
    if (!selectedPatientId || !clinicId) { toast.error("Selecione um paciente"); return; }
    if (!weight && !height && !hc) { toast.error("Informe ao menos uma medida"); return; }

    const indicatorsForDB: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(indicators)) {
      if (v) indicatorsForDB[k] = v;
    }

    const { error } = await supabase.from("pediatric_assessments").insert({
      clinic_id: clinicId,
      patient_id: selectedPatientId,
      date,
      sex,
      age_months: +correctedAge.toFixed(2),
      weight_kg: weight ? +weight : null,
      height_cm: height ? +height : null,
      head_circumference_cm: hc ? +hc : null,
      gestational_age_weeks: gestAge ? +gestAge : null,
      indicators: indicatorsForDB,
      classification: indicators.bmi?.classification || indicators.wfa?.classification || "",
      notes,
    });
    if (error) { toast.error("Erro ao salvar: " + error.message); return; }
    toast.success("Avaliação salva!");
    setWeight(""); setHeight(""); setHc(""); setNotes("");
    loadPatientData();
  };

  const handleSaveAnamnesis = async () => {
    if (!selectedPatientId || !clinicId) { toast.error("Selecione um paciente"); return; }
    const payload = {
      clinic_id: clinicId,
      patient_id: selectedPatientId,
      age_group: ageGroup,
      form_data: anamnesisData,
    };
    const { error } = anamnesisId
      ? await supabase.from("pediatric_anamnesis").update(payload).eq("id", anamnesisId)
      : await supabase.from("pediatric_anamnesis").insert(payload);
    if (error) { toast.error("Erro ao salvar: " + error.message); return; }
    toast.success("Anamnese salva!");
    loadPatientData();
  };

  // Patient points for charts (history)
  const wPoints = assessments.filter(a => a.weight_kg).map(a => ({ ageMonths: a.age_months, value: a.weight_kg! }));
  const hPoints = assessments.filter(a => a.height_cm).map(a => ({ ageMonths: a.age_months, value: a.height_cm! }));
  const hcPoints = assessments.filter(a => a.head_circumference_cm).map(a => ({ ageMonths: a.age_months, value: a.head_circumference_cm! }));
  const bmiPoints = assessments.filter(a => a.weight_kg && a.height_cm)
    .map(a => ({ ageMonths: a.age_months, value: +(a.weight_kg! / Math.pow(a.height_cm! / 100, 2)).toFixed(2) }));

  // Add current input as a "preview" point
  const cw = parseFloat(weight); const ch = parseFloat(height); const chc = parseFloat(hc);
  const liveW = cw ? [...wPoints, { ageMonths: correctedAge, value: cw }] : wPoints;
  const liveH = ch ? [...hPoints, { ageMonths: correctedAge, value: ch }] : hPoints;
  const liveHC = chc ? [...hcPoints, { ageMonths: correctedAge, value: chc }] : hcPoints;
  const liveBMI = cw && ch ? [...bmiPoints, { ageMonths: correctedAge, value: +(cw / Math.pow(ch / 100, 2)).toFixed(2) }] : bmiPoints;

  const handlePrint = () => window.print();

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 print:p-0">
      <div className="flex items-center gap-3 print:hidden">
        <Baby className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Pediatria</h1>
          <p className="text-sm text-muted-foreground">Avaliação antropométrica (OMS) e anamnese por faixa etária</p>
        </div>
      </div>

      <Card className="print:hidden">
        <CardContent className="pt-6">
          <Label>Paciente</Label>
          <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
            <SelectTrigger><SelectValue placeholder="Selecione um paciente" /></SelectTrigger>
            <SelectContent>
              {patients.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} {p.birth_date ? `— ${calcAgeMonths(p.birth_date).toFixed(1)} meses` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedPatient && (
            <div className="flex flex-wrap gap-2 mt-3 text-sm">
              <Badge variant="outline">Idade cronológica: {ageMonths.toFixed(1)} meses ({(ageMonths/12).toFixed(1)} anos)</Badge>
              {gestAge && +gestAge < 37 && (
                <Badge variant="secondary">Idade corrigida: {correctedAge.toFixed(1)} meses</Badge>
              )}
              <Badge>{AGE_GROUP_LABELS[ageGroup]}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedPatientId && (
        <Tabs defaultValue="anthro">
          <TabsList className="print:hidden">
            <TabsTrigger value="anthro"><Calculator className="h-4 w-4 mr-2" />Antropometria OMS</TabsTrigger>
            <TabsTrigger value="anamnese">Anamnese ({AGE_GROUP_LABELS[ageGroup].split(" ")[0]})</TabsTrigger>
          </TabsList>

          <TabsContent value="anthro" className="space-y-4">
            <Card className="print:shadow-none print:border-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Nova Avaliação</CardTitle>
                <Button variant="outline" size="sm" onClick={handlePrint} className="print:hidden">
                  <Printer className="h-4 w-4 mr-2" />Imprimir laudo
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div><Label>Sexo</Label>
                    <Select value={sex} onValueChange={(v) => setSex(v as Sex)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Feminino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Data</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
                  <div><Label>Peso (kg)</Label><Input type="number" step="0.01" value={weight} onChange={e => setWeight(e.target.value)} /></div>
                  <div><Label>Estatura (cm)</Label><Input type="number" step="0.1" value={height} onChange={e => setHeight(e.target.value)} /></div>
                  <div><Label>PC (cm)</Label><Input type="number" step="0.1" value={hc} onChange={e => setHc(e.target.value)} /></div>
                  <div><Label>IG (sem) — se prematuro</Label><Input type="number" step="1" value={gestAge} onChange={e => setGestAge(e.target.value)} placeholder="40" /></div>
                </div>

                {hasAlert && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Alerta clínico</AlertTitle>
                    <AlertDescription>Um ou mais indicadores estão fora da faixa de normalidade. Avaliar conduta.</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries({ wfa: "Peso/Idade", hfa: "Estatura/Idade", bmi: "IMC/Idade", hc: "PC/Idade" }).map(([key, label]) => {
                    const ind = indicators[key as keyof typeof indicators];
                    if (!ind) return (
                      <div key={key} className="rounded border border-dashed p-3 text-sm text-muted-foreground">
                        {label}: aguardando dados
                      </div>
                    );
                    const color = ind.alert === "danger" ? "destructive" : ind.alert === "warning" ? "secondary" : "default";
                    return (
                      <div key={key} className="rounded border p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{label}</span>
                          <Badge variant={color as "default" | "secondary" | "destructive"}>
                            {ind.alert === "normal" ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                            Z={ind.z.toFixed(2)} · P{ind.percentile.toFixed(1)}
                          </Badge>
                        </div>
                        <p className="text-sm">{ind.classification}</p>
                      </div>
                    );
                  })}
                </div>

                <div>
                  <Label>Observações clínicas</Label>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
                </div>

                <Button onClick={handleSaveAssessment} className="print:hidden">
                  <Save className="h-4 w-4 mr-2" />Salvar avaliação
                </Button>
              </CardContent>
            </Card>

            {/* Growth charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card><CardContent className="pt-4">
                <GrowthChart table={getWFA(sex)} patientPoints={liveW} unit="kg" title="Peso para Idade (OMS)" yLabel="Peso" />
              </CardContent></Card>
              <Card><CardContent className="pt-4">
                <GrowthChart table={getHFA(sex)} patientPoints={liveH} unit="cm" title="Estatura para Idade (OMS)" yLabel="Estatura" />
              </CardContent></Card>
              <Card><CardContent className="pt-4">
                <GrowthChart table={getBMI(sex)} patientPoints={liveBMI} unit="kg/m²" title="IMC para Idade (OMS)" yLabel="IMC" />
              </CardContent></Card>
              {correctedAge <= 60 && (
                <Card><CardContent className="pt-4">
                  <GrowthChart table={getHC(sex)} patientPoints={liveHC} unit="cm" title="Perímetro Cefálico para Idade (OMS)" yLabel="PC" />
                </CardContent></Card>
              )}
            </div>

            {assessments.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Histórico de medições ({assessments.length})</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {assessments.slice().reverse().map(a => (
                    <div key={a.id} className="flex flex-wrap gap-3 border-b pb-2">
                      <span className="font-medium">{a.date}</span>
                      <span>{a.age_months.toFixed(1)}m</span>
                      {a.weight_kg && <span>P: {a.weight_kg}kg</span>}
                      {a.height_cm && <span>E: {a.height_cm}cm</span>}
                      {a.head_circumference_cm && <span>PC: {a.head_circumference_cm}cm</span>}
                      {a.classification && <Badge variant="outline">{a.classification}</Badge>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="anamnese" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Anamnese — {AGE_GROUP_LABELS[ageGroup]}</CardTitle>
                <p className="text-sm text-muted-foreground">Baseada em protocolos da SBP e Caderneta da Criança (MS).</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {anamnesisSchema.map(section => (
                  <div key={section.title} className="space-y-3">
                    <h3 className="font-semibold text-primary border-b pb-1">{section.title}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {section.fields.map(field => (
                        <div key={field.name} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                          <Label className="text-xs">{field.label}</Label>
                          {field.type === "textarea" ? (
                            <Textarea
                              value={anamnesisData[field.name] || ""}
                              onChange={e => setAnamnesisData({ ...anamnesisData, [field.name]: e.target.value })}
                              placeholder={field.placeholder}
                              rows={2}
                            />
                          ) : field.type === "select" ? (
                            <Select
                              value={anamnesisData[field.name] || ""}
                              onValueChange={v => setAnamnesisData({ ...anamnesisData, [field.name]: v })}
                            >
                              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                              <SelectContent>
                                {field.options?.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                              value={anamnesisData[field.name] || ""}
                              onChange={e => setAnamnesisData({ ...anamnesisData, [field.name]: e.target.value })}
                              placeholder={field.placeholder}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 print:hidden">
                  <Button onClick={handleSaveAnamnesis}>
                    <Save className="h-4 w-4 mr-2" />Salvar anamnese
                  </Button>
                  <Button variant="outline" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" />Imprimir
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Pediatria;
