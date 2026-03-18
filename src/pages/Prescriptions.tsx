import { useState } from "react";
import { useClinicData } from "@/hooks/useClinicData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Printer, Plus, Trash2, Pill, ChevronDown, ShieldCheck, Loader2, MessageCircle, Receipt, Pencil, Calculator, Sparkles, Baby, Weight } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useFormDraft } from "@/hooks/useFormDraft";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ReactMarkdown from "react-markdown";

type MedEntry = { name: string; posology: string };

const ADULT_CATALOG: Record<string, MedEntry[]> = {
  "Antibióticos": [
    { name: "Amoxicilina + Clavulanato (Clavulin) 875/125mg", posology: "Tomar 1 comprimido de 12 em 12 horas por 7 dias." },
    { name: "Amoxicilina 500mg", posology: "Tomar 1 cápsula de 8 em 8 horas por 7 dias." },
    { name: "Azitromicina 500mg", posology: "Tomar 1 comprimido ao dia por 3 dias." },
    { name: "Cefalexina 500mg", posology: "Tomar 1 comprimido de 6 em 6 horas por 7 dias." },
    { name: "Clindamicina 300mg", posology: "Tomar 1 cápsula de 8 em 8 horas por 7 dias." },
    { name: "Metronidazol 400mg", posology: "Tomar 1 comprimido de 8 em 8 horas por 7 dias." },
  ],
  "Analgésicos": [
    { name: "Dipirona Sódica 500mg", posology: "Tomar 1 comprimido de 6 em 6 horas se dor." },
    { name: "Paracetamol 750mg", posology: "Tomar 1 comprimido de 6 em 6 horas se dor. Máximo 4 comprimidos/dia." },
    { name: "Tramadol 50mg", posology: "Tomar 1 cápsula de 8 em 8 horas se dor intensa. Uso por no máximo 5 dias." },
  ],
  "Anti-inflamatórios": [
    { name: "Ibuprofeno 600mg", posology: "Tomar 1 comprimido de 8 em 8 horas por 5 dias, após as refeições." },
    { name: "Nimesulida 100mg", posology: "Tomar 1 comprimido de 12 em 12 horas por 5 dias, após as refeições." },
    { name: "Dexametasona 4mg comprimido", posology: "Tomar 1 comprimido ao dia por 3 dias, pela manhã após o café." },
    { name: "Prednisolona 20mg", posology: "Tomar 1 comprimido ao dia por 5 dias, pela manhã." },
    { name: "Diclofenaco Sódico 50mg", posology: "Tomar 1 comprimido de 8 em 8 horas por 5 dias, após as refeições." },
  ],
  "Antivirais": [
    { name: "Aciclovir 200mg comprimido", posology: "Tomar 1 comprimido de 4 em 4 horas (5x/dia) por 5 dias." },
    { name: "Aciclovir 400mg comprimido", posology: "Tomar 1 comprimido de 8 em 8 horas por 5 dias." },
    { name: "Aciclovir Pomada 5%", posology: "Aplicar na lesão 5 vezes ao dia, a cada 4 horas, por 5 a 10 dias." },
    { name: "Valaciclovir 500mg", posology: "Tomar 1 comprimido de 12 em 12 horas por 5 dias." },
  ],
  "Pomadas e Tópicos Orais": [
    { name: "Oncilon-A Orabase (Triancinolona Acetonida)", posology: "Aplicar pequena quantidade sobre a lesão oral 2 a 3 vezes ao dia, após as refeições e ao deitar, sem friccionar." },
    { name: "Dexametasona Pomada Oral (Omcilon-AM)", posology: "Aplicar sobre a lesão oral 3 vezes ao dia, após alimentação e higiene bucal." },
    { name: "Miconazol Gel Oral 2%", posology: "Aplicar na região afetada 4 vezes ao dia por 14 dias." },
    { name: "Nistatina Suspensão Oral 100.000 UI/mL", posology: "Bochechar e engolir 5mL, 4 vezes ao dia por 14 dias." },
    { name: "Digluconato de Clorexidina 0,12% (Periogard)", posology: "Bochechar 15mL por 1 minuto, 2 vezes ao dia, por 7 dias. Não engolir." },
    { name: "Rifocina Spray", posology: "Aplicar sobre a lesão 2 a 3 vezes ao dia." },
  ],
  "Antifúngicos": [
    { name: "Fluconazol 150mg", posology: "Tomar 1 cápsula em dose única. Repetir após 7 dias se necessário." },
    { name: "Cetoconazol Creme 2%", posology: "Aplicar na área afetada 1 a 2 vezes ao dia por 2 a 4 semanas." },
    { name: "Cetoconazol Shampoo 2%", posology: "Aplicar no couro cabeludo, deixar agir 5 minutos e enxaguar. Usar 2 vezes por semana por 4 semanas." },
  ],
  "Gripes e Resfriados": [
    { name: "Loratadina 10mg", posology: "Tomar 1 comprimido ao dia." },
    { name: "Desloratadina 5mg", posology: "Tomar 1 comprimido ao dia." },
    { name: "Cloridrato de Fenilefrina + Paracetamol + Clorfeniramina (Resfenol)", posology: "Tomar 1 cápsula de 6 em 6 horas. Máximo 4 cápsulas/dia." },
    { name: "Ambroxol Xarope 30mg/5mL", posology: "Tomar 10mL (1 colher de sopa) de 8 em 8 horas." },
    { name: "Acetilcisteína 600mg", posology: "Dissolver 1 envelope em água e tomar 1 vez ao dia." },
    { name: "Dexclorfeniramina 2mg (Polaramine)", posology: "Tomar 1 comprimido de 8 em 8 horas." },
  ],
  "Asma e Broncodilatadores": [
    { name: "Salbutamol Spray 100mcg/dose (Aerolin)", posology: "Fazer 2 jatos por via inalatória a cada 6 horas, ou conforme necessidade (SOS)." },
    { name: "Budesonida Spray Nasal 50mcg", posology: "Aplicar 2 jatos em cada narina, 2 vezes ao dia." },
    { name: "Prednisolona 3mg/mL Solução Oral", posology: "Tomar conforme peso corporal (1mg/kg/dia) por 3 a 5 dias." },
    { name: "Formoterol + Budesonida 6/200mcg (Alenia)", posology: "Inalar 1 cápsula de 12 em 12 horas." },
    { name: "Brometo de Ipratrópio 0,025% (Atrovent) Solução para inalação", posology: "Fazer inalação com 20 a 40 gotas diluídas em 3mL de soro fisiológico, 3 vezes ao dia." },
  ],
  "Antidiarreicos e Gastrointestinais": [
    { name: "Loperamida 2mg (Imosec)", posology: "Tomar 2 comprimidos na primeira dose, depois 1 comprimido após cada evacuação líquida. Máximo 8 comprimidos/dia." },
    { name: "Racecadotrila 100mg", posology: "Tomar 1 cápsula de 8 em 8 horas, antes das refeições, por até 7 dias." },
    { name: "Sais de Reidratação Oral (SRO)", posology: "Dissolver 1 envelope em 1 litro de água filtrada ou fervida. Tomar em pequenos goles após cada evacuação." },
    { name: "Omeprazol 20mg", posology: "Tomar 1 cápsula ao dia, em jejum, 30 minutos antes do café da manhã." },
    { name: "Metoclopramida 10mg (Plasil)", posology: "Tomar 1 comprimido de 8 em 8 horas, 30 minutos antes das refeições." },
    { name: "Buscopan Composto (Escopolamina + Dipirona)", posology: "Tomar 1 a 2 comprimidos de 6 em 6 horas se cólica/dor abdominal." },
  ],
  "Anti-hipertensivos": [
    { name: "Losartana Potássica 50mg", posology: "Tomar 1 comprimido ao dia, pela manhã." },
    { name: "Anlodipino 5mg", posology: "Tomar 1 comprimido ao dia, pela manhã." },
    { name: "Enalapril 10mg", posology: "Tomar 1 comprimido de 12 em 12 horas." },
  ],
  "Antidiabéticos": [
    { name: "Metformina 850mg", posology: "Tomar 1 comprimido de 12 em 12 horas, durante as refeições." },
    { name: "Glibenclamida 5mg", posology: "Tomar 1 comprimido ao dia, antes do café da manhã." },
    { name: "Gliclazida 30mg MR", posology: "Tomar 1 comprimido ao dia, antes do café da manhã." },
    { name: "Sitagliptina 100mg", posology: "Tomar 1 comprimido ao dia, com ou sem alimento." },
  ],
  "Antiparasitários": [
    { name: "Albendazol 400mg", posology: "Tomar 1 comprimido em dose única." },
    { name: "Ivermectina 6mg", posology: "Tomar conforme peso corporal (200mcg/kg), em dose única, em jejum." },
  ],
  "Shampoos Medicamentosos": [
    { name: "Cetoconazol Shampoo 2%", posology: "Aplicar no couro cabeludo, deixar agir 5 minutos e enxaguar. Usar 2 vezes por semana por 4 semanas." },
    { name: "Sulfeto de Selênio Shampoo 2,5% (Selsun)", posology: "Aplicar no couro cabeludo, massagear, deixar agir 3 minutos e enxaguar. Usar 2 vezes por semana." },
    { name: "Piritionato de Zinco Shampoo 1%", posology: "Usar 3 vezes por semana, deixar agir 3 a 5 minutos antes de enxaguar." },
  ],
};

