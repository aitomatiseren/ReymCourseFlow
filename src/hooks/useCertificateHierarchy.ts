import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type CertificatePrerequisite = Tables<'certificate_prerequisites'>;
type License = Tables<'licenses'>;
type EmployeeLicense = Tables<'employee_licenses'>;

export interface LicenseWithPrerequisites extends License {
  prerequisites?: License[];
  dependents?: License[];
}

export interface EmployeeLicenseWithLevel extends EmployeeLicense {
  license?: License;
  can_renew_without_lower_levels?: boolean;
}

// Hook to fetch all certificate prerequisites
export const useCertificatePrerequisites = () => {
  return useQuery({
    queryKey: ['certificate-prerequisites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificate_prerequisites')
        .select(`
          *,
          certificate:licenses!certificate_prerequisites_certificate_id_fkey(
            id, name, level, level_description, category
          ),
          prerequisite:licenses!certificate_prerequisites_prerequisite_id_fkey(
            id, name, level, level_description, category
          )
        `);

      if (error) throw error;
      return data;
    },
  });
};

// Hook to fetch licenses with their hierarchy information
export const useLicensesWithHierarchy = () => {
  return useQuery({
    queryKey: ['licenses-hierarchy'],
    queryFn: async () => {
      const { data: licenses, error: licensesError } = await supabase
        .from('licenses')
        .select('*')
        .order('level', { ascending: true });

      if (licensesError) throw licensesError;

      const { data: prerequisites, error: prereqError } = await supabase
        .from('certificate_prerequisites')
        .select(`
          *,
          certificate:licenses!certificate_prerequisites_certificate_id_fkey(*),
          prerequisite:licenses!certificate_prerequisites_prerequisite_id_fkey(*)
        `);

      if (prereqError) throw prereqError;

      // Build hierarchy map
      const licenseMap = new Map<string, LicenseWithPrerequisites>();
      
      licenses.forEach(license => {
        licenseMap.set(license.id, {
          ...license,
          prerequisites: [],
          dependents: []
        });
      });

      // Add prerequisite relationships
      prerequisites.forEach(prereq => {
        const certificate = licenseMap.get(prereq.certificate_id);
        const prerequisite = licenseMap.get(prereq.prerequisite_id);
        
        if (certificate && prerequisite) {
          certificate.prerequisites?.push(prerequisite);
          prerequisite.dependents?.push(certificate);
        }
      });

      return Array.from(licenseMap.values());
    },
  });
};

// Hook to check if an employee meets prerequisites for a certificate
export const usePrerequisiteCheck = (employeeId: string, licenseId: string) => {
  return useQuery({
    queryKey: ['prerequisite-check', employeeId, licenseId],
    queryFn: async () => {
      // Get the certificate and its prerequisites
      const { data: certificate, error: certError } = await supabase
        .from('licenses')
        .select(`
          *,
          prerequisites:certificate_prerequisites!certificate_prerequisites_certificate_id_fkey(
            prerequisite:licenses!certificate_prerequisites_prerequisite_id_fkey(*)
          )
        `)
        .eq('id', licenseId)
        .single();

      if (certError) throw certError;

      // Get employee's current licenses
      const { data: employeeLicenses, error: empError } = await supabase
        .from('employee_licenses')
        .select(`
          *,
          license:licenses(*)
        `)
        .eq('employee_id', employeeId)
        .eq('status', 'valid');

      if (empError) throw empError;

      // Check if all prerequisites are met
      const prerequisitesMet = certificate.prerequisites?.every(prereq => {
        return employeeLicenses.some(empLicense => 
          empLicense.license_id === prereq.prerequisite.id && 
          empLicense.status === 'valid'
        );
      }) ?? true;

      return {
        certificate,
        employeeLicenses,
        prerequisitesMet,
        missingPrerequisites: certificate.prerequisites?.filter(prereq => 
          !employeeLicenses.some(empLicense => 
            empLicense.license_id === prereq.prerequisite.id && 
            empLicense.status === 'valid'
          )
        ) ?? []
      };
    },
    enabled: !!employeeId && !!licenseId,
  });
};

