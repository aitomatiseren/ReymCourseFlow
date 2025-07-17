-- Add certificate hierarchy and superseding relationship fields
-- This supports the real-world structure where certificates supersede others (VCA Vol supersedes VCA Basis)

-- Add superseding relationship fields to licenses table
ALTER TABLE public.licenses 
ADD COLUMN supersedes_license_id UUID REFERENCES public.licenses(id) ON DELETE SET NULL,
ADD COLUMN is_base_level BOOLEAN DEFAULT true,
ADD COLUMN hierarchy_order INTEGER DEFAULT 1;

-- Create index for performance on superseding relationships
CREATE INDEX idx_licenses_supersedes ON public.licenses(supersedes_license_id);
CREATE INDEX idx_licenses_hierarchy_order ON public.licenses(hierarchy_order);

-- Add comments to explain the new fields
COMMENT ON COLUMN public.licenses.supersedes_license_id IS 'Points to the license that this certificate supersedes (e.g., VCA Vol supersedes VCA Basis)';
COMMENT ON COLUMN public.licenses.is_base_level IS 'True if this is a base/entry-level certificate, false for advanced certificates';
COMMENT ON COLUMN public.licenses.hierarchy_order IS 'Order in the certification hierarchy (1=base, 2=intermediate, 3=advanced, etc.)';

-- Update course_certificates table to better handle direct certificate granting
-- Remove the confusing grants_level concept and make it certificate-specific
ALTER TABLE public.course_certificates 
ADD COLUMN directly_grants BOOLEAN DEFAULT true,
ADD COLUMN progression_course BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.course_certificates.directly_grants IS 'True if this course directly grants this certificate upon completion';
COMMENT ON COLUMN public.course_certificates.progression_course IS 'True if this course is part of a progression path to higher certificates';

