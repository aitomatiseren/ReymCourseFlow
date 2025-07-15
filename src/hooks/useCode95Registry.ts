import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Employee } from '@/types';
import { 
  code95RegistryService, 
  Code95RegistryResult, 
  Code95BulkResult,
  Code95RegistryStatus
} from '@/services/registryIntegration/code95RegistryService';

/**
 * Hook for verifying Code 95 status for a single employee
 */
export function useCode95Verification(employee: Employee | null) {
  return useMutation<Code95RegistryResult, Error, Employee>({
    mutationFn: async (emp: Employee) => {
      return await code95RegistryService.verifyCode95Status(emp);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(
          result.cached 
            ? `Code 95 status retrieved (cached)`
            : `Code 95 status verified from registry`
        );
      } else {
        toast.error(`Verification failed: ${result.error}`);
      }
    },
    onError: (error) => {
      toast.error(`Registry verification failed: ${error.message}`);
    }
  });
}

/**
 * Hook for bulk verifying Code 95 status for multiple employees
 */
export function useBulkCode95Verification() {
  const queryClient = useQueryClient();
  
  return useMutation<Code95BulkResult, Error, Employee[]>({
    mutationFn: async (employees: Employee[]) => {
      return await code95RegistryService.bulkVerifyCode95Status(employees);
    },
    onSuccess: (result) => {
      toast.success(
        `Bulk verification completed: ${result.successful} successful, ${result.failed} failed`
      );
      
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['code95-registry-stats'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error) => {
      toast.error(`Bulk verification failed: ${error.message}`);
    }
  });
}

/**
 * Hook for refreshing cached Code 95 status for an employee
 */
export function useRefreshCode95Status() {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, string>({
    mutationFn: async (employeeId: string) => {
      await code95RegistryService.refreshEmployeeStatus(employeeId);
    },
    onSuccess: () => {
      toast.success('Code 95 status cache refreshed');
      queryClient.invalidateQueries({ queryKey: ['code95-registry-stats'] });
    },
    onError: (error) => {
      toast.error(`Failed to refresh status: ${error.message}`);
    }
  });
}

/**
 * Hook for getting Code 95 registry integration statistics
 */
export function useCode95RegistryStats() {
  return useQuery({
    queryKey: ['code95-registry-stats'],
    queryFn: async () => {
      return await code95RegistryService.getIntegrationStats();
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider stale after 2 minutes
  });
}

/**
 * Hook for getting cached Code 95 registry data
 */
export function useCode95RegistryCache(employeeId: string | null) {
  return useQuery({
    queryKey: ['code95-registry-cache', employeeId],
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
 * Combined hook for Code 95 registry operations
 */
export function useCode95Registry() {
  const verification = useCode95Verification(null);
  const bulkVerification = useBulkCode95Verification();
  const refreshStatus = useRefreshCode95Status();
  const stats = useCode95RegistryStats();
  
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