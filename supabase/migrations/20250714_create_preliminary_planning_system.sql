-- Migration: Create Preliminary Planning System
-- Description: Implements the Potloodplanning (Preliminary Planning) system for certificate expiry management and employee grouping

-- Create preliminary_plans table for version-controlled planning
CREATE TABLE public.preliminary_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    planning_period_start DATE NOT NULL,
    planning_period_end DATE NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'finalized', 'archived')),
    version INTEGER NOT NULL DEFAULT 1,
    parent_plan_id UUID REFERENCES public.preliminary_plans(id),
    created_by UUID REFERENCES public.user_profiles(id),
    approved_by UUID REFERENCES public.user_profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    finalized_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create preliminary_plan_groups table for employee groupings by certificate expiry
CREATE TABLE public.preliminary_plan_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.preliminary_plans(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    description TEXT,
    certificate_id UUID REFERENCES public.licenses(id),
    group_type VARCHAR NOT NULL DEFAULT 'renewal' CHECK (group_type IN ('new', 'renewal', 'mixed')),
    location VARCHAR,
    priority INTEGER DEFAULT 1,
    max_participants INTEGER,
    target_completion_date DATE,
    estimated_cost DECIMAL(10,2),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create preliminary_plan_group_employees table for employee assignments to groups
CREATE TABLE public.preliminary_plan_group_employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.preliminary_plan_groups(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    employee_type VARCHAR NOT NULL CHECK (employee_type IN ('new', 'renewal')),
    current_certificate_id UUID REFERENCES public.employee_licenses(id),
    certificate_expiry_date DATE,
    priority_score INTEGER DEFAULT 0,
    notes TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, employee_id)
);

-- Create preliminary_plan_trainings table for planned training sessions
CREATE TABLE public.preliminary_plan_trainings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.preliminary_plans(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.preliminary_plan_groups(id) ON DELETE SET NULL,
    course_id UUID REFERENCES public.courses(id),
    provider_id UUID REFERENCES public.course_providers(id),
    title VARCHAR NOT NULL,
    proposed_date DATE,
    proposed_time TIME,
    proposed_location VARCHAR,
    estimated_participants INTEGER,
    max_participants INTEGER,
    estimated_cost DECIMAL(10,2),
    cost_breakdown JSONB DEFAULT '[]',
    status VARCHAR NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'confirmed', 'cancelled', 'converted')),
    converted_training_id UUID REFERENCES public.trainings(id),
    priority INTEGER DEFAULT 1,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_preliminary_plans_status ON public.preliminary_plans(status);
CREATE INDEX idx_preliminary_plans_period ON public.preliminary_plans(planning_period_start, planning_period_end);
CREATE INDEX idx_preliminary_plans_created_by ON public.preliminary_plans(created_by);

CREATE INDEX idx_preliminary_plan_groups_plan_id ON public.preliminary_plan_groups(plan_id);
CREATE INDEX idx_preliminary_plan_groups_certificate_id ON public.preliminary_plan_groups(certificate_id);
CREATE INDEX idx_preliminary_plan_groups_type ON public.preliminary_plan_groups(group_type);

CREATE INDEX idx_preliminary_plan_group_employees_group_id ON public.preliminary_plan_group_employees(group_id);
CREATE INDEX idx_preliminary_plan_group_employees_employee_id ON public.preliminary_plan_group_employees(employee_id);
CREATE INDEX idx_preliminary_plan_group_employees_expiry ON public.preliminary_plan_group_employees(certificate_expiry_date);