const PEDIATRIC_CATALOG: Record<string, MedEntry[]> = {
  "Antibióticos Pediátricos": [
    { name: "Amoxicilina Suspensão 250mg/5mL", posology: "Administrar ___mL de 8 em 8 horas por 7 dias. (Dose: 25-50mg/kg/dia)" },
    { name: "Amoxicilina + Clavulanato Suspensão 250/62,5mg/5mL", posology: "Administrar ___mL de 8 em 8 horas por 7 dias. (Dose: 25-45mg/kg/dia)" },
    { name: "Azitromicina Suspensão 200mg/5mL", posology: "Administrar ___mL 1x/dia por 3 dias. (Dose: 10mg/kg/dia)" },
    { name: "Cefalexina Suspensão 250mg/5mL", posology: "Administrar ___mL de 6 em 6 horas por 7 dias. (Dose: 25-50mg/kg/dia)" },
    { name: "Sulfametoxazol + Trimetoprima Suspensão (Bactrim)", posology: "Administrar ___mL de 12 em 12 horas por 7 dias. (Dose: 40mg/kg/dia de SMX)" },
  ],
  "Analgésicos e Antitérmicos Pediátricos": [
    { name: "Dipirona Gotas 500mg/mL", posology: "Administrar 1 gota/kg de 6 em 6 horas se dor ou febre. Máx. 40 gotas/dose." },
    { name: "Paracetamol Gotas 200mg/mL", posology: "Administrar 1 gota/kg de 6 em 6 horas se dor ou febre. Máx. 35 gotas/dose." },
    { name: "Ibuprofeno Gotas 100mg/mL", posology: "Administrar 1 gota/kg de 6 em 6 horas (máx. 40 gotas). Uso por até 3 dias." },
    { name: "Ibuprofeno Suspensão 50mg/mL", posology: "Administrar ___mL de 6 em 8 horas. (Dose: 5-10mg/kg/dose)" },
  ],
  "Anti-inflamatórios Pediátricos": [
    { name: "Prednisolona Solução Oral 3mg/mL", posology: "Administrar ___mL 1x/dia por 3-5 dias. (Dose: 1-2mg/kg/dia)" },
    { name: "Dexametasona Elixir 0,1mg/mL", posology: "Administrar ___mL 1x/dia por 3 dias. (Dose: 0,15-0,6mg/kg/dia)" },
    { name: "Nimesulida Gotas 50mg/mL (>2 anos)", posology: "Administrar 1 gota/kg de 12 em 12 horas por 3 dias. (Dose: 5mg/kg/dia)" },
  ],
  "Antialérgicos Pediátricos": [
    { name: "Loratadina Xarope 1mg/mL", posology: "<30kg: 5mL 1x/dia. >30kg: 10mL 1x/dia." },
    { name: "Desloratadina Xarope 0,5mg/mL", posology: "1-5 anos: 2,5mL 1x/dia. 6-11 anos: 5mL 1x/dia. >12 anos: 10mL 1x/dia." },
    { name: "Dexclorfeniramina Xarope 0,4mg/mL (Polaramine)", posology: "2-6 anos: 2,5mL 3x/dia. 6-12 anos: 5mL 3x/dia." },
    { name: "Hidroxizina Xarope 2mg/mL (Hixizine)", posology: "Administrar ___mL de 8 em 8 horas. (Dose: 1-2mg/kg/dia)" },
  ],
  "Antitussígenos e Mucolíticos Pediátricos": [
    { name: "Ambroxol Xarope Pediátrico 15mg/5mL", posology: "<2 anos: 2,5mL 2x/dia. 2-5 anos: 2,5mL 3x/dia. >5 anos: 5mL 3x/dia." },
    { name: "Acetilcisteína Granulado 100mg", posology: "2-6 anos: 1 sachê 2x/dia. >6 anos: 1 sachê 3x/dia. Dissolver em água." },
    { name: "Brometo de Ipratrópio 0,025% (Atrovent) Solução inalatória", posology: "<6 anos: 10-20 gotas em 3mL de SF, 3x/dia. >6 anos: 20-40 gotas em 3mL de SF, 3x/dia." },
  ],
  "Antifúngicos e Antiparasitários Pediátricos": [
    { name: "Nistatina Suspensão Oral 100.000 UI/mL", posology: "Lactentes: 1mL 4x/dia. Crianças: 2-5mL 4x/dia. Aplicar na mucosa oral por 14 dias." },
    { name: "Miconazol Gel Oral 2%", posology: "Aplicar ½ colher de chá na região afetada 4x/dia por 7-14 dias." },
    { name: "Albendazol Suspensão 40mg/mL", posology: ">2 anos: 10mL (400mg) em dose única." },
    { name: "Mebendazol Suspensão 20mg/mL", posology: ">1 ano: 5mL de 12 em 12 horas por 3 dias." },
    { name: "Ivermectina Gotas 6mg/mL (>15kg)", posology: "Administrar conforme peso: 200mcg/kg em dose única, em jejum." },
  ],
  "Gastrointestinais Pediátricos": [
    { name: "Sais de Reidratação Oral (SRO)", posology: "Dissolver 1 envelope em 1L de água. Oferecer após cada evacuação: <1 ano: 50-100mL, 1-10 anos: 100-200mL." },
    { name: "Ondansetrona Xarope 0,8mg/mL (Vonau)", posology: "Administrar ___mL de 8 em 8 horas. (Dose: 0,15mg/kg/dose, máx. 4mg)" },
    { name: "Dimeticona Gotas 75mg/mL", posology: "Lactentes: 3-5 gotas antes das mamadas. Crianças: 5-8 gotas de 8 em 8 horas." },
    { name: "Domperidona Suspensão 1mg/mL (Motilium)", posology: "Administrar ___mL de 8 em 8 horas antes das refeições. (Dose: 0,25mg/kg/dose)" },
  ],
  "Vitaminas e Suplementos Pediátricos": [
    { name: "Sulfato Ferroso Gotas 125mg/mL (25mg Fe elem./mL)", posology: "Profilaxia: 1mg Fe/kg/dia. Tratamento: 3-5mg Fe/kg/dia. Administrar 30min antes das refeições." },
    { name: "Vitamina D3 Gotas 200UI/gota", posology: "Lactentes até 1 ano: 2 gotas/dia (400UI). 1-2 anos: 3 gotas/dia (600UI)." },
    { name: "Polivitamínico Gotas (Ad-til / Protovit)", posology: "Administrar 12 gotas 1x/dia." },
  ],
};

