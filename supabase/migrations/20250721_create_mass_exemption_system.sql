-- Create mass exemption templates table
CREATE TABLE IF NOT EXISTS mass_exemption_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL,
  exemption_type VARCHAR(20) NOT NULL CHECK (exemption_type IN ('temporary', 'permanent', 'conditional')),
  default_reason TEXT,
  default_justification TEXT,
  default_duration_days INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by_id UUID REFERENCES employees(id),
  created_by_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0
);

-- Create mass exemption operations table for audit trail
CREATE TABLE IF NOT EXISTS mass_exemption_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES mass_exemption_templates(id),
  template_name VARCHAR(255) NOT NULL,
  license_id UUID NOT NULL REFERENCES licenses(id),
  criteria_used JSONB NOT NULL,
  exemption_type VARCHAR(20) NOT NULL,
  reason TEXT NOT NULL,
  justification TEXT,
  effective_date DATE NOT NULL,
  expiry_date DATE,
  employees_affected INTEGER NOT NULL,
  employees_processed INTEGER DEFAULT 0,
  employees_successful INTEGER DEFAULT 0,
  employees_failed INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  error_details JSONB,
  executed_by_id UUID REFERENCES employees(id),
  executed_by_name VARCHAR(255) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create mass exemption results table for detailed tracking
