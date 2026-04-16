-- Fix: Platform admin update policy needs WITH CHECK
DROP POLICY IF EXISTS "Platform admins can update any clinic" ON public.clinics;
CREATE POLICY "Platform admins can update any clinic"
  ON public.clinics FOR UPDATE
  TO authenticated
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- Fix handle_new_user trigger to use 14 days instead of 15
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_clinic_id UUID;
BEGIN
  INSERT INTO public.clinics (name, trial_ends_at) 
  VALUES (COALESCE(NEW.raw_user_meta_data->>'clinic_name', 'Minha Clínica'), now() + interval '14 days')
  RETURNING id INTO new_clinic_id;
  
  INSERT INTO public.profiles (user_id, clinic_id, full_name)
  VALUES (NEW.id, new_clinic_id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'owner');
  
  INSERT INTO public.clinic_settings (clinic_id) VALUES (new_clinic_id);
  
  RETURN NEW;
END;
$function$;