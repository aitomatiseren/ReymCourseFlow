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
            id, name, category
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
            id, name, category
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
            id, name, category
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
    mutationFn: async ({ file, employeeId, licenseId }: {
      file: File;
      employeeId?: string;
      licenseId?: string;
    }) => {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `certificate-documents/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

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
        file_name: file.name,
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

  return {
    uploadDocument,
    processDocument,
    verifyDocument,
    updateDocumentMetadata,
    deleteDocument,
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