// Hook to check if employee can renew at current level
export const useRenewalEligibility = (employeeId: string, licenseId: string) => {
  return useQuery({
    queryKey: ['renewal-eligibility', employeeId, licenseId],
    queryFn: async () => {
      // Get employee's current license record
      const { data: employeeLicense, error } = await supabase
        .from('employee_licenses')
        .select(`
          *,
          license:licenses(*)
        `)
        .eq('employee_id', employeeId)
        .eq('license_id', licenseId)
        .single();

      if (error) throw error;

      const currentLevel = employeeLicense?.level_achieved || 1;
      const canRenewFromLevel = employeeLicense?.can_renew_from_level || 1;
      
      // Can renew if current level is >= can_renew_from_level
      const canRenewAtCurrentLevel = currentLevel >= canRenewFromLevel;

      return {
        employeeLicense,
        currentLevel,
        canRenewFromLevel,
        canRenewAtCurrentLevel,
        requiresLowerLevelRetraining: !canRenewAtCurrentLevel
      };
    },
    enabled: !!employeeId && !!licenseId,
  });
};

// Hook to manage certificate prerequisites
export const useCertificatePrerequisiteManagement = () => {
  const queryClient = useQueryClient();

  const addPrerequisite = useMutation({
    mutationFn: async ({ certificateId, prerequisiteId }: { certificateId: string; prerequisiteId: string }) => {
      const { data, error } = await supabase
        .from('certificate_prerequisites')
        .insert({
          certificate_id: certificateId,
          prerequisite_id: prerequisiteId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-prerequisites'] });
      queryClient.invalidateQueries({ queryKey: ['licenses-hierarchy'] });
    },
  });

  const removePrerequisite = useMutation({
    mutationFn: async ({ certificateId, prerequisiteId }: { certificateId: string; prerequisiteId: string }) => {
      const { error } = await supabase
        .from('certificate_prerequisites')
        .delete()
        .eq('certificate_id', certificateId)
        .eq('prerequisite_id', prerequisiteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-prerequisites'] });
      queryClient.invalidateQueries({ queryKey: ['licenses-hierarchy'] });
    },
  });

  return {
    addPrerequisite,
    removePrerequisite,
  };
};

// Hook to update license level information
export const useLicenseLevelManagement = () => {
  const queryClient = useQueryClient();

  const updateLicenseLevel = useMutation({
    mutationFn: async ({ 
      licenseId, 
      level, 
      levelDescription 
    }: { 
      licenseId: string; 
      level: number; 
      levelDescription?: string;
    }) => {
      const { data, error } = await supabase
        .from('licenses')
        .update({
          level,
          level_description: levelDescription,
        })
        .eq('id', licenseId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenses-hierarchy'] });
      queryClient.invalidateQueries({ queryKey: ['licenses'] });
    },
  });

  return {
    updateLicenseLevel,
  };
};

// Hook to update employee license level achievement
export const useEmployeeLicenseLevelManagement = () => {
  const queryClient = useQueryClient();

  const updateEmployeeLicenseLevel = useMutation({
    mutationFn: async ({ 
      employeeLicenseId, 
      levelAchieved, 
      canRenewFromLevel 
    }: { 
      employeeLicenseId: string; 
      levelAchieved: number; 
      canRenewFromLevel?: number;
    }) => {
      const { data, error } = await supabase
        .from('employee_licenses')
        .update({
          level_achieved: levelAchieved,
          can_renew_from_level: canRenewFromLevel ?? levelAchieved,
        })
        .eq('id', employeeLicenseId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employee-licenses'] });
      queryClient.invalidateQueries({ queryKey: ['renewal-eligibility'] });
      queryClient.invalidateQueries({ queryKey: ['employee-licenses', data.employee_id] });
    },
  });

  return {
    updateEmployeeLicenseLevel,
  };
};

// Utility function to get the highest level achieved for a license type
export const getHighestLevelAchieved = (licenses: EmployeeLicense[], licenseId: string): number => {
  const relevantLicenses = licenses.filter(l => l.license_id === licenseId && l.status === 'valid');
  return Math.max(...relevantLicenses.map(l => l.level_achieved || 1), 0);
};

// Utility function to check if prerequisites are satisfied
export const checkPrerequisitesSatisfied = (
  employeeLicenses: EmployeeLicense[],
  prerequisites: License[]
): boolean => {
  return prerequisites.every(prereq => 
    employeeLicenses.some(empLicense => 
      empLicense.license_id === prereq.id && 
      empLicense.status === 'valid'
    )
  );
};