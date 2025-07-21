import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type CertificateExemption = Tables<'certificate_exemptions'>;
type CertificateExemptionInsert = TablesInsert<'certificate_exemptions'>;
type CertificateExemptionUpdate = TablesUpdate<'certificate_exemptions'>;

export interface ExemptionWithDetails extends CertificateExemption {
  employee?: {
    id: string;
    name: string;
    employee_number: string;
    department: string;
  };
  license?: {
    id: string;
    name: string;
    description: string | null;
    level: number | null;
  };
  requested_by?: {
    id: string;
    name: string;
  };
  approved_by?: {
    id: string;
    name: string;
  };
}

export interface ExemptionRequest {
  employeeId: string;
  licenseId: string;
  exemptionType: 'permanent' | 'temporary' | 'conditional';
  reason: string;
  justification?: string;
  effectiveDate: string;
  expiryDate?: string;
  dontRepeatFlag: boolean;
}

// Hook to fetch all exemptions with filters
export const useCertificateExemptions = (filters?: {
  employeeId?: string;
  licenseId?: string;
  approvalStatus?: string;
  exemptionType?: string;
  isActive?: boolean;
}) => {
  return useQuery({
    queryKey: ['certificate-exemptions', filters],
    queryFn: async () => {
      let query = supabase
        .from('certificate_exemptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.employeeId) {
        query = query.eq('employee_id', filters.employeeId);
      }
      if (filters?.licenseId) {
        query = query.eq('license_id', filters.licenseId);
      }
      if (filters?.approvalStatus) {
        query = query.eq('approval_status', filters.approvalStatus);
      }
      if (filters?.exemptionType) {
        query = query.eq('exemption_type', filters.exemptionType);
      }
      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ExemptionWithDetails[];
    },
  });
};

// Hook to fetch pending exemptions for approval
export const usePendingExemptions = () => {
  return useQuery({
    queryKey: ['pending-exemptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificate_exemptions')
        .select('*')
        .eq('approval_status', 'pending')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as ExemptionWithDetails[];
    },
  });
};

// Hook to check if employee has active exemption for a license
export const useEmployeeExemptionStatus = (employeeId: string, licenseId: string) => {
  return useQuery({
    queryKey: ['employee-exemption-status', employeeId, licenseId],
    queryFn: async () => {
      const { data: exemption, error } = await supabase
        .from('certificate_exemptions')
        .select(`
          *,
          license:licenses(name, description, category)
        `)
        .eq('employee_id', employeeId)
        .eq('license_id', licenseId)
        .eq('approval_status', 'approved')
        .eq('is_active', true)
        .lte('effective_date', new Date().toISOString().split('T')[0])
        .or(`expiry_date.is.null,expiry_date.gte.${new Date().toISOString().split('T')[0]}`)
        .maybeSingle();

      if (error) throw error;

      return {
        hasActiveExemption: exemption !== null,
        exemption: exemption
      };
    },
    enabled: !!employeeId && !!licenseId,
  });
};

// Hook to get exemption statistics
export const useExemptionStatistics = () => {
  return useQuery({
    queryKey: ['exemption-statistics'],
    queryFn: async () => {
      const { data: pending, error: pendingError } = await supabase
        .from('certificate_exemptions')
        .select('id')
        .eq('approval_status', 'pending')
        .eq('is_active', true);

      const { data: approved, error: approvedError } = await supabase
        .from('certificate_exemptions')
        .select('id')
        .eq('approval_status', 'approved')
        .eq('is_active', true);

      const { data: rejected, error: rejectedError } = await supabase
        .from('certificate_exemptions')
        .select('id')
        .eq('approval_status', 'rejected');

      const { data: expiringSoon, error: expiringError } = await supabase
        .from('certificate_exemptions')
        .select('id')
        .eq('approval_status', 'approved')
        .eq('is_active', true)
        .not('expiry_date', 'is', null)
        .lte('expiry_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      if (pendingError || approvedError || rejectedError || expiringError) {
        throw new Error('Failed to fetch exemption statistics');
      }

      return {
        pending: pending?.length || 0,
        approved: approved?.length || 0,
        rejected: rejected?.length || 0,
        expiringSoon: expiringSoon?.length || 0
      };
    },
  });
};

