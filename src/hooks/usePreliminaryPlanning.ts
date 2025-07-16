import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Types for preliminary planning
export interface PreliminaryPlan {
  id: string;
  name: string;
  description?: string;
  planning_period_start: string;
  planning_period_end: string;
  status: 'draft' | 'review' | 'approved' | 'finalized' | 'archived';
  version: number;
  parent_plan_id?: string;
  created_by: string;
  approved_by?: string;
  approved_at?: string;
  finalized_at?: string;
  notes?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PreliminaryPlanGroup {
  id: string;
  plan_id: string;
  name: string;
  description?: string;
  certificate_id?: string;
  group_type: 'new' | 'renewal' | 'mixed';
  location?: string;
  provider_id?: string;
  priority: number;
  max_participants?: number;
  target_completion_date?: string;
  planned_start_date?: string;
  planned_end_date?: string;
  estimated_cost?: number;
  provider_recommendation?: string;
  sessions_required?: number;
  notes?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  licenses?: {
    id: string;
    name: string;
    category: string;
  };
}

export interface PreliminaryPlanGroupEmployee {
  id: string;
  group_id: string;
  employee_id: string;
  employee_type: 'new' | 'renewal';
  current_certificate_id?: string;
  certificate_expiry_date?: string;
  priority_score: number;
  notes?: string;
  added_at: string;
  employees?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    department?: string;
    job_title?: string;
  };
}

