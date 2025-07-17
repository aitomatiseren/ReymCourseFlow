import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/context/PermissionsContext';

// Types for employee self-service data
export interface EmployeeTrainingProgress {
  id: string;
  employee_id: string;
  training_id: string;
  status: 'pending' | 'enrolled' | 'in_progress' | 'completed' | 'cancelled';
  enrollment_date: string;
  completion_date?: string;
  completion_score?: number;
  notes?: string;
  code95_eligible: boolean;
  training_session_id: string;
  start_date: string;
  end_date: string;
  location?: string;
  instructor?: string;
  max_participants: number;
  current_participants: number;
  training_status: string;
  course_id: string;
  course_title: string;
  course_category: string;
  course_level: number;
  duration_hours: number;
  code95_points?: number;
  progress_percentage: number;
  grants_certificate: boolean;
}

export interface CertificateRenewalInfo {
  certificate_name: string;
  current_expiry_date: string;
  renewal_notice_date: string;
  renewal_window_start: string;
  is_renewable: boolean;
  days_until_expiry: number;
  renewal_status: 'current' | 'renewal_approaching' | 'renewal_due' | 'expired';
}

export interface RenewalCourseOption {
  license_name: string;
  course_id: string;
  course_title: string;
  course_category: string;
  duration_hours: number;
  code95_points?: number;
  grants_level: number;
  is_required: boolean;
  renewal_eligible: boolean;
  upcoming_training_id?: string;
  upcoming_start_date?: string;
  upcoming_location?: string;
  available_spots?: number;
}

export interface AvailableTraining {
  id: string;
  course_id: string;
  course_title: string;
  course_category: string;
  course_level: number;
  start_date: string;
  end_date: string;
  location?: string;
  instructor?: string;
  max_participants: number;
  current_participants: number;
  status: string;
  duration_hours: number;
  code95_points?: number;
  description?: string;
  available_spots: number;
  is_enrolled: boolean;
  enrollment_status?: string;
}

// Hook to get employee's own training progress
export const useEmployeeTrainingProgress = () => {
  const { userProfile } = usePermissions();
  
  return useQuery({
    queryKey: ['employee-training-progress', userProfile?.employee_id],
    queryFn: async () => {
      if (!userProfile?.employee_id) {
        throw new Error('No employee profile found');
      }

      const { data, error } = await supabase
        .from('employee_training_progress')
        .select('*')
        .eq('employee_id', userProfile.employee_id)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data as EmployeeTrainingProgress[];
    },
    enabled: !!userProfile?.employee_id
  });
};

// Hook to get employee's certificate renewal schedule
export const useEmployeeCertificateRenewals = () => {
  const { userProfile } = usePermissions();

  return useQuery({
    queryKey: ['employee-certificate-renewals', userProfile?.employee_id],
    queryFn: async () => {
      if (!userProfile?.employee_id) {
        throw new Error('No employee profile found');
      }

      const { data, error } = await supabase
        .rpc('get_employee_certificate_renewal_schedule', {
          target_employee_id: userProfile.employee_id
        });

      if (error) throw error;
      return data as CertificateRenewalInfo[];
    },
    enabled: !!userProfile?.employee_id
  });
};

// Hook to get available renewal courses for employee
export const useEmployeeRenewalCourses = () => {
  const { userProfile } = usePermissions();

  return useQuery({
    queryKey: ['employee-renewal-courses', userProfile?.employee_id],
    queryFn: async () => {
      if (!userProfile?.employee_id) {
        throw new Error('No employee profile found');
      }

      const { data, error } = await supabase
        .rpc('get_renewal_courses_for_employee', {
          target_employee_id: userProfile.employee_id
        });

      if (error) throw error;
      return data as RenewalCourseOption[];
    },
    enabled: !!userProfile?.employee_id
  });
};

