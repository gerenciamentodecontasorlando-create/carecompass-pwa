// Demo mode: ensures a demo clinic exists with sample data and returns credentials
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEMO_EMAIL = "demo@btxclinicos.com.br";
const DEMO_PASSWORD = "DemoBtx2026!";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // 1. Ensure user exists
    let userId: string | null = null;
    const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const found = existing?.users?.find((u) => u.email === DEMO_EMAIL);
    if (found) {
      userId = found.id;
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: "Dr. Demonstração", clinic_name: "Clínica Demo Btx" },
      });
      if (createErr) throw createErr;
      userId = created.user!.id;
      // Wait briefly for handle_new_user trigger
      await new Promise((r) => setTimeout(r, 800));
    }

    // 2. Get clinic_id
    const { data: profile } = await admin.from("profiles").select("clinic_id").eq("user_id", userId!).maybeSingle();
    const clinicId = profile?.clinic_id;
    if (!clinicId) throw new Error("Clinic not found for demo user");

    // 3. Set plan = professional + extend trial so it never expires
    await admin.from("clinics").update({
      plan: "professional",
      max_patients: 5000,
      max_storage_mb: 2000,
      ai_monthly_limit: 0,
      trial_ends_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      name: "Clínica Demo Btx",
    }).eq("id", clinicId);

    // 4. Populate sample data (only if no patients yet)
    const { count } = await admin.from("patients").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId);
    if ((count ?? 0) === 0) {
      const today = new Date();
      const dStr = (offset = 0) => {
        const d = new Date(today);
        d.setDate(d.getDate() + offset);
        return d.toISOString().split("T")[0];
      };

      const patients = [
        { name: "Maria Silva Santos", phone: "(91) 98765-4321", email: "maria.silva@email.com", cpf: "123.456.789-00", birth_date: "1985-03-15", address: "Rua das Flores, 123", notes: "Paciente desde 2020" },
        { name: "João Pedro Almeida", phone: "(91) 99876-5432", email: "joao.almeida@email.com", cpf: "234.567.890-11", birth_date: "1990-07-22", address: "Av. Brasil, 456", notes: "Alergia a penicilina" },
        { name: "Ana Carolina Ferreira", phone: "(91) 98123-4567", email: "ana.ferreira@email.com", cpf: "345.678.901-22", birth_date: "1978-11-08", address: "Rua Verde, 789", notes: "" },
        { name: "Carlos Eduardo Lima", phone: "(91) 97654-3210", email: "carlos.lima@email.com", cpf: "456.789.012-33", birth_date: "1995-01-30", address: "Trav. Central, 12", notes: "Hipertenso" },
        { name: "Beatriz Costa Souza", phone: "(91) 96543-2109", email: "beatriz.souza@email.com", cpf: "567.890.123-44", birth_date: "2001-05-18", address: "Rua Nova, 345", notes: "" },
        { name: "Rafael Mendes Oliveira", phone: "(91) 95432-1098", email: "rafael.mendes@email.com", cpf: "678.901.234-55", birth_date: "1988-09-25", address: "Av. Principal, 678", notes: "" },
      ].map((p) => ({ ...p, clinic_id: clinicId }));
      const { data: insertedPatients } = await admin.from("patients").insert(patients).select("id, name");

      if (insertedPatients) {
        const appts = [
          { patient_name: insertedPatients[0].name, date: dStr(0), time: "09:00", type: "Consulta", status: "agendado", procedure: "Avaliação inicial", dentist: "Dr. Demonstração" },
          { patient_name: insertedPatients[1].name, date: dStr(0), time: "10:30", type: "Retorno", status: "confirmado", procedure: "Limpeza", dentist: "Dr. Demonstração" },
          { patient_name: insertedPatients[2].name, date: dStr(0), time: "14:00", type: "Procedimento", status: "agendado", procedure: "Restauração", dentist: "Dr. Demonstração" },
          { patient_name: insertedPatients[3].name, date: dStr(1), time: "08:30", type: "Consulta", status: "agendado", procedure: "Check-up", dentist: "Dr. Demonstração" },
          { patient_name: insertedPatients[4].name, date: dStr(1), time: "11:00", type: "Cirurgia", status: "agendado", procedure: "Extração", dentist: "Dr. Demonstração" },
          { patient_name: insertedPatients[5].name, date: dStr(2), time: "15:30", type: "Consulta", status: "agendado", procedure: "Avaliação ortodôntica", dentist: "Dr. Demonstração" },
          { patient_name: insertedPatients[0].name, date: dStr(-7), time: "10:00", type: "Consulta", status: "concluido", procedure: "Avaliação inicial", dentist: "Dr. Demonstração" },
          { patient_name: insertedPatients[1].name, date: dStr(-3), time: "14:30", type: "Procedimento", status: "concluido", procedure: "Restauração superior", dentist: "Dr. Demonstração" },
        ].map((a) => ({ ...a, clinic_id: clinicId }));
        await admin.from("appointments").insert(appts);

        const tx = [
          { description: "Consulta - Maria Silva", amount: 150, type: "income", category: "Consulta", date: dStr(-7) },
          { description: "Procedimento - João Pedro", amount: 380, type: "income", category: "Procedimento", date: dStr(-3) },
          { description: "Aluguel consultório", amount: 2500, type: "expense", category: "Fixa", date: dStr(-5) },
          { description: "Material odontológico", amount: 480, type: "expense", category: "Material", date: dStr(-2) },
          { description: "Consulta - Ana Carolina", amount: 200, type: "income", category: "Consulta", date: dStr(-1) },
          { description: "Consulta - Carlos Eduardo", amount: 150, type: "income", category: "Consulta", date: dStr(0) },
        ].map((t) => ({ ...t, clinic_id: clinicId }));
        await admin.from("transactions").insert(tx);

        const materials = [
          { name: "Anestésico Lidocaína", quantity: 25, min_quantity: 10, unit: "tubete", category: "Medicamento" },
          { name: "Luvas descartáveis", quantity: 8, min_quantity: 20, unit: "caixa", category: "Consumível" },
          { name: "Máscara cirúrgica", quantity: 150, min_quantity: 50, unit: "un", category: "Consumível" },
          { name: "Resina composta A2", quantity: 4, min_quantity: 5, unit: "seringa", category: "Material" },
        ].map((m) => ({ ...m, clinic_id: clinicId }));
        await admin.from("materials").insert(materials);

        const presc = [
          { patient_name: insertedPatients[0].name, date: dStr(-7), medications: "Amoxicilina 500mg - 1 cápsula de 8 em 8 horas por 7 dias\nIbuprofeno 600mg - 1 comprimido de 12 em 12 horas se dor" },
          { patient_name: insertedPatients[1].name, date: dStr(-3), medications: "Nimesulida 100mg - 1 comprimido de 12 em 12 horas por 3 dias" },
        ].map((p) => ({ ...p, clinic_id: clinicId }));
        await admin.from("prescriptions").insert(presc);
      }
    }

    return new Response(JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("demo-signin error:", err);
    return new Response(JSON.stringify({ error: err?.message ?? String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
