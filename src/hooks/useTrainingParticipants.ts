
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
      // First fetch the employee to check Code 95 requirements
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .single();
      
      if (employeeError) throw employeeError;
      
      // Determine if employee requires Code 95
      const code95Eligible = requiresCode95(employee);
      
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

  return {
    participants,
    isLoading,
    addParticipant,
    removeParticipant
  };
}
