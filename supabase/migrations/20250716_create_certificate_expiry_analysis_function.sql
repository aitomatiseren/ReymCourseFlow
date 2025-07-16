-- Migration: Create Certificate Expiry Analysis Function
-- Description: Creates the get_certificate_expiry_analysis_for_period function for time-context-aware certificate expiry analysis
-- Date: 2025-07-16

-- Create function to get time-context-aware certificate expiry analysis
CREATE OR REPLACE FUNCTION get_certificate_expiry_analysis_for_period(
    planning_start_date DATE,
    planning_end_date DATE,
    license_id UUID DEFAULT NULL,
    department_filter VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    employee_id UUID,
    first_name VARCHAR,
    last_name VARCHAR,
    email VARCHAR,
    department VARCHAR,
    job_title VARCHAR,
    employee_license_id UUID,
    license_id UUID,
    expiry_date DATE,
    license_status VARCHAR,
    license_name VARCHAR,
    license_category VARCHAR,
    renewal_notice_months INTEGER,
    renewal_grace_period_months INTEGER,
    employee_status VARCHAR,
    days_until_expiry INTEGER,
    renewal_window_start DATE,
    days_until_expiry_from_period_start INTEGER,
    expires_during_period BOOLEAN,
    needs_renewal_during_period BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cea.employee_id,
        cea.first_name,
        cea.last_name,
        cea.email,
        cea.department,
        cea.job_title,
        cea.employee_license_id,
        cea.license_id,
        cea.expiry_date,
        cea.license_status,
        cea.license_name,
        cea.license_category,
        cea.renewal_notice_months,
        cea.renewal_grace_period_months,
        -- Context-aware status based on planning period
        CASE 
            WHEN cea.employee_license_id IS NULL THEN 'new'::VARCHAR
            WHEN cea.expiry_date <= planning_start_date THEN 'expired'::VARCHAR
            WHEN cea.expiry_date <= planning_end_date THEN 'expiring_during_period'::VARCHAR
            WHEN cea.expiry_date <= planning_end_date + INTERVAL '6 months' THEN 'renewal_approaching'::VARCHAR
            ELSE 'valid'::VARCHAR
        END as employee_status,
        cea.days_until_expiry,
        cea.renewal_window_start,
        -- Days until expiry from period start
        CASE 
            WHEN cea.expiry_date IS NOT NULL THEN EXTRACT(DAYS FROM (cea.expiry_date - planning_start_date))::INTEGER
            ELSE NULL
        END as days_until_expiry_from_period_start,
        -- Boolean flags for easier filtering
        CASE 
            WHEN cea.expiry_date IS NOT NULL 
                AND cea.expiry_date >= planning_start_date 
                AND cea.expiry_date <= planning_end_date THEN TRUE
            ELSE FALSE
        END as expires_during_period,
        CASE 
            WHEN cea.expiry_date IS NOT NULL 
                AND cea.expiry_date >= planning_start_date 
                AND cea.expiry_date <= planning_end_date + INTERVAL '6 months' THEN TRUE
            ELSE FALSE
        END as needs_renewal_during_period
    FROM certificate_expiry_analysis cea
    WHERE 
        (get_certificate_expiry_analysis_for_period.license_id IS NULL OR cea.license_id = get_certificate_expiry_analysis_for_period.license_id)
        AND (department_filter IS NULL OR cea.department = department_filter)
        AND (
            -- Include employees who need certificates
            cea.employee_license_id IS NULL 
            OR 
            -- Include employees with certificates expiring before or during planning period + buffer
            cea.expiry_date <= planning_end_date + INTERVAL '6 months'
        )
    ORDER BY 
        CASE 
            WHEN cea.expiry_date IS NOT NULL THEN cea.expiry_date
            ELSE planning_end_date + INTERVAL '1 year'
        END,
        cea.last_name, 
        cea.first_name;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION get_certificate_expiry_analysis_for_period IS 'Returns certificate expiry analysis contextual to a specific planning period';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_certificate_expiry_analysis_for_period TO authenticated;
GRANT EXECUTE ON FUNCTION get_certificate_expiry_analysis_for_period TO anon;