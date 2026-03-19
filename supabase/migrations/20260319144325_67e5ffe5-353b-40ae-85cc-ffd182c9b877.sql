
-- Add plan column to clinics
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free';
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS max_patients integer NOT NULL DEFAULT 50;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS max_storage_mb integer NOT NULL DEFAULT 100;

-- Create platform_admins table (users who can see all clinics)
CREATE TABLE IF NOT EXISTS public.platform_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Platform admins can only view their own record
CREATE POLICY "Users can view own admin status" ON public.platform_admins
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Security definer function to check platform admin
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins WHERE user_id = _user_id
  )
$$;

-- Security definer function to get platform stats (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- Only platform admins can call this
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
