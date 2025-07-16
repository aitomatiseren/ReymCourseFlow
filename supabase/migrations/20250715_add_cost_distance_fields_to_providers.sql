-- Migration: Add cost and distance fields to course_providers table
-- Date: 2025-07-15
-- Description: Add basic cost and distance fields to provider records for quick analysis

-- Add cost and distance fields to course_providers table
ALTER TABLE course_providers
ADD COLUMN default_hourly_rate DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN travel_cost_per_km DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN base_location_lat DECIMAL(10,8) DEFAULT NULL,
ADD COLUMN base_location_lng DECIMAL(10,8) DEFAULT NULL,
ADD COLUMN min_group_size INTEGER DEFAULT 1,
ADD COLUMN max_group_size INTEGER DEFAULT 20,
ADD COLUMN setup_cost DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN cancellation_fee DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN advance_booking_days INTEGER DEFAULT 14,
ADD COLUMN cost_currency VARCHAR(3) DEFAULT 'EUR';

-- Add comments for better documentation
COMMENT ON COLUMN course_providers.default_hourly_rate IS 'Default hourly rate for training sessions (per hour)';
COMMENT ON COLUMN course_providers.travel_cost_per_km IS 'Cost per kilometer for travel to training location';
COMMENT ON COLUMN course_providers.base_location_lat IS 'Base location latitude for distance calculations';
COMMENT ON COLUMN course_providers.base_location_lng IS 'Base location longitude for distance calculations';
COMMENT ON COLUMN course_providers.min_group_size IS 'Minimum number of participants for training';
COMMENT ON COLUMN course_providers.max_group_size IS 'Maximum number of participants for training';
COMMENT ON COLUMN course_providers.setup_cost IS 'One-time setup cost for training session';
COMMENT ON COLUMN course_providers.cancellation_fee IS 'Fee charged for training cancellation';
COMMENT ON COLUMN course_providers.advance_booking_days IS 'Minimum days required for advance booking';
COMMENT ON COLUMN course_providers.cost_currency IS 'Currency code for all cost fields (e.g., EUR, USD)';

-- Add constraints for data validation
ALTER TABLE course_providers
ADD CONSTRAINT check_hourly_rate_positive CHECK (default_hourly_rate >= 0),
ADD CONSTRAINT check_travel_cost_positive CHECK (travel_cost_per_km >= 0),
ADD CONSTRAINT check_latitude_range CHECK (base_location_lat >= -90 AND base_location_lat <= 90),
ADD CONSTRAINT check_longitude_range CHECK (base_location_lng >= -180 AND base_location_lng <= 180),
ADD CONSTRAINT check_min_group_size_positive CHECK (min_group_size >= 1),
ADD CONSTRAINT check_max_group_size_valid CHECK (max_group_size >= min_group_size),
ADD CONSTRAINT check_setup_cost_positive CHECK (setup_cost >= 0),
ADD CONSTRAINT check_cancellation_fee_positive CHECK (cancellation_fee >= 0),
ADD CONSTRAINT check_advance_booking_positive CHECK (advance_booking_days >= 0),
ADD CONSTRAINT check_cost_currency_format CHECK (cost_currency ~ '^[A-Z]{3}$');

-- Create index for location-based queries
CREATE INDEX idx_course_providers_location ON course_providers(base_location_lat, base_location_lng) 
WHERE base_location_lat IS NOT NULL AND base_location_lng IS NOT NULL;

-- Create index for cost-based queries
CREATE INDEX idx_course_providers_cost ON course_providers(default_hourly_rate, travel_cost_per_km) 
WHERE default_hourly_rate IS NOT NULL OR travel_cost_per_km IS NOT NULL;

-- Create composite index for group size queries
CREATE INDEX idx_course_providers_group_size ON course_providers(min_group_size, max_group_size);

