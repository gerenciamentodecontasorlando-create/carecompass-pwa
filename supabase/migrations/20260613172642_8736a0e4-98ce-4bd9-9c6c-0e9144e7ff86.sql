
-- 1) Restrict clinics UPDATE to owners only
DROP POLICY IF EXISTS "Owners can update own clinic" ON public.clinics;
CREATE POLICY "Owners can update own clinic" ON public.clinics
  FOR UPDATE TO authenticated
  USING (id = public.get_user_clinic_id(auth.uid()) AND public.has_role(auth.uid(), 'owner'))
  WITH CHECK (id = public.get_user_clinic_id(auth.uid()) AND public.has_role(auth.uid(), 'owner'));

-- 2) Remove self-insert on user_roles
DROP POLICY IF EXISTS "Users can insert own roles" ON public.user_roles;

-- 3) Remove self-insert on profiles (trigger handles it via service_role)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- 4) Storage: patient-files scoped to user's clinic
DROP POLICY IF EXISTS "Clinic members can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Clinic members can view files" ON storage.objects;
DROP POLICY IF EXISTS "Clinic members can delete files" ON storage.objects;

CREATE POLICY "Clinic members can upload own clinic files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'patient-files'
    AND (storage.foldername(name))[1] = public.get_user_clinic_id(auth.uid())::text
  );

CREATE POLICY "Clinic members can view own clinic files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'patient-files'
    AND (storage.foldername(name))[1] = public.get_user_clinic_id(auth.uid())::text
  );

CREATE POLICY "Clinic members can delete own clinic files" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'patient-files'
    AND (storage.foldername(name))[1] = public.get_user_clinic_id(auth.uid())::text
  );

-- 5) temp-ai-images: restrict to uploader
DROP POLICY IF EXISTS "Public can read temp images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete temp images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload temp images" ON storage.objects;

CREATE POLICY "Auth users can upload temp images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'temp-ai-images' AND owner = auth.uid());

CREATE POLICY "Auth users can read own temp images" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'temp-ai-images' AND owner = auth.uid());

CREATE POLICY "Auth users can delete own temp images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'temp-ai-images' AND owner = auth.uid());

-- 6) Lock down SECURITY DEFINER admin/utility functions
REVOKE EXECUTE ON FUNCTION public.admin_update_clinic_plan(uuid, text, integer, integer, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_update_clinic_ai_limit(uuid, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_platform_stats() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_ai_usage(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_ai_usage(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_documents() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_clinic_id(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_platform_admin(uuid) FROM anon;
