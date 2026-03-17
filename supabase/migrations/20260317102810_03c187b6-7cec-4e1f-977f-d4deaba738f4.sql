
-- Add soft-delete column to evolutions table
ALTER TABLE public.evolutions ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;

-- Add soft-delete column to clinical_records table  
ALTER TABLE public.clinical_records ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;

-- Add soft-delete column to prescriptions table
ALTER TABLE public.prescriptions ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;

-- Add soft-delete column to certificates table
ALTER TABLE public.certificates ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;
