import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Provider {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  postcode?: string;
  default_location?: string;
  additional_locations?: any;
  active: boolean;
  instructors?: any;
  description?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export function useProviders(includeRelations = false, enableRealTime = true) {
  const queryClient = useQueryClient();

  // Real-time subscriptions for provider data
  useEffect(() => {
    if (!enableRealTime) return;

    // Subscribe to course_providers table changes
    const providersChannel = supabase
      .channel('course-providers-global')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'course_providers'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['course-providers'] });
        queryClient.invalidateQueries({ queryKey: ['providers'] });
        queryClient.invalidateQueries({ queryKey: ['trainings'] }); // Provider changes affect trainings
      })
      .subscribe();

    // Subscribe to course_provider_courses relationship changes
    const providerCoursesChannel = supabase
      .channel('course-provider-courses-global')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'course_provider_courses'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['course-providers'] });
        queryClient.invalidateQueries({ queryKey: ['course-providers-for-course'] });
        queryClient.invalidateQueries({ queryKey: ['provider'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(providersChannel);
      supabase.removeChannel(providerCoursesChannel);
    };
  }, [enableRealTime, queryClient]);

  return useQuery({
    queryKey: ['course-providers', includeRelations ? 'with-relations' : 'basic'],
    queryFn: async () => {
      console.log(`Fetching providers from database${includeRelations ? ' with relations' : ''}...`);
      
      const selectQuery = includeRelations 
        ? `
          *,
          course_provider_courses (
            course_id,
            courses (
              id,
              title,
              category
            )
          )
        `
        : '*';
      
      const { data, error } = await supabase
        .from('course_providers')
        .select(selectQuery)
        .order('name');
      
      if (error) {
        console.error('Error fetching providers:', error);
        throw error;
      }
      
      console.log(`Fetched ${data?.length || 0} providers`);
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook for fetching providers that offer a specific course
export function useProvidersForCourse(courseId?: string, enableRealTime = true) {
  const queryClient = useQueryClient();

  // Real-time subscriptions for course-specific provider data
  useEffect(() => {
    if (!enableRealTime || !courseId) return;

    // Subscribe to provider-course relationship changes for this course
    const providerCoursesChannel = supabase
      .channel(`course-providers-for-course-${courseId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'course_provider_courses',
        filter: `course_id=eq.${courseId}`
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['course-providers-for-course', courseId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(providerCoursesChannel);
    };
  }, [enableRealTime, courseId, queryClient]);

  return useQuery({
    queryKey: ['course-providers-for-course', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      
      console.log(`[DEBUG] Fetching providers for course ${courseId}...`);
      
      // First, let's check if the course_provider_courses table has any records for this course
      const { data: relationshipData, error: relationshipError } = await supabase
        .from('course_provider_courses')
        .select('*')
        .eq('course_id', courseId);
      
      console.log(`[DEBUG] Course provider relationships for course ${courseId}:`, relationshipData);
      
      if (relationshipError) {
        console.error('[DEBUG] Error fetching course provider relationships:', relationshipError);
      }
      
      // Now try a simplified query first to isolate the issue
      console.log(`[DEBUG] Testing simplified query first...`);
      const { data: simpleData, error: simpleError } = await supabase
        .from('course_provider_courses')
        .select(`
          course_providers (
            id,
            name,
            active
          )
        `)
        .eq('course_id', courseId);
      
      console.log(`[DEBUG] Simple query result:`, simpleData);
      if (simpleError) {
        console.error('[DEBUG] Simple query error:', simpleError);
      }

      // Now try the full query (fixed to include default_location)
      const { data, error } = await supabase
        .from('course_provider_courses')
        .select(`
          course_providers (
            id,
            name,
            contact_person,
            email,
            phone,
            website,
            address,
            city,
            country,
            postcode,
            default_location,
            additional_locations,
            active,
            instructors,
            description,
            notes,
            created_at,
            updated_at
          )
        `)
        .eq('course_id', courseId);
      
      console.log(`[DEBUG] Raw query result for course ${courseId}:`, data);
      
      if (error) {
        console.error('[DEBUG] Error fetching providers for course:', error);
        throw error;
      }
      
      const providers = data?.map(item => item.course_providers).filter(Boolean) || [];
      console.log(`[DEBUG] Processed providers for course ${courseId}:`, providers);
      console.log(`[DEBUG] Fetched ${providers.length} providers for course ${courseId}`);
      
      // Additional debug: Check if providers are active
      const activeProviders = providers.filter(p => p?.active !== false);
      console.log(`[DEBUG] Active providers for course ${courseId}:`, activeProviders);
      
      return providers as Provider[];
    },
    enabled: !!courseId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook for fetching provider-course specific pricing and details
export function useProviderCourseDetails(providerId?: string, courseId?: string) {
  return useQuery({
    queryKey: ['provider-course-details', providerId, courseId],
    queryFn: async () => {
      if (!providerId || !courseId) return null;
      
      console.log(`Fetching provider-course details for provider ${providerId} and course ${courseId}...`);
      
      const { data, error } = await supabase
        .from('course_provider_courses')
        .select('*')
        .eq('provider_id', providerId)
        .eq('course_id', courseId)
        .single();
      
      if (error) {
        console.error('Error fetching provider-course details:', error);
        throw error;
      }
      
      console.log('Fetched provider-course details:', data);
      return data;
    },
    enabled: !!providerId && !!courseId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook for fetching individual provider details
export function useProvider(providerId?: string, enableRealTime = true) {
  const queryClient = useQueryClient();

  // Real-time subscriptions for individual provider data
  useEffect(() => {
    if (!enableRealTime || !providerId) return;

    const providerChannel = supabase
      .channel(`provider-${providerId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'course_providers',
        filter: `id=eq.${providerId}`
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['provider', providerId] });
        queryClient.invalidateQueries({ queryKey: ['course-providers'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(providerChannel);
    };
  }, [enableRealTime, providerId, queryClient]);

  return useQuery({
    queryKey: ['provider', providerId],
    queryFn: async () => {
      if (!providerId) return null;
      
      console.log(`Fetching provider ${providerId}...`);
      
      const { data, error } = await supabase
        .from('course_providers')
        .select('*')
        .eq('id', providerId)
        .single();
      
      if (error) {
        console.error('Error fetching provider:', error);
        throw error;
      }
      
      console.log(`Fetched provider: ${data?.name}`);
      return data as Provider;
    },
    enabled: !!providerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}