-- Create function to get certificate hierarchy
CREATE OR REPLACE FUNCTION public.get_certificate_hierarchy()
RETURNS TABLE (
    certificate_id UUID,
    certificate_name TEXT,
    category TEXT,
    hierarchy_order INTEGER,
    is_base_level BOOLEAN,
    supersedes_id UUID,
    supersedes_name TEXT,
    prerequisites_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.name,
        l.category,
        l.hierarchy_order,
        l.is_base_level,
        l.supersedes_license_id,
        superseded.name as supersedes_name,
        (
            SELECT COUNT(*)::INTEGER 
            FROM public.certificate_prerequisites cp 
            WHERE cp.certificate_id = l.id
        ) as prerequisites_count
    FROM public.licenses l
    LEFT JOIN public.licenses superseded ON l.supersedes_license_id = superseded.id
    ORDER BY l.category, l.hierarchy_order, l.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if employee needs certificate (considering superseding)
CREATE OR REPLACE FUNCTION public.employee_needs_certificate(
    employee_id_param UUID,
    license_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    has_superseding BOOLEAN := false;
    has_certificate BOOLEAN := false;
BEGIN
    -- Check if employee has a certificate that supersedes this one
    SELECT EXISTS (
        SELECT 1 
        FROM public.employee_licenses el
        JOIN public.licenses l ON el.license_id = l.id
        WHERE el.employee_id = employee_id_param
        AND l.supersedes_license_id = license_id_param
        AND el.status = 'valid'
    ) INTO has_superseding;
    
    -- If employee has superseding certificate, they don't need this one
    IF has_superseding THEN
        RETURN false;
    END IF;
    
    -- Check if employee already has this certificate
    SELECT EXISTS (
        SELECT 1 
        FROM public.employee_licenses el
        WHERE el.employee_id = employee_id_param
        AND el.license_id = license_id_param
        AND el.status = 'valid'
    ) INTO has_certificate;
    
    -- Employee needs certificate if they don't have it and no superseding certificate
    RETURN NOT has_certificate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get employee's effective certificates (considering superseding)
CREATE OR REPLACE FUNCTION public.get_employee_effective_certificates(employee_id_param UUID)
RETURNS TABLE (
    license_id UUID,
    license_name TEXT,
    category TEXT,
    status TEXT,
    expiry_date DATE,
    superseded_by_id UUID,
    superseded_by_name TEXT,
    is_effective BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        el.license_id,
        l.name as license_name,
        l.category,
        el.status,
        el.expiry_date,
        superseding.id as superseded_by_id,
        superseding.name as superseded_by_name,
        -- Certificate is effective if valid and not superseded by another valid certificate
        (el.status = 'valid' AND NOT EXISTS (
            SELECT 1 
            FROM public.employee_licenses el2
            JOIN public.licenses l2 ON el2.license_id = l2.id
            WHERE el2.employee_id = employee_id_param
            AND l2.supersedes_license_id = el.license_id
            AND el2.status = 'valid'
        )) as is_effective
    FROM public.employee_licenses el
    JOIN public.licenses l ON el.license_id = l.id
    LEFT JOIN public.employee_licenses el_superseding ON (
        el_superseding.employee_id = employee_id_param 
        AND el_superseding.status = 'valid'
    )
    LEFT JOIN public.licenses superseding ON (
        el_superseding.license_id = superseding.id 
        AND superseding.supersedes_license_id = el.license_id
    )
    WHERE el.employee_id = employee_id_param
    ORDER BY l.category, l.hierarchy_order, l.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get certificate progression paths
CREATE OR REPLACE FUNCTION public.get_certificate_progression_paths(license_id_param UUID)
RETURNS TABLE (
    from_certificate_id UUID,
    from_certificate_name TEXT,
    to_certificate_id UUID,
    to_certificate_name TEXT,
    available_courses_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        base.id as from_certificate_id,
        base.name as from_certificate_name,
        advanced.id as to_certificate_id,
        advanced.name as to_certificate_name,
        (
            SELECT COUNT(DISTINCT cc.course_id)::INTEGER
            FROM public.course_certificates cc
            WHERE cc.license_id = advanced.id
            AND cc.directly_grants = true
        ) as available_courses_count
    FROM public.licenses base
    JOIN public.licenses advanced ON advanced.supersedes_license_id = base.id
    WHERE base.id = license_id_param OR advanced.id = license_id_param
    ORDER BY base.hierarchy_order, advanced.hierarchy_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update some existing certificates with hierarchy examples
-- This is sample data to demonstrate the concept

-- Example: Set up VCA hierarchy (if VCA certificates exist)
UPDATE public.licenses 
SET hierarchy_order = 1, is_base_level = true 
WHERE LOWER(name) LIKE '%vca%basis%' OR LOWER(name) LIKE '%vca%basic%';

UPDATE public.licenses 
SET hierarchy_order = 2, is_base_level = false,
    supersedes_license_id = (
        SELECT id FROM public.licenses 
        WHERE LOWER(name) LIKE '%vca%basis%' OR LOWER(name) LIKE '%vca%basic%' 
        LIMIT 1
    )
WHERE LOWER(name) LIKE '%vca%vol%' OR LOWER(name) LIKE '%vca%advanced%';

-- Example: Set up forklift hierarchy (if forklift certificates exist)
UPDATE public.licenses 
SET hierarchy_order = 1, is_base_level = true 
WHERE LOWER(name) LIKE '%forklift%basic%' OR LOWER(name) LIKE '%forklift%operator%';

UPDATE public.licenses 
SET hierarchy_order = 2, is_base_level = false,
    supersedes_license_id = (
        SELECT id FROM public.licenses 
        WHERE LOWER(name) LIKE '%forklift%basic%' OR LOWER(name) LIKE '%forklift%operator%' 
        LIMIT 1
    )
WHERE LOWER(name) LIKE '%forklift%advanced%' OR LOWER(name) LIKE '%forklift%supervisor%';

-- Grant permissions for the new functions
GRANT EXECUTE ON FUNCTION public.get_certificate_hierarchy() TO authenticated;
GRANT EXECUTE ON FUNCTION public.employee_needs_certificate(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_employee_effective_certificates(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_certificate_progression_paths(UUID) TO authenticated;