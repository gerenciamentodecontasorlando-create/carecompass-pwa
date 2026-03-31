-- Indexes for high-volume queries
CREATE INDEX IF NOT EXISTS idx_patients_clinic_id ON public.patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON public.appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_date ON public.appointments(clinic_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_clinic_id ON public.transactions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_transactions_clinic_date ON public.transactions(clinic_id, date);
CREATE INDEX IF NOT EXISTS idx_evolutions_clinic_id ON public.evolutions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_evolutions_patient_id ON public.evolutions(clinic_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_records_patient ON public.clinical_records(clinic_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_files_patient ON public.patient_files(clinic_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_materials_clinic_id ON public.materials(clinic_id);
CREATE INDEX IF NOT EXISTS idx_certificates_clinic_id ON public.certificates(clinic_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_clinic_id ON public.prescriptions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_odontograms_patient ON public.odontograms(clinic_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_notes_clinic_id ON public.notes(clinic_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_clinic_id ON public.profiles(clinic_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_name_search ON public.patients(clinic_id, name);