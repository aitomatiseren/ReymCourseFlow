
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

export interface Certificate {
  id: string;
  employeeId: string;
  employeeName: string;
  licenseName: string;
  certificateNumber: string;
  issueDate: string;
  expiryDate: string;
  status: 'valid' | 'expiring' | 'expired';
}

// Hook to fetch license definitions
export function useLicenses() {
  return useQuery({
    queryKey: ['licenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('licenses')
        .select(`
          id,
          name,
          description,
          validity_period_months,
          renewal_notice_months,
          level,
          level_description,
          is_base_level,
          supersedes_license_id,
          created_at
        `)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Tables<'licenses'>[];
    }
  });
}

// Hook to fetch course-certificate mappings
export function useCourseCertificateMappings() {
  return useQuery({
    queryKey: ['course-certificate-mappings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_certificates')
        .select(`
          id,
          course_id,
          license_id,
          directly_grants,
          is_required,
          renewal_eligible,
          courses:courses(id, title),
          licenses:licenses(id, name)
        `)
        .order('course_id');

      if (error) throw error;
      return data;
    }
  });
}

// Hook to fetch certificates for a specific course
export function useCertificatesForCourse(courseId: string) {
  return useQuery({
    queryKey: ['course-certificates', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_certificates')
        .select(`
          id,
          directly_grants,
          is_required,
          renewal_eligible,
          licenses:licenses(id, name, description, validity_period_months)
        `)
        .eq('course_id', courseId);

      if (error) throw error;
      return data;
    },
    enabled: !!courseId
  });
}

// Hook to fetch courses that grant a specific certificate
export function useCoursesForCertificate(licenseId: string) {
  return useQuery({
    queryKey: ['certificate-courses', licenseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_certificates')
        .select(`
          id,
          directly_grants,
          is_required,
          renewal_eligible,
          courses:courses(id, title, duration_hours)
        `)
        .eq('license_id', licenseId);

      if (error) throw error;
      return data;
    },
    enabled: !!licenseId
  });
}

export function useCertificates(enableRealTime = true) {
  const queryClient = useQueryClient();

  // Real-time subscriptions for certificate data
  useEffect(() => {
    if (!enableRealTime) return;

    // Subscribe to employee licenses changes (certificates)
    const certificatesChannel = supabase
      .channel('certificates-global')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'employee_licenses'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['certificates'] });
        queryClient.invalidateQueries({ queryKey: ['employee-licenses'] });
        queryClient.invalidateQueries({ queryKey: ['certificate-expiry'] });
      })
      .subscribe();

    // Subscribe to licenses table changes (license definitions)
    const licensesChannel = supabase
      .channel('licenses-global')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'licenses'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['certificates'] });
        queryClient.invalidateQueries({ queryKey: ['licenses'] });
      })
      .subscribe();

    // Subscribe to course_certificates table changes
    const courseCertificatesChannel = supabase
      .channel('course-certificates-global')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'course_certificates'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['course-certificate-mappings'] });
        queryClient.invalidateQueries({ queryKey: ['course-certificates'] });
        queryClient.invalidateQueries({ queryKey: ['certificate-courses'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(certificatesChannel);
      supabase.removeChannel(licensesChannel);
      supabase.removeChannel(courseCertificatesChannel);
    };
  }, [enableRealTime, queryClient]);

  return useQuery({
    queryKey: ['certificates'],
    queryFn: async () => {
      console.log('Fetching certificates from database...');
      
      const { data, error } = await supabase
        .from('employee_licenses')
        .select(`
          id,
          certificate_number,
          issue_date,
          expiry_date,
          status,
          employees (
            id,
            name,
            employee_number
          ),
          licenses (
            name
          )
        `)
        .order('expiry_date');
      
      if (error) {
        console.error('Error fetching certificates:', error);
        throw error;
      }
      
      console.log('Fetched certificates:', data);
      
      // Transform database data to match our Certificate interface
      const certificates: Certificate[] = data.map(cert => ({
        id: cert.id,
        employeeId: cert.employees?.id || '',
        employeeName: cert.employees?.name || 'Unknown',
        licenseName: cert.licenses?.name || 'Unknown License',
        certificateNumber: cert.certificate_number || '',
        issueDate: cert.issue_date || '',
        expiryDate: cert.expiry_date || '',
        status: cert.status as Certificate['status'] || 'valid'
      }));
      
      return certificates;
    }
  });
}

// Hook for certificate management operations
export function useCertificateManagement() {
  const queryClient = useQueryClient();

  const createCourseCertificateMapping = useMutation({
    mutationFn: async (mapping: {
      course_id: string;
      license_id: string;
      directly_grants?: boolean;
      is_required?: boolean;
      renewal_eligible?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('course_certificates')
        .insert(mapping)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-certificate-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['course-certificates'] });
      queryClient.invalidateQueries({ queryKey: ['certificate-courses'] });
    }
  });

  const updateCourseCertificateMapping = useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<{
        directly_grants: boolean;
        is_required: boolean;
        renewal_eligible: boolean;
      }>;
    }) => {
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
      queryClient.invalidateQueries({ queryKey: ['course-certificate-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['course-certificates'] });
      queryClient.invalidateQueries({ queryKey: ['certificate-courses'] });
    }
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
      queryClient.invalidateQueries({ queryKey: ['course-certificate-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['course-certificates'] });
      queryClient.invalidateQueries({ queryKey: ['certificate-courses'] });
    }
  });

  const createLicense = useMutation({
    mutationFn: async (license: {
      name: string;
      description?: string;
      validity_period_months?: number;
      renewal_notice_months?: number;
      is_base_level?: boolean;
      supersedes_license_id?: string;
    }) => {
      const { data, error } = await supabase
        .from('licenses')
        .insert(license)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenses'] });
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
    }
  });

  const updateLicense = useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<{
        name: string;
        description: string;
        validity_period_months: number;
        renewal_notice_months: number;
        is_base_level: boolean;
        supersedes_license_id: string;
      }>;
    }) => {
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
      queryClient.invalidateQueries({ queryKey: ['licenses'] });
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
    }
  });

  const deleteLicense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('licenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenses'] });
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      queryClient.invalidateQueries({ queryKey: ['course-certificate-mappings'] });
    }
  });

  const createEmployeeLicense = useMutation({
    mutationFn: async (certificate: {
      employee_id: string;
      license_id: string;
      certificate_number?: string;
      issue_date?: string;
      expiry_date?: string;
    }) => {
      const { data, error } = await supabase
        .from('employee_licenses')
        .insert(certificate)
        .select(`
          id,
          certificate_number,
          issue_date,
          expiry_date,
          employees:employee_id (
            id,
            name,
            employee_number
          ),
          licenses:license_id (
            id,
            name
          )
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      queryClient.invalidateQueries({ queryKey: ['employee-licenses'] });
      queryClient.invalidateQueries({ queryKey: ['certificate-expiry'] });
    }
  });

  return {
    createCourseCertificateMapping,
    updateCourseCertificateMapping,
    deleteCourseCertificateMapping,
    createLicense,
    updateLicense,
    deleteLicense,
    createEmployeeLicense
  };
}