// Hook to get available trainings for employee enrollment
export const useAvailableTrainings = () => {
  const { userProfile } = usePermissions();

  return useQuery({
    queryKey: ['available-trainings', userProfile?.employee_id],
    queryFn: async () => {
      if (!userProfile?.employee_id) {
        throw new Error('No employee profile found');
      }

      const { data, error } = await supabase
        .from('trainings')
        .select(`
          id,
          course_id,
          start_date,
          end_date,
          location,
          instructor,
          max_participants,
          current_participants,
          status,
          courses:courses(
            id,
            title,
            category,
            level,
            duration_hours,
            code95_points,
            description
          )
        `)
        .eq('status', 'scheduled')
        .gt('start_date', new Date().toISOString())
        .lt('current_participants', supabase.sql`max_participants`)
        .order('start_date', { ascending: true });

      if (error) throw error;

      // Get employee's current enrollments to mark which trainings they're already enrolled in
      const { data: enrollments } = await supabase
        .from('training_participants')
        .select('training_id, status')
        .eq('employee_id', userProfile.employee_id);

      const enrollmentMap = new Map(
        enrollments?.map(e => [e.training_id, e.status]) || []
      );

      const availableTrainings: AvailableTraining[] = data.map(training => ({
        id: training.id,
        course_id: training.course_id,
        course_title: training.courses?.title || 'Unknown Course',
        course_category: 'General',
        course_level: training.courses?.level || 1,
        start_date: training.start_date,
        end_date: training.end_date,
        location: training.location,
        instructor: training.instructor,
        max_participants: training.max_participants,
        current_participants: training.current_participants,
        status: training.status,
        duration_hours: training.courses?.duration_hours || 0,
        code95_points: training.courses?.code95_points,
        description: training.courses?.description,
        available_spots: training.max_participants - training.current_participants,
        is_enrolled: enrollmentMap.has(training.id),
        enrollment_status: enrollmentMap.get(training.id)
      }));

      return availableTrainings;
    },
    enabled: !!userProfile?.employee_id
  });
};

