-- Create course-certificate junction table for explicit relationships
CREATE TABLE public.course_certificates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    license_id UUID NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
    grants_level INTEGER DEFAULT 1,
    is_required BOOLEAN DEFAULT false,
    renewal_eligible BOOLEAN DEFAULT true,
    min_score_required INTEGER DEFAULT NULL,
    credits_awarded INTEGER DEFAULT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Ensure unique course-license combinations
    UNIQUE(course_id, license_id)
);

-- Add renewal notice period to licenses table  
ALTER TABLE public.licenses 
ADD COLUMN renewal_notice_months INTEGER DEFAULT 6,
ADD COLUMN renewal_grace_period_months INTEGER DEFAULT 3;

-- Create document storage table for certificate documents
CREATE TABLE public.certificate_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_license_id UUID REFERENCES public.employee_licenses(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    license_id UUID REFERENCES public.licenses(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- AI processing results
    ai_extracted_data JSONB,
    ai_confidence_score DECIMAL(3,2),
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    
    -- Extracted certificate information
    extracted_certificate_number TEXT,
    extracted_issue_date DATE,
    extracted_expiry_date DATE,
    extracted_issuer TEXT,
    extracted_employee_name TEXT,
    
    -- Verification status
    verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified', 'rejected')),
    verified_by UUID REFERENCES public.employees(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_notes TEXT,
    
    uploaded_by UUID REFERENCES public.employees(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_course_certificates_course_id ON public.course_certificates(course_id);
CREATE INDEX idx_course_certificates_license_id ON public.course_certificates(license_id);
CREATE INDEX idx_certificate_documents_employee_id ON public.certificate_documents(employee_id);
CREATE INDEX idx_certificate_documents_license_id ON public.certificate_documents(license_id);
CREATE INDEX idx_certificate_documents_processing_status ON public.certificate_documents(processing_status);
CREATE INDEX idx_certificate_documents_upload_date ON public.certificate_documents(upload_date);

-- Create updated_at trigger for course_certificates
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_course_certificates_updated_at
    BEFORE UPDATE ON public.course_certificates
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER set_certificate_documents_updated_at
    BEFORE UPDATE ON public.certificate_documents
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

-- Row Level Security (RLS) policies
ALTER TABLE public.course_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_documents ENABLE ROW LEVEL SECURITY;

-- Allow read access to course_certificates for authenticated users
CREATE POLICY "course_certificates_read_policy" ON public.course_certificates
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow full access to course_certificates for admin roles
CREATE POLICY "course_certificates_admin_policy" ON public.course_certificates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.user_profiles up ON ur.user_id = up.id
            WHERE up.id = auth.uid()
            AND ur.role_name IN ('admin', 'hr_manager', 'supervisor')
        )
    );

-- Allow read access to certificate_documents for related employees and admins
CREATE POLICY "certificate_documents_read_policy" ON public.certificate_documents
    FOR SELECT USING (
        -- Employee can see their own documents
        employee_id = (
            SELECT employee_id FROM public.user_profiles 
            WHERE id = auth.uid()
        )
        OR
        -- Admins can see all documents
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.user_profiles up ON ur.user_id = up.id
            WHERE up.id = auth.uid()
            AND ur.role_name IN ('admin', 'hr_manager', 'supervisor')
        )
    );

-- Allow insert/update for certificate_documents by admins and document owners
CREATE POLICY "certificate_documents_modify_policy" ON public.certificate_documents
    FOR ALL USING (
        -- Admins can modify all documents
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.user_profiles up ON ur.user_id = up.id
            WHERE up.id = auth.uid()
            AND ur.role_name IN ('admin', 'hr_manager', 'supervisor')
        )
        OR
        -- Users can modify their own documents (if not verified)
        (employee_id = (
            SELECT employee_id FROM public.user_profiles 
            WHERE id = auth.uid()
        ) AND verification_status = 'unverified')
    );

-- Create helper functions for course-certificate relationships

