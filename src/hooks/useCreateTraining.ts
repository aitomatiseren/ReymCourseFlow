
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CreateTrainingData {
  course_id: string;
  title: string;
  instructor: string;
  date: string;
  time: string;
  location: string;
  max_participants: number;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
  requires_approval: boolean;
  sessions_count: number;
  session_dates?: string[] | null;
  session_times?: string[] | null;
  session_end_times?: string[] | null;
}

export function useCreateTraining() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (trainingData: CreateTrainingData) => {
      console.log('Creating training with data:', trainingData);
      
      // For multi-session trainings, use session data; for single session, use main date/time
      const isMultiSession = trainingData.sessions_count && trainingData.sessions_count > 1;
      
      // Prepare the data for insertion
      const insertData = {
        title: trainingData.title,
        course_id: trainingData.course_id,
        instructor: trainingData.instructor,
        date: isMultiSession ? (trainingData.session_dates?.[0] || trainingData.date) : trainingData.date,
        time: isMultiSession ? (trainingData.session_times?.[0] || trainingData.time) : trainingData.time,
        location: trainingData.location,
        max_participants: trainingData.max_participants,
        requires_approval: trainingData.requires_approval,
        sessions_count: trainingData.sessions_count || 1,
        // Store session information as JSON arrays for multi-session trainings
        session_dates: isMultiSession && trainingData.session_dates && trainingData.session_dates.length > 0
          ? trainingData.session_dates 
          : null,
        session_times: isMultiSession && trainingData.session_times && trainingData.session_times.length > 0
          ? trainingData.session_times
          : null,
        session_end_times: isMultiSession && trainingData.session_end_times && trainingData.session_end_times.length > 0
          ? trainingData.session_end_times
          : null
      };
      
      console.log('Inserting data:', insertData);
      
      const { data, error } = await supabase
        .from('trainings')
        .insert([insertData])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating training:', error);
        throw error;
      }
      
      console.log('Training created successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
    }
  });
}
