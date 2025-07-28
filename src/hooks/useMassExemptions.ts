import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type MassExemptionTemplate = Tables<'mass_exemption_templates'>;
type MassExemptionOperation = Tables<'mass_exemption_operations'>;
type MassExemptionResult = Tables<'mass_exemption_results'>;

export interface ExemptionCriteria {
  departments?: string[];
  contract_types?: string[];
  cities?: string[]; // Using cities temporarily until hub_location column is added
  hire_date_from?: string;
  hire_date_to?: string;
  min_service_years?: number;
  max_service_years?: number;
  exclude_existing_exemptions?: boolean;
  license_id?: string; // Used for preview and execution
}

export interface MassExemptionRequest {
  templateId?: string;
  templateName?: string;
  licenseId: string;
  criteria: ExemptionCriteria;
  exemptionType: 'permanent' | 'temporary' | 'conditional';
  reason: string;
  justification?: string;
  effectiveDate: string;
  expiryDate?: string;
  saveAsTemplate?: boolean;
}

export interface AutoExemptionRuleRequest {
  name: string;
  description?: string;
  licenseId: string;
  criteria: ExemptionCriteria;
  exemptionType: 'permanent' | 'temporary' | 'conditional';
  reason: string;
  justification?: string;
  effectiveDateOffset?: number;
  durationDays?: number;
}

export interface EmployeePreview {
  employee_id: string;
  employee_name: string;
  department: string;
  contract_type: string;
  city: string; // Using city temporarily until hub_location column is added
  job_title: string;
  hire_date: string;
  service_years: number;
}

// Hook to fetch mass exemption templates
export const useMassExemptionTemplates = (filters?: {
  isActive?: boolean;
  createdById?: string;
}) => {
  return useQuery({
    queryKey: ['mass-exemption-templates', filters],
    queryFn: async () => {
      let query = supabase
        .from('mass_exemption_templates')
        .select('*')
        .order('usage_count', { ascending: false });

      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }
      if (filters?.createdById) {
        query = query.eq('created_by_id', filters.createdById);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MassExemptionTemplate[];
    },
  });
};

