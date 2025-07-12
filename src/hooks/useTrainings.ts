
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CostComponent {
  name: string;
  amount: number;
  description: string;
}

export interface Training {
  id: string;
  title: string;
  instructor: string;
  date: string;
  time: string;
  location: string;
  maxParticipants: number;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
  requiresApproval: boolean;
  participantCount: number;
  course_id?: string;
  courseName?: string;
  price?: number;
  cost_breakdown?: CostComponent[];
  code95_points?: number;
  sessions_count?: number;
  session_dates?: string[] | null;
  session_times?: string[] | null;
  session_end_times?: string[] | null;
  checklist?: Array<{ id: string; text: string; completed: boolean }>;
  notes?: string;
}

export function useTrainings(enableRealTime = true) {
  const queryClient = useQueryClient();

  // Real-time subscriptions for training data
  useEffect(() => {
    if (!enableRealTime) return;

    // Subscribe to trainings table changes
    const trainingsChannel = supabase
      .channel('trainings-global')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trainings'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['trainings'] });
      })
      .subscribe();

    // Subscribe to training participants changes (affects training capacity display)
    const participantsChannel = supabase
      .channel('training-participants-global')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'training_participants'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['trainings'] });
        queryClient.invalidateQueries({ queryKey: ['training-participants'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(trainingsChannel);
      supabase.removeChannel(participantsChannel);
    };
  }, [enableRealTime, queryClient]);

  return useQuery({
    queryKey: ['trainings'],
    queryFn: async () => {
      console.log('Fetching trainings from database...');
      
      const { data: trainingsData, error: trainingsError } = await supabase
        .from('trainings')
        .select(`
          id,
          title,
          instructor,
          date,
          time,
          location,
          max_participants,
          status,
          requires_approval,
          sessions_count,
          session_dates,
          session_times,
          session_end_times,
          price,
          cost_breakdown,
          notes,
          checklist,
          course_id,
          courses (
            title,
            price,
            code95_points
          )
        `)
        .order('date');
      
      if (trainingsError) {
        console.error('Error fetching trainings:', trainingsError);
        throw trainingsError;
      }
      
      // Get participant counts for each training
      const { data: participantsData, error: participantsError } = await supabase
        .from('training_participants')
        .select('training_id')
        .in('status', ['enrolled', 'attended']);
      
      if (participantsError) {
        console.error('Error fetching training participants:', participantsError);
        throw participantsError;
      }
      
      // Count participants per training
      const participantCounts = participantsData.reduce((acc, participant) => {
        acc[participant.training_id] = (acc[participant.training_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log('Fetched trainings:', trainingsData);
      
      // Transform database data to match our Training interface
      const trainings: Training[] = trainingsData.map(training => {
        const finalPrice = training.price ? Number(training.price) : training.courses?.price ? Number(training.courses.price) : undefined;
        
        // Use existing cost breakdown from database, or create a simple one from the price
        const costBreakdown: CostComponent[] | undefined = 
          training.cost_breakdown && Array.isArray(training.cost_breakdown) && training.cost_breakdown.length > 0
            ? training.cost_breakdown as unknown as CostComponent[]
            : finalPrice ? [
                {
                  name: "Training Fee",
                  amount: finalPrice,
                  description: "Total course fee"
                }
              ] : undefined;
        
        return {
          id: training.id,
          title: training.title,
          instructor: training.instructor || 'TBD',
          date: training.date,
          time: training.time,
          location: training.location,
          maxParticipants: training.max_participants,
          status: training.status as Training['status'] || 'scheduled',
          requiresApproval: training.requires_approval || false,
          participantCount: participantCounts[training.id] || 0,
          course_id: training.course_id,
          courseName: training.courses?.title,
          price: finalPrice,
          cost_breakdown: costBreakdown,
          code95_points: training.courses?.code95_points || undefined,
          sessions_count: training.sessions_count || 1,
          session_dates: training.session_dates as string[] | null,
          session_times: training.session_times as string[] | null,
          session_end_times: training.session_end_times as string[] | null,
          checklist: training.checklist as Array<{ id: string; text: string; completed: boolean }> || [],
          notes: training.notes || ""
        };
      });
      
      return trainings;
    }
  });
}
