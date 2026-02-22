
-- =============================================
-- CLINICAPRO MULTI-TENANT SCHEMA
-- =============================================

-- 1. Role enum
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'dentist', 'receptionist', 'assistant');

-- 2. Clinics table (tenants)
CREATE TABLE public.clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

-- 3. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  specialty TEXT DEFAULT '',
  registration_number TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'dentist',
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. Security definer functions
CREATE OR REPLACE FUNCTION public.get_user_clinic_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT clinic_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- 6. Patients table
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  birth_date TEXT DEFAULT '',
  cpf TEXT DEFAULT '',
  address TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- 7. Appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  type TEXT DEFAULT 'Consulta',
  status TEXT DEFAULT 'agendado',
  notes TEXT DEFAULT '',
  procedure TEXT DEFAULT '',
  dentist TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 8. Transactions (financial)
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  category TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 9. Materials
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER NOT NULL DEFAULT 5,
  unit TEXT DEFAULT 'un',
  category TEXT DEFAULT 'Consumível',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- 10. Clinical records
CREATE TABLE public.clinical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  chief_complaint TEXT DEFAULT '',
  medical_history TEXT DEFAULT '',
  allergies TEXT DEFAULT '',
  current_medications TEXT DEFAULT '',
  family_history TEXT DEFAULT '',
  dental_history TEXT DEFAULT '',
  habits TEXT DEFAULT '',
  extra_oral_exam TEXT DEFAULT '',
  intra_oral_exam TEXT DEFAULT '',
  diagnosis TEXT DEFAULT '',
  treatment_plan TEXT DEFAULT '',
  prognosis TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(patient_id)
);
ALTER TABLE public.clinical_records ENABLE ROW LEVEL SECURITY;

-- 11. Evolutions
CREATE TABLE public.evolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  subjective TEXT DEFAULT '',
  objective TEXT DEFAULT '',
  assessment TEXT DEFAULT '',
  plan TEXT DEFAULT '',
  procedure TEXT DEFAULT '',
  tooth_number TEXT DEFAULT '',
  professional TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.evolutions ENABLE ROW LEVEL SECURITY;

-- 12. Patient files (metadata - actual files in storage)
CREATE TABLE public.patient_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT '',
  storage_path TEXT DEFAULT '',
  date TEXT DEFAULT '',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patient_files ENABLE ROW LEVEL SECURITY;

-- 13. Prescriptions
CREATE TABLE public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  date TEXT NOT NULL,
  medications TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- 14. Certificates
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  date TEXT NOT NULL,
  content TEXT DEFAULT '',
  days TEXT DEFAULT '1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- 15. Odontograms
CREATE TABLE public.odontograms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  records JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(patient_id)
);
ALTER TABLE public.odontograms ENABLE ROW LEVEL SECURITY;

-- 16. Notes
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- 17. Clinic settings
CREATE TABLE public.clinic_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE UNIQUE,
  professional_name TEXT DEFAULT '',
  specialty TEXT DEFAULT '',
  registration_number TEXT DEFAULT '',
  clinic_name TEXT DEFAULT '',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  jarvis_enabled BOOLEAN DEFAULT true,
  jarvis_speed NUMERIC(3,1) DEFAULT 1.0,
  jarvis_pitch NUMERIC(3,1) DEFAULT 0.7,
  jarvis_volume NUMERIC(3,2) DEFAULT 1.0,
  jarvis_voice_gender TEXT DEFAULT 'male',
  jarvis_always_listening BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES (all scoped by clinic_id)
-- =============================================