// Pediatric dose calculation rules: { concentration (mg/mL), dose range (mg/kg/day), doses per day, max single dose mg? }
type DoseRule = { concMgPerMl: number; minDosePerKg: number; maxDosePerKg: number; dosesPerDay: number; maxSingleDoseMg?: number; unit: "mL" | "gotas"; dropMl?: number };
const DOSE_RULES: Record<string, DoseRule> = {
  "Amoxicilina Suspensão 250mg/5mL": { concMgPerMl: 50, minDosePerKg: 25, maxDosePerKg: 50, dosesPerDay: 3, unit: "mL" },
  "Amoxicilina + Clavulanato Suspensão 250/62,5mg/5mL": { concMgPerMl: 50, minDosePerKg: 25, maxDosePerKg: 45, dosesPerDay: 3, unit: "mL" },
  "Azitromicina Suspensão 200mg/5mL": { concMgPerMl: 40, minDosePerKg: 10, maxDosePerKg: 10, dosesPerDay: 1, unit: "mL" },
  "Cefalexina Suspensão 250mg/5mL": { concMgPerMl: 50, minDosePerKg: 25, maxDosePerKg: 50, dosesPerDay: 4, unit: "mL" },
  "Dipirona Gotas 500mg/mL": { concMgPerMl: 500, minDosePerKg: 10, maxDosePerKg: 25, dosesPerDay: 4, unit: "gotas", dropMl: 0.05, maxSingleDoseMg: 1000 },
  "Paracetamol Gotas 200mg/mL": { concMgPerMl: 200, minDosePerKg: 10, maxDosePerKg: 15, dosesPerDay: 4, unit: "gotas", dropMl: 0.05, maxSingleDoseMg: 750 },
  "Ibuprofeno Gotas 100mg/mL": { concMgPerMl: 100, minDosePerKg: 5, maxDosePerKg: 10, dosesPerDay: 3, unit: "gotas", dropMl: 0.05, maxSingleDoseMg: 400 },
  "Ibuprofeno Suspensão 50mg/mL": { concMgPerMl: 50, minDosePerKg: 5, maxDosePerKg: 10, dosesPerDay: 3, unit: "mL" },
  "Prednisolona Solução Oral 3mg/mL": { concMgPerMl: 3, minDosePerKg: 1, maxDosePerKg: 2, dosesPerDay: 1, unit: "mL" },
  "Dexametasona Elixir 0,1mg/mL": { concMgPerMl: 0.1, minDosePerKg: 0.15, maxDosePerKg: 0.6, dosesPerDay: 1, unit: "mL" },
  "Hidroxizina Xarope 2mg/mL (Hixizine)": { concMgPerMl: 2, minDosePerKg: 1, maxDosePerKg: 2, dosesPerDay: 3, unit: "mL" },
  "Ondansetrona Xarope 0,8mg/mL (Vonau)": { concMgPerMl: 0.8, minDosePerKg: 0.15, maxDosePerKg: 0.15, dosesPerDay: 3, maxSingleDoseMg: 4, unit: "mL" },
  "Domperidona Suspensão 1mg/mL (Motilium)": { concMgPerMl: 1, minDosePerKg: 0.25, maxDosePerKg: 0.25, dosesPerDay: 3, unit: "mL" },
  "Sulfato Ferroso Gotas 125mg/mL (25mg Fe elem./mL)": { concMgPerMl: 25, minDosePerKg: 1, maxDosePerKg: 5, dosesPerDay: 1, unit: "gotas", dropMl: 0.05 },
};

