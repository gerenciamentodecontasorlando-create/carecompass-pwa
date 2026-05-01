REVOKE ALL ON FUNCTION public.admin_update_clinic_plan(uuid, text, integer, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_update_clinic_ai_limit(uuid, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_update_clinic_plan(uuid, text, integer, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_clinic_ai_limit(uuid, integer) TO authenticated;