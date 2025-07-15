import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type License = Tables<'licenses'>;
type Course = Tables<'courses'>;
type CourseCertificate = Tables<'course_certificates'>;
type CourseCertificateInsert = TablesInsert<'course_certificates'>;
type CourseCertificateUpdate = TablesUpdate<'course_certificates'>;

export interface LicenseWithCourses extends License {
  course_certificates?: Array<CourseCertificate & {
    courses?: Course;
  }>;
}

export interface CourseWithCertificates extends Course {
  course_certificates?: Array<CourseCertificate & {
    licenses?: License;
  }>;
}

export interface CourseCertificateMapping {
  id?: string;
  course_id: string;
  license_id: string;
  grants_level: number;
  is_required: boolean;
  renewal_eligible: boolean;
  min_score_required?: number;
  credits_awarded?: number;
  notes?: string;
}

// Hook to fetch all license definitions with their linked courses
export const useLicenseDefinitions = () => {
  return useQuery({
    queryKey: ['license-definitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('licenses')
        .select(`
          *,
          course_certificates (
            *,
            courses (
              id,
              title,
              category,
              level,
              duration_hours,
              code95_points
            )
          )
        `)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data as LicenseWithCourses[];
    },
  });
};

// Hook to fetch all courses with their linked certificates
export const useCourseDefinitions = () => {
  return useQuery({
    queryKey: ['course-definitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          course_certificates (
            *,
            licenses (
              id,
              name,
              category,
              level,
              validity_period_months
            )
          )
        `)
        .order('category', { ascending: true })
        .order('title', { ascending: true });

      if (error) throw error;
      return data as CourseWithCertificates[];
    },
  });
};

// Hook to get courses available for a specific certificate
export const useCoursesForCertificate = (licenseId: string) => {
  return useQuery({
    queryKey: ['courses-for-certificate', licenseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_courses_for_certificate', {
          cert_license_id: licenseId
        });

      if (error) throw error;
      return data;
    },
    enabled: !!licenseId,
  });
};

// Hook to get certificates granted by a specific course
export const useCertificatesForCourse = (courseId: string) => {
  return useQuery({
    queryKey: ['certificates-for-course', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_certificates_for_course', {
          course_id_param: courseId
        });

      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });
};

// Hook to get all course-certificate mappings
export const useCourseCertificateMappings = () => {
  return useQuery({
    queryKey: ['course-certificate-mappings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_certificates')
        .select(`
          *,
          courses (
            id,
            title,
            category,
            level
          ),
          licenses (
            id,
            name,
            category,
            level
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

// Re-export for backwards compatibility and to centralize course-certificate hooks
export { useCertificatesForCourse as useCertificatesForCourseAlternative } from './useCertificates';

// Hook for managing course-certificate relationships
export const useCertificateDefinitionManagement = () => {
  const queryClient = useQueryClient();

  const createCourseCertificateMapping = useMutation({
    mutationFn: async (mapping: CourseCertificateMapping) => {
      const { data, error } = await supabase
        .from('course_certificates')
        .insert({
          course_id: mapping.course_id,
          license_id: mapping.license_id,
          grants_level: mapping.grants_level,
          is_required: mapping.is_required,
          renewal_eligible: mapping.renewal_eligible,
          min_score_required: mapping.min_score_required,
          credits_awarded: mapping.credits_awarded,
          notes: mapping.notes
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['license-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['course-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['course-certificate-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['courses-for-certificate'] });
      queryClient.invalidateQueries({ queryKey: ['certificates-for-course'] });
    },
  });

  const updateCourseCertificateMapping = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CourseCertificateMapping> }) => {
      const { data, error } = await supabase
        .from('course_certificates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['license-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['course-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['course-certificate-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['courses-for-certificate'] });
      queryClient.invalidateQueries({ queryKey: ['certificates-for-course'] });
    },
  });

  const deleteCourseCertificateMapping = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('course_certificates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['license-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['course-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['course-certificate-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['courses-for-certificate'] });
      queryClient.invalidateQueries({ queryKey: ['certificates-for-course'] });
    },
  });

  const updateLicenseDefinition = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<License> }) => {
      const { data, error } = await supabase
        .from('licenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['license-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['licenses'] });
    },
  });

  const createLicenseDefinition = useMutation({
    mutationFn: async (license: Omit<License, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('licenses')
        .insert(license)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['license-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['licenses'] });
    },
  });

  return {
    createCourseCertificateMapping,
    updateCourseCertificateMapping,
    deleteCourseCertificateMapping,
    updateLicenseDefinition,
    createLicenseDefinition,
  };
};

// Hook to check if a course can grant a specific certificate level
export const useCanCourseGrantCertificate = (courseId: string, licenseId: string, desiredLevel: number = 1) => {
  return useQuery({
    queryKey: ['can-course-grant-certificate', courseId, licenseId, desiredLevel],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('can_course_grant_certificate', {
          course_id_param: courseId,
          license_id_param: licenseId,
          desired_level: desiredLevel
        });

      if (error) throw error;
      return data;
    },
    enabled: !!courseId && !!licenseId,
  });
};

// Hook to get renewal courses for an employee
export const useRenewalCoursesForEmployee = (employeeId: string) => {
  return useQuery({
    queryKey: ['renewal-courses-for-employee', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_renewal_courses_for_employee', {
          employee_id_param: employeeId
        });

      if (error) throw error;
      return data;
    },
    enabled: !!employeeId,
  });
};

// Utility functions
export const getCertificateCategories = (licenses: License[]): string[] => {
  const categories = [...new Set(licenses.map(l => l.category).filter(Boolean))];
  return categories.sort();
};

export const getCourseCategories = (courses: Course[]): string[] => {
  const categories = [...new Set(courses.map(c => c.category).filter(Boolean))];
  return categories.sort();
};

export const getLevelColor = (level: number): string => {
  const colors = {
    1: 'bg-green-100 text-green-800',
    2: 'bg-blue-100 text-blue-800',
    3: 'bg-yellow-100 text-yellow-800',
    4: 'bg-orange-100 text-orange-800',
    5: 'bg-red-100 text-red-800'
  };
  return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

export const validateCourseCertificateMapping = (mapping: CourseCertificateMapping): string[] => {
  const errors: string[] = [];

  if (!mapping.course_id) errors.push('Course is required');
  if (!mapping.license_id) errors.push('Certificate is required');
  if (!mapping.grants_level || mapping.grants_level < 1 || mapping.grants_level > 5) {
    errors.push('Grants level must be between 1 and 5');
  }
  if (mapping.min_score_required && (mapping.min_score_required < 0 || mapping.min_score_required > 100)) {
    errors.push('Minimum score must be between 0 and 100');
  }
  if (mapping.credits_awarded && mapping.credits_awarded < 0) {
    errors.push('Credits awarded cannot be negative');
  }

  return errors;
};