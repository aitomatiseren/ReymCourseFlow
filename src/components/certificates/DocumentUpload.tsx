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
import { useLicenses } from '@/hooks/useCertificates';
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

  const { data: employees } = useEmployees();
  const { data: licenses } = useLicenses();
  const { uploadDocument, processDocument } = useDocumentManagement();

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

        // Upload the file
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
            await processDocument.mutateAsync(result.id);
            
            setUploadingFiles(prev => 
              prev.map((uf, index) => 
                index === uploadingFileIndex
                  ? { ...uf, status: 'completed' }
                  : uf
              )
            );

            toast({
              title: "Document processed successfully",
              description: `${file.name} has been uploaded and processed with AI.`
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

            <div className="mt-4 flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoProcess"
                checked={autoProcess}
                onChange={(e) => setAutoProcess(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <Label htmlFor="autoProcess" className="text-sm">
                Automatically process with AI after upload
              </Label>
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
                    <div className="flex items-center space-x-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>
                        Document uploaded and {autoProcess ? 'processed' : 'ready for processing'}
                      </span>
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