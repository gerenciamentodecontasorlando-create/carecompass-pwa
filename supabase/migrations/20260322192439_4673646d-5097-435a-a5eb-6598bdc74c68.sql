-- Add trial_ends_at to clinics
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS trial_ends_at timestamp with time zone DEFAULT (now() + interval '15 days');

-- Update handle_new_user to set trial_ends_at on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_clinic_id UUID;
BEGIN
  INSERT INTO public.clinics (name, trial_ends_at) 
  VALUES (COALESCE(NEW.raw_user_meta_data->>'clinic_name', 'Minha Clínica'), now() + interval '15 days')
  RETURNING id INTO new_clinic_id;
  
  INSERT INTO public.profiles (user_id, clinic_id, full_name)
  VALUES (NEW.id, new_clinic_id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'owner');
  
  INSERT INTO public.clinic_settings (clinic_id) VALUES (new_clinic_id);
  
  RETURN NEW;
END;
$$;