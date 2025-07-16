import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type EmployeeAvailability = Database["public"]["Tables"]["employee_availability"]["Row"];
type EmployeeAvailabilityInsert = Database["public"]["Tables"]["employee_availability"]["Insert"];
type EmployeeAvailabilityUpdate = Database["public"]["Tables"]["employee_availability"]["Update"];

type EmployeeLearningProfile = Database["public"]["Tables"]["employee_learning_profiles"]["Row"];
type EmployeeLearningProfileInsert = Database["public"]["Tables"]["employee_learning_profiles"]["Insert"];
type EmployeeLearningProfileUpdate = Database["public"]["Tables"]["employee_learning_profiles"]["Update"];

type EmployeeWorkArrangement = Database["public"]["Tables"]["employee_work_arrangements"]["Row"];
type EmployeeWorkArrangementInsert = Database["public"]["Tables"]["employee_work_arrangements"]["Insert"];
type EmployeeWorkArrangementUpdate = Database["public"]["Tables"]["employee_work_arrangements"]["Update"];

// Hook to fetch employee availability for a specific employee
export function useEmployeeAvailability(employeeId?: string) {
  return useQuery({
    queryKey: ['employee-availability', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      
      const { data, error } = await supabase
        .from('employee_availability')
        .select(`
          *,
          employees (
            id,
            first_name,
            last_name,
            email,
            department
          )
        `)
        .eq('employee_id', employeeId)
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching employee availability:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!employeeId,
  });
}

// Hook to fetch all employee availability (for planning overview)
export function useAllEmployeeAvailability(filters?: {
  startDate?: string;
  endDate?: string;
  availabilityType?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['employee-availability-all', filters],
    queryFn: async () => {
      let query = supabase
        .from('employee_availability')
        .select(`
          *,
          employees (
            id,
            first_name,
            last_name,
            email,
            department,
            job_title
          )
        `);

      // Apply filters
      if (filters?.startDate) {
        query = query.gte('start_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('end_date', filters.endDate);
      }
      if (filters?.availabilityType) {
        query = query.eq('availability_type', filters.availabilityType);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching all employee availability:', error);
        throw error;
      }

      return data || [];
    },
  });
}

// Hook to create or update employee availability
export function useUpsertEmployeeAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (availability: EmployeeAvailabilityInsert) => {
      const { data, error } = await supabase
        .from('employee_availability')
        .upsert(availability)
        .select()
        .single();

      if (error) {
        console.error('Error upserting employee availability:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-availability'] });
      toast.success('Employee availability updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update employee availability:', error);
      toast.error('Failed to update employee availability');
    },
  });
}

// Hook to delete employee availability
export function useDeleteEmployeeAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('employee_availability')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting employee availability:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-availability'] });
      toast.success('Employee availability deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete employee availability:', error);
      toast.error('Failed to delete employee availability');
    },
  });
}

// Hook to fetch employee learning profiles
export function useEmployeeLearningProfile(employeeId?: string) {
  return useQuery({
    queryKey: ['employee-learning-profile', employeeId],
    queryFn: async () => {
      if (!employeeId) return null;
      
      const { data, error } = await supabase
        .from('employee_learning_profiles')
        .select(`
          *,
          employees (
            id,
            first_name,
            last_name,
            email,
            department
          )
        `)
        .eq('employee_id', employeeId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching employee learning profile:', error);
        throw error;
      }

      return data || null;
    },
    enabled: !!employeeId,
  });
}

// Hook to create or update employee learning profile
export function useUpsertEmployeeLearningProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: EmployeeLearningProfileInsert) => {
      const { data, error } = await supabase
        .from('employee_learning_profiles')
        .upsert(profile, {
          onConflict: 'employee_id',
        })
        .select()
        .single();

      if (error) {
        console.error('Error upserting employee learning profile:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-learning-profile'] });
      toast.success('Employee learning profile updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update employee learning profile:', error);
      toast.error('Failed to update employee learning profile');
    },
  });
}

// Hook to fetch employee work arrangements
export function useEmployeeWorkArrangement(employeeId?: string) {
  return useQuery({
    queryKey: ['employee-work-arrangement', employeeId],
    queryFn: async () => {
      if (!employeeId) return null;
      
      const { data, error } = await supabase
        .from('employee_work_arrangements')
        .select(`
          *,
          employees (
            id,
            first_name,
            last_name,
            email,
            department
          )
        `)
        .eq('employee_id', employeeId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching employee work arrangement:', error);
        throw error;
      }

      return data || null;
    },
    enabled: !!employeeId,
  });
}

// Hook to create or update employee work arrangement
export function useUpsertEmployeeWorkArrangement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (arrangement: EmployeeWorkArrangementInsert) => {
      const { data, error } = await supabase
        .from('employee_work_arrangements')
        .upsert(arrangement, {
          onConflict: 'employee_id',
        })
        .select()
        .single();

      if (error) {
        console.error('Error upserting employee work arrangement:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-work-arrangement'] });
      toast.success('Employee work arrangement updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update employee work arrangement:', error);
      toast.error('Failed to update employee work arrangement');
    },
  });
}

// Hook to check if employee is available for a specific date range
export function useCheckEmployeeAvailability() {
  return useMutation({
    mutationFn: async ({ 
      employeeId, 
      startDate, 
      endDate 
    }: {
      employeeId: string;
      startDate: string;
      endDate: string;
    }) => {
      const { data, error } = await supabase
        .from('employee_availability')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('status', 'active')
        .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)
        .or(`end_date.is.null,end_date.gte.${startDate}`);

      if (error) {
        console.error('Error checking employee availability:', error);
        throw error;
      }

      // Return availability conflicts
      return {
        isAvailable: data.length === 0,
        conflicts: data || [],
      };
    },
  });
}

// Hook to get employee availability summary for AI
export function useEmployeeAvailabilitySummary() {
  return useQuery({
    queryKey: ['employee-availability-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_availability')
        .select(`
          *,
          employees (
            id,
            first_name,
            last_name,
            email,
            department,
            job_title
          )
        `)
        .eq('status', 'active')
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching employee availability summary:', error);
        throw error;
      }

      // Group by employee for easy AI consumption
      const grouped = data?.reduce((acc, availability) => {
        const employeeId = availability.employee_id;
        if (!acc[employeeId]) {
          acc[employeeId] = {
            employee: availability.employees,
            availabilities: []
          };
        }
        acc[employeeId].availabilities.push(availability);
        return acc;
      }, {} as Record<string, any>);

      return grouped || {};
    },
  });
}

// Hook to get comprehensive employee data for AI (availability + learning + work arrangement)
export function useEmployeeComprehensiveData() {
  return useQuery({
    queryKey: ['employee-comprehensive-data'],
    queryFn: async () => {
      // Get all employees with their comprehensive data
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select(`
          *,
          employee_availability!inner (
            id,
            availability_type,
            status,
            start_date,
            end_date,
            reason,
            impact_level,
            notes
          ),
          employee_learning_profiles (
            id,
            learning_style,
            language_preference,
            special_accommodations,
            performance_level,
            previous_training_success_rate,
            preferred_training_times,
            training_capacity_per_month,
            notes
          ),
          employee_work_arrangements (
            id,
            primary_work_location,
            work_schedule,
            contract_type,
            notice_period_days,
            travel_restrictions,
            mobility_limitations,
            remote_work_percentage
          )
        `)
        .eq('employee_availability.status', 'active');

      if (employeesError) {
        console.error('Error fetching comprehensive employee data:', employeesError);
        throw employeesError;
      }

      return employees || [];
    },
  });
}