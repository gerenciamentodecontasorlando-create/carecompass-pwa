
CREATE TABLE public.dental_procedures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  date text NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD'),
  tooth_number text,
  procedure text NOT NULL,
  notes text,
  value numeric NOT NULL DEFAULT 0,
  paid_amount numeric NOT NULL DEFAULT 0,
  payment_method text,
  professional text,
  status text NOT NULL DEFAULT 'planejado',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dental_procedures TO authenticated;
GRANT ALL ON public.dental_procedures TO service_role;

ALTER TABLE public.dental_procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clinic members can view dental procedures"
  ON public.dental_procedures FOR SELECT TO authenticated
  USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "clinic members can insert dental procedures"
  ON public.dental_procedures FOR INSERT TO authenticated
  WITH CHECK (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "clinic members can update dental procedures"
  ON public.dental_procedures FOR UPDATE TO authenticated
  USING (clinic_id = public.get_user_clinic_id(auth.uid()))
  WITH CHECK (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "clinic members can delete dental procedures"
  ON public.dental_procedures FOR DELETE TO authenticated
  USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE TRIGGER update_dental_procedures_updated_at
  BEFORE UPDATE ON public.dental_procedures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_dental_procedures_patient ON public.dental_procedures(patient_id);
CREATE INDEX idx_dental_procedures_clinic ON public.dental_procedures(clinic_id);
