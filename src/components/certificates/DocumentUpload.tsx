import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  Download,
  Loader2,
  FileText,
  Image as ImageIcon,
  Zap
} from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useLicenses, useCertificateManagement } from '@/hooks/useCertificates';
import { supabase } from '@/integrations/supabase/client';
import { 
  useDocumentManagement,
  formatFileSize,
  isImageFile,
  isPdfFile,
  getFileIcon
} from '@/hooks/useCertificateDocuments';
import { toast } from '@/hooks/use-toast';

interface DocumentUploadProps {
  prefilledEmployeeId?: string;
  prefilledLicenseId?: string;
  onUploadComplete?: (documentId: string) => void;
  showEmployeeSelection?: boolean;
  showLicenseSelection?: boolean;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  documentId?: string;
  error?: string;
  aiExtractedData?: {
    employeeName?: string;
    certificateNumber?: string;
    issueDate?: string;
    expiryDate?: string;
    certificateType?: string;
    confidence?: number;
    employeeSuggestion?: any;
    licenseSuggestion?: any;
  };
  selectedEmployeeId?: string;
  selectedLicenseId?: string;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  prefilledEmployeeId,
  prefilledLicenseId,
  onUploadComplete,
  showEmployeeSelection = true,
  showLicenseSelection = true
}) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(prefilledEmployeeId || '__auto__');
  const [selectedLicenseId, setSelectedLicenseId] = useState(prefilledLicenseId || '__auto__');
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [autoProcess, setAutoProcess] = useState(true);
  const [editingFileIndex, setEditingFileIndex] = useState<number | null>(null);

  const { data: employees } = useEmployees();
  const { data: licenses } = useLicenses();
  const { uploadDocument, processDocument } = useDocumentManagement();
  const { createEmployeeLicense } = useCertificateManagement();

  // Format date from YYYY-MM-DD to DD-MM-YYYY for display
  const formatDateForDisplay = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Format employee name as "Last, First Initial" (e.g., "Kroes, R." or "Ven, J. van de")
  const formatEmployeeNameForFile = (employee: any) => {
    if (!employee) return 'Unknown';
    
    // Try to use Dutch name components first
    if (employee.lastName) {
      const firstInitial = employee.roepnaam?.[0] || employee.firstName?.[0] || employee.name?.[0] || 'X';
      const tussenvoegsel = employee.tussenvoegsel ? ` ${employee.tussenvoegsel}` : '';
      return `${employee.lastName}, ${firstInitial}.${tussenvoegsel}`;
    }
    
    // Fallback to parsing full name
    const nameParts = employee.name?.split(' ') || ['Unknown'];
    if (nameParts.length === 1) {
      return nameParts[0];
    }
    
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];
    const firstInitial = firstName[0] || 'X';
    
    // Handle middle parts (tussenvoegsels)
    const middleParts = nameParts.slice(1, -1);
    const tussenvoegsel = middleParts.length > 0 ? ` ${middleParts.join(' ')}` : '';
    
    return `${lastName}, ${firstInitial}.${tussenvoegsel}`;
  };

  // Generate filename in format: yymmdd - Certificate name - Employee name
  const generateCertificateFilename = (
    originalFilename: string,
    certificateName: string,
    employeeName: string,
    issueDate?: string
  ) => {
    // Get file extension
    const extension = originalFilename.split('.').pop() || 'pdf';
    
    // Format date as yymmdd
    let datePrefix = '';
    if (issueDate) {
      const date = new Date(issueDate);
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
    const cleanCertName = certificateName
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .trim()
      .substring(0, 30)
      .replace(/\s+/g, ' ');
    
    // Clean employee name
    const cleanEmployeeName = employeeName
      .replace(/[^a-zA-Z0-9\s,.]/g, '')
      .trim()
      .substring(0, 25);
    
    return `${datePrefix} - ${cleanCertName} - ${cleanEmployeeName}.${extension}`;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newUploadingFiles: UploadingFile[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }));

    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      const uploadingFileIndex = uploadingFiles.length + i;

      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadingFiles(prev => 
            prev.map((uf, index) => 
              index === uploadingFileIndex && uf.status === 'uploading'
                ? { ...uf, progress: Math.min(uf.progress + 10, 90) }
                : uf
            )
          );
        }, 200);

        // Upload the file (without certificate data yet, will be set after AI processing)
        const result = await uploadDocument.mutateAsync({
          file,
          employeeId: selectedEmployeeId === '__auto__' ? undefined : selectedEmployeeId,
          licenseId: selectedLicenseId === '__auto__' ? undefined : selectedLicenseId
        });

        clearInterval(progressInterval);

        // Update to completed upload
        setUploadingFiles(prev => 
          prev.map((uf, index) => 
            index === uploadingFileIndex
              ? { ...uf, progress: 100, status: 'completed', documentId: result.id }
              : uf
          )
        );

        // Auto-process if enabled
        if (autoProcess) {
          setUploadingFiles(prev => 
            prev.map((uf, index) => 
              index === uploadingFileIndex
                ? { ...uf, status: 'processing' }
                : uf
            )
          );

          try {
            const processedDocument = await processDocument.mutateAsync(result.id);
            
            // Extract AI data from the processed document
            const aiData = processedDocument.ai_extracted_data || {};
            const extractedData = {
              employeeName: processedDocument.extracted_employee_name,
              certificateNumber: processedDocument.extracted_certificate_number,
              issueDate: processedDocument.extracted_issue_date,
              expiryDate: processedDocument.extracted_expiry_date,
              certificateType: processedDocument.extracted_license_type,
              issuer: processedDocument.extracted_issuer,
              confidence: processedDocument.ai_confidence_score,
              employeeSuggestion: aiData.employee_suggestion,
              licenseSuggestion: aiData.license_suggestion
            };

            // Try to automatically match employee by name (only if not manually pre-selected)
            let matchedEmployeeId = (selectedEmployeeId !== '__auto__' ? selectedEmployeeId : '') || ''; // Use pre-selected employee if available
            let matchedLicenseId = (selectedLicenseId !== '__auto__' ? selectedLicenseId : '') || ''; // Use pre-selected license if available
            
            
            // Only auto-match employee if no employee was pre-selected (or set to auto)
            if ((!selectedEmployeeId || selectedEmployeeId === '__auto__') && extractedData.employeeName && employees) {
              const normalizedExtractedName = extractedData.employeeName.toLowerCase().trim();
              
              // Try to find exact match first
              let matchedEmployee = employees.find(emp => 
                emp.name?.toLowerCase().trim() === normalizedExtractedName
              );
              
              // If no exact match, try partial matches
              if (!matchedEmployee) {
                matchedEmployee = employees.find(emp => {
                  const empName = emp.name?.toLowerCase().trim() || '';
                  const firstName = emp.firstName?.toLowerCase().trim() || '';
                  const lastName = emp.lastName?.toLowerCase().trim() || '';
                  const roepnaam = emp.roepnaam?.toLowerCase().trim() || '';
                  
                  
                  // Check if extracted name contains employee's name parts
                  if (empName.includes(normalizedExtractedName) ||
                      normalizedExtractedName.includes(empName) ||
                      (firstName && lastName && 
                       normalizedExtractedName.includes(firstName) && 
                       normalizedExtractedName.includes(lastName)) ||
                      (roepnaam && lastName && 
                       normalizedExtractedName.includes(roepnaam) && 
                       normalizedExtractedName.includes(lastName))) {
                    return true;
                  }
                  
                  // Check for initial + last name patterns (e.g., "R. Kroes", "R Kroes")
                  const initialPattern = /^([a-z])[.\s]*([a-z]+)$/i;
                  const match = normalizedExtractedName.match(initialPattern);
                  if (match) {
                    const [, initial, lastNameFromExtracted] = match;
                    const initialLower = initial.toLowerCase();
                    const lastNameLower = lastNameFromExtracted.toLowerCase();
                    
                    
                    // Check if initial matches first name, roepnaam, or name
                    const firstNameMatch = firstName && firstName.startsWith(initialLower);
                    const roepnaamMatch = roepnaam && roepnaam.startsWith(initialLower);
                    const nameMatch = empName && empName.startsWith(initialLower);
                    
                    // Check if last name matches
                    const lastNameMatch = lastName && lastName === lastNameLower;
                    
                    if ((firstNameMatch || roepnaamMatch || nameMatch) && lastNameMatch) {
                      return true;
                    }
                  }
                  
                  return false;
                });
              }
              
              if (matchedEmployee) {
                matchedEmployeeId = matchedEmployee.id;
              }
            }

            // Only auto-match license/certificate type if no license was pre-selected (or set to auto)
            if ((!selectedLicenseId || selectedLicenseId === '__auto__') && extractedData.certificateType && licenses) {
              const normalizedCertType = extractedData.certificateType.toLowerCase().trim();
              const matchedLicense = licenses.find(license => 
                license.name?.toLowerCase().includes(normalizedCertType) ||
                normalizedCertType.includes(license.name?.toLowerCase() || '')
              );
              
              if (matchedLicense) {
                matchedLicenseId = matchedLicense.id;
              }
            }
            
            setUploadingFiles(prev => 
              prev.map((uf, index) => 
                index === uploadingFileIndex
                  ? { 
                      ...uf, 
                      status: 'completed', 
                      aiExtractedData: extractedData,
                      selectedEmployeeId: matchedEmployeeId,
                      selectedLicenseId: matchedLicenseId
                    }
                  : uf
              )
            );

            const autoMatchMessages = [];
            if (matchedEmployeeId) {
              const employeeName = employees?.find(e => e.id === matchedEmployeeId)?.name;
              autoMatchMessages.push(`Employee: ${employeeName}`);
            }
            if (matchedLicenseId) {
              const licenseName = licenses?.find(l => l.id === matchedLicenseId)?.name;
              autoMatchMessages.push(`Certificate: ${licenseName}`);
            }
            
            toast({
              title: "Document processed successfully",
              description: `${file.name} has been uploaded and processed with AI.${
                autoMatchMessages.length > 0 
                  ? ` Auto-matched: ${autoMatchMessages.join(', ')}`
                  : ''
              }`
            });

            onUploadComplete?.(result.id);
          } catch (error) {
            setUploadingFiles(prev => 
              prev.map((uf, index) => 
                index === uploadingFileIndex
                  ? { ...uf, status: 'error', error: 'AI processing failed' }
                  : uf
              )
            );
          }
        } else {
          toast({
            title: "Document uploaded successfully",
            description: `${file.name} has been uploaded. You can process it with AI later.`
          });

          onUploadComplete?.(result.id);
        }

      } catch (error) {
        setUploadingFiles(prev => 
          prev.map((uf, index) => 
            index === uploadingFileIndex
              ? { ...uf, status: 'error', error: 'Upload failed' }
              : uf
          )
        );

        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}. Please try again.`,
          variant: "destructive"
        });
      }
    }
  }, [selectedEmployeeId, selectedLicenseId, uploadDocument, processDocument, autoProcess, uploadingFiles.length, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  });

  const removeUploadingFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const retryUpload = async (index: number) => {
    const uploadingFile = uploadingFiles[index];
    if (!uploadingFile) return;

    setUploadingFiles(prev => 
      prev.map((uf, i) => 
        i === index ? { ...uf, status: 'uploading', progress: 0, error: undefined } : uf
      )
    );

    // Retry the upload
    onDrop([uploadingFile.file]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'processing':
        return <Zap className="h-4 w-4 text-yellow-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <File className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploading': return 'Uploading...';
      case 'processing': return 'AI Processing...';
      case 'completed': return 'Completed';
      case 'error': return 'Error';
      default: return 'Pending';
    }
  };

  return (
    <div className="space-y-6">
      {/* Selection Controls */}
      {(showEmployeeSelection || showLicenseSelection) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upload Settings</CardTitle>
            <CardDescription>
              Configure the upload settings before dropping files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {showEmployeeSelection && (
                <div className="space-y-2">
                  <Label>Employee (Optional)</Label>
                  <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="AI will try to detect employee..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__auto__">Let AI detect employee</SelectItem>
                      {employees?.map(employee => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name} ({employee.employee_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {showLicenseSelection && (
                <div className="space-y-2">
                  <Label>Certificate Type (Optional)</Label>
                  <Select value={selectedLicenseId} onValueChange={setSelectedLicenseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="AI will try to detect certificate..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__auto__">Let AI detect certificate</SelectItem>
                      {licenses?.map(license => (
                        <SelectItem key={license.id} value={license.id}>
                          {license.name} ({license.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

          </CardContent>
        </Card>
      )}

      {/* Upload Dropzone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Certificate Documents
          </CardTitle>
          <CardDescription>
            Drag and drop certificate files here, or click to browse. Supports PDF and image files up to 10MB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Upload className="h-8 w-8 text-gray-600" />
              </div>
              {isDragActive ? (
                <p className="text-lg font-medium text-blue-600">
                  Drop the files here...
                </p>
              ) : (
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Drop certificate files here
                  </p>
                  <p className="text-gray-600">
                    or click to browse your computer
                  </p>
                </div>
              )}
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <FileText className="h-4 w-4" />
                  <span>PDF</span>
                </div>
                <div className="flex items-center space-x-1">
                  <ImageIcon className="h-4 w-4" />
                  <span>Images</span>
                </div>
                <span>•</span>
                <span>Max 10MB</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <File className="h-5 w-5" />
              Upload Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadingFiles.map((uploadingFile, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">
                        {getFileIcon(uploadingFile.file.type)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{uploadingFile.file.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(uploadingFile.file.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(uploadingFile.status)}
                      <Badge variant={uploadingFile.status === 'error' ? 'destructive' : 'outline'}>
                        {getStatusText(uploadingFile.status)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUploadingFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {uploadingFile.status === 'uploading' && (
                    <Progress value={uploadingFile.progress} className="h-2" />
                  )}

                  {uploadingFile.status === 'processing' && (
                    <div className="flex items-center space-x-2 text-sm text-yellow-600">
                      <Zap className="h-4 w-4" />
                      <span>AI is analyzing the document...</span>
                    </div>
                  )}

                  {uploadingFile.status === 'error' && (
                    <div className="space-y-2">
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {uploadingFile.error || 'An error occurred during upload'}
                        </AlertDescription>
                      </Alert>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => retryUpload(index)}
                      >
                        Retry Upload
                      </Button>
                    </div>
                  )}

                  {uploadingFile.status === 'completed' && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>
                          Document uploaded and {autoProcess ? 'processed' : 'ready for processing'}
                        </span>
                      </div>
                      
                      {/* AI Extracted Data Editor */}
                      {uploadingFile.aiExtractedData && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-blue-900">AI Extracted Information</h4>
                            <Badge variant="outline" className="text-xs">
                              {Math.round((uploadingFile.aiExtractedData.confidence || 0) * 100)}% confidence
                            </Badge>
                          </div>
                          
                          {editingFileIndex === index ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label htmlFor="employee-name" className="text-xs">Employee Name</Label>
                                  <Input
                                    id="employee-name"
                                    value={uploadingFile.aiExtractedData.employeeName || ''}
                                    onChange={(e) => {
                                      setUploadingFiles(prev => 
                                        prev.map((uf, idx) => 
                                          idx === index && uf.aiExtractedData
                                            ? { ...uf, aiExtractedData: { ...uf.aiExtractedData, employeeName: e.target.value } }
                                            : uf
                                        )
                                      );
                                    }}
                                    className="h-8 text-xs"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="certificate-number" className="text-xs">Certificate Number</Label>
                                  <Input
                                    id="certificate-number"
                                    value={uploadingFile.aiExtractedData.certificateNumber || ''}
                                    onChange={(e) => {
                                      setUploadingFiles(prev => 
                                        prev.map((uf, idx) => 
                                          idx === index && uf.aiExtractedData
                                            ? { ...uf, aiExtractedData: { ...uf.aiExtractedData, certificateNumber: e.target.value } }
                                            : uf
                                        )
                                      );
                                    }}
                                    className="h-8 text-xs"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="issue-date" className="text-xs">Issue Date</Label>
                                  <Input
                                    id="issue-date"
                                    type="date"
                                    value={uploadingFile.aiExtractedData.issueDate || ''}
                                    onChange={(e) => {
                                      setUploadingFiles(prev => 
                                        prev.map((uf, idx) => 
                                          idx === index && uf.aiExtractedData
                                            ? { ...uf, aiExtractedData: { ...uf.aiExtractedData, issueDate: e.target.value } }
                                            : uf
                                        )
                                      );
                                    }}
                                    className="h-8 text-xs"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="expiry-date" className="text-xs">Expiry Date</Label>
                                  <Input
                                    id="expiry-date"
                                    type="date"
                                    value={uploadingFile.aiExtractedData.expiryDate || ''}
                                    onChange={(e) => {
                                      setUploadingFiles(prev => 
                                        prev.map((uf, idx) => 
                                          idx === index && uf.aiExtractedData
                                            ? { ...uf, aiExtractedData: { ...uf.aiExtractedData, expiryDate: e.target.value } }
                                            : uf
                                        )
                                      );
                                    }}
                                    className="h-8 text-xs"
                                  />
                                </div>
                              </div>
                              
                              {/* Employee and License Selection */}
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label htmlFor="employee-select" className="text-xs">Select Employee</Label>
                                  <Select 
                                    value={uploadingFile.selectedEmployeeId || ''} 
                                    onValueChange={(value) => {
                                      setUploadingFiles(prev => 
                                        prev.map((uf, idx) => 
                                          idx === index ? { ...uf, selectedEmployeeId: value } : uf
                                        )
                                      );
                                    }}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="Choose employee..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {employees?.map(employee => (
                                        <SelectItem key={employee.id} value={employee.id}>
                                          {employee.name} ({employee.employee_number})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="license-select" className="text-xs">Select Certificate Type</Label>
                                  <Select 
                                    value={uploadingFile.selectedLicenseId || ''} 
                                    onValueChange={(value) => {
                                      setUploadingFiles(prev => 
                                        prev.map((uf, idx) => 
                                          idx === index ? { ...uf, selectedLicenseId: value } : uf
                                        )
                                      );
                                    }}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="Choose certificate type..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {licenses?.map(license => (
                                        <SelectItem key={license.id} value={license.id}>
                                          {license.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              
                              {/* Filename Preview */}
                              {uploadingFile.selectedEmployeeId && uploadingFile.selectedLicenseId && (
                                <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                                  <Label className="text-xs font-medium text-blue-800">File will be saved as:</Label>
                                  <div className="text-xs text-blue-700 mt-1 font-mono break-all">
                                    {(() => {
                                      const selectedEmployee = employees?.find(e => e.id === uploadingFile.selectedEmployeeId);
                                      const selectedLicense = licenses?.find(l => l.id === uploadingFile.selectedLicenseId);
                                      if (selectedEmployee && selectedLicense) {
                                        const formattedEmployeeName = formatEmployeeNameForFile(selectedEmployee);
                                        const certificateName = selectedLicense.name || 'Certificate';
                                        const issueDate = uploadingFile.aiExtractedData?.issueDate;
                                        return generateCertificateFilename(
                                          uploadingFile.file.name,
                                          certificateName,
                                          formattedEmployeeName,
                                          issueDate
                                        );
                                      }
                                      return 'Generating filename...';
                                    })()}
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex justify-end space-x-2 mt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingFileIndex(null)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    // TODO: Save the edited data
                                    setEditingFileIndex(null);
                                    toast({
                                      title: "Changes saved",
                                      description: "AI extracted data has been updated."
                                    });
                                  }}
                                >
                                  Save Changes
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="font-medium">Employee:</span> {uploadingFile.aiExtractedData.employeeName || 'Not detected'}
                                </div>
                                <div>
                                  <span className="font-medium">Certificate:</span> {uploadingFile.aiExtractedData.certificateNumber || 'Not detected'}
                                </div>
                                <div>
                                  <span className="font-medium">Issue Date:</span> {formatDateForDisplay(uploadingFile.aiExtractedData.issueDate) || 'Not detected'}
                                </div>
                                <div>
                                  <span className="font-medium">Expiry Date:</span> {formatDateForDisplay(uploadingFile.aiExtractedData.expiryDate) || 'Not detected'}
                                </div>
                              </div>
                              
                              {/* Show selected employee and license */}
                              <div className="border-t pt-2 mt-2">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="font-medium">Selected Employee:</span> {
                                      uploadingFile.selectedEmployeeId 
                                        ? employees?.find(e => e.id === uploadingFile.selectedEmployeeId)?.name || 'Unknown'
                                        : 'Not selected'
                                    }
                                  </div>
                                  <div>
                                    <span className="font-medium">Selected Certificate Type:</span> {
                                      uploadingFile.selectedLicenseId 
                                        ? licenses?.find(l => l.id === uploadingFile.selectedLicenseId)?.name || 'Unknown'
                                        : 'Not selected'
                                    }
                                  </div>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingFileIndex(index)}
                                  className="flex-1"
                                >
                                  Edit AI Extracted Data
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={async () => {
                                    if (!uploadingFile.selectedEmployeeId || !uploadingFile.selectedLicenseId) {
                                      toast({
                                        title: "Missing information",
                                        description: "Please select both an employee and certificate type.",
                                        variant: "destructive"
                                      });
                                      return;
                                    }

                                    if (!uploadingFile.documentId) {
                                      toast({
                                        title: "Upload error",
                                        description: "Document ID is missing. Please re-upload the file.",
                                        variant: "destructive"
                                      });
                                      return;
                                    }

                                    try {
                                      // Get employee and license details for filename generation
                                      const selectedEmployee = employees?.find(e => e.id === uploadingFile.selectedEmployeeId);
                                      const selectedLicense = licenses?.find(l => l.id === uploadingFile.selectedLicenseId);
                                      
                                      if (!selectedEmployee || !selectedLicense) {
                                        throw new Error('Selected employee or license not found');
                                      }

                                      // Generate new filename
                                      const formattedEmployeeName = formatEmployeeNameForFile(selectedEmployee);
                                      const certificateName = selectedLicense.name || 'Certificate';
                                      const issueDate = uploadingFile.aiExtractedData?.issueDate;
                                      const newFilename = generateCertificateFilename(
                                        uploadingFile.file.name,
                                        certificateName,
                                        formattedEmployeeName,
                                        issueDate
                                      );

                                      // Update document record with proper filename in database
                                      try {
                                        await supabase
                                          .from('certificate_documents')
                                          .update({ 
                                            file_name: newFilename 
                                          })
                                          .eq('id', uploadingFile.documentId);
                                      } catch (updateError) {
                                        console.warn('Failed to update document filename:', updateError);
                                      }

                                      // Prepare certificate data from AI extraction
                                      const certificateData = {
                                        employee_id: uploadingFile.selectedEmployeeId,
                                        license_id: uploadingFile.selectedLicenseId,
                                        certificate_number: uploadingFile.aiExtractedData?.certificateNumber || '',
                                        issue_date: uploadingFile.aiExtractedData?.issueDate || null,
                                        expiry_date: uploadingFile.aiExtractedData?.expiryDate || null,
                                        issuer: uploadingFile.aiExtractedData?.issuer || null
                                      };

                                      // Check for actual duplicates (same cert number AND same expiry date)
                                      const { data: existingCertificates, error: checkError } = await supabase
                                        .from('employee_licenses')
                                        .select('id, certificate_number, expiry_date, issue_date')
                                        .eq('employee_id', uploadingFile.selectedEmployeeId)
                                        .eq('license_id', uploadingFile.selectedLicenseId);

                                      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
                                        console.error('Error checking existing certificates:', checkError);
                                        throw checkError;
                                      }

                                      // Check for exact duplicates (same cert number AND same expiry date)
                                      const newCertNumber = certificateData.certificate_number;
                                      const newExpiryDate = certificateData.expiry_date;
                                      
                                      if (existingCertificates && existingCertificates.length > 0 && newCertNumber) {
                                        const exactDuplicate = existingCertificates.find(existing => 
                                          existing.certificate_number === newCertNumber &&
                                          existing.expiry_date === newExpiryDate
                                        );
                                        
                                        if (exactDuplicate) {
                                          toast({
                                            title: "Duplicate certificate detected",
                                            description: `This exact certificate (${newCertNumber} expiring ${newExpiryDate}) already exists. This appears to be a true duplicate.`,
                                            variant: "destructive"
                                          });
                                          return;
                                        }
                                        
                                        // Check for renewals (same cert number, different expiry date)
                                        const renewal = existingCertificates.find(existing => 
                                          existing.certificate_number === newCertNumber &&
                                          existing.expiry_date !== newExpiryDate
                                        );
                                        
                                      }

                                      // Save to database and get the new employee license record
                                      const newEmployeeLicense = await createEmployeeLicense.mutateAsync(certificateData);
                                      
                                      // Link the certificate document to the employee license
                                      if (newEmployeeLicense && uploadingFile.documentId) {
                                        await supabase
                                          .from('certificate_documents')
                                          .update({ employee_license_id: newEmployeeLicense.id })
                                          .eq('id', uploadingFile.documentId);
                                      }

                                      // Remove from uploading files list
                                      setUploadingFiles(prev => prev.filter((_, idx) => idx !== index));

                                      toast({
                                        title: "Certificate saved successfully",
                                        description: `Certificate saved as "${newFilename}" and added to ${selectedEmployee.name}'s record.`,
                                        duration: 5000
                                      });

                                      // Call completion callback
                                      onUploadComplete?.(uploadingFile.documentId!);
                                    } catch (error) {
                                      console.error('Error saving certificate:', error);
                                      toast({
                                        title: "Save failed",
                                        description: "Failed to save certificate. Please try again.",
                                        variant: "destructive"
                                      });
                                    }
                                  }}
                                  className="flex-1"
                                  disabled={!uploadingFile.selectedEmployeeId || !uploadingFile.selectedLicenseId || createEmployeeLicense.isPending}
                                >
                                  {createEmployeeLicense.isPending ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Saving...
                                    </>
                                  ) : (
                                    'Confirm & Save'
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Processing Info */}
      <Alert>
        <Zap className="h-4 w-4" />
        <AlertDescription>
          <strong>AI-Powered Processing:</strong> Our AI will automatically extract certificate information including:
          employee names, certificate numbers, issue dates, expiry dates, and issuing authorities. 
          You can review and verify the extracted data before finalizing.
        </AlertDescription>
      </Alert>
    </div>
  );
};