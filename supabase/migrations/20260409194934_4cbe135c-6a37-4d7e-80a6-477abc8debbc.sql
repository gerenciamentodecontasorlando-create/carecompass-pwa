-- Allow platform admins to update any clinic (for plan changes)
CREATE POLICY "Platform admins can update any clinic"
ON public.clinics
FOR UPDATE
TO authenticated
USING (public.is_platform_admin(auth.uid()));

-- Create temp bucket for AI image analysis
INSERT INTO storage.buckets (id, name, public)
VALUES ('temp-ai-images', 'temp-ai-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to temp-ai-images
CREATE POLICY "Authenticated users can upload temp images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'temp-ai-images');

-- Allow public read of temp images (for AI to access)
CREATE POLICY "Public can read temp images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'temp-ai-images');

-- Allow authenticated users to delete their temp images
CREATE POLICY "Authenticated users can delete temp images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'temp-ai-images');