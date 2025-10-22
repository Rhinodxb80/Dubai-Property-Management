-- Add property_id and move_in_date to applicants table
ALTER TABLE public.applicants
ADD COLUMN property_id TEXT,
ADD COLUMN move_in_date DATE,
ADD COLUMN required_documents JSONB DEFAULT '{"passport": false, "eid": false, "visa": false, "salaryConfirmation": false, "bankStatement": false}'::jsonb;