CREATE INDEX idx_preliminary_plan_trainings_plan_id ON public.preliminary_plan_trainings(plan_id);
CREATE INDEX idx_preliminary_plan_trainings_group_id ON public.preliminary_plan_trainings(group_id);
CREATE INDEX idx_preliminary_plan_trainings_status ON public.preliminary_plan_trainings(status);
CREATE INDEX idx_preliminary_plan_trainings_date ON public.preliminary_plan_trainings(proposed_date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_preliminary_plans_updated_at BEFORE UPDATE ON public.preliminary_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_preliminary_plan_groups_updated_at BEFORE UPDATE ON public.preliminary_plan_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_preliminary_plan_trainings_updated_at BEFORE UPDATE ON public.preliminary_plan_trainings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for certificate expiry analysis
CREATE OR REPLACE VIEW public.certificate_expiry_analysis AS
SELECT 
    e.id as employee_id,
    e.first_name,
    e.last_name,
    e.email,
    e.department,
    e.job_title as position,
    el.id as employee_license_id,
    l.id as license_id,
    el.expiry_date,
    el.status as license_status,
    l.name as license_name,
    l.category as license_category,
    l.renewal_notice_months,
    l.renewal_grace_period_months,
    CASE 
        WHEN el.id IS NULL THEN 'new'
        WHEN el.expiry_date <= CURRENT_DATE THEN 'expired'
        WHEN el.expiry_date <= CURRENT_DATE + INTERVAL '1 month' * COALESCE(l.renewal_notice_months, 6) THEN 'renewal_due'
        WHEN el.expiry_date <= CURRENT_DATE + INTERVAL '1 month' * (COALESCE(l.renewal_notice_months, 6) + 3) THEN 'renewal_approaching'
        ELSE 'valid'
    END as employee_status,
    CASE 
        WHEN el.expiry_date IS NOT NULL THEN (el.expiry_date - CURRENT_DATE)
        ELSE NULL
    END as days_until_expiry,
    CASE 
        WHEN el.expiry_date IS NOT NULL THEN (el.expiry_date - INTERVAL '1 month' * COALESCE(l.renewal_notice_months, 6))::DATE
        ELSE NULL
    END as renewal_window_start
FROM public.employees e
CROSS JOIN public.licenses l
LEFT JOIN public.employee_licenses el ON e.id = el.employee_id AND l.id = el.license_id
WHERE e.status = 'active'
ORDER BY e.last_name, e.first_name, l.name;

-- Create function to calculate employee priority score for grouping
CREATE OR REPLACE FUNCTION calculate_employee_priority_score(
    employee_id UUID,
    license_id UUID,
    expiry_date DATE DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    priority_score INTEGER := 0;
    days_until_expiry INTEGER;
    license_info RECORD;
    employee_info RECORD;
BEGIN
    -- Get license information
    SELECT renewal_notice_months, category INTO license_info
    FROM public.licenses WHERE id = license_id;
    
    -- Get employee information
    SELECT department, position INTO employee_info
    FROM public.employees WHERE id = employee_id;
    
    -- Calculate days until expiry
    IF expiry_date IS NOT NULL THEN
        days_until_expiry := EXTRACT(DAYS FROM (expiry_date - CURRENT_DATE));
        
        -- Higher priority for certificates expiring sooner
        IF days_until_expiry <= 30 THEN
            priority_score := priority_score + 100;
        ELSIF days_until_expiry <= 90 THEN
            priority_score := priority_score + 75;
        ELSIF days_until_expiry <= 180 THEN
            priority_score := priority_score + 50;
        ELSE
            priority_score := priority_score + 25;
        END IF;
    ELSE
        -- New employee without certificate gets medium priority
        priority_score := priority_score + 60;
    END IF;
    
    -- Add priority based on license category
    CASE license_info.category
        WHEN 'safety' THEN priority_score := priority_score + 30;
        WHEN 'operational' THEN priority_score := priority_score + 20;
        WHEN 'administrative' THEN priority_score := priority_score + 10;
        ELSE priority_score := priority_score + 15;
    END CASE;
    
    -- Add priority based on department (customize as needed)
    CASE employee_info.department
        WHEN 'Operations' THEN priority_score := priority_score + 15;
        WHEN 'Safety' THEN priority_score := priority_score + 20;
        WHEN 'Maintenance' THEN priority_score := priority_score + 15;
        ELSE priority_score := priority_score + 10;
    END CASE;
    
    RETURN priority_score;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for preliminary planning tables
ALTER TABLE public.preliminary_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preliminary_plan_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preliminary_plan_group_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preliminary_plan_trainings ENABLE ROW LEVEL SECURITY;

-- RLS policies for preliminary_plans
CREATE POLICY "Users can view preliminary plans" ON public.preliminary_plans
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid()
            AND up.role_id IN (
                SELECT id FROM public.user_roles 
                WHERE name IN ('admin', 'manager', 'planner', 'instructor')
            )
        )
    );

