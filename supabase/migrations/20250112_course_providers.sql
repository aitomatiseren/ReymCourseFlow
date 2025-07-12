-- Create course_providers table
CREATE TABLE IF NOT EXISTS public.course_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    address TEXT,
    postcode TEXT,
    city TEXT,
    country TEXT DEFAULT 'Netherlands',
    default_location TEXT, -- Default training location
    description TEXT,
    notes TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create junction table for course-provider relationships
CREATE TABLE IF NOT EXISTS public.course_provider_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.course_providers(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    price NUMERIC, -- Provider-specific pricing (can override course price)
    duration_hours NUMERIC, -- Provider-specific duration (can override course duration)
    max_participants INTEGER, -- Provider-specific max participants
    location TEXT, -- Provider-specific default location for this course
    notes TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider_id, course_id)
);

-- Add provider_id to trainings table
ALTER TABLE public.trainings 
ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES public.course_providers(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_course_providers_active ON public.course_providers(active);
CREATE INDEX IF NOT EXISTS idx_course_provider_courses_provider ON public.course_provider_courses(provider_id);
CREATE INDEX IF NOT EXISTS idx_course_provider_courses_course ON public.course_provider_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_trainings_provider ON public.trainings(provider_id);

-- Add triggers for updated_at
CREATE TRIGGER update_course_providers_updated_at 
BEFORE UPDATE ON public.course_providers 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_provider_courses_updated_at 
BEFORE UPDATE ON public.course_provider_courses 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE public.course_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_provider_courses ENABLE ROW LEVEL SECURITY;

-- Policies for course_providers (allow all authenticated users to read, admins to write)
CREATE POLICY "Allow authenticated users to view course providers" 
ON public.course_providers FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow admins to manage course providers" 
ON public.course_providers FOR ALL 
TO authenticated 
USING (true); -- You may want to restrict this to admin role

-- Policies for course_provider_courses
CREATE POLICY "Allow authenticated users to view course provider courses" 
ON public.course_provider_courses FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow admins to manage course provider courses" 
ON public.course_provider_courses FOR ALL 
TO authenticated 
USING (true); -- You may want to restrict this to admin role