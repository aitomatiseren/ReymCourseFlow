import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type WorkHub = Database["public"]["Tables"]["work_hubs"]["Row"];
type WorkHubInsert = Database["public"]["Tables"]["work_hubs"]["Insert"];
type WorkHubUpdate = Database["public"]["Tables"]["work_hubs"]["Update"];

export function useWorkHubs() {
  return useQuery({
    queryKey: ['work-hubs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_hubs')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as WorkHub[];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useWorkHub(hubId: string) {
  return useQuery({
    queryKey: ['work-hub', hubId],
    queryFn: async () => {
      if (!hubId) return null;

      const { data, error } = await supabase
        .from('work_hubs')
        .select('*')
        .eq('id', hubId)
        .single();

      if (error) throw error;
      return data as WorkHub;
    },
    enabled: !!hubId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useWorkHubMutations() {
  const queryClient = useQueryClient();

  const createWorkHub = useMutation({
    mutationFn: async (hubData: WorkHubInsert) => {
      const { data, error } = await supabase
        .from('work_hubs')
        .insert(hubData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-hubs'] });
    }
  });

  const updateWorkHub = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: WorkHubUpdate }) => {
      const { data, error } = await supabase
        .from('work_hubs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['work-hubs'] });
      queryClient.invalidateQueries({ queryKey: ['work-hub', data.id] });
    }
  });

  const deleteWorkHub = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('work_hubs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-hubs'] });
    }
  });

  return {
    createWorkHub,
    updateWorkHub,
    deleteWorkHub
  };
}