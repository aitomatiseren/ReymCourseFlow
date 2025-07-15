import { Employee } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export interface CDRRegistryStatus {
  employeeId: string;
  bsn: string;
  cdrNumber: string;
  certificateType: string;
  validUntil: string | null;
  status: 'valid' | 'expired' | 'suspended' | 'revoked' | 'not_found';
  qrCode: string | null;
  lastChecked: string;
  registryResponse: any;
}

export interface CDRRegistryResult {
  success: boolean;
  data?: CDRRegistryStatus;
  error?: string;
  cached?: boolean;
}

export interface CDRBulkResult {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  results: CDRRegistryResult[];
}

export interface QRCodeScanResult {
  success: boolean;
  data?: {
    cdrNumber: string;
    employeeName: string;
    certificateType: string;
    validUntil: string;
    status: string;
  };
  error?: string;
}

/**
 * CDR Registry Integration Service (cdr.ssvv.nl)
 * 
 * This service provides integration with the CDR registry for VCA diploma
 * verification, including QR code scanning capabilities.
 * 
 * Note: This is a mock implementation for demonstration purposes.
 * In production, this would connect to the actual CDR registry API.
 */
export class CDRRegistryService {
  private static instance: CDRRegistryService;
  private cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private apiEndpoint = 'https://cdr.ssvv.nl/api/v1/verify'; // Mock endpoint
  
  private constructor() {}
  
  static getInstance(): CDRRegistryService {
    if (!CDRRegistryService.instance) {
      CDRRegistryService.instance = new CDRRegistryService();
    }
    return CDRRegistryService.instance;
  }

  /**
   * Verify CDR certificate status for a single employee
   */
  async verifyCDRStatus(employee: Employee): Promise<CDRRegistryResult> {
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
          error: 'Employee missing BSN for CDR verification'
        };
      }

      // Call the registry API (mock implementation)
      const registryData = await this.callCDRRegistryAPI(employee.bsn);
      
      // Process and cache the result
      const status: CDRRegistryStatus = {
        employeeId: employee.id,
        bsn: employee.bsn,
        cdrNumber: registryData.cdrNumber,
        certificateType: registryData.certificateType,
        validUntil: registryData.validUntil,
        status: registryData.status,
        qrCode: registryData.qrCode,
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
      console.error('Error verifying CDR status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Bulk verify CDR status for multiple employees
   */
  async bulkVerifyCDRStatus(employees: Employee[]): Promise<CDRBulkResult> {
    const results: CDRRegistryResult[] = [];
    let successful = 0;
    let failed = 0;

    for (const employee of employees) {
      try {
        const result = await this.verifyCDRStatus(employee);
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
   * Scan QR code to verify VCA diploma
   */
  async scanQRCode(qrCodeData: string): Promise<QRCodeScanResult> {
    try {
      // Simulate QR code scanning delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Parse QR code data (mock implementation)
      const qrData = this.parseQRCodeData(qrCodeData);
      
      if (!qrData) {
        return {
          success: false,
          error: 'Invalid QR code format'
        };
      }

      // Verify with CDR registry
      const registryData = await this.callCDRRegistryAPI(qrData.cdrNumber);
      
      return {
        success: true,
        data: {
          cdrNumber: registryData.cdrNumber,
          employeeName: registryData.employeeName,
          certificateType: registryData.certificateType,
          validUntil: registryData.validUntil,
          status: registryData.status
        }
      };

    } catch (error) {
      console.error('Error scanning QR code:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'QR code scanning failed'
      };
    }
  }

  /**
   * Generate QR code for a CDR certificate
   */
  async generateQRCode(employeeId: string): Promise<string | null> {
    try {
      const cachedStatus = await this.getCachedStatus(employeeId);
      if (!cachedStatus || !cachedStatus.cdrNumber) {
        return null;
      }

      // Generate QR code data (mock implementation)
      const qrData = {
        cdrNumber: cachedStatus.cdrNumber,
        certificateType: cachedStatus.certificateType,
        validUntil: cachedStatus.validUntil,
        verificationUrl: `https://cdr.ssvv.nl/verify/${cachedStatus.cdrNumber}`
      };

      return JSON.stringify(qrData);
    } catch (error) {
      console.error('Error generating QR code:', error);
      return null;
    }
  }

  /**
   * Parse QR code data
   */
  private parseQRCodeData(qrCodeData: string): { cdrNumber: string; certificateType: string } | null {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(qrCodeData);
      if (parsed.cdrNumber && parsed.certificateType) {
        return parsed;
      }
      
      // Try to parse as URL
      if (qrCodeData.includes('cdr.ssvv.nl/verify/')) {
        const match = qrCodeData.match(/verify\/([^\/\?]+)/);
        if (match) {
          return {
            cdrNumber: match[1],
            certificateType: 'VCA'
          };
        }
      }
      
      return null;
    } catch (error) {
      // If JSON parsing fails, try other formats
      return null;
    }
  }

  /**
   * Get cached status from database
   */
  private async getCachedStatus(employeeId: string): Promise<CDRRegistryStatus | null> {
    try {
      const { data, error } = await supabase
        .from('cdr_registry_cache')
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
        cdrNumber: data.cdr_number,
        certificateType: data.certificate_type,
        validUntil: data.valid_until,
        status: data.status,
        qrCode: data.qr_code,
        lastChecked: data.last_checked,
        registryResponse: data.registry_response
      };
    } catch (error) {
      console.error('Error retrieving cached CDR status:', error);
      return null;
    }
  }

  /**
   * Cache status result in database
   */
  private async cacheStatus(status: CDRRegistryStatus): Promise<void> {
    try {
      const { error } = await supabase
        .from('cdr_registry_cache')
        .upsert({
          employee_id: status.employeeId,
          bsn: status.bsn,
          cdr_number: status.cdrNumber,
          certificate_type: status.certificateType,
          valid_until: status.validUntil,
          status: status.status,
          qr_code: status.qrCode,
          last_checked: status.lastChecked,
          registry_response: status.registryResponse
        });

      if (error) {
        console.error('Error caching CDR status:', error);
      }
    } catch (error) {
      console.error('Error caching CDR status:', error);
    }
  }

  /**
   * Mock CDR registry API call
   * In production, this would call the actual CDR registry API
   */
  private async callCDRRegistryAPI(identifier: string): Promise<any> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock response - in production this would be the actual API response
    const mockResponses = [
      {
        status: 'valid',
        cdrNumber: 'VCA-001234-2023',
        employeeName: 'John Doe',
        certificateType: 'VCA Basis',
        validUntil: '2025-06-15',
        issueDate: '2023-06-15',
        qrCode: 'QR-VCA-001234-2023',
        registryId: 'CDR-REG-001'
      },
      {
        status: 'expired',
        cdrNumber: 'VCA-005678-2022',
        employeeName: 'Jane Smith',
        certificateType: 'VCA VOL',
        validUntil: '2024-03-20',
        issueDate: '2022-03-20',
        qrCode: 'QR-VCA-005678-2022',
        registryId: 'CDR-REG-002'
      },
      {
        status: 'not_found',
        cdrNumber: null,
        employeeName: null,
        certificateType: null,
        validUntil: null,
        issueDate: null,
        qrCode: null,
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
        .from('cdr_registry_cache')
        .delete()
        .eq('employee_id', employeeId);
    } catch (error) {
      console.error('Error refreshing cached CDR status:', error);
    }
  }

  /**
   * Get CDR registry integration statistics
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
        .from('cdr_registry_cache')
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
      console.error('Error getting CDR integration stats:', error);
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
export const cdrRegistryService = CDRRegistryService.getInstance();