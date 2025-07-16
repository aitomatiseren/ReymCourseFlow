-- Employee Availability Management System
-- Tracks employee availability, leave periods, risk status, and work arrangements

-- Employee availability and status tracking
CREATE TABLE employee_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    availability_type VARCHAR(50) NOT NULL CHECK (availability_type IN ('leave', 'risk', 'restriction', 'schedule')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'planned', 'resolved', 'cancelled')),
    start_date DATE NOT NULL,
    end_date DATE,
    reason TEXT,
    impact_level VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (impact_level IN ('high', 'medium', 'low')),
    notes TEXT,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee learning profiles and preferences
CREATE TABLE employee_learning_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    learning_style VARCHAR(50) CHECK (learning_style IN ('visual', 'auditory', 'kinesthetic', 'reading', 'mixed')),
    language_preference VARCHAR(10) DEFAULT 'en',
    special_accommodations TEXT,
    performance_level VARCHAR(20) CHECK (performance_level IN ('beginner', 'intermediate', 'advanced')),
    previous_training_success_rate DECIMAL(5,2) DEFAULT 0.00,
    preferred_training_times JSONB, -- Store preferred time slots
    training_capacity_per_month INTEGER DEFAULT 2,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee work arrangements and location preferences
CREATE TABLE employee_work_arrangements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    primary_work_location VARCHAR(100),
    work_schedule VARCHAR(50) CHECK (work_schedule IN ('full-time', 'part-time', 'night-shift', 'flexible', 'remote')),
    contract_type VARCHAR(50) CHECK (contract_type IN ('permanent', 'temporary', 'contractor', 'intern')),
    notice_period_days INTEGER DEFAULT 30,
    travel_restrictions TEXT,
    mobility_limitations TEXT,
    remote_work_percentage INTEGER DEFAULT 0 CHECK (remote_work_percentage >= 0 AND remote_work_percentage <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_employee_availability_employee_id ON employee_availability(employee_id);
CREATE INDEX idx_employee_availability_dates ON employee_availability(start_date, end_date);
CREATE INDEX idx_employee_availability_status ON employee_availability(status);
CREATE INDEX idx_employee_learning_profiles_employee_id ON employee_learning_profiles(employee_id);
CREATE INDEX idx_employee_work_arrangements_employee_id ON employee_work_arrangements(employee_id);

-- RLS Policies
ALTER TABLE employee_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_learning_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_work_arrangements ENABLE ROW LEVEL SECURITY;

-- Policy for employee_availability
CREATE POLICY "Users can view employee availability" ON employee_availability
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage employee availability" ON employee_availability
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Policy for employee_learning_profiles
CREATE POLICY "Users can view employee learning profiles" ON employee_learning_profiles
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage employee learning profiles" ON employee_learning_profiles
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Policy for employee_work_arrangements
CREATE POLICY "Users can view employee work arrangements" ON employee_work_arrangements
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage employee work arrangements" ON employee_work_arrangements
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_employee_availability_updated_at BEFORE UPDATE ON employee_availability FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_learning_profiles_updated_at BEFORE UPDATE ON employee_learning_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_work_arrangements_updated_at BEFORE UPDATE ON employee_work_arrangements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();