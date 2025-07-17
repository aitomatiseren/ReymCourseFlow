-- Remove redundant hierarchy_order column from certificates
-- The superseding relationship already provides the hierarchy information

-- Remove the hierarchy_order column from licenses table
ALTER TABLE public.licenses DROP COLUMN IF EXISTS hierarchy_order;

-- Remove the index for hierarchy_order
DROP INDEX IF EXISTS idx_licenses_hierarchy_order;

-- Update the get_certificate_hierarchy function to remove hierarchy_order
CREATE OR REPLACE FUNCTION public.get_certificate_hierarchy()
RETURNS TABLE (
    certificate_id UUID,
    certificate_name TEXT,
    category TEXT,
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
    ORDER BY l.category, l.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the get_certificate_progression_paths function to remove hierarchy_order
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
    ORDER BY base.name, advanced.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the get_employee_effective_certificates function to remove hierarchy_order
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
    ORDER BY l.category, l.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_certificate_hierarchy() IS 'Returns certificate hierarchy based on superseding relationships, no longer uses hierarchy_order';
COMMENT ON FUNCTION public.get_certificate_progression_paths(UUID) IS 'Returns certificate progression paths based on superseding relationships';
COMMENT ON FUNCTION public.get_employee_effective_certificates(UUID) IS 'Returns employee certificates with superseding logic, no longer uses hierarchy_order';