-- Function to get courses that grant a specific certificate
CREATE OR REPLACE FUNCTION public.get_courses_for_certificate(cert_license_id UUID)
RETURNS TABLE (
    course_id UUID,
    course_title TEXT,
    course_category TEXT,
    course_level INTEGER,
    grants_level INTEGER,
    is_required BOOLEAN,
    renewal_eligible BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.title,
        c.category,
        c.level,
        cc.grants_level,
        cc.is_required,
        cc.renewal_eligible
    FROM public.courses c
    JOIN public.course_certificates cc ON c.id = cc.course_id
    WHERE cc.license_id = cert_license_id
    ORDER BY cc.grants_level, c.title;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get certificates granted by a specific course
CREATE OR REPLACE FUNCTION public.get_certificates_for_course(course_id_param UUID)
RETURNS TABLE (
    license_id UUID,
    license_name TEXT,
    license_category TEXT,
    grants_level INTEGER,
    is_required BOOLEAN,
    renewal_eligible BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.name,
        l.category,
        cc.grants_level,
        cc.is_required,
        cc.renewal_eligible
    FROM public.licenses l
    JOIN public.course_certificates cc ON l.id = cc.license_id
    WHERE cc.course_id = course_id_param
    ORDER BY cc.grants_level, l.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a course can grant a specific certificate level
CREATE OR REPLACE FUNCTION public.can_course_grant_certificate(
    course_id_param UUID,
    license_id_param UUID,
    desired_level INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.course_certificates
        WHERE course_id = course_id_param
        AND license_id = license_id_param
        AND grants_level >= desired_level
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get renewal-eligible courses for an employee's certificates
CREATE OR REPLACE FUNCTION public.get_renewal_courses_for_employee(employee_id_param UUID)
RETURNS TABLE (
    employee_license_id UUID,
    license_name TEXT,
    expiry_date DATE,
    days_until_expiry INTEGER,
    course_id UUID,
    course_title TEXT,
    can_renew_with_course BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        el.id,
        l.name,
        el.expiry_date,
        (el.expiry_date - CURRENT_DATE)::INTEGER,
        c.id,
        c.title,
        cc.renewal_eligible
    FROM public.employee_licenses el
    JOIN public.licenses l ON el.license_id = l.id
    JOIN public.course_certificates cc ON l.id = cc.license_id
    JOIN public.courses c ON cc.course_id = c.id
    WHERE el.employee_id = employee_id_param
    AND el.status = 'valid'
    AND el.expiry_date IS NOT NULL
    AND cc.renewal_eligible = true
    AND (el.expiry_date - CURRENT_DATE) <= (l.renewal_notice_months * 30)
    ORDER BY el.expiry_date, l.name, c.title;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add some initial data to link existing courses to certificates based on category matching
-- This migration script will attempt to create logical relationships based on existing data

INSERT INTO public.course_certificates (course_id, license_id, grants_level, is_required, renewal_eligible)
SELECT DISTINCT 
    c.id as course_id,
    l.id as license_id,
    COALESCE(c.level, 1) as grants_level,
    true as is_required,
    true as renewal_eligible
FROM public.courses c
JOIN public.licenses l ON (
    -- Match by exact category
    LOWER(c.category) = LOWER(l.category)
    OR
    -- Match by similar names (basic pattern matching)
    (LOWER(c.title) LIKE '%' || LOWER(SPLIT_PART(l.name, ' ', 1)) || '%' 
     AND LENGTH(SPLIT_PART(l.name, ' ', 1)) > 3)
    OR
    -- Match specific known patterns
    (LOWER(c.title) LIKE '%vca%' AND LOWER(l.name) LIKE '%vca%')
    OR
    (LOWER(c.title) LIKE '%forklift%' AND LOWER(l.name) LIKE '%forklift%')
    OR
    (LOWER(c.title) LIKE '%safety%' AND LOWER(l.name) LIKE '%safety%')
    OR
    (LOWER(c.title) LIKE '%code%95%' AND LOWER(l.name) LIKE '%code%95%')
)
WHERE c.id IS NOT NULL AND l.id IS NOT NULL
ON CONFLICT (course_id, license_id) DO NOTHING;

-- Update renewal notice periods for specific certificate types
UPDATE public.licenses 
SET renewal_notice_months = 6, renewal_grace_period_months = 3 
WHERE category IN ('Safety', 'Driver License', 'Professional Certification');

UPDATE public.licenses 
SET renewal_notice_months = 12, renewal_grace_period_months = 6 
WHERE category IN ('Medical', 'Aviation', 'Maritime');

UPDATE public.licenses 
SET renewal_notice_months = 3, renewal_grace_period_months = 1 
WHERE category IN ('Basic Training', 'Orientation');

COMMENT ON TABLE public.course_certificates IS 'Junction table linking courses to the certificates they can grant or help renew';
COMMENT ON TABLE public.certificate_documents IS 'Storage and AI processing metadata for uploaded certificate documents';
COMMENT ON COLUMN public.licenses.renewal_notice_months IS 'How many months before expiry to send renewal notifications';
COMMENT ON COLUMN public.licenses.renewal_grace_period_months IS 'How many months after expiry the certificate remains valid for renewal';