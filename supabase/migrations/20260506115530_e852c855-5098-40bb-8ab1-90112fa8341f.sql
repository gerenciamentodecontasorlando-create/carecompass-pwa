
CREATE TABLE public.pediatric_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  date text NOT NULL,
  sex text NOT NULL,
  age_months numeric NOT NULL,
  weight_kg numeric,
  height_cm numeric,
  head_circumference_cm numeric,
  gestational_age_weeks numeric,
  indicators jsonb NOT NULL DEFAULT '{}'::jsonb,
  classification text DEFAULT '',
  notes text DEFAULT '',
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pediatric_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic members view pediatric_assessments" ON public.pediatric_assessments
  FOR SELECT TO authenticated USING (clinic_id = get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members insert pediatric_assessments" ON public.pediatric_assessments
  FOR INSERT TO authenticated WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members update pediatric_assessments" ON public.pediatric_assessments
  FOR UPDATE TO authenticated USING (clinic_id = get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members delete pediatric_assessments" ON public.pediatric_assessments
  FOR DELETE TO authenticated USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE INDEX idx_pediatric_assessments_patient ON public.pediatric_assessments(clinic_id, patient_id, date);

CREATE TRIGGER update_pediatric_assessments_updated_at
  BEFORE UPDATE ON public.pediatric_assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.pediatric_anamnesis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  age_group text NOT NULL,
  form_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pediatric_anamnesis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic members view pediatric_anamnesis" ON public.pediatric_anamnesis
  FOR SELECT TO authenticated USING (clinic_id = get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members insert pediatric_anamnesis" ON public.pediatric_anamnesis
  FOR INSERT TO authenticated WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members update pediatric_anamnesis" ON public.pediatric_anamnesis
  FOR UPDATE TO authenticated USING (clinic_id = get_user_clinic_id(auth.uid()));
CREATE POLICY "Clinic members delete pediatric_anamnesis" ON public.pediatric_anamnesis
  FOR DELETE TO authenticated USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE INDEX idx_pediatric_anamnesis_patient ON public.pediatric_anamnesis(clinic_id, patient_id);

CREATE TRIGGER update_pediatric_anamnesis_updated_at
  BEFORE UPDATE ON public.pediatric_anamnesis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
