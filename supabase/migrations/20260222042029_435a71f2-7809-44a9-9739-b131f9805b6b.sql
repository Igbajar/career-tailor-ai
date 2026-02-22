
-- Add generated_data column to store full AI output for re-download
ALTER TABLE public.job_applications ADD COLUMN generated_data jsonb;
