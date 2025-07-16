import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to get courses that grant a specific certificate
 * Follows the relationship: Certificate (licenses) → course_certificates → courses
 */
export function useCoursesForCertificate(certificateId: string) {
  return useQuery({
    queryKey: ['courses-for-certificate', certificateId],
    queryFn: async () => {
      if (!certificateId || certificateId === 'all') {
        return [];
      }

      const { data, error } = await supabase
        .from('course_certificates')
        .select(`
          course_id,
          courses (
            id,
            title,
            description,
            category,
            duration_hours,
            max_participants,
            created_at
          )
        `)
        .eq('license_id', certificateId);

      if (error) {
        console.error('Error fetching courses for certificate:', error);
        throw error;
      }

      return data.map(item => item.courses).filter(Boolean);
    },
    enabled: !!certificateId && certificateId !== 'all',
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to get providers that can deliver training for a specific certificate
 * Follows the relationship: Certificate → course_certificates → courses → course_provider_courses → providers
 */
export function useProvidersForCertificate(certificateId: string) {
  return useQuery({
    queryKey: ['providers-for-certificate', certificateId],
    queryFn: async () => {
      if (!certificateId || certificateId === 'all') {
        return [];
      }

      // First, get courses that grant this certificate
      const { data: courseCertificates, error: courseCertError } = await supabase
        .from('course_certificates')
        .select('course_id')
        .eq('license_id', certificateId);

      if (courseCertError) {
        console.error('Error fetching course certificates:', courseCertError);
        throw courseCertError;
      }

      if (!courseCertificates || courseCertificates.length === 0) {
        return [];
      }

      const courseIds = courseCertificates.map(cc => cc.course_id);

      // Now get providers that can deliver these courses
      const { data: providersData, error: providersError } = await supabase
        .from('course_provider_courses')
        .select(`
          provider_id,
          course_id,
          max_participants,
          number_of_sessions,
          price,
          cost_breakdown,
          notes,
          courses (
            id,
            title,
            description,
            category
          ),
          course_providers (
            id,
            name,
            contact_person,
            email,
            phone,
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
        .in('course_id', courseIds)
        .eq('course_providers.active', true);

      if (providersError) {
        console.error('Error fetching providers for certificate:', providersError);
        throw providersError;
      }

      // Group by provider and include course information
      const providerMap = new Map();
      
      providersData.forEach(item => {
        const provider = item.course_providers;
        const course = item.courses;
        
        if (!provider || !course) return;

        if (!providerMap.has(provider.id)) {
          providerMap.set(provider.id, {
            ...provider,
            course_provider_courses: []
          });
        }

        providerMap.get(provider.id).course_provider_courses.push({
          course_id: item.course_id,
          max_participants: item.max_participants,
          number_of_sessions: item.number_of_sessions,
          price: item.price,
          cost_breakdown: item.cost_breakdown,
          notes: item.notes,
          courses: course
        });
      });

      return Array.from(providerMap.values());
    },
    enabled: !!certificateId && certificateId !== 'all',
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to get comprehensive provider information for a specific certificate
 * Includes provider preferences and availability
 */
export function useProvidersForCertificateWithPreferences(certificateId: string) {
  const { data: providers, isLoading: providersLoading, error: providersError } = useProvidersForCertificate(certificateId);

  return useQuery({
    queryKey: ['providers-for-certificate-with-preferences', certificateId],
    queryFn: async () => {
      if (!providers || providers.length === 0) {
        return [];
      }

      const providerIds = providers.map(p => p.id);

      // Get provider preferences for this certificate
      const { data: preferences, error: prefError } = await supabase
        .from('provider_preferences')
        .select('*')
        .eq('license_id', certificateId)
        .in('provider_id', providerIds);

      if (prefError) {
        console.error('Error fetching provider preferences:', prefError);
        // Continue without preferences rather than failing
      }

      // Merge preferences with provider data
      return providers.map(provider => ({
        ...provider,
        preferences: preferences?.find(p => p.provider_id === provider.id)
      }));
    },
    enabled: !!providers && providers.length > 0 && !providersLoading,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}