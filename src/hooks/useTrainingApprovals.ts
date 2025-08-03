import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ApprovalRequirement } from "@/components/training/ApprovalWorkflowManager";

export interface TrainingApproval {
  id: string;
  training_id: string;
  approval_type: 'planning_department' | 'manager' | 'custom';
  approver_id?: string;
  approver_email?: string;
  approver_name?: string;
  work_hub_id?: string;
  work_hub_name?: string;
  manager_id?: string;
  manager_name?: string;
  is_required: boolean;
  approval_order: number;
  status: 'pending' | 'approved' | 'rejected' | 'not_required';
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TrainingApprovalInsert {
  training_id: string;
  approval_type: 'planning_department' | 'manager' | 'custom';
  approver_id?: string;
  approver_email?: string;
  approver_name?: string;
  work_hub_id?: string;
  work_hub_name?: string;
  manager_id?: string;
  manager_name?: string;
  is_required: boolean;
  approval_order: number;
  status?: 'pending' | 'approved' | 'rejected' | 'not_required';
  notes?: string;
}

export function useTrainingApprovals(trainingId: string) {
  return useQuery({
    queryKey: ['training-approvals', trainingId],
    queryFn: async () => {
      if (!trainingId) return [];

      // For now, we'll simulate this since the table might not exist yet
      // In the real implementation, this would be:
      // const { data, error } = await supabase
      //   .from('training_approvals')
      //   .select('*')
      //   .eq('training_id', trainingId)
      //   .order('approval_order', { ascending: true });

      // if (error) throw error;
      // return data as TrainingApproval[];

      // Temporary mock data for development
      return [] as TrainingApproval[];
    },
    enabled: !!trainingId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useTrainingApprovalMutations() {
  const queryClient = useQueryClient();

  const createTrainingApprovals = useMutation({
    mutationFn: async ({ trainingId, approvals }: { 
      trainingId: string; 
      approvals: ApprovalRequirement[] 
    }) => {
      // Transform ApprovalRequirement to TrainingApprovalInsert
      const approvalInserts: TrainingApprovalInsert[] = approvals.map(req => ({
        training_id: trainingId,
        approval_type: req.type,
        approver_id: req.type === 'manager' ? req.managerId : undefined,
        approver_email: req.type === 'custom' ? req.customApproverEmail : undefined,
        approver_name: req.type === 'custom' ? req.customApproverName : 
                      req.type === 'manager' ? req.managerName : undefined,
        work_hub_id: req.type === 'planning_department' ? req.hubId : undefined,
        work_hub_name: req.type === 'planning_department' ? req.hubName : undefined,
        manager_id: req.type === 'manager' ? req.managerId : undefined,
        manager_name: req.type === 'manager' ? req.managerName : undefined,
        is_required: req.isRequired,
        approval_order: req.order,
        status: req.status,
        notes: req.notes
      }));

      // For now, we'll store this in the training metadata
      // In the real implementation, this would be:
      // const { data, error } = await supabase
      //   .from('training_approvals')
      //   .insert(approvalInserts)
      //   .select();

      // if (error) throw error;
      // return data;

      // Temporary: Store in training metadata
      const { data, error } = await supabase
        .from('trainings')
        .update({
          requires_approval: approvals.length > 0,
          // Store approval requirements in metadata for now
          // This will be moved to separate table later
        })
        .eq('id', trainingId)
        .select()
        .single();

      if (error) throw error;
      
      return approvalInserts;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['training-approvals', variables.trainingId] });
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
    }
  });

  const updateApprovalStatus = useMutation({
    mutationFn: async ({ 
      approvalId, 
      status, 
      approvedBy, 
      rejectedBy, 
      rejectionReason,
      notes
    }: { 
      approvalId: string;
      status: 'approved' | 'rejected';
      approvedBy?: string;
      rejectedBy?: string;
      rejectionReason?: string;
      notes?: string;
    }) => {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'approved') {
        updateData.approved_by = approvedBy;
        updateData.approved_at = new Date().toISOString();
      } else if (status === 'rejected') {
        updateData.rejected_by = rejectedBy;
        updateData.rejected_at = new Date().toISOString();
        updateData.rejection_reason = rejectionReason;
      }

      if (notes) {
        updateData.notes = notes;
      }

      // For now, this is a placeholder
      // In the real implementation:
      // const { data, error } = await supabase
      //   .from('training_approvals')
      //   .update(updateData)
      //   .eq('id', approvalId)
      //   .select()
      //   .single();

      // if (error) throw error;
      // return data;

      return { id: approvalId, ...updateData };
    },
    onSuccess: (data) => {
      // queryClient.invalidateQueries({ queryKey: ['training-approvals'] });
    }
  });

  const deleteTrainingApprovals = useMutation({
    mutationFn: async (trainingId: string) => {
      // For now, this is a placeholder
      // In the real implementation:
      // const { error } = await supabase
      //   .from('training_approvals')
      //   .delete()
      //   .eq('training_id', trainingId);

      // if (error) throw error;
      
      return trainingId;
    },
    onSuccess: (trainingId) => {
      queryClient.invalidateQueries({ queryKey: ['training-approvals', trainingId] });
    }
  });

  return {
    createTrainingApprovals,
    updateApprovalStatus,
    deleteTrainingApprovals
  };
}

// Helper function to check if training is fully approved
export function useTrainingApprovalStatus(trainingId: string) {
  const { data: approvals = [] } = useTrainingApprovals(trainingId);

  const requiredApprovals = approvals.filter(approval => approval.is_required);
  const approvedRequiredApprovals = requiredApprovals.filter(approval => approval.status === 'approved');
  const rejectedApprovals = approvals.filter(approval => approval.status === 'rejected');

  const isFullyApproved = requiredApprovals.length > 0 && approvedRequiredApprovals.length === requiredApprovals.length;
  const hasRejections = rejectedApprovals.length > 0;
  const isPending = requiredApprovals.length > 0 && !isFullyApproved && !hasRejections;

  return {
    approvals,
    requiredApprovals,
    approvedRequiredApprovals,
    rejectedApprovals,
    isFullyApproved,
    hasRejections,
    isPending,
    approvalProgress: requiredApprovals.length > 0 ? 
      (approvedRequiredApprovals.length / requiredApprovals.length) * 100 : 100
  };
}