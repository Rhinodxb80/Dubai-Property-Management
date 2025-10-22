-- Create applicants table
CREATE TABLE public.applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  job TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public inserts (for the form)
CREATE POLICY "Anyone can submit applications"
ON public.applicants
FOR INSERT
TO public
WITH CHECK (true);

-- Create policy to allow public reads (for admin view)
CREATE POLICY "Anyone can view applications"
ON public.applicants
FOR SELECT
TO public
USING (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_applicants_updated_at
BEFORE UPDATE ON public.applicants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();