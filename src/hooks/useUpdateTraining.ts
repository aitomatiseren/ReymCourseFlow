
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CostComponent } from "./useTrainings";

interface UpdateTrainingData {
  id: string;
  title?: string;
  instructor?: string;
  date?: string;
  time?: string;
  location?: string;
  maxParticipants?: number;
  status?: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
  requiresApproval?: boolean;
  sessions_count?: number;
  session_dates?: string[] | null;
  session_times?: string[] | null;
  session_end_times?: string[] | null;
  price?: number | null;
  cost_breakdown?: CostComponent[];
  notes?: string;
  checklist?: Array<{ id: string; text: string; completed: boolean }>;
}

export function useUpdateTraining() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (trainingData: UpdateTrainingData) => {
      const { id, ...updateData } = trainingData;
      
      const { data, error } = await supabase
        .from('trainings')
        .update({
          ...(updateData.title && { title: updateData.title }),
          ...(updateData.instructor && { instructor: updateData.instructor }),
          ...(updateData.date && { date: updateData.date }),
          ...(updateData.time && { time: updateData.time }),
          ...(updateData.location && { location: updateData.location }),
          ...(updateData.maxParticipants && { max_participants: updateData.maxParticipants }),
          ...(updateData.status && { status: updateData.status }),
          ...(updateData.requiresApproval !== undefined && { requires_approval: updateData.requiresApproval }),
          ...(updateData.sessions_count !== undefined && { sessions_count: updateData.sessions_count }),
          ...(updateData.session_dates !== undefined && { session_dates: updateData.session_dates }),
          ...(updateData.session_times !== undefined && { session_times: updateData.session_times }),
          ...(updateData.session_end_times !== undefined && { session_end_times: updateData.session_end_times }),
          ...(updateData.price !== undefined && { price: updateData.price }),
          ...(updateData.cost_breakdown !== undefined && { cost_breakdown: updateData.cost_breakdown }),
          ...(updateData.notes !== undefined && { notes: updateData.notes }),
          ...(updateData.checklist !== undefined && { checklist: updateData.checklist })
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: ['training', data.id] });
      }
    }
  });
}
