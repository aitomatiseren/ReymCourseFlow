import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type CertificateDocument = Tables<'certificate_documents'>;
type CertificateDocumentInsert = TablesInsert<'certificate_documents'>;
type CertificateDocumentUpdate = TablesUpdate<'certificate_documents'>;

export interface DocumentWithDetails extends CertificateDocument {
  employee?: {
    id: string;
    name: string;
    employee_number: string;
  };
  license?: {
    id: string;
    name: string;
    category: string;
  };
  uploaded_by_employee?: {
    id: string;
    name: string;
  };
  verified_by_employee?: {
    id: string;
    name: string;
  };
}

export interface DocumentUploadData {
  employeeId?: string;
  licenseId?: string;
  file: File;
  extractedData?: {
    certificateNumber?: string;
    issueDate?: string;
    expiryDate?: string;
    issuer?: string;
    employeeName?: string;
  };
}

export interface DocumentProcessingResult {
  success: boolean;
  confidence: number;
  extractedData: {
    certificateNumber?: string;
    issueDate?: string;
    expiryDate?: string;
    issuer?: string;
    employeeName?: string;
    [key: string]: any;
  };
  suggestedEmployee?: {
    id: string;
    name: string;
    confidence: number;
  };
  suggestedLicense?: {
    id: string;
    name: string;
    confidence: number;
  };
  errors?: string[];
}

