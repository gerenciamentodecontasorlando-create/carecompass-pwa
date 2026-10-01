ALTER TABLE public.clinics
  ADD COLUMN IF NOT EXISTS plan_display_name text,
  ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS custom_ai_enabled boolean NOT NULL DEFAULT false;

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
SECURITY DEFINER
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
GRANT EXECUTE ON FUNCTION public.admin_update_clinic_plan(uuid,text,integer,integer,integer,text,timestamptz,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_clinic_plan(uuid,text,integer,integer,integer,text,timestamptz,boolean) TO service_role;

CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  ym text := to_char(now(), 'YYYY-MM');
BEGIN
  IF NOT is_platform_admin(auth.uid()) THEN
    RETURN '{}'::json;
  END IF;

  SELECT json_build_object(
    'total_clinics', (SELECT count(*) FROM clinics),
    'total_patients', (SELECT count(*) FROM patients),
    'total_appointments', (SELECT count(*) FROM appointments),
    'total_evolutions', (SELECT count(*) FROM evolutions),
    'total_prescriptions', (SELECT count(*) FROM prescriptions),
    'total_transactions', (SELECT count(*) FROM transactions),
    'total_ai_usage_month', (SELECT COALESCE(sum(count),0) FROM ai_usage WHERE year_month = ym),
    'plan_distribution', (
      SELECT json_agg(json_build_object('plan', plan, 'count', cnt))
      FROM (SELECT plan, count(*) as cnt FROM clinics GROUP BY plan) sub
    ),
    'clinics', (
      SELECT json_agg(json_build_object(
        'id', c.id,
        'name', c.name,
        'plan', c.plan,
        'plan_display_name', c.plan_display_name,
        'plan_expires_at', c.plan_expires_at,
        'custom_ai_enabled', c.custom_ai_enabled,
        'max_patients', c.max_patients,
        'max_storage_mb', c.max_storage_mb,
        'created_at', c.created_at,
        'ai_monthly_limit', c.ai_monthly_limit,
        'ai_used_month', COALESCE((SELECT count FROM ai_usage WHERE clinic_id = c.id AND year_month = ym), 0),
        'patient_count', (SELECT count(*) FROM patients p WHERE p.clinic_id = c.id),
        'appointment_count', (SELECT count(*) FROM appointments a WHERE a.clinic_id = c.id),
        'is_platform_admin_clinic', EXISTS (
          SELECT 1 FROM profiles p
          JOIN platform_admins pa ON pa.user_id = p.user_id
          WHERE p.clinic_id = c.id
        )
      ) ORDER BY c.created_at DESC)
      FROM clinics c
    ),
    'monthly_signups', (
      SELECT json_agg(json_build_object('month', m, 'count', cnt))
      FROM (
        SELECT to_char(created_at, 'YYYY-MM') as m, count(*) as cnt
        FROM clinics
        GROUP BY to_char(created_at, 'YYYY-MM')
        ORDER BY m DESC
        LIMIT 12
      ) sub
    )
  ) INTO result;

  RETURN result;
END;
$$;