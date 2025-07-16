
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Course {
  id: string;
  title: string;
  description?: string;
  duration_hours?: number;
  max_participants?: number;
  price?: number;
  code95_points?: number;
  sessions_required?: number;
  has_checklist?: boolean;
  checklist_items?: any[];
  cost_breakdown?: any[];
  created_at: string;
  course_certificates?: Array<{
    license_id: string;
    licenses: {
      id: string;
      name: string;
    };
  }>;
}

export function useCourses(enableRealTime = true) {
  const queryClient = useQueryClient();

  // Real-time subscriptions for course data
  useEffect(() => {
    if (!enableRealTime) return;

    // Subscribe to courses table changes
    const coursesChannel = supabase
      .channel('courses-global')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'courses'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['courses'] });
        queryClient.invalidateQueries({ queryKey: ['trainings'] }); // Course changes affect trainings
      })
      .subscribe();

    // Subscribe to course sessions changes
    const sessionsChannel = supabase
      .channel('course-sessions-global')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'course_sessions'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['courses'] });
        queryClient.invalidateQueries({ queryKey: ['course-sessions'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(coursesChannel);
      supabase.removeChannel(sessionsChannel);
    };
  }, [enableRealTime, queryClient]);

  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      console.log('Fetching courses from database...');

      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          course_certificates (
            license_id,
            licenses (
              id,
              name
            )
          )
        `)
        .order('title');

      if (error) {
        console.error('Error fetching courses:', error);
        throw error;
      }

      console.log('Fetched courses:', data);
      return data as Course[];
    }
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseData: Omit<Course, 'id' | 'created_at'>) => {
      console.log('Creating course:', courseData);

      const { data, error } = await supabase
        .from('courses')
        .insert([courseData])
        .select()
        .single();

      if (error) {
        console.error('Error creating course:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    }
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...courseData }: Partial<Course> & { id: string }) => {
      console.log('Updating course:', id, courseData);

      const { data, error } = await supabase
        .from('courses')
        .update(courseData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating course:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    }
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      console.log('Deleting course:', courseId);

      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) {
        console.error('Error deleting course:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    }
  });
}
