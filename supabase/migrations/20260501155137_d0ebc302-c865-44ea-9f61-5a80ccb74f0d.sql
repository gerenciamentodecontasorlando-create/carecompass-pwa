DROP POLICY IF EXISTS "Platform admins can update any clinic" ON public.clinics;

CREATE POLICY "Platform admins can update any clinic"
ON public.clinics
FOR UPDATE
TO authenticated
USING (public.is_platform_admin(auth.uid()))
WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.admin_update_clinic_plan(
  _clinic_id uuid,
  _plan text,
  _max_patients integer,
  _max_storage_mb integer,
  _ai_monthly_limit integer
)
RETURNS public.clinics
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  updated_clinic public.clinics;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: somente administradores da plataforma podem alterar planos.';
  END IF;

  UPDATE public.clinics
  SET
    plan = _plan,
    max_patients = GREATEST(_max_patients, 0),
    max_storage_mb = GREATEST(_max_storage_mb, 0),
    ai_monthly_limit = GREATEST(_ai_monthly_limit, 0),
    updated_at = now()
  WHERE id = _clinic_id
  RETURNING * INTO updated_clinic;

  IF updated_clinic.id IS NULL THEN
    RAISE EXCEPTION 'Clínica não encontrada.';
  END IF;

  RETURN updated_clinic;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_clinic_ai_limit(
  _clinic_id uuid,
  _ai_monthly_limit integer
)
RETURNS public.clinics
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  updated_clinic public.clinics;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: somente administradores da plataforma podem alterar limites de IA.';
  END IF;

  UPDATE public.clinics
  SET
    ai_monthly_limit = GREATEST(_ai_monthly_limit, 0),
    updated_at = now()
  WHERE id = _clinic_id
  RETURNING * INTO updated_clinic;

  IF updated_clinic.id IS NULL THEN
    RAISE EXCEPTION 'Clínica não encontrada.';
  END IF;

  RETURN updated_clinic;
END;
$$;