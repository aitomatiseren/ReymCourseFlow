
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
      const { data, error } = await supabase
        .from('training_participants')
        .insert([{
          training_id: trainingId,
          employee_id: employeeId,
          status: 'enrolled',
          registration_date: new Date().toISOString()
        }])
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