-- Clinics: users can only see their own clinic
CREATE POLICY "Users can view own clinic" ON public.clinics
  FOR SELECT TO authenticated
  USING (id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Owners can update own clinic" ON public.clinics
  FOR UPDATE TO authenticated
  USING (id = public.get_user_clinic_id(auth.uid()));

-- Profiles
CREATE POLICY "Users can view clinic profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- User roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Macro for clinic-scoped tables
-- Patients
CREATE POLICY "Clinic members can view patients" ON public.patients
  FOR SELECT TO authenticated USING (clinic_id = public.get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members can insert patients" ON public.patients
  FOR INSERT TO authenticated WITH CHECK (clinic_id = public.get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members can update patients" ON public.patients
  FOR UPDATE TO authenticated USING (clinic_id = public.get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members can delete patients" ON public.patients
  FOR DELETE TO authenticated USING (clinic_id = public.get_user_clinic_id(auth.uid()));

-- Appointments
CREATE POLICY "Clinic members can view appointments" ON public.appointments
  FOR SELECT TO authenticated USING (clinic_id = public.get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members can insert appointments" ON public.appointments
  FOR INSERT TO authenticated WITH CHECK (clinic_id = public.get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members can update appointments" ON public.appointments
  FOR UPDATE TO authenticated USING (clinic_id = public.get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members can delete appointments" ON public.appointments
  FOR DELETE TO authenticated USING (clinic_id = public.get_user_clinic_id(auth.uid()));

-- Transactions
CREATE POLICY "Clinic members can view transactions" ON public.transactions
  FOR SELECT TO authenticated USING (clinic_id = public.get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members can insert transactions" ON public.transactions
  FOR INSERT TO authenticated WITH CHECK (clinic_id = public.get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members can update transactions" ON public.transactions
  FOR UPDATE TO authenticated USING (clinic_id = public.get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members can delete transactions" ON public.transactions
  FOR DELETE TO authenticated USING (clinic_id = public.get_user_clinic_id(auth.uid()));

-- Materials
CREATE POLICY "Clinic members can view materials" ON public.materials
  FOR SELECT TO authenticated USING (clinic_id = public.get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members can insert materials" ON public.materials
  FOR INSERT TO authenticated WITH CHECK (clinic_id = public.get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members can update materials" ON public.materials
  FOR UPDATE TO authenticated USING (clinic_id = public.get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members can delete materials" ON public.materials
  FOR DELETE TO authenticated USING (clinic_id = public.get_user_clinic_id(auth.uid()));

-- Clinical records
CREATE POLICY "Clinic members can view clinical_records" ON public.clinical_records
  FOR SELECT TO authenticated USING (clinic_id = public.get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members can insert clinical_records" ON public.clinical_records
  FOR INSERT TO authenticated WITH CHECK (clinic_id = public.get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members can update clinical_records" ON public.clinical_records
  FOR UPDATE TO authenticated USING (clinic_id = public.get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members can delete clinical_records" ON public.clinical_records
  FOR DELETE TO authenticated USING (clinic_id = public.get_user_clinic_id(auth.uid()));

-- Evolutions
CREATE POLICY "Clinic members can view evolutions" ON public.evolutions
  FOR SELECT TO authenticated USING (clinic_id = public.get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members can insert evolutions" ON public.evolutions
  FOR INSERT TO authenticated WITH CHECK (clinic_id = public.get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members can update evolutions" ON public.evolutions
  FOR UPDATE TO authenticated USING (clinic_id = public.get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members can delete evolutions" ON public.evolutions
  FOR DELETE TO authenticated USING (clinic_id = public.get_user_clinic_id(auth.uid()));

-- Patient files
CREATE POLICY "Clinic members can view patient_files" ON public.patient_files
  FOR SELECT TO authenticated USING (clinic_id = public.get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members can insert patient_files" ON public.patient_files
  FOR INSERT TO authenticated WITH CHECK (clinic_id = public.get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members can update patient_files" ON public.patient_files
  FOR UPDATE TO authenticated USING (clinic_id = public.get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members can delete patient_files" ON public.patient_files
  FOR DELETE TO authenticated USING (clinic_id = public.get_user_clinic_id(auth.uid()));

-- Prescriptions
CREATE POLICY "Clinic members can view prescriptions" ON public.prescriptions
  FOR SELECT TO authenticated USING (clinic_id = public.get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members can insert prescriptions" ON public.prescriptions
  FOR INSERT TO authenticated WITH CHECK (clinic_id = public.get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members can delete prescriptions" ON public.prescriptions
  FOR DELETE TO authenticated USING (clinic_id = public.get_user_clinic_id(auth.uid()));

-- Certificates
CREATE POLICY "Clinic members can view certificates" ON public.certificates
  FOR SELECT TO authenticated USING (clinic_id = public.get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members can insert certificates" ON public.certificates
  FOR INSERT TO authenticated WITH CHECK (clinic_id = public.get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members can delete certificates" ON public.certificates
  FOR DELETE TO authenticated USING (clinic_id = public.get_user_clinic_id(auth.uid()));

-- Odontograms
CREATE POLICY "Clinic members can view odontograms" ON public.odontograms
  FOR SELECT TO authenticated USING (clinic_id = public.get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members can insert odontograms" ON public.odontograms
  FOR INSERT TO authenticated WITH CHECK (clinic_id = public.get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members can update odontograms" ON public.odontograms
  FOR UPDATE TO authenticated USING (clinic_id = public.get_user_clinic_id(auth.uid()));

-- Notes
CREATE POLICY "Clinic members can view notes" ON public.notes
  FOR SELECT TO authenticated USING (clinic_id = public.get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members can insert notes" ON public.notes
  FOR INSERT TO authenticated WITH CHECK (clinic_id = public.get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members can update notes" ON public.notes
  FOR UPDATE TO authenticated USING (clinic_id = public.get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members can delete notes" ON public.notes
  FOR DELETE TO authenticated USING (clinic_id = public.get_user_clinic_id(auth.uid()));

-- Clinic settings
CREATE POLICY "Clinic members can view settings" ON public.clinic_settings
  FOR SELECT TO authenticated USING (clinic_id = public.get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members can insert settings" ON public.clinic_settings
  FOR INSERT TO authenticated WITH CHECK (clinic_id = public.get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members can update settings" ON public.clinic_settings
  FOR UPDATE TO authenticated USING (clinic_id = public.get_user_clinic_id(auth.uid()));

-- =============================================
-- TRIGGERS for updated_at
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON public.clinics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clinical_records_updated_at BEFORE UPDATE ON public.clinical_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_odontograms_updated_at BEFORE UPDATE ON public.odontograms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clinic_settings_updated_at BEFORE UPDATE ON public.clinic_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- AUTO-CREATE profile + clinic on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_clinic_id UUID;
BEGIN
  -- Create a new clinic for each new user (they become the owner)
  INSERT INTO public.clinics (name) VALUES (COALESCE(NEW.raw_user_meta_data->>'clinic_name', 'Minha Clínica'))
  RETURNING id INTO new_clinic_id;
  
  -- Create profile
  INSERT INTO public.profiles (user_id, clinic_id, full_name)
  VALUES (NEW.id, new_clinic_id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  -- Assign owner role
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'owner');
  
  -- Create default clinic settings
  INSERT INTO public.clinic_settings (clinic_id) VALUES (new_clinic_id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for patient files
INSERT INTO storage.buckets (id, name, public) VALUES ('patient-files', 'patient-files', false);

CREATE POLICY "Clinic members can upload files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'patient-files');

CREATE POLICY "Clinic members can view files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'patient-files');

CREATE POLICY "Clinic members can delete files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'patient-files');
