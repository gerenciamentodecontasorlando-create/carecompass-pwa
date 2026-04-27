
-- 1) Tabela de contagem mensal de uso de IA
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  year_month text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, year_month)
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic members view own ai_usage"
  ON public.ai_usage FOR SELECT TO authenticated
  USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Platform admins view all ai_usage"
  ON public.ai_usage FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_ai_usage_clinic_month ON public.ai_usage (clinic_id, year_month);

-- 2) Limite mensal de IA por clínica
ALTER TABLE public.clinics
  ADD COLUMN IF NOT EXISTS ai_monthly_limit integer NOT NULL DEFAULT 0;

-- 3) RPC para incrementar uso (usada pelas edge functions com service role; também acessível por usuários da clínica)
CREATE OR REPLACE FUNCTION public.increment_ai_usage(_clinic_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ym text := to_char(now(), 'YYYY-MM');
  new_count integer;
BEGIN
  INSERT INTO public.ai_usage (clinic_id, year_month, count)
  VALUES (_clinic_id, ym, 1)
  ON CONFLICT (clinic_id, year_month)
  DO UPDATE SET count = public.ai_usage.count + 1, updated_at = now()
  RETURNING count INTO new_count;
  RETURN new_count;
END;
$$;

-- 4) RPC para checar uso atual
CREATE OR REPLACE FUNCTION public.get_ai_usage(_clinic_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(count, 0) FROM public.ai_usage
  WHERE clinic_id = _clinic_id AND year_month = to_char(now(), 'YYYY-MM')
$$;

-- 5) Atualizar handle_new_user para 15 dias trial
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_clinic_id UUID;
BEGIN
  INSERT INTO public.clinics (name, trial_ends_at, ai_monthly_limit)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'clinic_name', 'Minha Clínica'), now() + interval '15 days', 0)
  RETURNING id INTO new_clinic_id;

  INSERT INTO public.profiles (user_id, clinic_id, full_name)
  VALUES (NEW.id, new_clinic_id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'owner');

  INSERT INTO public.clinic_settings (clinic_id) VALUES (new_clinic_id);

  RETURN NEW;
END;
$$;

-- 6) Atualizar get_platform_stats para incluir uso de IA
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
        'created_at', c.created_at,
        'ai_monthly_limit', c.ai_monthly_limit,
        'ai_used_month', COALESCE((SELECT count FROM ai_usage WHERE clinic_id = c.id AND year_month = ym), 0),
        'patient_count', (SELECT count(*) FROM patients p WHERE p.clinic_id = c.id),
        'appointment_count', (SELECT count(*) FROM appointments a WHERE a.clinic_id = c.id)
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
