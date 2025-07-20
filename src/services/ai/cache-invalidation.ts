import { QueryClient } from '@tanstack/react-query';

/**
 * Utility class for invalidating React Query cache from AI services
 */
export class CacheInvalidationService {
  private static queryClient: QueryClient | null = null;

  /**
   * Set the query client instance (should be called once from the app)
   */
  static setQueryClient(client: QueryClient) {
    this.queryClient = client;
  }

  /**
   * Get the query client instance
   */
  static getQueryClient(): QueryClient | null {
    return this.queryClient;
  }

  /**
   * Invalidate certificate-related queries
   */
  static invalidateCertificateQueries() {
    if (!this.queryClient) return;
    
    this.queryClient.invalidateQueries({ queryKey: ['certificates'] });
    this.queryClient.invalidateQueries({ queryKey: ['employee-licenses'] });
    this.queryClient.invalidateQueries({ queryKey: ['certificate-expiry'] });
    this.queryClient.invalidateQueries({ queryKey: ['license-definitions'] });
    this.queryClient.invalidateQueries({ queryKey: ['licenses'] });
  }

  /**
   * Invalidate certificate document queries
   */
  static invalidateCertificateDocumentQueries() {
    if (!this.queryClient) return;
    
    this.queryClient.invalidateQueries({ queryKey: ['certificate-documents'] });
    this.queryClient.invalidateQueries({ queryKey: ['pending-documents'] });
    this.queryClient.invalidateQueries({ queryKey: ['documents-for-verification'] });
  }

  /**
   * Invalidate training-related queries
   */
  static invalidateTrainingQueries() {
    if (!this.queryClient) return;
    
    this.queryClient.invalidateQueries({ queryKey: ['trainings'] });
    this.queryClient.invalidateQueries({ queryKey: ['training-participants'] });
    this.queryClient.invalidateQueries({ queryKey: ['employee-training-history'] });
  }

  /**
   * Invalidate provider-related queries
   */
  static invalidateProviderQueries() {
    if (!this.queryClient) return;
    
    this.queryClient.invalidateQueries({ queryKey: ['course-providers'] });
    this.queryClient.invalidateQueries({ queryKey: ['providers'] });
    this.queryClient.invalidateQueries({ queryKey: ['course-providers-for-course'] });
  }

  /**
   * Invalidate course-related queries
   */
  static invalidateCourseQueries() {
    if (!this.queryClient) return;
    
    this.queryClient.invalidateQueries({ queryKey: ['courses'] });
    this.queryClient.invalidateQueries({ queryKey: ['course-definitions'] });
    this.queryClient.invalidateQueries({ queryKey: ['course-certificate-mappings'] });
  }

  /**
   * Invalidate employee-related queries
   */
  static invalidateEmployeeQueries() {
    if (!this.queryClient) return;
    
    this.queryClient.invalidateQueries({ queryKey: ['employees'] });
    this.queryClient.invalidateQueries({ queryKey: ['employee'] });
  }

  /**
   * Invalidate all related queries (use when unsure what was affected)
   */
  static invalidateAllQueries() {
    if (!this.queryClient) return;
    
    this.invalidateCertificateQueries();
    this.invalidateCertificateDocumentQueries();
    this.invalidateTrainingQueries();
    this.invalidateProviderQueries();
    this.invalidateCourseQueries();
    this.invalidateEmployeeQueries();
  }
}