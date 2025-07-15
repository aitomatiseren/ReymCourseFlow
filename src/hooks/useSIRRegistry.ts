import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Employee } from '@/types';
import { 
  sirRegistryService, 
  SIRRegistryResult, 
  SIRBulkResult,
  SIRRegistryStatus
} from '@/services/registryIntegration/sirRegistryService';

/**
 * Hook for verifying SIR certificate status for a single employee
 */
export function useSIRVerification(employee: Employee | null) {
  return useMutation<SIRRegistryResult, Error, Employee>({
    mutationFn: async (emp: Employee) => {
      return await sirRegistryService.verifySIRStatus(emp);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(
          result.cached 
            ? `SIR certificate status retrieved (cached)`
            : `SIR certificate status verified from registry`
        );
      } else {
        toast.error(`SIR verification failed: ${result.error}`);
      }
    },
    onError: (error) => {
      toast.error(`SIR registry verification failed: ${error.message}`);
    }
  });
}

/**
 * Hook for bulk verifying SIR certificate status for multiple employees
 */
export function useBulkSIRVerification() {
  const queryClient = useQueryClient();
  
  return useMutation<SIRBulkResult, Error, Employee[]>({
    mutationFn: async (employees: Employee[]) => {
      return await sirRegistryService.bulkVerifySIRStatus(employees);
    },
    onSuccess: (result) => {
      toast.success(
        `SIR bulk verification completed: ${result.successful} successful, ${result.failed} failed`
      );
      
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['sir-registry-stats'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error) => {
      toast.error(`SIR bulk verification failed: ${error.message}`);
    }
  });
}

/**
 * Hook for refreshing cached SIR certificate status for an employee
 */
export function useRefreshSIRStatus() {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, string>({
    mutationFn: async (employeeId: string) => {
      await sirRegistryService.refreshEmployeeStatus(employeeId);
    },
    onSuccess: () => {
      toast.success('SIR certificate status cache refreshed');
      queryClient.invalidateQueries({ queryKey: ['sir-registry-stats'] });
    },
    onError: (error) => {
      toast.error(`Failed to refresh SIR status: ${error.message}`);
    }
  });
}

/**
 * Hook for getting SIR registry integration statistics
 */
export function useSIRRegistryStats() {
  return useQuery({
    queryKey: ['sir-registry-stats'],
    queryFn: async () => {
      return await sirRegistryService.getIntegrationStats();
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider stale after 2 minutes
  });
}

/**
 * Hook for getting cached SIR registry data
 */
export function useSIRRegistryCache(employeeId: string | null) {
  return useQuery({
    queryKey: ['sir-registry-cache', employeeId],
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
 * Combined hook for SIR registry operations
 */
export function useSIRRegistry() {
  const verification = useSIRVerification(null);
  const bulkVerification = useBulkSIRVerification();
  const refreshStatus = useRefreshSIRStatus();
  const stats = useSIRRegistryStats();
  
  const verifyEmployee = async (employee: Employee) => {
    return verification.mutateAsync(employee);
  };
  
  const bulkVerifyEmployees = async (employees: Employee[]) => {
    return bulkVerification.mutateAsync(employees);
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
    
    // Refresh status
    refreshEmployeeStatus,
    isRefreshing: refreshStatus.isPending,
    
    // Statistics
    stats: stats.data,
    isLoadingStats: stats.isLoading,
    
    // Overall loading state
    isLoading: verification.isPending || bulkVerification.isPending || refreshStatus.isPending
  };
}