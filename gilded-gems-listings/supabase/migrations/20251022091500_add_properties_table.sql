-- Create table to persist custom property data (full JSON payload) in Supabase.
CREATE TABLE IF NOT EXISTS public.properties (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Allow unauthenticated reads so the public site can display listings.
CREATE POLICY "Properties are readable by anyone"
ON public.properties
FOR SELECT
TO public
USING (true);

-- Allow unauthenticated upserts/deletes for now so the admin UI works without auth.
-- Replace with authenticated policies when hooking up Supabase Auth.
CREATE POLICY "Properties can be inserted by anyone"
ON public.properties
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Properties can be updated by anyone"
ON public.properties
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Properties can be deleted by anyone"
ON public.properties
FOR DELETE
TO public
USING (true);

CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
