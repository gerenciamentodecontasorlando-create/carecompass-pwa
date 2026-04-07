
-- Enable pg_cron and pg_net extensions for scheduled cleanup
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to auto-delete prescriptions and certificates older than 7 days
CREATE OR REPLACE FUNCTION public.cleanup_old_documents()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete prescriptions older than 7 days
  DELETE FROM public.prescriptions 
  WHERE created_at < now() - interval '7 days';
  
  -- Delete certificates older than 7 days
  DELETE FROM public.certificates 
  WHERE created_at < now() - interval '7 days';
END;
$$;

-- Add external_url column to patient_files for storing links instead of uploads
ALTER TABLE public.patient_files 
ADD COLUMN IF NOT EXISTS external_url text DEFAULT '';
