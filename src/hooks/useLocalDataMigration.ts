import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const MIGRATION_KEY = "clinicapro-data-migrated";

export function useLocalDataMigration() {
  const { clinicId, user } = useAuth();
  const migrating = useRef(false);

  useEffect(() => {
    if (!clinicId || !user || migrating.current) return;
    if (localStorage.getItem(MIGRATION_KEY) === "true") return;
    
    const hasLocalData = ["patients", "appointments", "transactions", "materials"].some(
      (key) => {
        try {
          const item = localStorage.getItem(key);
          return item && JSON.parse(item).length > 0;
        } catch { return false; }
      }
    );
    
    if (!hasLocalData) {
      localStorage.setItem(MIGRATION_KEY, "true");
      return;
    }

    migrating.current = true;
    migrateData(clinicId).then(() => {
      localStorage.setItem(MIGRATION_KEY, "true");
      migrating.current = false;
      toast.success("Dados locais migrados para a nuvem com sucesso!");
    }).catch((err) => {
      console.error("Migration error:", err);
      migrating.current = false;
      toast.error("Erro na migração de alguns dados.");
    });
  }, [clinicId, user]);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeParseArray(key: string): any[] {
  try {
    const item = localStorage.getItem(key);
    if (!item) return [];
    const parsed = JSON.parse(item);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeParseObject(key: string): Record<string, any> {
  try {
    const item = localStorage.getItem(key);
    if (!item) return {};
    const parsed = JSON.parse(item);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? parsed : {};
  } catch { return {}; }
}

async function migrateData(clinicId: string) {
  // Migrate patients and track ID mapping
  const patients = safeParseArray("patients");
  const patientIdMap: Record<string, string> = {};
  
  for (const p of patients) {
    const { data, error } = await supabase.from("patients").insert({
      clinic_id: clinicId,
      name: String(p.name || ""),
      phone: String(p.phone || ""),
      email: String(p.email || ""),
      birth_date: String(p.birthDate || ""),
      cpf: String(p.cpf || ""),
      address: String(p.address || ""),
      notes: String(p.notes || ""),
    }).select("id").single();
    if (!error && data) patientIdMap[p.id] = data.id;
  }

  // Appointments
  const appointments = safeParseArray("appointments");
  if (appointments.length > 0) {
    await supabase.from("appointments").insert(
      appointments.map((a) => ({
        clinic_id: clinicId,
        patient_name: String(a.patientName || ""),
        date: String(a.date || ""),
        time: String(a.time || ""),
        type: String(a.type || "Consulta"),
        status: String(a.status || "agendado"),
        notes: String(a.notes || ""),
        procedure: String(a.procedure || ""),
        dentist: String(a.dentist || ""),
      }))
    );
  }

  // Transactions
  const transactions = safeParseArray("transactions");
  if (transactions.length > 0) {
    await supabase.from("transactions").insert(
      transactions.map((t) => ({
        clinic_id: clinicId,
        date: String(t.date || ""),
        description: String(t.description || ""),
        type: String(t.type || "income"),
        amount: Number(t.amount) || 0,
        category: String(t.category || ""),
      }))
    );
  }

  // Materials
  const materials = safeParseArray("materials");
  if (materials.length > 0) {
    await supabase.from("materials").insert(
      materials.map((m) => ({
        clinic_id: clinicId,
        name: String(m.name || ""),
        quantity: Number(m.quantity) || 0,
        min_quantity: Number(m.minQuantity) || 5,
        unit: String(m.unit || "un"),
        category: String(m.category || "Consumível"),
      }))
    );
  }

  // Prescriptions
  const prescriptions = safeParseArray("prescriptions");
  if (prescriptions.length > 0) {
    await supabase.from("prescriptions").insert(
      prescriptions.map((p) => ({
        clinic_id: clinicId,
        patient_name: String(p.patientName || ""),
        date: String(p.date || ""),
        medications: String(p.medications || ""),
      }))
    );
  }

  // Certificates
  const certificates = safeParseArray("certificates");
  if (certificates.length > 0) {
    await supabase.from("certificates").insert(
      certificates.map((c) => ({
        clinic_id: clinicId,
        patient_name: String(c.patientName || ""),
        date: String(c.date || ""),
        content: String(c.content || ""),
        days: String(c.days || "1"),
      }))
    );
  }

  // Notes
  const notes = safeParseArray("clinic-notes");
  if (notes.length > 0) {
    await supabase.from("notes").insert(
      notes.map((n) => ({
        clinic_id: clinicId,
        title: String(n.title || ""),
        content: String(n.content || ""),
      }))
    );
  }

  // Clinical records
  const clinicalRecords = safeParseObject("clinicalRecords");
  for (const [oldId, record] of Object.entries(clinicalRecords)) {
    const newId = patientIdMap[oldId];
    if (!newId || !record) continue;
    await supabase.from("clinical_records").insert({
      clinic_id: clinicId,
      patient_id: newId,
      chief_complaint: String(record.chiefComplaint || ""),
      medical_history: String(record.medicalHistory || ""),
      allergies: String(record.allergies || ""),
      current_medications: String(record.currentMedications || ""),
      family_history: String(record.familyHistory || ""),
      dental_history: String(record.dentalHistory || ""),
      habits: String(record.habits || ""),
      extra_oral_exam: String(record.extraOralExam || ""),
      intra_oral_exam: String(record.intraOralExam || ""),
      diagnosis: String(record.diagnosis || ""),
      treatment_plan: String(record.treatmentPlan || ""),
      prognosis: String(record.prognosis || ""),
    });
  }

  // Evolutions
  const evolutions = safeParseObject("evolutions");
  for (const [oldId, evoList] of Object.entries(evolutions)) {
    const newId = patientIdMap[oldId];
    if (!newId || !Array.isArray(evoList)) continue;
    if (evoList.length > 0) {
      await supabase.from("evolutions").insert(
        evoList.map((e) => ({
          clinic_id: clinicId,
          patient_id: newId,
          date: String(e.date || ""),
          subjective: String(e.subjective || ""),
          objective: String(e.objective || ""),
          assessment: String(e.assessment || ""),
          plan: String(e.plan || ""),
          procedure: String(e.procedure || ""),
          tooth_number: String(e.toothNumber || ""),
          professional: String(e.professional || ""),
        }))
      );
    }
  }

  // Clinic settings
  const settings = safeParseObject("clinicSettings");
  if (settings.professionalName || settings.clinicName) {
    await supabase.from("clinic_settings").update({
      professional_name: String(settings.professionalName || ""),
      specialty: String(settings.specialty || ""),
      registration_number: String(settings.registrationNumber || ""),
      clinic_name: String(settings.clinicName || ""),
      address: String(settings.address || ""),
      phone: String(settings.phone || ""),
      email: String(settings.email || ""),
    }).eq("clinic_id", clinicId);
  }
}
