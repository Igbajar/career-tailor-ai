CREATE POLICY "Admins can view all applications"
ON public.job_applications FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));