// Hook for exemption management operations
export const useExemptionManagement = () => {
  const queryClient = useQueryClient();

  const createExemptionRequest = useMutation({
    mutationFn: async (request: ExemptionRequest & { requestedByName: string }) => {
      const { data: currentUser } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('employee_id')
        .eq('id', currentUser.user?.id)
        .single();

      const exemptionData: CertificateExemptionInsert = {
        employee_id: request.employeeId,
        license_id: request.licenseId,
        exemption_type: request.exemptionType,
        reason: request.reason,
        justification: request.justification,
        effective_date: request.effectiveDate,
        expiry_date: request.expiryDate,
        dont_repeat_flag: request.dontRepeatFlag,
        requested_by_id: userProfile?.employee_id || null,
        requested_by_name: request.requestedByName,
        approval_status: 'pending'
      };

      const { data, error } = await supabase
        .from('certificate_exemptions')
        .insert(exemptionData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-exemptions'] });
      queryClient.invalidateQueries({ queryKey: ['pending-exemptions'] });
      queryClient.invalidateQueries({ queryKey: ['exemption-statistics'] });
    },
  });

  const approveExemption = useMutation({
    mutationFn: async ({ 
      exemptionId, 
      approvalNotes,
      approvedByName 
    }: { 
      exemptionId: string; 
      approvalNotes?: string;
      approvedByName: string;
    }) => {
      const { data: currentUser } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('employee_id')
        .eq('id', currentUser.user?.id)
        .single();

      const updateData: CertificateExemptionUpdate = {
        approval_status: 'approved',
        approved_at: new Date().toISOString(),
        approval_notes: approvalNotes,
        approved_by_id: userProfile?.employee_id || null,
        approved_by_name: approvedByName
      };

      const { data, error } = await supabase
        .from('certificate_exemptions')
        .update(updateData)
        .eq('id', exemptionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-exemptions'] });
      queryClient.invalidateQueries({ queryKey: ['pending-exemptions'] });
      queryClient.invalidateQueries({ queryKey: ['exemption-statistics'] });
      queryClient.invalidateQueries({ queryKey: ['employee-exemption-status'] });
    },
  });

  const rejectExemption = useMutation({
    mutationFn: async ({ 
      exemptionId, 
      rejectionReason,
      approvedByName 
    }: { 
      exemptionId: string; 
      rejectionReason: string;
      approvedByName: string;
    }) => {
      const { data: currentUser } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('employee_id')
        .eq('id', currentUser.user?.id)
        .single();

      const updateData: CertificateExemptionUpdate = {
        approval_status: 'rejected',
        approved_at: new Date().toISOString(),
        approval_notes: rejectionReason,
        approved_by_id: userProfile?.employee_id || null,
        approved_by_name: approvedByName
      };

      const { data, error } = await supabase
        .from('certificate_exemptions')
        .update(updateData)
        .eq('id', exemptionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-exemptions'] });
      queryClient.invalidateQueries({ queryKey: ['pending-exemptions'] });
      queryClient.invalidateQueries({ queryKey: ['exemption-statistics'] });
    },
  });

  const revokeExemption = useMutation({
    mutationFn: async ({ 
      exemptionId, 
      revocationReason 
    }: { 
      exemptionId: string; 
      revocationReason: string;
    }) => {
      const updateData: CertificateExemptionUpdate = {
        approval_status: 'revoked',
        is_active: false,
        approval_notes: revocationReason
      };

      const { data, error } = await supabase
        .from('certificate_exemptions')
        .update(updateData)
        .eq('id', exemptionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-exemptions'] });
      queryClient.invalidateQueries({ queryKey: ['exemption-statistics'] });
      queryClient.invalidateQueries({ queryKey: ['employee-exemption-status'] });
    },
  });

  const updateExemption = useMutation({
    mutationFn: async ({ 
      exemptionId, 
      updates 
    }: { 
      exemptionId: string; 
      updates: Partial<CertificateExemptionUpdate>;
    }) => {
      const { data, error } = await supabase
        .from('certificate_exemptions')
        .update(updates)
        .eq('id', exemptionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-exemptions'] });
      queryClient.invalidateQueries({ queryKey: ['employee-exemption-status'] });
    },
  });

  return {
    createExemptionRequest,
    approveExemption,
    rejectExemption,
    revokeExemption,
    updateExemption,
  };
};

// Utility functions
export const getExemptionStatusColor = (status: string) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    revoked: 'bg-gray-100 text-gray-800'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

export const getExemptionTypeColor = (type: string) => {
  const colors = {
    permanent: 'bg-blue-100 text-blue-800',
    temporary: 'bg-orange-100 text-orange-800',
    conditional: 'bg-purple-100 text-purple-800'
  };
  return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

export const isExemptionExpiringSoon = (exemption: CertificateExemption, days: number = 30): boolean => {
  if (!exemption.expiry_date) return false;
  const expiryDate = new Date(exemption.expiry_date);
  const warningDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return expiryDate <= warningDate;
};

export const validateExemptionRequest = (request: ExemptionRequest): string[] => {
  const errors: string[] = [];

  if (!request.employeeId) errors.push('Employee is required');
  if (!request.licenseId) errors.push('Certificate is required');
  if (!request.exemptionType) errors.push('Exemption type is required');
  if (!request.reason.trim()) errors.push('Reason is required');
  if (!request.effectiveDate) errors.push('Effective date is required');

  if (request.exemptionType === 'temporary' && !request.expiryDate) {
    errors.push('Expiry date is required for temporary exemptions');
  }

  if (request.expiryDate && request.effectiveDate) {
    const effectiveDate = new Date(request.effectiveDate);
    const expiryDate = new Date(request.expiryDate);
    if (expiryDate <= effectiveDate) {
      errors.push('Expiry date must be after effective date');
    }
  }

  return errors;
};