CREATE POLICY "Planners can create preliminary plans" ON public.preliminary_plans
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid()
            AND up.role_id IN (
                SELECT id FROM public.user_roles 
                WHERE name IN ('admin', 'manager', 'planner')
            )
        )
    );

CREATE POLICY "Planners can update their preliminary plans" ON public.preliminary_plans
    FOR UPDATE USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid()
            AND up.role_id IN (
                SELECT id FROM public.user_roles 
                WHERE name IN ('admin', 'manager')
            )
        )
    );

-- RLS policies for preliminary_plan_groups
CREATE POLICY "Users can view preliminary plan groups" ON public.preliminary_plan_groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid()
            AND up.role_id IN (
                SELECT id FROM public.user_roles 
                WHERE name IN ('admin', 'manager', 'planner', 'instructor')
            )
        )
    );

CREATE POLICY "Planners can manage preliminary plan groups" ON public.preliminary_plan_groups
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.preliminary_plans pp
            JOIN public.user_profiles up ON pp.created_by = up.id
            WHERE pp.id = plan_id
            AND (pp.created_by = auth.uid() OR up.role_id IN (
                SELECT id FROM public.user_roles 
                WHERE name IN ('admin', 'manager', 'planner')
            ))
        )
    );

-- RLS policies for preliminary_plan_group_employees
CREATE POLICY "Users can view preliminary plan group employees" ON public.preliminary_plan_group_employees
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid()
            AND up.role_id IN (
                SELECT id FROM public.user_roles 
                WHERE name IN ('admin', 'manager', 'planner', 'instructor')
            )
        )
    );

CREATE POLICY "Planners can manage preliminary plan group employees" ON public.preliminary_plan_group_employees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.preliminary_plan_groups ppg
            JOIN public.preliminary_plans pp ON ppg.plan_id = pp.id
            JOIN public.user_profiles up ON pp.created_by = up.id
            WHERE ppg.id = group_id
            AND (pp.created_by = auth.uid() OR up.role_id IN (
                SELECT id FROM public.user_roles 
                WHERE name IN ('admin', 'manager', 'planner')
            ))
        )
    );

-- RLS policies for preliminary_plan_trainings
CREATE POLICY "Users can view preliminary plan trainings" ON public.preliminary_plan_trainings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid()
            AND up.role_id IN (
                SELECT id FROM public.user_roles 
                WHERE name IN ('admin', 'manager', 'planner', 'instructor')
            )
        )
    );

CREATE POLICY "Planners can manage preliminary plan trainings" ON public.preliminary_plan_trainings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.preliminary_plans pp
            JOIN public.user_profiles up ON pp.created_by = up.id
            WHERE pp.id = plan_id
            AND (pp.created_by = auth.uid() OR up.role_id IN (
                SELECT id FROM public.user_roles 
                WHERE name IN ('admin', 'manager', 'planner')
            ))
        )
    );

-- Add comments for documentation
COMMENT ON TABLE public.preliminary_plans IS 'Stores preliminary training plans with version control and approval workflow';
COMMENT ON TABLE public.preliminary_plan_groups IS 'Groups employees by certificate expiry and training needs';
COMMENT ON TABLE public.preliminary_plan_group_employees IS 'Associates employees with planning groups based on certificate status';
COMMENT ON TABLE public.preliminary_plan_trainings IS 'Proposed training sessions within preliminary plans';
COMMENT ON VIEW public.certificate_expiry_analysis IS 'Analyzes employee certificate expiry status for planning purposes';
COMMENT ON FUNCTION calculate_employee_priority_score IS 'Calculates priority score for employee grouping in preliminary planning';