-- Provider Preferences and Quality Management System
-- Tracks provider rankings, costs, distances, and quality metrics

-- Provider preferences and rankings per course
CREATE TABLE provider_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES training_providers(id) ON DELETE CASCADE,
    priority_rank INTEGER NOT NULL CHECK (priority_rank > 0),
    cost_per_participant DECIMAL(10,2),
    distance_from_hub_km DECIMAL(8,2),
    quality_rating DECIMAL(3,2) CHECK (quality_rating >= 0 AND quality_rating <= 10),
    booking_lead_time_days INTEGER DEFAULT 14,
    cancellation_policy TEXT,
    rescheduling_flexibility_score INTEGER DEFAULT 5 CHECK (rescheduling_flexibility_score >= 1 AND rescheduling_flexibility_score <= 10),
    notes TEXT,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, provider_id)
);

-- Provider quality metrics and historical performance
CREATE TABLE provider_quality_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES training_providers(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN ('completion_rate', 'satisfaction_score', 'pass_rate', 'instructor_rating', 'material_quality')),
    metric_value DECIMAL(5,2) NOT NULL,
    measurement_period_start DATE,
    measurement_period_end DATE,
    sample_size INTEGER,
    notes TEXT,
    recorded_by UUID REFERENCES employees(id),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Work hub locations for distance calculations
CREATE TABLE work_hubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    is_primary BOOLEAN DEFAULT FALSE,
    employee_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Provider cost history for trend analysis
CREATE TABLE provider_cost_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES training_providers(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    cost_per_participant DECIMAL(10,2) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    additional_fees JSONB, -- Store breakdown of additional costs
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    notes TEXT,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Provider availability windows
CREATE TABLE provider_availability_windows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES training_providers(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    available_from DATE NOT NULL,
    available_to DATE NOT NULL,
    max_bookings_per_week INTEGER DEFAULT 1,
    preferred_days_of_week INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- Monday=1, Sunday=7
    blackout_periods JSONB, -- Store holiday/unavailable periods
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business context and constraints
CREATE TABLE business_context_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_type VARCHAR(50) NOT NULL CHECK (setting_type IN ('peak_period', 'budget_cycle', 'team_coverage', 'seasonal_pattern')),
    setting_name VARCHAR(100) NOT NULL,
    start_date DATE,
    end_date DATE,
    impact_level VARCHAR(20) CHECK (impact_level IN ('high', 'medium', 'low')),
    description TEXT,
    constraints JSONB, -- Store flexible constraint data
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_provider_preferences_course_id ON provider_preferences(course_id);
CREATE INDEX idx_provider_preferences_provider_id ON provider_preferences(provider_id);
CREATE INDEX idx_provider_preferences_priority ON provider_preferences(priority_rank);
CREATE INDEX idx_provider_quality_metrics_provider_id ON provider_quality_metrics(provider_id);
CREATE INDEX idx_provider_quality_metrics_course_id ON provider_quality_metrics(course_id);
CREATE INDEX idx_provider_cost_history_provider_course ON provider_cost_history(provider_id, course_id);
CREATE INDEX idx_provider_availability_dates ON provider_availability_windows(available_from, available_to);
CREATE INDEX idx_business_context_dates ON business_context_settings(start_date, end_date);

-- RLS Policies
ALTER TABLE provider_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_quality_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_cost_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_availability_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_context_settings ENABLE ROW LEVEL SECURITY;

-- Policies for provider_preferences
CREATE POLICY "Users can view provider preferences" ON provider_preferences
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage provider preferences" ON provider_preferences
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Policies for provider_quality_metrics
CREATE POLICY "Users can view provider quality metrics" ON provider_quality_metrics
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage provider quality metrics" ON provider_quality_metrics
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Policies for work_hubs
CREATE POLICY "Users can view work hubs" ON work_hubs
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage work hubs" ON work_hubs
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Policies for provider_cost_history
CREATE POLICY "Users can view provider cost history" ON provider_cost_history
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage provider cost history" ON provider_cost_history
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Policies for provider_availability_windows
CREATE POLICY "Users can view provider availability windows" ON provider_availability_windows
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage provider availability windows" ON provider_availability_windows
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Policies for business_context_settings
CREATE POLICY "Users can view business context settings" ON business_context_settings
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage business context settings" ON business_context_settings
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Triggers for updated_at
CREATE TRIGGER update_provider_preferences_updated_at BEFORE UPDATE ON provider_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_hubs_updated_at BEFORE UPDATE ON work_hubs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_provider_availability_windows_updated_at BEFORE UPDATE ON provider_availability_windows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_context_settings_updated_at BEFORE UPDATE ON business_context_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();