export interface PreliminaryPlanTraining {
  id: string;
  plan_id: string;
  group_id?: string;
  course_id?: string;
  provider_id?: string;
  title: string;
  proposed_date?: string;
  proposed_time?: string;
  proposed_location?: string;
  estimated_participants?: number;
  max_participants?: number;
  estimated_cost?: number;
  cost_breakdown: Array<Record<string, unknown>>;
  status: 'proposed' | 'confirmed' | 'cancelled' | 'converted';
  converted_training_id?: string;
  priority: number;
  notes?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CertificateExpiryAnalysis {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  department?: string;
  job_title?: string;
  work_location?: string;
  employee_license_id?: string;
  license_id: string;
  expiry_date?: string;
  license_status?: string;
  license_name: string;
  license_category: string;
  renewal_notice_months?: number;
  renewal_grace_period_months?: number;
  employee_status: 'new' | 'expired' | 'renewal_due' | 'renewal_approaching' | 'valid' | 'expiring_during_period';
  days_until_expiry?: number;
  renewal_window_start?: string;
  // Additional fields from the time-aware function
  days_until_expiry_from_period_start?: number;
  expires_during_period?: boolean;
  needs_renewal_during_period?: boolean;
}

// Hook for fetching all preliminary plans
export function usePreliminaryPlans() {
  return useQuery({
    queryKey: ['preliminary-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('preliminary_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PreliminaryPlan[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook for fetching a specific preliminary plan with details
export function usePreliminaryPlan(planId: string) {
  return useQuery({
    queryKey: ['preliminary-plan', planId],
    queryFn: async () => {
      if (!planId) return null;

      const { data, error } = await supabase
        .from('preliminary_plans')
        .select(`
          *,
          preliminary_plan_groups (
            *,
            licenses (
              id,
              name,
              category
            )
          ),
          preliminary_plan_trainings (*)
        `)
        .eq('id', planId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!planId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook for certificate expiry analysis
export function useCertificateExpiryAnalysis(filters?: {
  license_id?: string;
  department?: string;
  employee_status?: string;
  days_until_expiry_max?: number;
  preliminary_plan_id?: string;
}) {
  return useQuery({
    queryKey: ['certificate-expiry-analysis', filters],
    queryFn: async () => {
      // If a preliminary plan is selected, use the time-aware function for contextual filtering
      if (filters?.preliminary_plan_id && filters.preliminary_plan_id !== 'all') {
        const { data: planData, error: planError } = await supabase
          .from('preliminary_plans')
          .select('planning_period_start, planning_period_end')
          .eq('id', filters.preliminary_plan_id)
          .single();

        if (planError) throw planError;
        if (!planData) throw new Error('Plan not found');

        const { data, error } = await supabase
          .rpc('get_certificate_expiry_analysis_for_period', {
            planning_start_date: planData.planning_period_start,
            planning_end_date: planData.planning_period_end,
            filter_license_id: filters.license_id || null,
            department_filter: filters.department || null
          });

        if (error) throw error;

        // Apply additional filters
        let filteredData = data || [];
        
        if (filters?.employee_status) {
          filteredData = filteredData.filter(emp => emp.employee_status === filters.employee_status);
        }
        
        if (filters?.days_until_expiry_max) {
          filteredData = filteredData.filter(emp => 
            emp.days_until_expiry !== null && emp.days_until_expiry <= filters.days_until_expiry_max!
          );
        }

        return filteredData as CertificateExpiryAnalysis[];
      }

      // Default query when no plan is selected
      let query = supabase
        .from('certificate_expiry_analysis')
        .select('*');

      // IMPORTANT: For certificate expiry planning, include employees with certificates that are expiring AND new employees who need training
      // Exclude only "valid" status (not expiring soon) to keep new employees, expired, renewal_due, and renewal_approaching
      if (filters?.employee_status) {
        query = query.eq('employee_status', filters.employee_status);
      } else {
        // Default: include new employees and expiring certificates (exclude only valid long-term certificates)
        query = query.in('employee_status', ['new', 'expired', 'renewal_due', 'renewal_approaching']);
      }

      // Apply other filters
      if (filters?.license_id) {
        query = query.eq('license_id', filters.license_id);
      }
      if (filters?.department) {
        query = query.eq('department', filters.department);
      }
      if (filters?.days_until_expiry_max) {
        query = query.lte('days_until_expiry', filters.days_until_expiry_max);
      }

      const { data, error } = await query.order('days_until_expiry', { ascending: true });

      if (error) throw error;

      // Deduplicate by employee_id, keeping the first occurrence
      const uniqueEmployees = data.reduce((acc, current) => {
        if (!acc.some(item => item.employee_id === current.employee_id)) {
          acc.push(current);
        }
        return acc;
      }, [] as CertificateExpiryAnalysis[]);

      return uniqueEmployees as CertificateExpiryAnalysis[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes (more frequent updates for expiry data)
    onError: (error) => {
      console.error("Error in useCertificateExpiryAnalysis:", error);
    },
  });
}

// Hook for fetching groups in a preliminary plan
export function usePreliminaryPlanGroups(planId: string) {
  return useQuery({
    queryKey: ['preliminary-plan-groups', planId],
    queryFn: async () => {
      if (!planId) return [];

      const { data, error } = await supabase
        .from('preliminary_plan_groups')
        .select(`
          *,
          licenses (
            id,
            name,
            category
          ),
          preliminary_plan_group_employees (
            *,
            employees (
              id,
              first_name,
              last_name,
              email,
              department,
              job_title
            )
          )
        `)
        .eq('plan_id', planId)
        .order('priority', { ascending: false });

      if (error) throw error;
      return data as (PreliminaryPlanGroup & {
        preliminary_plan_group_employees: (PreliminaryPlanGroupEmployee & {
          employees: {
            id: string;
            first_name: string;
            last_name: string;
            email: string;
            department?: string;
            job_title?: string;
          };
        })[];
      })[];
    },
    enabled: !!planId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook for mutations
export function usePreliminaryPlanningMutations() {
  const queryClient = useQueryClient();

  const createPreliminaryPlan = useMutation({
    mutationFn: async (planData: Partial<PreliminaryPlan>) => {
      const { data, error } = await supabase
        .from('preliminary_plans')
        .insert(planData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preliminary-plans'] });
    }
  });

  const updatePreliminaryPlan = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PreliminaryPlan> }) => {
      const { data, error } = await supabase
        .from('preliminary_plans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['preliminary-plans'] });
      queryClient.invalidateQueries({ queryKey: ['preliminary-plan', data.id] });
    }
  });

  const createPreliminaryPlanGroup = useMutation({
    mutationFn: async (groupData: Partial<PreliminaryPlanGroup>) => {
      const { data, error } = await supabase
        .from('preliminary_plan_groups')
        .insert(groupData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['preliminary-plan-groups', data.plan_id] });
      queryClient.invalidateQueries({ queryKey: ['preliminary-plan', data.plan_id] });
    }
  });

  const addEmployeeToGroup = useMutation({
    mutationFn: async (employeeData: Partial<PreliminaryPlanGroupEmployee>) => {
      // Calculate priority score using the database function
      const priorityScore = employeeData.employee_id && employeeData.certificate_expiry_date
        ? await calculateEmployeePriorityScore(
            employeeData.employee_id,
            employeeData.current_certificate_id || '',
            employeeData.certificate_expiry_date
          )
        : 0;

      const dataToInsert = {
        ...employeeData,
        priority_score: priorityScore
      };

      const { data, error } = await supabase
        .from('preliminary_plan_group_employees')
        .insert(dataToInsert)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['preliminary-plan-groups'] });
    }
  });

  const removeEmployeeFromGroup = useMutation({
    mutationFn: async ({ groupId, employeeId }: { groupId: string; employeeId: string }) => {
      const { error } = await supabase
        .from('preliminary_plan_group_employees')
        .delete()
        .eq('group_id', groupId)
        .eq('employee_id', employeeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preliminary-plan-groups'] });
    }
  });

  const createPreliminaryTraining = useMutation({
    mutationFn: async (trainingData: Partial<PreliminaryPlanTraining>) => {
      const { data, error } = await supabase
        .from('preliminary_plan_trainings')
        .insert(trainingData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['preliminary-plan', data.plan_id] });
    }
  });

  const convertPlanToDefinitive = useMutation({
    mutationFn: async ({ planId, convertOptions }: { 
      planId: string; 
      convertOptions?: {
        skipEmptyGroups?: boolean;
        autoSchedule?: boolean;
      } 
    }) => {
      // First, update the plan status to finalized
      const { data: plan, error: planError } = await supabase
        .from('preliminary_plans')
        .update({ 
          status: 'finalized',
          finalized_at: new Date().toISOString()
        })
        .eq('id', planId)
        .select()
        .single();

      if (planError) throw planError;

      // Get all preliminary trainings for this plan
      const { data: preliminaryTrainings, error: trainingsError } = await supabase
        .from('preliminary_plan_trainings')
        .select(`
          *,
          preliminary_plan_groups (
            *,
            preliminary_plan_group_employees (
              employee_id
            )
          )
        `)
        .eq('plan_id', planId)
        .eq('status', 'proposed');

      if (trainingsError) throw trainingsError;

      // Convert each preliminary training to a definitive training
      const createdTrainings = [];
      for (const prelimTraining of preliminaryTrainings) {
        if (convertOptions?.skipEmptyGroups && 
            prelimTraining.preliminary_plan_groups?.preliminary_plan_group_employees?.length === 0) {
          continue;
        }

        // Create the actual training
        const { data: newTraining, error: trainingError } = await supabase
          .from('trainings')
          .insert({
            course_id: prelimTraining.course_id,
            provider_id: prelimTraining.provider_id,
            title: prelimTraining.title,
            start_date: prelimTraining.proposed_date,
            start_time: prelimTraining.proposed_time,
            location: prelimTraining.proposed_location,
            max_participants: prelimTraining.max_participants,
            cost_per_participant: prelimTraining.estimated_cost,
            cost_breakdown: prelimTraining.cost_breakdown,
            notes: `Converted from preliminary plan: ${plan.name}\n${prelimTraining.notes || ''}`
          })
          .select()
          .single();

        if (trainingError) throw trainingError;

        // Add participants from the group
        if (prelimTraining.group_id && prelimTraining.preliminary_plan_groups?.preliminary_plan_group_employees) {
          const participantInserts = prelimTraining.preliminary_plan_groups.preliminary_plan_group_employees.map(emp => ({
            training_id: newTraining.id,
            employee_id: emp.employee_id,
            status: 'enrolled',
            registration_date: new Date().toISOString()
          }));

          const { error: participantsError } = await supabase
            .from('training_participants')
            .insert(participantInserts);

          if (participantsError) throw participantsError;
        }

        // Update the preliminary training to mark it as converted
        await supabase
          .from('preliminary_plan_trainings')
          .update({ 
            status: 'converted',
            converted_training_id: newTraining.id
          })
          .eq('id', prelimTraining.id);

        createdTrainings.push(newTraining);
      }

      return { plan, createdTrainings };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['preliminary-plans'] });
      queryClient.invalidateQueries({ queryKey: ['preliminary-plan', data.plan.id] });
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
    }
  });

  return {
    createPreliminaryPlan,
    updatePreliminaryPlan,
    createPreliminaryPlanGroup,
    addEmployeeToGroup,
    removeEmployeeFromGroup,
    createPreliminaryTraining,
    convertPlanToDefinitive
  };
}

// Helper function to calculate employee priority score
async function calculateEmployeePriorityScore(
  employeeId: string,
  licenseId: string,
  expiryDate?: string
): Promise<number> {
  try {
    const { data, error } = await supabase
      .rpc('calculate_employee_priority_score', {
        employee_id: employeeId,
        license_id: licenseId,
        expiry_date: expiryDate
      });

    if (error) {
      console.error('Error calculating priority score:', error);
      return 50; // Default score
    }

    return data || 50;
  } catch (error) {
    console.error('Error calling priority score function:', error);
    return 50;
  }
}

// Hook for intelligent employee grouping suggestions with existing training consideration
export function useEmployeeGroupingSuggestions(
  licenseId: string,
  maxGroupSize: number = 15,
  timeWindowDays: number = 90
) {
  return useQuery({
    queryKey: ['employee-grouping-suggestions', licenseId, maxGroupSize, timeWindowDays],
    queryFn: async () => {
      if (!licenseId) return [];

      try {
        // Get certificate expiry analysis for the specific license
        const { data: expiryData, error } = await supabase
          .from('certificate_expiry_analysis')
          .select('*')
          .eq('license_id', licenseId)
          .in('employee_status', ['new', 'renewal_due', 'renewal_approaching'])
          .order('days_until_expiry', { ascending: true });

        if (error) {
          console.error("Error fetching employee grouping suggestions:", error);
          throw error;
        }

        // Get existing trainings with available capacity for the same license/certificate
        const { data: existingTrainings, error: trainingsError } = await supabase
          .from('trainings')
          .select(`
            id,
            title,
            date,
            time,
            location,
            max_participants,
            status,
            course_id,
            courses (
              id,
              title,
              course_certificates (
                license_id,
                licenses (
                  id,
                  name
                )
              )
            )
          `)
          .eq('status', 'scheduled')
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true });

        if (trainingsError) {
          console.error("Error fetching existing trainings:", trainingsError);
          throw trainingsError;
        }

        // Get current participant counts
        const { data: participantCounts, error: participantError } = await supabase
          .from('training_participants')
          .select('training_id')
          .in('status', ['enrolled', 'attended']);

        if (participantError) {
          console.error("Error fetching participant counts:", participantError);
          throw participantError;
        }

        // Calculate available capacity for each training
        const participantCountsMap = participantCounts.reduce((acc, participant) => {
          acc[participant.training_id] = (acc[participant.training_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Filter trainings that have capacity and are relevant to the license
        const relevantTrainings = existingTrainings?.filter(training => {
          const currentParticipants = participantCountsMap[training.id] || 0;
          const hasCapacity = currentParticipants < training.max_participants;
          
          // Check if the training course is relevant to the license
          const courseRelevant = training.courses?.course_certificates?.some(cc => 
            cc.license_id === licenseId
          );
          
          return hasCapacity && courseRelevant;
        }) || [];

        // Group employees by location and expiry timeframe, considering existing trainings
        const suggestions = groupEmployeesIntelligently(
          expiryData, 
          maxGroupSize, 
          timeWindowDays, 
          relevantTrainings,
          participantCountsMap
        );
        
        return suggestions;
      } catch (err) {
        console.error("Caught error in useEmployeeGroupingSuggestions queryFn:", err);
        throw err;
      }
    },
    enabled: !!licenseId && licenseId !== 'all',
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Helper function for intelligent employee grouping
function groupEmployeesIntelligently(
  employees: CertificateExpiryAnalysis[],
  maxGroupSize: number,
  timeWindowDays: number,
  existingTrainings: any[] = [],
  participantCountsMap: Record<string, number> = {}
) {
  const groups: {
    id: string;
    name: string;
    employees: CertificateExpiryAnalysis[];
    averageDaysUntilExpiry: number;
    department?: string;
    priority: number;
    existingTraining?: {
      id: string;
      title: string;
      date: string;
      time: string;
      location: string;
      availableSpots: number;
      maxParticipants: number;
    };
  }[] = [];

  // Sort employees by department and expiry urgency
  const sortedEmployees = employees.sort((a, b) => {
    // First by department
    const deptA = a.department || 'Unknown';
    const deptB = b.department || 'Unknown';
    if (deptA !== deptB) return deptA.localeCompare(deptB);
    
    // Then by days until expiry (more urgent first)
    const daysA = a.days_until_expiry || 999;
    const daysB = b.days_until_expiry || 999;
    return daysA - daysB;
  });

  // Group by department first
  const departmentGroups = sortedEmployees.reduce((acc, emp) => {
    const dept = emp.department || 'Unknown';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(emp);
    return acc;
  }, {} as Record<string, CertificateExpiryAnalysis[]>);

  // First, try to assign employees to existing trainings with available capacity
  const remainingEmployees = [...employees];
  
  for (const training of existingTrainings) {
    const currentParticipants = participantCountsMap[training.id] || 0;
    const availableSpots = training.max_participants - currentParticipants;
    
    if (availableSpots > 0) {
      // Find employees that could fit in this training (considering timing and location)
      const suitableEmployees = remainingEmployees.filter(emp => {
        const daysUntilExpiry = emp.days_until_expiry || 999;
        const trainingDate = new Date(training.date);
        const employeeExpiryDate = emp.expiry_date ? new Date(emp.expiry_date) : null;
        
        // Check if training date is before expiry date (with some buffer)
        if (employeeExpiryDate) {
          const bufferDays = 30; // Training should be at least 30 days before expiry
          const latestTrainingDate = new Date(employeeExpiryDate);
          latestTrainingDate.setDate(latestTrainingDate.getDate() - bufferDays);
          
          if (trainingDate > latestTrainingDate) {
            return false;
          }
        }
        
        return daysUntilExpiry >= 0; // Not already expired
      });
      
      if (suitableEmployees.length > 0) {
        // Take up to available spots, prioritizing most urgent
        const employeesToAssign = suitableEmployees
          .sort((a, b) => (a.days_until_expiry || 999) - (b.days_until_expiry || 999))
          .slice(0, availableSpots);
        
        if (employeesToAssign.length > 0) {
          groups.push({
            id: `existing-${training.id}`,
            name: `Add to: ${training.title}`,
            employees: employeesToAssign,
            averageDaysUntilExpiry: Math.round(
              employeesToAssign.reduce((sum, emp) => sum + (emp.days_until_expiry || 999), 0) / employeesToAssign.length
            ),
            department: employeesToAssign[0].department,
            priority: 100, // Highest priority for existing trainings
            existingTraining: {
              id: training.id,
              title: training.title,
              date: training.date,
              time: training.time,
              location: training.location,
              availableSpots,
              maxParticipants: training.max_participants
            }
          });
          
          // Remove assigned employees from remaining employees
          employeesToAssign.forEach(emp => {
            const index = remainingEmployees.findIndex(e => e.employee_id === emp.employee_id);
            if (index > -1) {
              remainingEmployees.splice(index, 1);
            }
          });
        }
      }
    }
  }

  // Create new groups for remaining employees
  const remainingDepartmentGroups = remainingEmployees.reduce((acc, emp) => {
    const dept = emp.department || 'Unknown';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(emp);
    return acc;
  }, {} as Record<string, CertificateExpiryAnalysis[]>);

  // Create optimal groups within each department
  Object.entries(remainingDepartmentGroups).forEach(([department, deptEmployees]) => {
    let currentGroup: CertificateExpiryAnalysis[] = [];
    
    for (let i = 0; i < deptEmployees.length; i++) {
      const employee = deptEmployees[i];
      
      // Check if adding this employee would exceed the time window
      if (currentGroup.length > 0 && wouldExceedTimeWindow(currentGroup, employee, timeWindowDays)) {
        // Finalize current group if it has at least 3 employees
        if (currentGroup.length >= 3) {
          groups.push(createGroupFromEmployees(currentGroup, department));
          currentGroup = [employee];
        } else {
          // Add to current group anyway if it's too small
          currentGroup.push(employee);
        }
      } else {
        currentGroup.push(employee);
      }
      
      // Finalize group if it reaches max size or we're at the end
      if (currentGroup.length >= maxGroupSize || i === deptEmployees.length - 1) {
        if (currentGroup.length > 0) {
          groups.push(createGroupFromEmployees(currentGroup, department));
          currentGroup = [];
        }
      }
    }
  });

  return groups.sort((a, b) => b.priority - a.priority);
}

function wouldExceedTimeWindow(
  currentGroup: CertificateExpiryAnalysis[], 
  newEmployee: CertificateExpiryAnalysis, 
  timeWindowDays: number
): boolean {
  if (currentGroup.length === 0) return false;
  
  const allEmployees = [...currentGroup, newEmployee];
  const days = allEmployees.map(emp => emp.days_until_expiry || 999).sort((a, b) => a - b);
  const range = days[days.length - 1] - days[0];
  
  return range > timeWindowDays;
}

function createGroupFromEmployees(employees: CertificateExpiryAnalysis[], department: string) {
  const avgDays = employees.reduce((sum, emp) => sum + (emp.days_until_expiry || 999), 0) / employees.length;
  const hasUrgent = employees.some(emp => (emp.days_until_expiry || 999) <= 30);
  const hasNewEmployees = employees.some(emp => emp.employee_status === 'new');
  const hasExpired = employees.some(emp => emp.employee_status === 'expired');
  
  let priority = 50;
  if (hasExpired) priority += 40;
  if (hasUrgent) priority += 30;
  if (hasNewEmployees) priority += 20;
  if (avgDays <= 60) priority += 25;

  // Create more descriptive group names
  let groupType = 'Training';
  if (hasExpired) groupType = 'Urgent Expired';
  else if (hasUrgent) groupType = 'Urgent Renewal';
  else if (hasNewEmployees) groupType = 'New Employee';
  else groupType = 'Renewal';

  return {
    id: `suggested-${Date.now()}-${Math.random()}`,
    name: `${department} - ${groupType} Group (${employees.length} employees)`,
    employees,
    averageDaysUntilExpiry: Math.round(avgDays),
    department,
    priority
  };
}