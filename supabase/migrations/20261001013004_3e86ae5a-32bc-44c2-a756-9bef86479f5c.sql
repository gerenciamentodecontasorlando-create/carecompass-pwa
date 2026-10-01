CREATE OR REPLACE FUNCTION public.admin_update_clinic_plan(
  _clinic_id uuid,
  _plan text,
  _max_patients integer,
  _max_storage_mb integer,
  _ai_monthly_limit integer,
  _plan_display_name text DEFAULT NULL,
  _plan_expires_at timestamptz DEFAULT NULL,
  _custom_ai_enabled boolean DEFAULT false
)
RETURNS public.clinics
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  updated_clinic public.clinics;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: somente administradores da plataforma podem alterar planos.';
  END IF;

  IF length(trim(COALESCE(_plan, ''))) = 0 OR length(_plan) > 50 THEN
    RAISE EXCEPTION 'Identificador de plano inválido.';
  END IF;

  IF _plan_display_name IS NOT NULL AND length(trim(_plan_display_name)) > 80 THEN
    RAISE EXCEPTION 'O nome do plano deve ter no máximo 80 caracteres.';
  END IF;

  UPDATE public.clinics
  SET
    plan = trim(_plan),
    plan_display_name = NULLIF(trim(COALESCE(_plan_display_name, '')), ''),
    plan_expires_at = _plan_expires_at,
    custom_ai_enabled = _custom_ai_enabled,
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

REVOKE ALL ON FUNCTION public.admin_update_clinic_plan(uuid,text,integer,integer,integer,text,timestamptz,boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_update_clinic_plan(uuid,text,integer,integer,integer,text,timestamptz,boolean) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_update_clinic_plan(uuid,text,integer,integer,integer,text,timestamptz,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_clinic_plan(uuid,text,integer,integer,integer,text,timestamptz,boolean) TO service_role;