function calcPediatricDose(medName: string, weightKg: number): string | null {
  const rule = DOSE_RULES[medName];
  if (!rule || weightKg <= 0) return null;
  const dailyMin = rule.minDosePerKg * weightKg;
  const dailyMax = rule.maxDosePerKg * weightKg;
  const singleMin = dailyMin / rule.dosesPerDay;
  const singleMax = dailyMax / rule.dosesPerDay;

  if (rule.unit === "gotas" && rule.dropMl) {
    const mgPerDrop = rule.concMgPerMl * rule.dropMl;
    let dropsMin = Math.round(singleMin / mgPerDrop);
    let dropsMax = Math.round(singleMax / mgPerDrop);
    if (rule.maxSingleDoseMg) {
      const maxDrops = Math.round(rule.maxSingleDoseMg / mgPerDrop);
      dropsMin = Math.min(dropsMin, maxDrops);
      dropsMax = Math.min(dropsMax, maxDrops);
    }
    return dropsMin === dropsMax
      ? `${dropsMin} gotas/dose (${rule.dosesPerDay}x/dia)`
      : `${dropsMin}–${dropsMax} gotas/dose (${rule.dosesPerDay}x/dia)`;
  }

  let mlMin = singleMin / rule.concMgPerMl;
  let mlMax = singleMax / rule.concMgPerMl;
  if (rule.maxSingleDoseMg) {
    const maxMl = rule.maxSingleDoseMg / rule.concMgPerMl;
    mlMin = Math.min(mlMin, maxMl);
    mlMax = Math.min(mlMax, maxMl);
  }
  mlMin = Math.round(mlMin * 10) / 10;
  mlMax = Math.round(mlMax * 10) / 10;
  return mlMin === mlMax
    ? `${mlMin}mL/dose (${rule.dosesPerDay}x/dia)`
    : `${mlMin}–${mlMax}mL/dose (${rule.dosesPerDay}x/dia)`;
}

