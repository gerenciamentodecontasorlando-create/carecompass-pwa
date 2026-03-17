
-- Allow clinic members to update prescriptions (needed for soft-delete)
CREATE POLICY "Clinic members can update prescriptions"
ON public.prescriptions
FOR UPDATE
TO authenticated
USING (clinic_id = get_user_clinic_id(auth.uid()));

-- Allow clinic members to update certificates (needed for soft-delete)
CREATE POLICY "Clinic members can update certificates"
ON public.certificates
FOR UPDATE
TO authenticated
USING (clinic_id = get_user_clinic_id(auth.uid()));
