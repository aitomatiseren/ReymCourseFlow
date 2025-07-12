
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Certificate {
  id: string;
  employeeId: string;
  employeeName: string;
  licenseName: string;
  certificateNumber: string;
  issueDate: string;
  expiryDate: string;
  status: 'valid' | 'expiring' | 'expired';
  category: string;
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

    return () => {
      supabase.removeChannel(certificatesChannel);
      supabase.removeChannel(licensesChannel);
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
            name,
            category
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
        status: cert.status as Certificate['status'] || 'valid',
        category: cert.licenses?.category || 'Other'
      }));
      
      return certificates;
    }
  });
}
