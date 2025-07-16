import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type ProviderPreference = Database["public"]["Tables"]["provider_preferences"]["Row"];
type ProviderPreferenceInsert = Database["public"]["Tables"]["provider_preferences"]["Insert"];
type ProviderPreferenceUpdate = Database["public"]["Tables"]["provider_preferences"]["Update"];

// Hook to fetch provider preferences for a specific course
export function useProviderPreferences(courseId?: string) {
  return useQuery({
    queryKey: ['provider-preferences', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      
      const { data, error } = await supabase
        .from('provider_preferences')
        .select(`
          *,
          course_providers (
            id,
            name,
            contact_email,
            phone,
            website,
            city,
            country
          ),
          courses (
            id,
            title
          )
        `)
        .eq('course_id', courseId)
        .order('priority_rank', { ascending: true });

      if (error) {
        console.error('Error fetching provider preferences:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!courseId,
  });
}

// Hook to fetch all provider preferences
export function useAllProviderPreferences() {
  return useQuery({
    queryKey: ['provider-preferences-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('provider_preferences')
        .select(`
          *,
          course_providers (
            id,
            name,
            contact_email,
            phone,
            website,
            city,
            country
          ),
          courses (
            id,
            title
          )
        `)
        .order('course_id', { ascending: true })
        .order('priority_rank', { ascending: true });

      if (error) {
        console.error('Error fetching all provider preferences:', error);
        throw error;
      }

      return data || [];
    },
  });
}

// Hook to create or update provider preference
export function useUpsertProviderPreference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preference: ProviderPreferenceInsert) => {
      const { data, error } = await supabase
        .from('provider_preferences')
        .upsert(preference, {
          onConflict: 'course_id,provider_id',
        })
        .select()
        .single();

      if (error) {
        console.error('Error upserting provider preference:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-preferences'] });
      toast.success('Provider preference updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update provider preference:', error);
      toast.error('Failed to update provider preference');
    },
  });
}

// Hook to delete provider preference
export function useDeleteProviderPreference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('provider_preferences')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting provider preference:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-preferences'] });
      toast.success('Provider preference deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete provider preference:', error);
      toast.error('Failed to delete provider preference');
    },
  });
}

// Hook to bulk update provider preferences (for drag-and-drop reordering)
export function useBulkUpdateProviderPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: ProviderPreferenceUpdate[]) => {
      const updates = preferences.map(pref => 
        supabase
          .from('provider_preferences')
          .update({ priority_rank: pref.priority_rank })
          .eq('id', pref.id)
      );

      const results = await Promise.all(updates);
      
      // Check for errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        console.error('Bulk update errors:', errors);
        throw new Error('Failed to update some provider preferences');
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-preferences'] });
      toast.success('Provider preferences updated successfully');
    },
    onError: (error) => {
      console.error('Failed to bulk update provider preferences:', error);
      toast.error('Failed to update provider preferences');
    },
  });
}

// Hook to calculate distance between provider and work hub
export function useCalculateDistance() {
  return useMutation({
    mutationFn: async ({ 
      providerLat, 
      providerLng, 
      hubLat, 
      hubLng 
    }: {
      providerLat: number;
      providerLng: number;
      hubLat: number;
      hubLng: number;
    }) => {
      // Haversine formula for distance calculation
      const R = 6371; // Earth's radius in kilometers
      const dLat = (hubLat - providerLat) * Math.PI / 180;
      const dLng = (hubLng - providerLng) * Math.PI / 180;
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(providerLat * Math.PI / 180) * Math.cos(hubLat * Math.PI / 180) * 
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      return Math.round(distance * 100) / 100; // Round to 2 decimal places
    },
  });
}

// Hook to fetch work hubs for distance calculations
export function useWorkHubs() {
  return useQuery({
    queryKey: ['work-hubs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_hubs')
        .select('*')
        .order('is_primary', { ascending: false })
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching work hubs:', error);
        throw error;
      }

      return data || [];
    },
  });
}

// Hook to manage work hubs
export function useManageWorkHub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (hub: Database["public"]["Tables"]["work_hubs"]["Insert"]) => {
      const { data, error } = await supabase
        .from('work_hubs')
        .insert(hub)
        .select()
        .single();

      if (error) {
        console.error('Error creating work hub:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-hubs'] });
      toast.success('Work hub created successfully');
    },
    onError: (error) => {
      console.error('Failed to create work hub:', error);
      toast.error('Failed to create work hub');
    },
  });
}

// Hook to get provider preferences summary for AI
export function useProviderPreferencesSummary() {
  return useQuery({
    queryKey: ['provider-preferences-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('provider_preferences')
        .select(`
          *,
          course_providers (
            id,
            name,
            city,
            country
          ),
          courses (
            id,
            title
          )
        `)
        .order('course_id', { ascending: true })
        .order('priority_rank', { ascending: true });

      if (error) {
        console.error('Error fetching provider preferences summary:', error);
        throw error;
      }

      // Group by course for easy AI consumption
      const grouped = data?.reduce((acc, pref) => {
        const courseId = pref.course_id;
        if (!acc[courseId]) {
          acc[courseId] = {
            course: pref.courses,
            providers: []
          };
        }
        acc[courseId].providers.push({
          ...pref,
          provider: pref.course_providers
        });
        return acc;
      }, {} as Record<string, any>);

      return grouped || {};
    },
  });
}