CREATE TABLE IF NOT EXISTS mass_exemption_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id UUID NOT NULL REFERENCES mass_exemption_operations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id),
  exemption_id UUID REFERENCES certificate_exemptions(id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mass_exemption_templates_created_by ON mass_exemption_templates(created_by_id);
CREATE INDEX IF NOT EXISTS idx_mass_exemption_templates_active ON mass_exemption_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_mass_exemption_templates_usage ON mass_exemption_templates(usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_mass_exemption_operations_template ON mass_exemption_operations(template_id);
CREATE INDEX IF NOT EXISTS idx_mass_exemption_operations_license ON mass_exemption_operations(license_id);
CREATE INDEX IF NOT EXISTS idx_mass_exemption_operations_status ON mass_exemption_operations(status);
CREATE INDEX IF NOT EXISTS idx_mass_exemption_operations_executed_by ON mass_exemption_operations(executed_by_id);

CREATE INDEX IF NOT EXISTS idx_mass_exemption_results_operation ON mass_exemption_results(operation_id);
CREATE INDEX IF NOT EXISTS idx_mass_exemption_results_employee ON mass_exemption_results(employee_id);
CREATE INDEX IF NOT EXISTS idx_mass_exemption_results_status ON mass_exemption_results(status);

-- Set up Row Level Security (RLS)
ALTER TABLE mass_exemption_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE mass_exemption_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mass_exemption_results ENABLE ROW LEVEL SECURITY;

-- Create policies for mass exemption templates
CREATE POLICY "Users can view mass exemption templates" ON mass_exemption_templates
  FOR SELECT USING (true);

CREATE POLICY "Users can insert mass exemption templates" ON mass_exemption_templates
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own mass exemption templates" ON mass_exemption_templates
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own mass exemption templates" ON mass_exemption_templates
  FOR DELETE USING (true);

-- Create policies for mass exemption operations
CREATE POLICY "Users can view mass exemption operations" ON mass_exemption_operations
  FOR SELECT USING (true);

CREATE POLICY "Users can insert mass exemption operations" ON mass_exemption_operations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update mass exemption operations" ON mass_exemption_operations
  FOR UPDATE USING (true);

-- Create policies for mass exemption results
CREATE POLICY "Users can view mass exemption results" ON mass_exemption_results
  FOR SELECT USING (true);

CREATE POLICY "Users can insert mass exemption results" ON mass_exemption_results
  FOR INSERT WITH CHECK (true);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_mass_exemption_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mass_exemption_templates_updated_at_trigger
  BEFORE UPDATE ON mass_exemption_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_mass_exemption_templates_updated_at();

-- Function to evaluate criteria and return matching employee IDs
CREATE OR REPLACE FUNCTION evaluate_mass_exemption_criteria(criteria_json JSONB)
RETURNS TABLE(employee_id UUID, employee_name VARCHAR, department VARCHAR, contract_type VARCHAR) AS $$
DECLARE
  base_query TEXT := 'SELECT e.id, e.name, e.department, e.contract_type FROM employees e WHERE e.is_active = true';
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
      
      WHEN 'countries' THEN
        IF jsonb_array_length(criteria_value) > 0 THEN
          condition := format('e.country = ANY(ARRAY[%s])', 
            (SELECT string_agg(quote_literal(value::text), ',') FROM jsonb_array_elements_text(criteria_value) AS value));
          where_conditions := array_append(where_conditions, condition);
        END IF;
      
      WHEN 'cities' THEN
        IF jsonb_array_length(criteria_value) > 0 THEN
          condition := format('e.city = ANY(ARRAY[%s])', 
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
    END CASE;
  END LOOP;
  
  -- Construct final query
  IF array_length(where_conditions, 1) > 0 THEN
    base_query := base_query || ' AND ' || array_to_string(where_conditions, ' AND ');
  END IF;
  
  -- Execute dynamic query
  RETURN QUERY EXECUTE base_query;
END;
$$ LANGUAGE plpgsql;

-- Function to create mass exemptions
CREATE OR REPLACE FUNCTION create_mass_exemptions(
  p_operation_id UUID,
  p_license_id UUID,
  p_criteria JSONB,
  p_exemption_type VARCHAR,
  p_reason TEXT,
  p_justification TEXT,
  p_effective_date DATE,
  p_expiry_date DATE,
  p_executed_by_id UUID,
  p_executed_by_name VARCHAR
)
RETURNS TABLE(success_count INTEGER, error_count INTEGER, total_count INTEGER) AS $$
DECLARE
  emp_record RECORD;
  exemption_id UUID;
  success_cnt INTEGER := 0;
  error_cnt INTEGER := 0;
  total_cnt INTEGER := 0;
BEGIN
  -- Update operation status to processing
  UPDATE mass_exemption_operations 
  SET status = 'processing', 
      started_at = NOW()
  WHERE id = p_operation_id;

  -- Process each matching employee
  FOR emp_record IN 
    SELECT * FROM evaluate_mass_exemption_criteria(p_criteria || jsonb_build_object('license_id', p_license_id))
  LOOP
    total_cnt := total_cnt + 1;
    
    BEGIN
      -- Create exemption
      INSERT INTO certificate_exemptions (
        employee_id,
        license_id,
        exemption_type,
        reason,
        justification,
        effective_date,
        expiry_date,
        requested_by_id,
        requested_by_name,
        approval_status
      ) VALUES (
        emp_record.employee_id,
        p_license_id,
        p_exemption_type,
        p_reason,
        p_justification,
        p_effective_date,
        p_expiry_date,
        p_executed_by_id,
        p_executed_by_name,
        'approved'  -- Mass exemptions are auto-approved
      ) RETURNING id INTO exemption_id;
      
      -- Record success
      INSERT INTO mass_exemption_results (
        operation_id,
        employee_id,
        exemption_id,
        status
      ) VALUES (
        p_operation_id,
        emp_record.employee_id,
        exemption_id,
        'success'
      );
      
      success_cnt := success_cnt + 1;
      
    EXCEPTION WHEN OTHERS THEN
      -- Record error
      INSERT INTO mass_exemption_results (
        operation_id,
        employee_id,
        status,
        error_message
      ) VALUES (
        p_operation_id,
        emp_record.employee_id,
        'failed',
        SQLERRM
      );
      
      error_cnt := error_cnt + 1;
    END;
  END LOOP;
  
  -- Update operation with final counts
  UPDATE mass_exemption_operations 
  SET status = CASE WHEN error_cnt = 0 THEN 'completed' ELSE 'completed' END,
      employees_processed = total_cnt,
      employees_successful = success_cnt,
      employees_failed = error_cnt,
      completed_at = NOW()
  WHERE id = p_operation_id;
  
  RETURN QUERY SELECT success_cnt, error_cnt, total_cnt;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON mass_exemption_templates TO authenticated;
GRANT ALL ON mass_exemption_templates TO service_role;
GRANT ALL ON mass_exemption_operations TO authenticated;
GRANT ALL ON mass_exemption_operations TO service_role;
GRANT ALL ON mass_exemption_results TO authenticated;
GRANT ALL ON mass_exemption_results TO service_role;