-- Enhance the evaluate_mass_exemption_criteria function to return more employee details
CREATE OR REPLACE FUNCTION evaluate_mass_exemption_criteria(criteria_json JSONB)
RETURNS TABLE(
  employee_id UUID, 
  employee_name VARCHAR, 
  department VARCHAR, 
  contract_type VARCHAR,
  hub_location VARCHAR,
  job_title VARCHAR,
  hire_date DATE,
  service_years NUMERIC
) AS $$
DECLARE
  base_query TEXT := 'SELECT e.id, e.name, e.department, e.contract_type, COALESCE(e.hub_location, e.city, ''Unknown'') as hub_location, e.job_title, e.created_at::date as hire_date, EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.created_at::date))::numeric as service_years FROM employees e WHERE e.is_active = true';
  where_conditions TEXT[] := ARRAY[]::TEXT[];
  condition TEXT;
  criteria_key TEXT;
  criteria_value JSONB;
BEGIN
  -- Build WHERE conditions based on criteria
  FOR criteria_key, criteria_value IN SELECT * FROM jsonb_each(criteria_json) LOOP
    CASE criteria_key
      WHEN 'departments' THEN
        IF jsonb_array_length(criteria_value) > 0 THEN
          condition := format('e.department = ANY(ARRAY[%s])', 
            (SELECT string_agg(quote_literal(value::text), ',') FROM jsonb_array_elements_text(criteria_value) AS value));
          where_conditions := array_append(where_conditions, condition);
        END IF;
      
      WHEN 'contract_types' THEN
        IF jsonb_array_length(criteria_value) > 0 THEN
          condition := format('e.contract_type = ANY(ARRAY[%s])', 
            (SELECT string_agg(quote_literal(value::text), ',') FROM jsonb_array_elements_text(criteria_value) AS value));
          where_conditions := array_append(where_conditions, condition);
        END IF;
      
      WHEN 'hub_locations' THEN
        IF jsonb_array_length(criteria_value) > 0 THEN
          condition := format('(COALESCE(e.hub_location, e.city, ''Unknown'') = ANY(ARRAY[%s]))', 
            (SELECT string_agg(quote_literal(value::text), ',') FROM jsonb_array_elements_text(criteria_value) AS value));
          where_conditions := array_append(where_conditions, condition);
        END IF;
      
      WHEN 'hire_date_from' THEN
        condition := format('e.created_at >= %L::date', criteria_value::text);
        where_conditions := array_append(where_conditions, condition);
      
      WHEN 'hire_date_to' THEN
        condition := format('e.created_at <= %L::date', criteria_value::text);
        where_conditions := array_append(where_conditions, condition);
      
      WHEN 'min_service_years' THEN
        condition := format('EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.created_at::date)) >= %s', criteria_value::text);
        where_conditions := array_append(where_conditions, condition);
      
      WHEN 'max_service_years' THEN
        condition := format('EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.created_at::date)) <= %s', criteria_value::text);
        where_conditions := array_append(where_conditions, condition);
      
      WHEN 'exclude_existing_exemptions' THEN
        IF criteria_value::boolean = true THEN
          condition := format('NOT EXISTS (
            SELECT 1 FROM certificate_exemptions ce 
            WHERE ce.employee_id = e.id 
            AND ce.license_id = %L::uuid 
            AND ce.approval_status = ''approved'' 
            AND ce.is_active = true
          )', (criteria_json->>'license_id')::text);
          where_conditions := array_append(where_conditions, condition);
        END IF;
        
      -- Handle unknown criteria gracefully (for backwards compatibility)
      ELSE
        -- Log unknown criteria but don't fail
        RAISE NOTICE 'Unknown criteria key: %', criteria_key;
    END CASE;
  END LOOP;
  
  -- Construct final query
  IF array_length(where_conditions, 1) > 0 THEN
    base_query := base_query || ' AND ' || array_to_string(where_conditions, ' AND ');
  END IF;
  
  -- Add ordering for consistent results
  base_query := base_query || ' ORDER BY e.name, e.department';
  
  -- Execute dynamic query
  RETURN QUERY EXECUTE base_query;
END;
$$ LANGUAGE plpgsql;