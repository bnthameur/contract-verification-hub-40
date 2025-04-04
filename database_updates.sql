
-- Updates to verification_results table for better structure

-- Add new columns for improved verification results structure
ALTER TABLE public.verification_results 
ADD COLUMN IF NOT EXISTS structured_results JSONB DEFAULT '[]'::jsonb;

-- Create a new type for error severity
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'error_severity') THEN
    CREATE TYPE error_severity AS ENUM ('low', 'medium', 'high');
  END IF;
END $$;

-- Create a dedicated table for verification issues (more detailed)
CREATE TABLE IF NOT EXISTS public.verification_issues (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  verification_id uuid REFERENCES public.verification_results(id) ON DELETE CASCADE NOT NULL,
  error_type TEXT NOT NULL,
  severity error_severity NOT NULL,
  description TEXT NOT NULL,
  line_number INTEGER,
  column_number INTEGER,
  function_name TEXT,
  contract_name TEXT,
  suggested_fix TEXT,
  code_snippet TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add RLS to new issues table
ALTER TABLE public.verification_issues ENABLE ROW LEVEL SECURITY;

-- Create policies for verification issues
CREATE POLICY "Verification issues are viewable by project owners only"
  ON public.verification_issues 
  FOR SELECT
  USING (
    auth.uid() = (
      SELECT user_id 
      FROM public.projects 
      WHERE id = (
        SELECT project_id 
        FROM public.verification_results 
        WHERE id = verification_id
      )
    )
  );

-- Function to get verification issues
CREATE OR REPLACE FUNCTION public.get_verification_issues(v_result_id uuid)
RETURNS SETOF public.verification_issues
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT * FROM public.verification_issues 
  WHERE verification_id = v_result_id 
  ORDER BY severity DESC, line_number ASC;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION public.get_verification_issues TO anon, authenticated;
