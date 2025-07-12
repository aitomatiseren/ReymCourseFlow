
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { requiresCode95 } from "@/utils/code95Utils";
import { NotificationService } from "@/services/notificationService";

interface AddParticipantData {
  trainingId: string;
  employeeId: string;
}

export function useTrainingParticipants(trainingId?: string) {
  const queryClient = useQueryClient();

  const { data: participants = [], isLoading } = useQuery({
    queryKey: ['training-participants', trainingId],
    queryFn: async () => {
      if (!trainingId) return [];

      const { data, error } = await supabase
        .from('training_participants')
        .select(`
          id,
          status,
          approval_status,
          registration_date,
          code95_eligible,
          employees (
            id,
            name,
            email,
            employee_number,
            status
          )
        `)
        .eq('training_id', trainingId);

      if (error) throw error;
      return data;
    },
    enabled: !!trainingId
  });

  const addParticipant = useMutation({
    mutationFn: async ({ trainingId, employeeId }: AddParticipantData) => {
      // First, get the employee data to check if they have C, CE, or D licenses
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('driving_license_c, driving_license_ce, driving_license_d')
        .eq('id', employeeId)
        .single();

      if (employeeError) throw employeeError;

      // Only set code95_eligible to true if employee has required licenses
      const code95Eligible = !!(employee.driving_license_c || employee.driving_license_ce || employee.driving_license_d);
      
      const { data, error } = await supabase
        .from('training_participants')
        .insert([{
          training_id: trainingId,
          employee_id: employeeId,
          status: 'enrolled',
          registration_date: new Date().toISOString(),
          code95_eligible: code95Eligible
        }])
        .select()
        .single();

      if (error) throw error;

      // Send enrollment notification to the participant
      try {
        // Get training details for the notification
        const { data: training, error: trainingError } = await supabase
          .from('trainings')
          .select('id, title, date')
          .eq('id', trainingId)
          .single();

        if (!trainingError && training) {
          await NotificationService.notifyTrainingEnrollment(
            employeeId,
            training.title,
            training.date,
            training.id
          );
          console.log(`Enrollment notification sent to employee ${employeeId} for training ${training.title}`);
        }
      } catch (notificationError) {
        console.error('Error sending enrollment notification:', notificationError);
        // Don't throw - participant was successfully added, notification failure shouldn't block the operation
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-participants'] });
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
    }
  });

  const removeParticipant = useMutation({
    mutationFn: async (participantId: string) => {
      const { error } = await supabase
        .from('training_participants')
        .delete()
        .eq('id', participantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-participants'] });
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
    }
  });

  const updateParticipantCode95Status = useMutation({
    mutationFn: async ({ participantId, code95Eligible }: { participantId: string; code95Eligible: boolean }) => {
      // First, get the participant and employee data to verify they have the required licenses
      const { data: participant, error: participantError } = await supabase
        .from('training_participants')
        .select(`
          id,
          employees (
            driving_license_c,
            driving_license_ce,
            driving_license_d
          )
        `)
        .eq('id', participantId)
        .single();

      if (participantError) throw participantError;

      // Only allow code95_eligible to be true if employee has required licenses
      const hasRequiredLicenses = !!(
        participant.employees?.driving_license_c || 
        participant.employees?.driving_license_ce || 
        participant.employees?.driving_license_d
      );

      if (code95Eligible && !hasRequiredLicenses) {
        throw new Error('Employee must have C, CE, or D license to be eligible for Code 95');
      }

      const { data, error } = await supabase
        .from('training_participants')
        .update({ code95_eligible: code95Eligible })
        .eq('id', participantId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-participants'] });
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
    }
  });

  const updateParticipantCode95Status = useMutation({
    mutationFn: async ({ participantId, code95Eligible }: { participantId: string; code95Eligible: boolean }) => {
      // First, get the participant and employee data to verify they have the required licenses
      const { data: participant, error: participantError } = await supabase
        .from('training_participants')
        .select(`
          id,
          employees (
            driving_license_c,
            driving_license_ce,
            driving_license_d
          )
        `)
        .eq('id', participantId)
        .single();

      if (participantError) throw participantError;

      // Only allow code95_eligible to be true if employee has required licenses
      const hasRequiredLicenses = !!(
        participant.employees?.driving_license_c || 
        participant.employees?.driving_license_ce || 
        participant.employees?.driving_license_d
      );

      if (code95Eligible && !hasRequiredLicenses) {
        throw new Error('Employee must have C, CE, or D license to be eligible for Code 95');
      }

      const { data, error } = await supabase
        .from('training_participants')
        .update({ code95_eligible: code95Eligible })
        .eq('id', participantId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-participants'] });
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
    }
  });

  return {
    participants,
    isLoading,
    addParticipant,
    removeParticipant,
    updateParticipantCode95Status
  };
}
