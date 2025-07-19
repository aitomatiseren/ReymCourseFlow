-- Add issuer fields to support certificate provider information
-- This enables storing the organization that issued each certificate

-- Add issuer field to employee_licenses table
ALTER TABLE public.employee_licenses 
ADD COLUMN issuer TEXT;

-- Add extracted_issuer field to certificate_documents table (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'certificate_documents' 
        AND column_name = 'extracted_issuer'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.certificate_documents 
        ADD COLUMN extracted_issuer TEXT;
    END IF;
END $$;

-- Add comments to explain the new fields
COMMENT ON COLUMN public.employee_licenses.issuer IS 'The organization or authority that issued this certificate (e.g., "Training Authority Netherlands", "VCA Institute")';
COMMENT ON COLUMN public.certificate_documents.extracted_issuer IS 'AI-extracted issuer/provider information from the uploaded certificate document';

-- Create index for performance on issuer lookups
CREATE INDEX IF NOT EXISTS idx_employee_licenses_issuer ON public.employee_licenses(issuer);
CREATE INDEX IF NOT EXISTS idx_certificate_documents_extracted_issuer ON public.certificate_documents(extracted_issuer);