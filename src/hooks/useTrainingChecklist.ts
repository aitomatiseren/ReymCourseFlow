import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export function useTrainingChecklist(trainingId: string, initialChecklist: ChecklistItem[] = []) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklist);
  const queryClient = useQueryClient();

  const updateChecklistMutation = useMutation({
    mutationFn: async (newChecklist: ChecklistItem[]) => {
      const { data, error } = await supabase
        .from('trainings')
        .update({ checklist: newChecklist })
        .eq('id', trainingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch training data
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      queryClient.invalidateQueries({ queryKey: ['training', trainingId] });
    }
  });

  const updateChecklistItem = async (itemId: string, completed: boolean) => {
    const newChecklist = checklist.map(item =>
      item.id === itemId ? { ...item, completed } : item
    );
    setChecklist(newChecklist);
    
    try {
      await updateChecklistMutation.mutateAsync(newChecklist);
    } catch (error) {
      // Revert on error
      setChecklist(checklist);
      throw error;
    }
  };

  const addChecklistItem = async (text: string) => {
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text,
      completed: false
    };
    const newChecklist = [...checklist, newItem];
    setChecklist(newChecklist);
    
    try {
      await updateChecklistMutation.mutateAsync(newChecklist);
    } catch (error) {
      // Revert on error
      setChecklist(checklist);
      throw error;
    }
  };

  const removeChecklistItem = async (itemId: string) => {
    const newChecklist = checklist.filter(item => item.id !== itemId);
    setChecklist(newChecklist);
    
    try {
      await updateChecklistMutation.mutateAsync(newChecklist);
    } catch (error) {
      // Revert on error
      setChecklist(checklist);
      throw error;
    }
  };

  const updateChecklistItemText = async (itemId: string, text: string) => {
    const newChecklist = checklist.map(item =>
      item.id === itemId ? { ...item, text } : item
    );
    setChecklist(newChecklist);
    
    try {
      await updateChecklistMutation.mutateAsync(newChecklist);
    } catch (error) {
      // Revert on error
      setChecklist(checklist);
      throw error;
    }
  };

  return {
    checklist,
    updateChecklistItem,
    addChecklistItem,
    removeChecklistItem,
    updateChecklistItemText,
    isUpdating: updateChecklistMutation.isPending
  };
}