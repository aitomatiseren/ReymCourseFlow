import { Employee } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export interface Code95RegistryStatus {
  employeeId: string;
  bsn: string;
  code95Number: string;
  validUntil: string | null;
  status: 'valid' | 'expired' | 'suspended' | 'revoked' | 'not_found';
  lastChecked: string;
  registryResponse: any;
}

export interface Code95RegistryResult {
  success: boolean;
  data?: Code95RegistryStatus;
  error?: string;
  cached?: boolean;
}

export interface Code95BulkResult {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  results: Code95RegistryResult[];
}

/**
 * KIWA/CBR Code 95 Registry Integration Service
 * 
 * This service provides integration with the official Dutch Code 95 registry
 * to verify employee Code 95 certification status in real-time.
 * 
 * Note: This is a mock implementation for demonstration purposes.
 * In production, this would connect to the actual CBR registry API.
 */
export class Code95RegistryService {
  private static instance: Code95RegistryService;
  private cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  private constructor() {}
  
  static getInstance(): Code95RegistryService {
    if (!Code95RegistryService.instance) {
      Code95RegistryService.instance = new Code95RegistryService();
    }
    return Code95RegistryService.instance;
  }

  /**
   * Verify Code 95 status for a single employee
   */
  async verifyCode95Status(employee: Employee): Promise<Code95RegistryResult> {
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
      if (!employee.bsn || !employee.drivingLicenseCode95) {
        return {
          success: false,
          error: 'Employee missing BSN or Code 95 license information'
        };
      }

      // Call the registry API (mock implementation)
      const registryData = await this.callRegistryAPI(employee.bsn, employee.drivingLicenseCode95);
      
      // Process and cache the result
      const status: Code95RegistryStatus = {
        employeeId: employee.id,
        bsn: employee.bsn,
        code95Number: employee.drivingLicenseCode95,
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
      console.error('Error verifying Code 95 status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Bulk verify Code 95 status for multiple employees
   */
  async bulkVerifyCode95Status(employees: Employee[]): Promise<Code95BulkResult> {
    const results: Code95RegistryResult[] = [];
    let successful = 0;
    let failed = 0;

    // Filter employees who require Code 95
    const code95Employees = employees.filter(emp => 
      emp.drivingLicenseC || emp.drivingLicenseCE || emp.drivingLicenseD
    );

    for (const employee of code95Employees) {
      try {
        const result = await this.verifyCode95Status(employee);
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
      processed: code95Employees.length,
      successful,
      failed,
      results
    };
  }

  /**
   * Get cached status from database
   */
  private async getCachedStatus(employeeId: string): Promise<Code95RegistryStatus | null> {
    try {
      const { data, error } = await supabase
        .from('code95_registry_cache')
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
        code95Number: data.code95_number,
        validUntil: data.valid_until,
        status: data.status,
        lastChecked: data.last_checked,
        registryResponse: data.registry_response
      };
    } catch (error) {
      console.error('Error retrieving cached status:', error);
      return null;
    }
  }

  /**
   * Cache status result in database
   */
  private async cacheStatus(status: Code95RegistryStatus): Promise<void> {
    try {
      const { error } = await supabase
        .from('code95_registry_cache')
        .upsert({
          employee_id: status.employeeId,
          bsn: status.bsn,
          code95_number: status.code95Number,
          valid_until: status.validUntil,
          status: status.status,
          last_checked: status.lastChecked,
          registry_response: status.registryResponse
        });

      if (error) {
        console.error('Error caching status:', error);
      }
    } catch (error) {
      console.error('Error caching status:', error);
    }
  }

  /**
   * Mock registry API call
   * In production, this would call the actual CBR registry API
   */
  private async callRegistryAPI(bsn: string, code95Number: string): Promise<any> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock response - in production this would be the actual API response
    const mockResponses = [
      {
        status: 'valid',
        validUntil: '2025-12-31',
        lastTraining: '2023-01-15',
        pointsEarned: 35,
        registryId: 'CBR-123456'
      },
      {
        status: 'expired',
        validUntil: '2024-06-30',
        lastTraining: '2021-05-10',
        pointsEarned: 35,
        registryId: 'CBR-789012'
      },
      {
        status: 'suspended',
        validUntil: null,
        lastTraining: '2022-08-20',
        pointsEarned: 20,
        registryId: 'CBR-345678'
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
        .from('code95_registry_cache')
        .delete()
        .eq('employee_id', employeeId);
    } catch (error) {
      console.error('Error refreshing cached status:', error);
    }
  }

  /**
   * Get registry integration statistics
   */
  async getIntegrationStats(): Promise<{
    totalCached: number;
    validCertificates: number;
    expiredCertificates: number;
    suspendedCertificates: number;
    lastSyncTime: string | null;
  }> {
    try {
      const { data: stats, error } = await supabase
        .from('code95_registry_cache')
        .select('status, last_checked')
        .order('last_checked', { ascending: false });

      if (error) {
        throw error;
      }

      const totalCached = stats?.length || 0;
      const validCertificates = stats?.filter(s => s.status === 'valid').length || 0;
      const expiredCertificates = stats?.filter(s => s.status === 'expired').length || 0;
      const suspendedCertificates = stats?.filter(s => s.status === 'suspended').length || 0;
      const lastSyncTime = stats?.[0]?.last_checked || null;

      return {
        totalCached,
        validCertificates,
        expiredCertificates,
        suspendedCertificates,
        lastSyncTime
      };
    } catch (error) {
      console.error('Error getting integration stats:', error);
      return {
        totalCached: 0,
        validCertificates: 0,
        expiredCertificates: 0,
        suspendedCertificates: 0,
        lastSyncTime: null
      };
    }
  }
}

// Export singleton instance
export const code95RegistryService = Code95RegistryService.getInstance();