-- Add a calculated field for cost analysis (stored as a function)
CREATE OR REPLACE FUNCTION calculate_provider_base_cost(
    provider_id UUID,
    duration_hours INTEGER DEFAULT 8,
    group_size INTEGER DEFAULT 10,
    travel_distance_km DECIMAL DEFAULT 0
) RETURNS DECIMAL AS $$
DECLARE
    provider_record course_providers%ROWTYPE;
    base_cost DECIMAL DEFAULT 0;
BEGIN
    -- Get provider record
    SELECT * INTO provider_record FROM course_providers WHERE id = provider_id;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Calculate base training cost
    IF provider_record.default_hourly_rate IS NOT NULL THEN
        base_cost := provider_record.default_hourly_rate * duration_hours;
    END IF;
    
    -- Add setup cost if exists
    IF provider_record.setup_cost IS NOT NULL THEN
        base_cost := base_cost + provider_record.setup_cost;
    END IF;
    
    -- Add travel cost if exists
    IF provider_record.travel_cost_per_km IS NOT NULL AND travel_distance_km > 0 THEN
        base_cost := base_cost + (provider_record.travel_cost_per_km * travel_distance_km);
    END IF;
    
    RETURN base_cost;
END;
$$ LANGUAGE plpgsql;

-- Add a function to calculate distance between provider and target location
CREATE OR REPLACE FUNCTION calculate_provider_distance(
    provider_id UUID,
    target_lat DECIMAL,
    target_lng DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    provider_record course_providers%ROWTYPE;
    distance_km DECIMAL;
BEGIN
    -- Get provider record
    SELECT * INTO provider_record FROM course_providers WHERE id = provider_id;
    
    IF NOT FOUND OR provider_record.base_location_lat IS NULL OR provider_record.base_location_lng IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Calculate distance using Haversine formula
    -- Returns distance in kilometers
    SELECT 
        6371 * acos(
            cos(radians(target_lat)) * 
            cos(radians(provider_record.base_location_lat)) * 
            cos(radians(provider_record.base_location_lng) - radians(target_lng)) + 
            sin(radians(target_lat)) * 
            sin(radians(provider_record.base_location_lat))
        ) INTO distance_km;
    
    RETURN ROUND(distance_km, 2);
END;
$$ LANGUAGE plpgsql;

-- Create a view for provider cost analysis
CREATE OR REPLACE VIEW provider_cost_analysis AS
SELECT 
    p.id,
    p.name,
    p.city,
    p.country,
    p.default_hourly_rate,
    p.travel_cost_per_km,
    p.base_location_lat,
    p.base_location_lng,
    p.min_group_size,
    p.max_group_size,
    p.setup_cost,
    p.cancellation_fee,
    p.advance_booking_days,
    p.cost_currency,
    p.active,
    COUNT(cpc.id) as total_courses_offered,
    AVG(CASE 
        WHEN jsonb_array_length(cpc.cost_breakdown) > 0 THEN 
            (SELECT SUM((component->>'amount')::DECIMAL) 
             FROM jsonb_array_elements(cpc.cost_breakdown) AS component)
        ELSE NULL 
    END) as avg_course_cost,
    CASE 
        WHEN p.base_location_lat IS NOT NULL AND p.base_location_lng IS NOT NULL THEN true
        ELSE false
    END as has_location_data,
    CASE 
        WHEN p.default_hourly_rate IS NOT NULL THEN true
        ELSE false
    END as has_cost_data
FROM course_providers p
LEFT JOIN course_provider_courses cpc ON p.id = cpc.provider_id
GROUP BY p.id, p.name, p.city, p.country, p.default_hourly_rate, p.travel_cost_per_km, 
         p.base_location_lat, p.base_location_lng, p.min_group_size, p.max_group_size, 
         p.setup_cost, p.cancellation_fee, p.advance_booking_days, p.cost_currency, p.active;

-- Add RLS policy for the view
ALTER VIEW provider_cost_analysis OWNER TO postgres;
GRANT SELECT ON provider_cost_analysis TO authenticated;

-- Create a function to get provider recommendations based on cost and distance
CREATE OR REPLACE FUNCTION get_provider_recommendations(
    target_lat DECIMAL DEFAULT NULL,
    target_lng DECIMAL DEFAULT NULL,
    max_distance_km DECIMAL DEFAULT 100,
    max_hourly_rate DECIMAL DEFAULT NULL,
    min_group_size INTEGER DEFAULT 1,
    max_group_size INTEGER DEFAULT 50,
    course_id UUID DEFAULT NULL
) RETURNS TABLE (
    provider_id UUID,
    provider_name TEXT,
    hourly_rate DECIMAL,
    travel_cost DECIMAL,
    distance_km DECIMAL,
    estimated_travel_cost DECIMAL,
    group_size_min INTEGER,
    group_size_max INTEGER,
    setup_cost DECIMAL,
    advance_booking_days INTEGER,
    offers_course BOOLEAN,
    recommendation_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name::TEXT,
        p.default_hourly_rate,
        p.travel_cost_per_km,
        CASE 
            WHEN target_lat IS NOT NULL AND target_lng IS NOT NULL THEN
                calculate_provider_distance(p.id, target_lat, target_lng)
            ELSE NULL
        END as distance_km,
        CASE 
            WHEN target_lat IS NOT NULL AND target_lng IS NOT NULL AND p.travel_cost_per_km IS NOT NULL THEN
                p.travel_cost_per_km * calculate_provider_distance(p.id, target_lat, target_lng)
            ELSE NULL
        END as estimated_travel_cost,
        p.min_group_size,
        p.max_group_size,
        p.setup_cost,
        p.advance_booking_days,
        CASE 
            WHEN course_id IS NOT NULL THEN 
                EXISTS(SELECT 1 FROM course_provider_courses cpc WHERE cpc.provider_id = p.id AND cpc.course_id = course_id)
            ELSE NULL
        END as offers_course,
        -- Calculate recommendation score (higher is better)
        (
            -- Base score for active providers
            (CASE WHEN p.active = true THEN 50 ELSE 0 END) +
            -- Bonus for having cost data
            (CASE WHEN p.default_hourly_rate IS NOT NULL THEN 20 ELSE 0 END) +
            -- Bonus for having location data
            (CASE WHEN p.base_location_lat IS NOT NULL THEN 15 ELSE 0 END) +
            -- Bonus for reasonable advance booking
            (CASE WHEN p.advance_booking_days <= 14 THEN 10 ELSE 0 END) +
            -- Bonus for offering the requested course
            (CASE 
                WHEN course_id IS NOT NULL AND EXISTS(SELECT 1 FROM course_provider_courses cpc WHERE cpc.provider_id = p.id AND cpc.course_id = course_id) 
                THEN 25 
                ELSE 0 
            END)
        ) as recommendation_score
    FROM course_providers p
    WHERE p.active = true
        AND (max_hourly_rate IS NULL OR p.default_hourly_rate IS NULL OR p.default_hourly_rate <= max_hourly_rate)
        AND (min_group_size IS NULL OR p.max_group_size IS NULL OR p.max_group_size >= min_group_size)
        AND (max_group_size IS NULL OR p.min_group_size IS NULL OR p.min_group_size <= max_group_size)
        AND (
            target_lat IS NULL OR target_lng IS NULL OR 
            p.base_location_lat IS NULL OR p.base_location_lng IS NULL OR
            calculate_provider_distance(p.id, target_lat, target_lng) <= max_distance_km
        )
    ORDER BY recommendation_score DESC, p.name;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION calculate_provider_base_cost(UUID, INTEGER, INTEGER, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_provider_distance(UUID, DECIMAL, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION get_provider_recommendations(DECIMAL, DECIMAL, DECIMAL, DECIMAL, INTEGER, INTEGER, UUID) TO authenticated;

-- Add some sample data for testing (optional)
-- UPDATE course_providers 
-- SET default_hourly_rate = 150.00, 
--     travel_cost_per_km = 0.30,
--     min_group_size = 5,
--     max_group_size = 15,
--     setup_cost = 50.00,
--     advance_booking_days = 7
-- WHERE name LIKE '%Safety%' OR name LIKE '%VCA%';