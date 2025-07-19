
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Employee } from "@/types";

export function useEmployees(enableRealTime = true) {
  const queryClient = useQueryClient();

  // Real-time subscriptions for employee data
  useEffect(() => {
    if (!enableRealTime) return;

    // Subscribe to employee table changes
    const employeesChannel = supabase
      .channel('employees-global')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'employees'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['employees'] });
      })
      .subscribe();

    // Subscribe to employee status history changes (critical for status tracking)
    const statusChannel = supabase
      .channel('employee-status-global')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'employee_status_history'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['employees'] });
        queryClient.invalidateQueries({ queryKey: ['employee-status'] });
        queryClient.invalidateQueries({ queryKey: ['participant-current-statuses'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(employeesChannel);
      supabase.removeChannel(statusChannel);
    };
  }, [enableRealTime, queryClient]);
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      console.log('Fetching employees from database...');
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }
      
      console.log('Fetched employees:', data);
      
      // Transform database data to match our Employee type
      const employees: Employee[] = data.map(emp => ({
        id: emp.id,
        name: emp.name,
        firstName: emp.first_name || undefined,
        lastName: emp.last_name || undefined,
        tussenvoegsel: emp.tussenvoegsel || undefined,
        roepnaam: emp.roepnaam || undefined,
        email: emp.email,
        department: emp.department,
        employeeNumber: emp.employee_number,
        licenses: [], // Will be populated separately
        managerId: emp.manager_id || undefined,
        dateOfBirth: emp.date_of_birth || undefined,
        birthPlace: emp.birth_place || undefined,
        birthCountry: emp.birth_country || undefined,
        address: emp.address || undefined,
        postcode: emp.postcode || undefined,
        city: emp.city || undefined,
        country: emp.country || undefined,
        phone: emp.phone || undefined,
        mobilePhone: emp.mobile_phone || undefined,
        nationality: emp.nationality || undefined,
        personalId: emp.personal_id || undefined,
        maritalStatus: emp.marital_status as Employee['maritalStatus'],
        hireDate: emp.hire_date || undefined,
        contractType: emp.contract_type as Employee['contractType'],
        workLocation: emp.work_location || undefined,
        jobTitle: emp.job_title || undefined,
        salary: emp.salary ? Number(emp.salary) : undefined,
        workingHours: emp.working_hours ? Number(emp.working_hours) : undefined,
        status: emp.status as Employee['status'],
        privateEmail: emp.private_email || undefined,
        gender: emp.gender as Employee['gender'] || undefined,
        deathDate: emp.death_date || undefined,
        marriageDate: emp.marriage_date || undefined,
        divorceDate: emp.divorce_date || undefined,
        website: emp.website || undefined,
        idProofType: emp.id_proof_type || undefined,
        idProofNumber: emp.id_proof_number || undefined,
        idProofExpiryDate: emp.id_proof_expiry_date || undefined,
        drivingLicenseA: emp.driving_license_a || false,
        drivingLicenseAStartDate: emp.driving_license_a_start_date || undefined,
        drivingLicenseAExpiryDate: emp.driving_license_a_expiry_date || undefined,
        drivingLicenseB: emp.driving_license_b || false,
        drivingLicenseBStartDate: emp.driving_license_b_start_date || undefined,
        drivingLicenseBExpiryDate: emp.driving_license_b_expiry_date || undefined,
        drivingLicenseBE: emp.driving_license_be || false,
        drivingLicenseBEStartDate: emp.driving_license_be_start_date || undefined,
        drivingLicenseBEExpiryDate: emp.driving_license_be_expiry_date || undefined,
        drivingLicenseC: emp.driving_license_c || false,
        drivingLicenseCStartDate: emp.driving_license_c_start_date || undefined,
        drivingLicenseCExpiryDate: emp.driving_license_c_expiry_date || undefined,
        drivingLicenseCE: emp.driving_license_ce || false,
        drivingLicenseCEStartDate: emp.driving_license_ce_start_date || undefined,
        drivingLicenseCEExpiryDate: emp.driving_license_ce_expiry_date || undefined,
        drivingLicenseD: emp.driving_license_d || false,
        drivingLicenseDStartDate: emp.driving_license_d_start_date || undefined,
        drivingLicenseDExpiryDate: emp.driving_license_d_expiry_date || undefined,
        drivingLicenseCode95: emp.driving_license_code95 || false,
        drivingLicenseCode95StartDate: emp.driving_license_code95_start_date || undefined,
        drivingLicenseCode95ExpiryDate: emp.driving_license_code95_expiry_date || undefined,
        emergencyContact: emp.emergency_contact_name ? {
          name: emp.emergency_contact_name,
          relationship: emp.emergency_contact_relationship || '',
          phone: emp.emergency_contact_phone || ''
        } : undefined,
        notes: emp.notes || undefined,
        lastActive: emp.updated_at
      }));
      
      return employees;
    }
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      console.log('Fetching employee with ID:', id);
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          employee_licenses (
            *,
            licenses (*)
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching employee:', error);
        throw error;
      }
      
      console.log('Fetched employee with licenses:', data);
      
      // Transform database data to match our Employee type
      const employee: Employee = {
        id: data.id,
        name: data.name,
        firstName: data.first_name || undefined,
        lastName: data.last_name || undefined,
        tussenvoegsel: data.tussenvoegsel || undefined,
        roepnaam: data.roepnaam || undefined,
        email: data.email,
        department: data.department,
        employeeNumber: data.employee_number,
        licenses: data.employee_licenses?.map((el: any) => el.licenses.name) || [],
        managerId: data.manager_id || undefined,
        dateOfBirth: data.date_of_birth || undefined,
        birthPlace: data.birth_place || undefined,
        birthCountry: data.birth_country || undefined,
        address: data.address || undefined,
        postcode: data.postcode || undefined,
        city: data.city || undefined,
        country: data.country || undefined,
        phone: data.phone || undefined,
        mobilePhone: data.mobile_phone || undefined,
        nationality: data.nationality || undefined,
        personalId: data.personal_id || undefined,
        maritalStatus: data.marital_status as Employee['maritalStatus'],
        hireDate: data.hire_date || undefined,
        contractType: data.contract_type as Employee['contractType'],
        workLocation: data.work_location || undefined,
        jobTitle: data.job_title || undefined,
        salary: data.salary ? Number(data.salary) : undefined,
        workingHours: data.working_hours ? Number(data.working_hours) : undefined,
        status: data.status as Employee['status'],
        privateEmail: data.private_email || undefined,
        gender: data.gender as Employee['gender'] || undefined,
        deathDate: data.death_date || undefined,
        marriageDate: data.marriage_date || undefined,
        divorceDate: data.divorce_date || undefined,
        website: data.website || undefined,
        idProofType: data.id_proof_type || undefined,
        idProofNumber: data.id_proof_number || undefined,
        idProofExpiryDate: data.id_proof_expiry_date || undefined,
        drivingLicenseA: data.driving_license_a || false,
        drivingLicenseAStartDate: data.driving_license_a_start_date || undefined,
        drivingLicenseAExpiryDate: data.driving_license_a_expiry_date || undefined,
        drivingLicenseB: data.driving_license_b || false,
        drivingLicenseBStartDate: data.driving_license_b_start_date || undefined,
        drivingLicenseBExpiryDate: data.driving_license_b_expiry_date || undefined,
        drivingLicenseBE: data.driving_license_be || false,
        drivingLicenseBEStartDate: data.driving_license_be_start_date || undefined,
        drivingLicenseBEExpiryDate: data.driving_license_be_expiry_date || undefined,
        drivingLicenseC: data.driving_license_c || false,
        drivingLicenseCStartDate: data.driving_license_c_start_date || undefined,
        drivingLicenseCExpiryDate: data.driving_license_c_expiry_date || undefined,
        drivingLicenseCE: data.driving_license_ce || false,
        drivingLicenseCEStartDate: data.driving_license_ce_start_date || undefined,
        drivingLicenseCEExpiryDate: data.driving_license_ce_expiry_date || undefined,
        drivingLicenseD: data.driving_license_d || false,
        drivingLicenseDStartDate: data.driving_license_d_start_date || undefined,
        drivingLicenseDExpiryDate: data.driving_license_d_expiry_date || undefined,
        drivingLicenseCode95: data.driving_license_code95 || false,
        drivingLicenseCode95StartDate: data.driving_license_code95_start_date || undefined,
        drivingLicenseCode95ExpiryDate: data.driving_license_code95_expiry_date || undefined,
        emergencyContact: data.emergency_contact_name ? {
          name: data.emergency_contact_name,
          relationship: data.emergency_contact_relationship || '',
          phone: data.emergency_contact_phone || ''
        } : undefined,
        notes: data.notes || undefined,
        lastActive: data.updated_at,
        employee_licenses: data.employee_licenses || []
      };
      
      return employee;
    },
    enabled: !!id
  });
}