// Hook to fetch certificate documents with filters
export const useCertificateDocuments = (filters?: {
  employeeId?: string;
  licenseId?: string;
  processingStatus?: string;
  verificationStatus?: string;
}) => {
  return useQuery({
    queryKey: ['certificate-documents', filters],
    queryFn: async () => {
      let query = supabase
        .from('certificate_documents')
        .select(`
          *,
          employee:employees!certificate_documents_employee_id_fkey(
            id, name, employee_number
          ),
          license:licenses!certificate_documents_license_id_fkey(
            id, name, description, level
          ),
          uploaded_by_employee:employees!certificate_documents_uploaded_by_fkey(
            id, name
          ),
          verified_by_employee:employees!certificate_documents_verified_by_fkey(
            id, name
          )
        `)
        .order('upload_date', { ascending: false });

      if (filters?.employeeId) {
        query = query.eq('employee_id', filters.employeeId);
      }
      if (filters?.licenseId) {
        query = query.eq('license_id', filters.licenseId);
      }
      if (filters?.processingStatus) {
        query = query.eq('processing_status', filters.processingStatus);
      }
      if (filters?.verificationStatus) {
        query = query.eq('verification_status', filters.verificationStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DocumentWithDetails[];
    },
  });
};

// Hook to fetch pending document processing
export const usePendingDocuments = () => {
  return useQuery({
    queryKey: ['pending-documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificate_documents')
        .select(`
          *,
          employee:employees!certificate_documents_employee_id_fkey(
            id, name, employee_number
          ),
          license:licenses!certificate_documents_license_id_fkey(
            id, name, description, level
          )
        `)
        .in('processing_status', ['pending', 'processing'])
        .order('upload_date', { ascending: true });

      if (error) throw error;
      return data as DocumentWithDetails[];
    },
  });
};

// Hook to fetch documents needing verification
export const useDocumentsForVerification = () => {
  return useQuery({
    queryKey: ['documents-for-verification'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificate_documents')
        .select(`
          *,
          employee:employees!certificate_documents_employee_id_fkey(
            id, name, employee_number
          ),
          license:licenses!certificate_documents_license_id_fkey(
            id, name, description, level
          ),
          uploaded_by_employee:employees!certificate_documents_uploaded_by_fkey(
            id, name
          )
        `)
        .eq('processing_status', 'completed')
        .eq('verification_status', 'unverified')
        .order('upload_date', { ascending: true });

      if (error) throw error;
      return data as DocumentWithDetails[];
    },
  });
};

// Hook for document management operations
export const useDocumentManagement = () => {
  const queryClient = useQueryClient();

  const uploadDocument = useMutation({
    mutationFn: async ({ file, employeeId, licenseId, certificateData }: {
      file: File;
      employeeId?: string;
      licenseId?: string;
      certificateData?: {
        certificateName?: string;
        employeeName?: string;
        issueDate?: string;
      };
    }) => {
      // Generate proper filename upfront instead of using timestamp
      let fileName = file.name;
      
      // If we have certificate data, generate the proper filename immediately
      if (certificateData?.certificateName && certificateData?.employeeName) {
        const fileExt = file.name.split('.').pop() || 'pdf';
        
        // Format date as yymmdd
        let datePrefix = '';
        if (certificateData.issueDate) {
          const date = new Date(certificateData.issueDate);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear().toString().slice(-2);
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            datePrefix = `${year}${month}${day}`;
          }
        }
        
        // Fallback to current date if no valid issue date
        if (!datePrefix) {
          const now = new Date();
          const year = now.getFullYear().toString().slice(-2);
          const month = (now.getMonth() + 1).toString().padStart(2, '0');
          const day = now.getDate().toString().padStart(2, '0');
          datePrefix = `${year}${month}${day}`;
        }
        
        // Clean certificate name (remove special characters, limit length)
        const cleanCertName = certificateData.certificateName
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .trim()
          .substring(0, 30)
          .replace(/\s+/g, ' ');
        
        // Clean employee name 
        const cleanEmployeeName = certificateData.employeeName
          .replace(/[^a-zA-Z0-9\s,.]/g, '')
          .trim()
          .substring(0, 25);
        
        fileName = `${datePrefix} - ${cleanCertName} - ${cleanEmployeeName}.${fileExt}`;
      } else {
        // Fallback: use original filename with timestamp only if no certificate data
        const fileExt = file.name.split('.').pop();
        fileName = `${Date.now()}_${file.name}`;
      }

      const filePath = `certificate-documents/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false // Don't overwrite existing files
        });

      if (uploadError) throw uploadError;

      // Get current user for uploaded_by
      const { data: currentUser } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('employee_id')
        .eq('id', currentUser.user?.id)
        .single();

      // Create document record
      const documentData: CertificateDocumentInsert = {
        employee_id: employeeId || null,
        license_id: licenseId || null,
        file_name: fileName, // Use the generated filename, not original
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        processing_status: 'pending',
        uploaded_by: userProfile?.employee_id || null
      };

      const { data, error } = await supabase
        .from('certificate_documents')
        .insert(documentData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-documents'] });
      queryClient.invalidateQueries({ queryKey: ['pending-documents'] });
    },
  });

  const processDocument = useMutation({
    mutationFn: async (documentId: string) => {
      // Import the document processing service dynamically to avoid circular imports
      const { documentProcessingService } = await import('@/services/ai/document-processing-service');
      
      // Process document with AI
      const result = await documentProcessingService.processDocument(documentId);
      
      if (!result.success) {
        throw new Error(result.errors?.[0] || 'Document processing failed');
      }

      // Return the updated document record
      const { data, error } = await supabase
        .from('certificate_documents')
        .select()
        .eq('id', documentId)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-documents'] });
      queryClient.invalidateQueries({ queryKey: ['pending-documents'] });
      queryClient.invalidateQueries({ queryKey: ['documents-for-verification'] });
    },
  });

  const verifyDocument = useMutation({
    mutationFn: async ({ 
      documentId, 
      isApproved, 
      notes,
      employeeId,
      licenseId
    }: { 
      documentId: string; 
      isApproved: boolean; 
      notes?: string;
      employeeId?: string;
      licenseId?: string;
    }) => {
      const { data: currentUser } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('employee_id')
        .eq('id', currentUser.user?.id)
        .single();

      const updateData: CertificateDocumentUpdate = {
        verification_status: isApproved ? 'verified' : 'rejected',
        verified_by: userProfile?.employee_id || null,
        verified_at: new Date().toISOString(),
        verification_notes: notes,
        employee_id: employeeId,
        license_id: licenseId
      };

      const { data, error } = await supabase
        .from('certificate_documents')
        .update(updateData)
        .eq('id', documentId)
        .select()
        .single();

      if (error) throw error;

      // If approved and we have employee/license info, create employee_license record
      if (isApproved && employeeId && licenseId) {
        const document = data as CertificateDocument;
        
        const employeeLicenseData = {
          employee_id: employeeId,
          license_id: licenseId,
          certificate_number: document.extracted_certificate_number,
          issue_date: document.extracted_issue_date,
          expiry_date: document.extracted_expiry_date,
          status: 'valid' as const,
          level_achieved: 1 // Default to level 1, can be updated later
        };

        await supabase
          .from('employee_licenses')
          .insert(employeeLicenseData);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-documents'] });
      queryClient.invalidateQueries({ queryKey: ['documents-for-verification'] });
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      queryClient.invalidateQueries({ queryKey: ['employee-licenses'] });
    },
  });

  const updateDocumentMetadata = useMutation({
    mutationFn: async ({ 
      documentId, 
      updates 
    }: { 
      documentId: string; 
      updates: Partial<CertificateDocumentUpdate>;
    }) => {
      const { data, error } = await supabase
        .from('certificate_documents')
        .update(updates)
        .eq('id', documentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-documents'] });
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (documentId: string) => {
      // First get the document to find the file path
      const { data: document } = await supabase
        .from('certificate_documents')
        .select('file_path')
        .eq('id', documentId)
        .single();

      // Delete from storage
      if (document?.file_path) {
        await supabase.storage
          .from('documents')
          .remove([document.file_path]);
      }

      // Delete from database
      const { error } = await supabase
        .from('certificate_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-documents'] });
      queryClient.invalidateQueries({ queryKey: ['pending-documents'] });
      queryClient.invalidateQueries({ queryKey: ['documents-for-verification'] });
    },
  });

  const cleanupOrphanedDocuments = useMutation({
    mutationFn: async () => {
      // Get all certificate documents
      const { data: documents, error: fetchError } = await supabase
        .from('certificate_documents')
        .select('id, file_path');

      if (fetchError) throw fetchError;

      if (!documents || documents.length === 0) return { cleaned: 0 };

      let cleanedCount = 0;
      
      // Check each document's file existence
      for (const doc of documents) {
        if (!doc.file_path) continue;
        
        try {
          // Try to create a signed URL to check if file exists
          const { error } = await supabase.storage
            .from('documents')
            .createSignedUrl(doc.file_path, 60); // Short expiry for testing
          
          // If error indicates file not found, delete the database record
          if (error && error.message?.includes('Object not found')) {
            await supabase
              .from('certificate_documents')
              .delete()
              .eq('id', doc.id);
            cleanedCount++;
          }
        } catch (error) {
          // If there's an error accessing the file, consider it missing
          await supabase
            .from('certificate_documents')
            .delete()
            .eq('id', doc.id);
          cleanedCount++;
        }
      }

      return { cleaned: cleanedCount };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-documents'] });
      queryClient.invalidateQueries({ queryKey: ['pending-documents'] });
      queryClient.invalidateQueries({ queryKey: ['documents-for-verification'] });
    },
  });

  return {
    uploadDocument,
    processDocument,
    verifyDocument,
    updateDocumentMetadata,
    deleteDocument,
    cleanupOrphanedDocuments,
  };
};

// Utility functions
export const getProcessingStatusColor = (status: string): string => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

export const getVerificationStatusColor = (status: string): string => {
  const colors = {
    unverified: 'bg-gray-100 text-gray-800',
    verified: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

export const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.9) return 'text-green-600';
  if (confidence >= 0.7) return 'text-yellow-600';
  return 'text-red-600';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const isImageFile = (mimeType: string): boolean => {
  return mimeType.startsWith('image/');
};

export const isPdfFile = (mimeType: string): boolean => {
  return mimeType === 'application/pdf';
};

export const getFileIcon = (mimeType: string): string => {
  if (isImageFile(mimeType)) return '🖼️';
  if (isPdfFile(mimeType)) return '📄';
  return '📎';
};