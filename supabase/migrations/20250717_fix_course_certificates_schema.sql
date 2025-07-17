-- Fix course_certificates table schema to remove grants_level and ensure directly_grants is properly used

-- Check if grants_level column exists and drop it if it does
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'course_certificates' 
        AND column_name = 'grants_level'
    ) THEN
        ALTER TABLE public.course_certificates DROP COLUMN grants_level;
    END IF;
END $$;

-- Ensure directly_grants column exists with proper default
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'course_certificates' 
        AND column_name = 'directly_grants'
    ) THEN
        ALTER TABLE public.course_certificates ADD COLUMN directly_grants BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Ensure progression_course column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'course_certificates' 
        AND column_name = 'progression_course'
    ) THEN
        ALTER TABLE public.course_certificates ADD COLUMN progression_course BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Set default values for any existing rows that might have NULL values
UPDATE public.course_certificates 
SET directly_grants = true 
WHERE directly_grants IS NULL;

UPDATE public.course_certificates 
SET progression_course = false 
WHERE progression_course IS NULL;

-- Make sure the columns are NOT NULL with proper defaults
ALTER TABLE public.course_certificates 
ALTER COLUMN directly_grants SET NOT NULL,
ALTER COLUMN directly_grants SET DEFAULT true,
ALTER COLUMN progression_course SET NOT NULL,
ALTER COLUMN progression_course SET DEFAULT false;

-- Update the helper functions to use the new schema
CREATE OR REPLACE FUNCTION public.get_courses_for_certificate(cert_license_id UUID)
RETURNS TABLE (
    course_id UUID,
    course_title TEXT,
    course_category TEXT,
    course_level INTEGER,
    directly_grants BOOLEAN,
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
        cc.directly_grants,
        cc.is_required,
        cc.renewal_eligible
    FROM public.courses c
    JOIN public.course_certificates cc ON c.id = cc.course_id
    WHERE cc.license_id = cert_license_id
    ORDER BY c.title;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_certificates_for_course(course_id_param UUID)
RETURNS TABLE (
    license_id UUID,
    license_name TEXT,
    license_category TEXT,
    directly_grants BOOLEAN,
    is_required BOOLEAN,
    renewal_eligible BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.name,
        l.category,
        cc.directly_grants,
        cc.is_required,
        cc.renewal_eligible
    FROM public.licenses l
    JOIN public.course_certificates cc ON l.id = cc.license_id
    WHERE cc.course_id = course_id_param
    ORDER BY l.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_course_grant_certificate(
    course_id_param UUID,
    license_id_param UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.course_certificates
        WHERE course_id = course_id_param
        AND license_id = license_id_param
        AND directly_grants = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_courses_for_certificate(UUID) IS 'Returns courses that can grant a specific certificate, using directly_grants field';
COMMENT ON FUNCTION public.get_certificates_for_course(UUID) IS 'Returns certificates that can be granted by a specific course, using directly_grants field';
COMMENT ON FUNCTION public.can_course_grant_certificate(UUID, UUID) IS 'Checks if a course can grant a specific certificate using directly_grants field';