// Hook to get employee's own uploaded documents
export const useEmployeeDocuments = () => {
  const { userProfile } = usePermissions();

  return useQuery({
    queryKey: ['employee-documents', userProfile?.employee_id],
    queryFn: async () => {
      if (!userProfile?.employee_id) {
        throw new Error('No employee profile found');
      }

      const { data, error } = await supabase
        .from('certificate_documents')
        .select(`
          *,
          license:licenses(id, name, category),
          uploaded_by_employee:employees!certificate_documents_uploaded_by_fkey(id, name),
          verified_by_employee:employees!certificate_documents_verified_by_fkey(id, name)
        `)
        .eq('employee_id', userProfile.employee_id)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userProfile?.employee_id
  });
};

// Hook to get employee's own certificates
export const useEmployeeCertificates = () => {
  const { userProfile } = usePermissions();

  return useQuery({
    queryKey: ['employee-certificates', userProfile?.employee_id],
    queryFn: async () => {
      if (!userProfile?.employee_id) {
        throw new Error('No employee profile found');
      }

      const { data, error } = await supabase
        .from('employee_licenses')
        .select(`
          *,
          licenses(
            id,
            name,
            category,
            description,
            validity_period_months,
            renewal_notice_months,
            renewal_grace_period_months
          )
        `)
        .eq('employee_id', userProfile.employee_id)
        .order('expiry_date', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!userProfile?.employee_id
  });
};

// Hook for employee self-service actions
export const useEmployeeSelfServiceActions = () => {
  const queryClient = useQueryClient();
  const { userProfile } = usePermissions();

  // Request training enrollment
  const requestTrainingEnrollment = useMutation({
    mutationFn: async ({ 
      trainingId, 
      notes 
    }: { 
      trainingId: string; 
      notes?: string; 
    }) => {
      if (!userProfile?.employee_id) {
        throw new Error('No employee profile found');
      }

      const { data, error } = await supabase
        .from('training_participants')
        .insert({
          training_id: trainingId,
          employee_id: userProfile.employee_id,
          status: 'pending',
          enrollment_date: new Date().toISOString(),
          notes: notes
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['available-trainings'] });
      queryClient.invalidateQueries({ queryKey: ['employee-training-progress'] });
    }
  });

  // Cancel training enrollment (if still pending)
  const cancelTrainingEnrollment = useMutation({
    mutationFn: async (participationId: string) => {
      const { error } = await supabase
        .from('training_participants')
        .update({ status: 'cancelled' })
        .eq('id', participationId)
        .eq('employee_id', userProfile?.employee_id) // Ensure employee can only cancel their own enrollment
        .eq('status', 'pending'); // Can only cancel if still pending

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['available-trainings'] });
      queryClient.invalidateQueries({ queryKey: ['employee-training-progress'] });
    }
  });

  // Update own contact information
  const updateContactInfo = useMutation({
    mutationFn: async (updates: {
      email?: string;
      phone?: string;
      mobile_phone?: string;
      address?: string;
      city?: string;
      postal_code?: string;
      emergency_contact_name?: string;
      emergency_contact_phone?: string;
    }) => {
      if (!userProfile?.employee_id) {
        throw new Error('No employee profile found');
      }

      const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', userProfile.employee_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee-profile'] });
    }
  });

  // Upload certificate document
  const uploadCertificateDocument = useMutation({
    mutationFn: async ({ 
      file, 
      licenseId, 
      description 
    }: { 
      file: File; 
      licenseId?: string; 
      description?: string; 
    }) => {
      if (!userProfile?.employee_id) {
        throw new Error('No employee profile found');
      }

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `employee-certificates/${userProfile.employee_id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data, error } = await supabase
        .from('certificate_documents')
        .insert({
          employee_id: userProfile.employee_id,
          license_id: licenseId || null,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          processing_status: 'pending',
          uploaded_by: userProfile.employee_id,
          description: description
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-documents'] });
    }
  });

  return {
    requestTrainingEnrollment,
    cancelTrainingEnrollment,
    updateContactInfo,
    uploadCertificateDocument
  };
};

// Hook to get employee's training calendar
export const useEmployeeTrainingCalendar = () => {
  const { userProfile } = usePermissions();

  return useQuery({
    queryKey: ['employee-training-calendar', userProfile?.employee_id],
    queryFn: async () => {
      if (!userProfile?.employee_id) {
        throw new Error('No employee profile found');
      }

      const { data, error } = await supabase
        .from('training_participants')
        .select(`
          id,
          status,
          enrollment_date,
          completion_date,
          trainings:trainings(
            id,
            start_date,
            end_date,
            location,
            instructor,
            status,
            courses:courses(
              id,
              title,
              category,
              duration_hours
            )
          )
        `)
        .eq('employee_id', userProfile.employee_id)
        .in('status', ['enrolled', 'in_progress', 'completed'])
        .order('trainings(start_date)', { ascending: true });

      if (error) throw error;

      // Transform data for calendar display
      const calendarEvents = data
        .filter(tp => tp.trainings)
        .map(tp => ({
          id: tp.id,
          title: tp.trainings?.courses?.title || 'Training Session',
          start: tp.trainings?.start_date,
          end: tp.trainings?.end_date,
          location: tp.trainings?.location,
          instructor: tp.trainings?.instructor,
          status: tp.status,
          category: 'General',
          duration_hours: tp.trainings?.courses?.duration_hours,
          completion_date: tp.completion_date,
          training_status: tp.trainings?.status
        }));

      return calendarEvents;
    },
    enabled: !!userProfile?.employee_id
  });
};

// Hook to get employee dashboard statistics
export const useEmployeeDashboardStats = () => {
  const { userProfile } = usePermissions();

  return useQuery({
    queryKey: ['employee-dashboard-stats', userProfile?.employee_id],
    queryFn: async () => {
      if (!userProfile?.employee_id) {
        throw new Error('No employee profile found');
      }

      // Get various statistics in parallel
      const [
        trainingProgress,
        certificates,
        renewalSchedule,
        upcomingTrainings
      ] = await Promise.all([
        supabase
          .from('employee_training_progress')
          .select('status')
          .eq('employee_id', userProfile.employee_id),
        supabase
          .from('employee_licenses')
          .select('status, expiry_date')
          .eq('employee_id', userProfile.employee_id),
        supabase
          .rpc('get_employee_certificate_renewal_schedule', {
            target_employee_id: userProfile.employee_id
          }),
        supabase
          .from('training_participants')
          .select(`
            status,
            trainings:trainings(start_date, status)
          `)
          .eq('employee_id', userProfile.employee_id)
          .in('status', ['enrolled', 'in_progress'])
      ]);

      // Calculate statistics
      const totalTrainings = trainingProgress.data?.length || 0;
      const completedTrainings = trainingProgress.data?.filter(t => t.status === 'completed').length || 0;
      const inProgressTrainings = trainingProgress.data?.filter(t => t.status === 'in_progress').length || 0;
      
      const totalCertificates = certificates.data?.length || 0;
      const validCertificates = certificates.data?.filter(c => c.status === 'valid').length || 0;
      const expiringCertificates = renewalSchedule.data?.filter(r => r.renewal_status === 'renewal_due').length || 0;
      
      const upcomingTrainingCount = upcomingTrainings.data?.filter(t => 
        t.trainings?.start_date && new Date(t.trainings.start_date) > new Date()
      ).length || 0;

      return {
        training: {
          total: totalTrainings,
          completed: completedTrainings,
          inProgress: inProgressTrainings,
          completionRate: totalTrainings > 0 ? Math.round((completedTrainings / totalTrainings) * 100) : 0
        },
        certificates: {
          total: totalCertificates,
          valid: validCertificates,
          expiring: expiringCertificates
        },
        upcoming: {
          trainings: upcomingTrainingCount
        }
      };
    },
    enabled: !!userProfile?.employee_id
  });
};