const MEDICATION_CATALOG = ADULT_CATALOG;

const Prescriptions = () => {
  const { clinicId } = useAuth();
  const { data: settingsArr } = useClinicData("clinic_settings");
  const settings = settingsArr[0] || {};
  const { data: prescriptions, insert, remove, update: updatePrescription } = useClinicData("prescriptions");
  const { data: patients } = useClinicData("patients");
  const [form, setForm, clearDraft] = useFormDraft("prescriptions-form", { patientName: "", medications: "" });
  const [previewId, setPreviewId] = useFormDraft<string | null>("prescriptions-preview", null);
  const [aiReview, setAiReview] = useState<string | null>(null);
  const [aiReviewLoading, setAiReviewLoading] = useState(false);
  const [aiReviewOpen, setAiReviewOpen] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptAmount, setReceiptAmount] = useState("");
  const [receiptDescription, setReceiptDescription] = useState("");
  const [isPediatric, setIsPediatric] = useState(false);
  const [childWeight, setChildWeight] = useState("");
  const [childAge, setChildAge] = useState("");
  const [aiSuggestionLoading, setAiSuggestionLoading] = useState(false);
  const [aiSuggestionOpen, setAiSuggestionOpen] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [pedCondition, setPedCondition] = useState("");

  const activeCatalog = isPediatric ? PEDIATRIC_CATALOG : ADULT_CATALOG;
  const weightKg = parseFloat(childWeight) || 0;

  const addMedicationWithCalc = (med: MedEntry) => {
    if (isPediatric && weightKg > 0) {
      const calc = calcPediatricDose(med.name, weightKg);
      if (calc) {
        const current = form.medications.trim();
        const lines = current ? current.split("\n").filter(l => l.match(/^\d+\)/)) : [];
        const nextNum = lines.length + 1;
        const entry = `${nextNum}) ${med.name}\n   Peso: ${weightKg}kg → ${calc}\n   ${med.posology.replace(/___mL/g, calc.split("mL")[0].split("–").pop()?.trim() + "mL" || "___mL")}`;
        const newMeds = current ? `${current}\n\n${entry}` : entry;
        setForm({ ...form, medications: newMeds });
        toast.success(`${med.name} adicionado com dose calculada`);
        return;
      }
    }
    addMedication(med);
  };

  const handleAiPedSuggestion = async () => {
    if (!pedCondition.trim()) {
      toast.error("Descreva a condição/sintomas da criança"); return;
    }
    setAiSuggestionLoading(true);
    setAiSuggestionOpen(true);
    setAiSuggestion(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          type: "prescription",
          messages: [{
            role: "user",
            content: `Paciente pediátrico${childAge ? `, ${childAge}` : ""}${weightKg > 0 ? `, peso ${weightKg}kg` : ""}.\nCondição/sintomas: ${pedCondition}\n\nSugira prescrição pediátrica completa com medicamentos em suspensão/gotas, doses calculadas por peso quando possível, posologia e duração. Formate de forma clara e numerada, pronta para copiar na receita.`,
          }],
        },
      });
      if (error) throw error;

      // Handle streaming response
      const reader = data instanceof ReadableStream
        ? data.getReader()
        : null;
      if (reader) {
        const decoder = new TextDecoder();
        let result = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n").filter(l => l.startsWith("data: "));
          for (const line of lines) {
            const json = line.replace("data: ", "");
            if (json === "[DONE]") continue;
            try {
              const parsed = JSON.parse(json);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) { result += content; setAiSuggestion(result); }
            } catch {}
          }
        }
        if (!result) setAiSuggestion("Não foi possível gerar sugestão.");
      } else if (typeof data === "string") {
        setAiSuggestion(data);
      } else {
        setAiSuggestion(data?.error || "Resposta inesperada");
      }
    } catch (err) {
      console.error("AI suggestion error:", err);
      setAiSuggestion("Erro ao gerar sugestão. Tente novamente.");
    } finally {
      setAiSuggestionLoading(false);
    }
  };

    const current = form.medications.trim();
    const lines = current ? current.split("\n").filter(l => l.match(/^\d+\)/)) : [];
    const nextNum = lines.length + 1;
    const entry = `${nextNum}) ${med.name}\n   ${med.posology}`;
    const newMeds = current ? `${current}\n\n${entry}` : entry;
    setForm({ ...form, medications: newMeds });
    toast.success(`${med.name} adicionado`);
  };

  const handleEditPrescription = (p: Record<string, unknown>) => {
    setForm({ patientName: String(p.patient_name), medications: String(p.medications || "") });
    toast.info("Receituário carregado para edição");
  };

  const handleAiReview = async () => {
    if (!form.medications.trim()) {
      toast.error("Adicione medicamentos antes de revisar"); return;
    }
    setAiReviewLoading(true);
    setAiReviewOpen(true);
    setAiReview(null);
    try {
      const matchedPatient = patients.find(p =>
        String(p.name).toLowerCase() === form.patientName.trim().toLowerCase()
      );
      let allergies = "", medicalHistory = "", currentMedications = "";
      if (matchedPatient && clinicId) {
        const { data: records } = await supabase
          .from("clinical_records")
          .select("allergies, medical_history, current_medications")
          .eq("patient_id", String(matchedPatient.id))
          .eq("clinic_id", clinicId)
          .maybeSingle();
        if (records) {
          allergies = records.allergies || "";
          medicalHistory = records.medical_history || "";
          currentMedications = records.current_medications || "";
        }
      }
      const { data, error } = await supabase.functions.invoke("review-prescription", {
        body: {
          medications: form.medications,
          allergies,
          medicalHistory,
          currentMedications,
          patientName: form.patientName,
        },
      });
      if (error) throw error;
      setAiReview(data.review);
    } catch (err) {
      console.error("AI review error:", err);
      toast.error("Erro ao revisar prescrição com IA");
      setAiReview("Erro ao processar a revisão. Tente novamente.");
    } finally {
      setAiReviewLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.patientName.trim() || !form.medications.trim()) {
      toast.error("Preencha paciente e medicamentos"); return;
    }
    const result = await insert({
      patient_name: form.patientName,
      date: format(new Date(), "yyyy-MM-dd"),
      medications: form.medications,
    });
    if (result) {
      clearDraft();
      setPreviewId(String(result.id));
      toast.success("Receituário salvo");
    }
  };

  const previewPrescription = previewId ? prescriptions.find((p) => String(p.id) === previewId) : null;

  const printReceipt = () => {
    setShowReceipt(true);
    setTimeout(() => {
      window.print();
      setShowReceipt(false);
    }, 300);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Receituário</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid gap-2">
                <Label>Paciente *</Label>
                <Input value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} placeholder="Nome do paciente" />
              </div>

              {/* Medication catalog */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <Label>Prescrição *</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={isPediatric ? "default" : "outline"}
                      size="sm"
                      className="gap-1 text-xs"
                      onClick={() => setIsPediatric(!isPediatric)}
                    >
                      👶 {isPediatric ? "Pediátrico" : "Adulto"}
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1.5">
                          <Pill className="h-3.5 w-3.5" />Adicionar Medicamento
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 max-h-[420px] overflow-y-auto p-2" align="end">
                        {Object.entries(activeCatalog).map(([category, meds]) => (
                          <Collapsible key={category}>
                            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted/50">
                              {category}
                              <ChevronDown className="h-4 w-4" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pl-2">
                              {meds.map((med) => (
                                <button
                                  key={med.name}
                                  onClick={() => addMedication(med)}
                                  className="w-full text-left rounded-md px-3 py-2 text-sm hover:bg-primary/10 transition-colors"
                                >
                                  <span className="font-medium">{med.name}</span>
                                  <span className="block text-xs text-muted-foreground mt-0.5">{med.posology}</span>
                                </button>
                              ))}
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <Textarea
                  value={form.medications}
                  onChange={(e) => setForm({ ...form, medications: e.target.value })}
                  placeholder={"1) Amoxicilina 500mg\n   Tomar 1 comprimido de 8 em 8 horas por 7 dias"}
                  rows={10}
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button onClick={handleAiReview} variant="outline" disabled={!form.medications.trim() || aiReviewLoading} className="gap-1.5">
                  {aiReviewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Revisar com IA
                </Button>
                <Button onClick={handleSave} className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />Gerar Receituário
                </Button>
                {form.medications.trim() && (
                  <Button variant="outline" onClick={() => setForm({ ...form, medications: "" })}>
                    Limpar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Receipt area */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Receipt className="h-4 w-4" />Recibo
              </h3>
              <div className="grid gap-2">
                <Label>Valor (R$)</Label>
                <Input value={receiptAmount} onChange={(e) => setReceiptAmount(e.target.value)} placeholder="150,00" />
              </div>
              <div className="grid gap-2">
                <Label>Descrição do serviço</Label>
                <Input value={receiptDescription} onChange={(e) => setReceiptDescription(e.target.value)} placeholder="Consulta odontológica" />
              </div>
              <Button variant="outline" onClick={printReceipt} disabled={!receiptAmount || !form.patientName}>
                <Printer className="h-4 w-4 mr-2" />Imprimir Recibo
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Receituários anteriores</h3>
              {prescriptions.filter(p => !p.deleted_at).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum receituário emitido.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {[...prescriptions].filter(p => !p.deleted_at).reverse().map((p) => (
                    <div key={String(p.id)} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => setPreviewId(String(p.id))}>
                      <div>
                        <p className="text-sm font-medium">{String(p.patient_name)}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(String(p.date)), "dd/MM/yyyy")}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEditPrescription(p); }}>
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={async (e) => {
                          e.stopPropagation();
                          await updatePrescription(String(p.id), { deleted_at: new Date().toISOString() } as any);
                          if (previewId === String(p.id)) setPreviewId(null);
                          toast.success("Receituário movido para a lixeira");
                        }}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="flex justify-end gap-2 mb-2 no-print">
            <Button variant="outline" size="sm" disabled={!previewPrescription} onClick={() => {
              if (!previewPrescription) return;
              const matchedP = patients.find(p => String(p.name).toLowerCase() === String(previewPrescription.patient_name).toLowerCase());
              const phone = matchedP ? String(matchedP.phone || "").replace(/\D/g, "") : "";
              if (!phone) { toast.error("Telefone do paciente não encontrado"); return; }
              const text = `Olá ${String(previewPrescription.patient_name)}!\n\nSegue sua receita:\n\n${String(previewPrescription.medications)}\n\n${String(settings.professional_name || "")}\n${String(settings.registration_number || "")}`;
              window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(text)}`, "_blank");
            }}>
              <MessageCircle className="h-4 w-4 mr-2 text-green-600" />WhatsApp
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()} disabled={!previewPrescription}>
              <Printer className="h-4 w-4 mr-2" />Imprimir
            </Button>
          </div>

          {/* Prescription print area */}
          {!showReceipt && (
            <div className="print-area">
              <div className="bg-card border border-border rounded-xl shadow-sm" style={{ padding: "2.5rem 3rem", minHeight: "700px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div className="text-center pb-5 mb-6" style={{ borderBottom: "2px solid hsl(var(--primary) / 0.25)" }}>
                    <h2 className="text-xl font-bold text-primary">{String(settings.professional_name || "Dr(a). Nome")}</h2>
                    <p className="text-sm text-muted-foreground">{String(settings.specialty || "Especialidade")} — {String(settings.registration_number || "Registro Profissional")}</p>
                    {settings.clinic_name && <p className="text-sm font-medium mt-1">{String(settings.clinic_name)}</p>}
                  </div>
                  {previewPrescription ? (
                    <div className="space-y-6">
                      <div className="flex justify-between text-sm">
                        <span><strong>Paciente:</strong> {String(previewPrescription.patient_name)}</span>
                        <span><strong>Data:</strong> {format(new Date(String(previewPrescription.date)), "dd/MM/yyyy")}</span>
                      </div>
                      <div className="pt-4" style={{ borderTop: "1px solid hsl(var(--border))" }}>
                        <h3 className="font-semibold mb-4 text-center text-lg tracking-wide">RECEITUÁRIO</h3>
                        <div className="whitespace-pre-wrap text-sm leading-7" style={{ paddingLeft: "1rem", paddingRight: "1rem" }}>
                          {String(previewPrescription.medications)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-20">Selecione ou crie um receituário.</p>
                  )}
                </div>
                <div className="text-center space-y-1 mt-12" style={{ borderTop: "2px solid hsl(var(--primary) / 0.25)", paddingTop: "1.5rem" }}>
                  <div className="w-48 mx-auto mb-2 mt-8" style={{ borderTop: "1px solid hsl(var(--foreground))" }} />
                  <p className="text-sm font-semibold">{String(settings.professional_name || "Assinatura")}</p>
                  <p className="text-xs text-muted-foreground">{String(settings.registration_number || "Registro Profissional")}</p>
                  <p className="text-xs text-muted-foreground mt-3">{String(settings.address || "Endereço")} {settings.phone ? `• ${settings.phone}` : ""}</p>
                </div>
              </div>
            </div>
          )}

          {/* Receipt print area */}
          {showReceipt && (
            <div className="print-area">
              <div className="bg-card border border-border rounded-xl shadow-sm" style={{ padding: "2.5rem 3rem", minHeight: "500px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div className="text-center pb-5 mb-6" style={{ borderBottom: "2px solid hsl(var(--primary) / 0.25)" }}>
                    <h2 className="text-xl font-bold text-primary">{String(settings.professional_name || "Dr(a). Nome")}</h2>
                    <p className="text-sm text-muted-foreground">{String(settings.specialty || "Especialidade")} — {String(settings.registration_number || "Registro Profissional")}</p>
                    {settings.clinic_name && <p className="text-sm font-medium mt-1">{String(settings.clinic_name)}</p>}
                  </div>
                  <h3 className="font-semibold mb-6 text-center text-lg tracking-wide">RECIBO</h3>
                  <div className="space-y-4 text-sm" style={{ paddingLeft: "1rem", paddingRight: "1rem" }}>
                    <p>Recebi de <strong>{form.patientName || "_______________"}</strong> a quantia de <strong>R$ {receiptAmount || "___"}</strong> referente a:</p>
                    <p className="leading-7">{receiptDescription || "Serviços prestados."}</p>
                    <p className="mt-8">Para clareza e validade, firmo o presente recibo.</p>
                    <p className="mt-4">Data: {format(new Date(), "dd/MM/yyyy")}</p>
                  </div>
                </div>
                <div className="text-center space-y-1 mt-12" style={{ borderTop: "2px solid hsl(var(--primary) / 0.25)", paddingTop: "1.5rem" }}>
                  <div className="w-48 mx-auto mb-2 mt-8" style={{ borderTop: "1px solid hsl(var(--foreground))" }} />
                  <p className="text-sm font-semibold">{String(settings.professional_name || "Assinatura")}</p>
                  <p className="text-xs text-muted-foreground">{String(settings.registration_number || "Registro Profissional")}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Review Dialog */}
      <Dialog open={aiReviewOpen} onOpenChange={setAiReviewOpen}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Revisão de Prescrição por IA
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            {aiReviewLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Analisando prescrição com base científica...</p>
              </div>
            ) : aiReview ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{aiReview}</ReactMarkdown>
              </div>
            ) : null}
          </ScrollArea>
          <p className="text-xs text-muted-foreground mt-2">
            ⚠️ Esta é uma análise assistida por IA. Sempre confirme com fontes oficiais antes de prescrever.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Prescriptions;
