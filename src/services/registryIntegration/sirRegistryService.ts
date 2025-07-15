import { Employee } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export interface SIRRegistryStatus {
  employeeId: string;
  bsn: string;
  sirNumber: string;
  certificateType: string;
  validUntil: string | null;
  status: 'valid' | 'expired' | 'suspended' | 'revoked' | 'not_found';
  lastChecked: string;
  registryResponse: any;
}

export interface SIRRegistryResult {
  success: boolean;
  data?: SIRRegistryStatus;
  error?: string;
  cached?: boolean;
}

export interface SIRBulkResult {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  results: SIRRegistryResult[];
}

/**
 * SIR Register Integration Service (sir-safe.nl)
 * 
 * This service provides integration with the SIR registry for industrial
 * cleaning safety certificate verification.
 * 
 * Note: This is a mock implementation for demonstration purposes.
 * In production, this would connect to the actual SIR registry API.
 */
export class SIRRegistryService {
  private static instance: SIRRegistryService;
  private cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private apiEndpoint = 'https://sir-safe.nl/api/v1/verify'; // Mock endpoint
  
  private constructor() {}
  
  static getInstance(): SIRRegistryService {
    if (!SIRRegistryService.instance) {
      SIRRegistryService.instance = new SIRRegistryService();
    }
    return SIRRegistryService.instance;
  }

  /**
   * Verify SIR certificate status for a single employee
   */
  async verifySIRStatus(employee: Employee): Promise<SIRRegistryResult> {
    try {
      // Check if we have cached data first
      const cachedResult = await this.getCachedStatus(employee.id);
      if (cachedResult) {
        return {
          success: true,
          data: cachedResult,
          cached: true
        };
      }

      // Validate employee has required information
      if (!employee.bsn) {
        return {
          success: false,
          error: 'Employee missing BSN for SIR verification'
        };
      }

      // Call the registry API (mock implementation)
      const registryData = await this.callSIRRegistryAPI(employee.bsn);
      
      // Process and cache the result
      const status: SIRRegistryStatus = {
        employeeId: employee.id,
        bsn: employee.bsn,
        sirNumber: registryData.sirNumber,
        certificateType: registryData.certificateType,
        validUntil: registryData.validUntil,
        status: registryData.status,
        lastChecked: new Date().toISOString(),
        registryResponse: registryData
      };

      // Cache the result
      await this.cacheStatus(status);

      return {
        success: true,
        data: status
      };

    } catch (error) {
      console.error('Error verifying SIR status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Bulk verify SIR status for multiple employees
   */
  async bulkVerifySIRStatus(employees: Employee[]): Promise<SIRBulkResult> {
    const results: SIRRegistryResult[] = [];
    let successful = 0;
    let failed = 0;

    for (const employee of employees) {
      try {
        const result = await this.verifySIRStatus(employee);
        results.push(result);
        
        if (result.success) {
          successful++;
        } else {
          failed++;
        }
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        failed++;
      }
    }

    return {
      total: employees.length,
      processed: employees.length,
      successful,
      failed,
      results
    };
  }

  /**
   * Get cached status from database
   */
  private async getCachedStatus(employeeId: string): Promise<SIRRegistryStatus | null> {
    try {
      const { data, error } = await supabase
        .from('sir_registry_cache')
        .select('*')
        .eq('employee_id', employeeId)
        .single();

      if (error || !data) {
        return null;
      }

      // Check if cache is still valid
      const cacheAge = Date.now() - new Date(data.last_checked).getTime();
      if (cacheAge > this.cacheTimeout) {
        return null;
      }

      return {
        employeeId: data.employee_id,
        bsn: data.bsn,
        sirNumber: data.sir_number,
        certificateType: data.certificate_type,
        validUntil: data.valid_until,
        status: data.status,
        lastChecked: data.last_checked,
        registryResponse: data.registry_response
      };
    } catch (error) {
      console.error('Error retrieving cached SIR status:', error);
      return null;
    }
  }

  /**
   * Cache status result in database
   */
  private async cacheStatus(status: SIRRegistryStatus): Promise<void> {
    try {
      const { error } = await supabase
        .from('sir_registry_cache')
        .upsert({
          employee_id: status.employeeId,
          bsn: status.bsn,
          sir_number: status.sirNumber,
          certificate_type: status.certificateType,
          valid_until: status.validUntil,
          status: status.status,
          last_checked: status.lastChecked,
          registry_response: status.registryResponse
        });

      if (error) {
        console.error('Error caching SIR status:', error);
      }
    } catch (error) {
      console.error('Error caching SIR status:', error);
    }
  }

  /**
   * Mock SIR registry API call
   * In production, this would call the actual SIR registry API
   */
  private async callSIRRegistryAPI(bsn: string): Promise<any> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock response - in production this would be the actual API response
    const mockResponses = [
      {
        status: 'valid',
        sirNumber: 'SIR-001234',
        certificateType: 'Industrial Cleaning Safety',
        validUntil: '2025-08-15',
        issueDate: '2023-08-15',
        registryId: 'SIR-REG-001'
      },
      {
        status: 'expired',
        sirNumber: 'SIR-005678',
        certificateType: 'Industrial Cleaning Safety',
        validUntil: '2024-03-20',
        issueDate: '2022-03-20',
        registryId: 'SIR-REG-002'
      },
      {
        status: 'not_found',
        sirNumber: null,
        certificateType: null,
        validUntil: null,
        issueDate: null,
        registryId: null
      }
    ];

    // Return a random mock response
    return mockResponses[Math.floor(Math.random() * mockResponses.length)];
  }

  /**
   * Force refresh cached data for an employee
   */
  async refreshEmployeeStatus(employeeId: string): Promise<void> {
    try {
      await supabase
        .from('sir_registry_cache')
        .delete()
        .eq('employee_id', employeeId);
    } catch (error) {
      console.error('Error refreshing cached SIR status:', error);
    }
  }

  /**
   * Get SIR registry integration statistics
   */
  async getIntegrationStats(): Promise<{
    totalCached: number;
    validCertificates: number;
    expiredCertificates: number;
    notFound: number;
    lastSyncTime: string | null;
  }> {
    try {
      const { data: stats, error } = await supabase
        .from('sir_registry_cache')
        .select('status, last_checked')
        .order('last_checked', { ascending: false });

      if (error) {
        throw error;
      }

      const totalCached = stats?.length || 0;
      const validCertificates = stats?.filter(s => s.status === 'valid').length || 0;
      const expiredCertificates = stats?.filter(s => s.status === 'expired').length || 0;
      const notFound = stats?.filter(s => s.status === 'not_found').length || 0;
      const lastSyncTime = stats?.[0]?.last_checked || null;

      return {
        totalCached,
        validCertificates,
        expiredCertificates,
        notFound,
        lastSyncTime
      };
    } catch (error) {
      console.error('Error getting SIR integration stats:', error);
      return {
        totalCached: 0,
        validCertificates: 0,
        expiredCertificates: 0,
        notFound: 0,
        lastSyncTime: null
      };
    }
  }
}

// Export singleton instance
export const sirRegistryService = SIRRegistryService.getInstance();