// Hook to fetch mass exemption operations (history)
export const useMassExemptionOperations = (filters?: {
  status?: string;
  licenseId?: string;
  executedById?: string;
}) => {
  return useQuery({
    queryKey: ['mass-exemption-operations', filters],
    queryFn: async () => {
      let query = supabase
        .from('mass_exemption_operations')
        .select(`
          *,
          license:licenses(name, description)
        `)
        .order('started_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.licenseId) {
        query = query.eq('license_id', filters.licenseId);
      }
      if (filters?.executedById) {
        query = query.eq('executed_by_id', filters.executedById);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

// Hook to get operation details with results
export const useMassExemptionOperationDetails = (operationId: string) => {
  return useQuery({
    queryKey: ['mass-exemption-operation-details', operationId],
    queryFn: async () => {
      const [operationResult, resultsResult] = await Promise.all([
        supabase
          .from('mass_exemption_operations')
          .select(`
            *,
            license:licenses(name, description)
          `)
          .eq('id', operationId)
          .single(),
        supabase
          .from('mass_exemption_results')
          .select(`
            *,
            employee:employees(name, department, employee_number)
          `)
          .eq('operation_id', operationId)
          .order('created_at')
      ]);

      if (operationResult.error) throw operationResult.error;
      if (resultsResult.error) throw resultsResult.error;

      return {
        operation: operationResult.data,
        results: resultsResult.data
      };
    },
    enabled: !!operationId,
  });
};

// Hook to preview employees matching criteria
export const useEmployeePreview = (criteria: ExemptionCriteria) => {
  return useQuery({
    queryKey: ['employee-preview', criteria],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('evaluate_mass_exemption_criteria', { 
          criteria_json: criteria 
        });

      if (error) throw error;
      return data as EmployeePreview[];
    },
    enabled: Boolean(
      criteria.departments?.length ||
      criteria.contract_types?.length ||
      criteria.cities?.length ||
      criteria.hire_date_from ||
      criteria.hire_date_to ||
      criteria.min_service_years ||
      criteria.max_service_years ||
      criteria.exclude_existing_exemptions
    ),
  });
};

// Hook to get unique values for criteria dropdowns
export const useCriteriaOptions = () => {
  return useQuery({
    queryKey: ['criteria-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('department, contract_type, city');

      if (error) throw error;

      // Extract unique values
      const departments = [...new Set(data.map(e => e.department).filter(Boolean))].sort();
      const contractTypes = [...new Set(data.map(e => e.contract_type).filter(Boolean))].sort();
      const cities = [...new Set(data.map(e => e.city).filter(Boolean))].sort();

      return {
        departments,
        contractTypes,
        cities
      };
    },
  });
};

// Hook for mass exemption operations
export const useMassExemptionManagement = () => {
  const queryClient = useQueryClient();

  const saveTemplate = useMutation({
    mutationFn: async (template: {
      name: string;
      description?: string;
      criteria: ExemptionCriteria;
      exemptionType: string;
      defaultReason?: string;
      defaultJustification?: string;
      defaultDurationDays?: number;
    }) => {
      const { data: currentUser } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('employee_id')
        .eq('id', currentUser.user?.id)
        .single();

      const templateData: TablesInsert<'mass_exemption_templates'> = {
        name: template.name,
        description: template.description,
        criteria: template.criteria as ExemptionCriteria,
        exemption_type: template.exemptionType as 'permanent' | 'temporary' | 'conditional',
        default_reason: template.defaultReason,
        default_justification: template.defaultJustification,
        default_duration_days: template.defaultDurationDays,
        created_by_id: userProfile?.employee_id || null,
        created_by_name: currentUser.user?.email || 'Unknown User'
      };

      const { data, error } = await supabase
        .from('mass_exemption_templates')
        .insert(templateData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mass-exemption-templates'] });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ 
      templateId, 
      updates 
    }: { 
      templateId: string; 
      updates: Partial<TablesUpdate<'mass_exemption_templates'>>; 
    }) => {
      const { data, error } = await supabase
        .from('mass_exemption_templates')
        .update(updates)
        .eq('id', templateId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mass-exemption-templates'] });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const { data, error } = await supabase
        .from('mass_exemption_templates')
        .delete()
        .eq('id', templateId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mass-exemption-templates'] });
    },
  });

  const executeMassExemption = useMutation({
    mutationFn: async (request: MassExemptionRequest) => {
      const { data: currentUser } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('employee_id')
        .eq('id', currentUser.user?.id)
        .single();

      const executedByName = currentUser.user?.email || 'Unknown User';
      const executedById = userProfile?.employee_id || null;

      // First, save as template if requested
      if (request.saveAsTemplate && request.templateName) {
        await saveTemplate.mutateAsync({
          name: request.templateName,
          criteria: request.criteria,
          exemptionType: request.exemptionType,
          defaultReason: request.reason,
          defaultJustification: request.justification
        });
      }

      // Update template usage count if using existing template
      if (request.templateId) {
        await supabase
          .from('mass_exemption_templates')
          .update({ 
            usage_count: supabase.sql`usage_count + 1`,
            last_used_at: new Date().toISOString()
          })
          .eq('id', request.templateId);
      }

      // Get employee count for the operation record
      const previewData = await supabase
        .rpc('evaluate_mass_exemption_criteria', { 
          criteria_json: { ...request.criteria, license_id: request.licenseId } 
        });

      if (previewData.error) throw previewData.error;

      // Create operation record
      const operationData: TablesInsert<'mass_exemption_operations'> = {
        template_id: request.templateId || null,
        template_name: request.templateName || 'Ad-hoc Operation',
        license_id: request.licenseId,
        criteria_used: request.criteria as ExemptionCriteria,
        exemption_type: request.exemptionType as 'permanent' | 'temporary' | 'conditional',
        reason: request.reason,
        justification: request.justification,
        effective_date: request.effectiveDate,
        expiry_date: request.expiryDate,
        employees_affected: previewData.data?.length || 0,
        executed_by_id: executedById,
        executed_by_name: executedByName
      };

      const { data: operation, error: operationError } = await supabase
        .from('mass_exemption_operations')
        .insert(operationData)
        .select()
        .single();

      if (operationError) throw operationError;

      // Execute the mass exemption creation
      const { data: result, error: executionError } = await supabase
        .rpc('create_mass_exemptions', {
          p_operation_id: operation.id,
          p_license_id: request.licenseId,
          p_criteria: { ...request.criteria, license_id: request.licenseId },
          p_exemption_type: request.exemptionType,
          p_reason: request.reason,
          p_justification: request.justification,
          p_effective_date: request.effectiveDate,
          p_expiry_date: request.expiryDate,
          p_executed_by_id: executedById,
          p_executed_by_name: executedByName
        });

      if (executionError) throw executionError;

      return {
        operation,
        result: result?.[0] || { success_count: 0, error_count: 0, total_count: 0 }
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mass-exemption-operations'] });
      queryClient.invalidateQueries({ queryKey: ['certificate-exemptions'] });
      queryClient.invalidateQueries({ queryKey: ['exemption-statistics'] });
    },
  });

  const createAutoExemptionRule = useMutation({
    mutationFn: async (request: AutoExemptionRuleRequest) => {
      const { data: currentUser } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('employee_id')
        .eq('id', currentUser.user?.id)
        .single();

      const ruleData: TablesInsert<'exemption_auto_rules'> = {
        name: request.name,
        description: request.description,
        license_id: request.licenseId,
        criteria: request.criteria as ExemptionCriteria,
        exemption_type: request.exemptionType as 'permanent' | 'temporary' | 'conditional',
        reason: request.reason,
        justification: request.justification,
        effective_date_offset: request.effectiveDateOffset || 0,
        duration_days: request.durationDays,
        created_by_id: userProfile?.employee_id || null,
        created_by_name: currentUser.user?.email || 'Unknown User'
      };

      const { data, error } = await supabase
        .from('exemption_auto_rules')
        .insert(ruleData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exemption-auto-rules'] });
      queryClient.invalidateQueries({ queryKey: ['certificate-exemptions'] });
    },
  });

  return {
    saveTemplate,
    updateTemplate,
    deleteTemplate,
    executeMassExemption,
    createAutoExemptionRule,
  };
};

// Utility functions
export const getMassExemptionStatusColor = (status: string) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

export const formatCriteria = (criteria: ExemptionCriteria): string => {
  const parts: string[] = [];
  
  if (criteria.departments?.length) {
    parts.push(`Departments: ${criteria.departments.join(', ')}`);
  }
  if (criteria.contract_types?.length) {
    parts.push(`Contract Types: ${criteria.contract_types.join(', ')}`);
  }
  if (criteria.cities?.length) {
    parts.push(`Cities: ${criteria.cities.join(', ')}`);
  }
  if (criteria.hire_date_from) {
    parts.push(`Hired after: ${criteria.hire_date_from}`);
  }
  if (criteria.hire_date_to) {
    parts.push(`Hired before: ${criteria.hire_date_to}`);
  }
  if (criteria.min_service_years) {
    parts.push(`Min service: ${criteria.min_service_years} years`);
  }
  if (criteria.max_service_years) {
    parts.push(`Max service: ${criteria.max_service_years} years`);
  }
  if (criteria.exclude_existing_exemptions) {
    parts.push('Exclude employees with existing exemptions');
  }
  
  return parts.length > 0 ? parts.join(' | ') : 'No criteria specified';
};