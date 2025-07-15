import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Employee } from '@/types';
import { 
  cdrRegistryService, 
  CDRRegistryResult, 
  CDRBulkResult,
  CDRRegistryStatus,
  QRCodeScanResult
} from '@/services/registryIntegration/cdrRegistryService';

/**
 * Hook for verifying CDR certificate status for a single employee
 */
export function useCDRVerification(employee: Employee | null) {
  return useMutation<CDRRegistryResult, Error, Employee>({
    mutationFn: async (emp: Employee) => {
      return await cdrRegistryService.verifyCDRStatus(emp);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(
          result.cached 
            ? `CDR certificate status retrieved (cached)`
            : `CDR certificate status verified from registry`
        );
      } else {
        toast.error(`CDR verification failed: ${result.error}`);
      }
    },
    onError: (error) => {
      toast.error(`CDR registry verification failed: ${error.message}`);
    }
  });
}

/**
 * Hook for bulk verifying CDR certificate status for multiple employees
 */
export function useBulkCDRVerification() {
  const queryClient = useQueryClient();
  
  return useMutation<CDRBulkResult, Error, Employee[]>({
    mutationFn: async (employees: Employee[]) => {
      return await cdrRegistryService.bulkVerifyCDRStatus(employees);
    },
    onSuccess: (result) => {
      toast.success(
        `CDR bulk verification completed: ${result.successful} successful, ${result.failed} failed`
      );
      
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['cdr-registry-stats'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error) => {
      toast.error(`CDR bulk verification failed: ${error.message}`);
    }
  });
}

/**
 * Hook for scanning QR codes to verify VCA diplomas
 */
export function useQRCodeScanning() {
  return useMutation<QRCodeScanResult, Error, string>({
    mutationFn: async (qrCodeData: string) => {
      return await cdrRegistryService.scanQRCode(qrCodeData);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`QR code scanned successfully`);
      } else {
        toast.error(`QR code scan failed: ${result.error}`);
      }
    },
    onError: (error) => {
      toast.error(`QR code scanning failed: ${error.message}`);
    }
  });
}

/**
 * Hook for generating QR codes for CDR certificates
 */
export function useQRCodeGeneration() {
  return useMutation<string | null, Error, string>({
    mutationFn: async (employeeId: string) => {
      return await cdrRegistryService.generateQRCode(employeeId);
    },
    onSuccess: (result) => {
      if (result) {
        toast.success('QR code generated successfully');
      } else {
        toast.error('Failed to generate QR code');
      }
    },
    onError: (error) => {
      toast.error(`QR code generation failed: ${error.message}`);
    }
  });
}

/**
 * Hook for refreshing cached CDR certificate status for an employee
 */
export function useRefreshCDRStatus() {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, string>({
    mutationFn: async (employeeId: string) => {
      await cdrRegistryService.refreshEmployeeStatus(employeeId);
    },
    onSuccess: () => {
      toast.success('CDR certificate status cache refreshed');
      queryClient.invalidateQueries({ queryKey: ['cdr-registry-stats'] });
    },
    onError: (error) => {
      toast.error(`Failed to refresh CDR status: ${error.message}`);
    }
  });
}

/**
 * Hook for getting CDR registry integration statistics
 */
export function useCDRRegistryStats() {
  return useQuery({
    queryKey: ['cdr-registry-stats'],
    queryFn: async () => {
      return await cdrRegistryService.getIntegrationStats();
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider stale after 2 minutes
  });
}

/**
 * Hook for getting cached CDR registry data
 */
export function useCDRRegistryCache(employeeId: string | null) {
  return useQuery({
    queryKey: ['cdr-registry-cache', employeeId],
    queryFn: async () => {
      if (!employeeId) return null;
      
      // This would typically call a service method to get cached data
      // For now, we'll return null and let the verification handle it
      return null;
    },
    enabled: !!employeeId,
    staleTime: 10 * 60 * 1000, // Consider stale after 10 minutes
  });
}

/**
 * Combined hook for CDR registry operations
 */
export function useCDRRegistry() {
  const verification = useCDRVerification(null);
  const bulkVerification = useBulkCDRVerification();
  const qrScanning = useQRCodeScanning();
  const qrGeneration = useQRCodeGeneration();
  const refreshStatus = useRefreshCDRStatus();
  const stats = useCDRRegistryStats();
  
  const verifyEmployee = async (employee: Employee) => {
    return verification.mutateAsync(employee);
  };
  
  const bulkVerifyEmployees = async (employees: Employee[]) => {
    return bulkVerification.mutateAsync(employees);
  };
  
  const scanQRCode = async (qrCodeData: string) => {
    return qrScanning.mutateAsync(qrCodeData);
  };
  
  const generateQRCode = async (employeeId: string) => {
    return qrGeneration.mutateAsync(employeeId);
  };
  
  const refreshEmployeeStatus = async (employeeId: string) => {
    return refreshStatus.mutateAsync(employeeId);
  };
  
  return {
    // Individual verification
    verifyEmployee,
    isVerifying: verification.isPending,
    
    // Bulk verification
    bulkVerifyEmployees,
    isBulkVerifying: bulkVerification.isPending,
    
    // QR code operations
    scanQRCode,
    isScanning: qrScanning.isPending,
    generateQRCode,
    isGenerating: qrGeneration.isPending,
    
    // Refresh status
    refreshEmployeeStatus,
    isRefreshing: refreshStatus.isPending,
    
    // Statistics
    stats: stats.data,
    isLoadingStats: stats.isLoading,
    
    // Overall loading state
    isLoading: verification.isPending || bulkVerification.isPending || qrScanning.isPending || qrGeneration.isPending || refreshStatus.isPending
  };
}