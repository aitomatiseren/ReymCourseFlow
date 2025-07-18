import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Eye, 
  Trash2,
  Download,
  User,
  Calendar,
  Award,
  Settings,
  Loader2
} from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useLicenses } from '@/hooks/useCertificates';
import { toast } from '@/hooks/use-toast';

interface CertificateFile {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'reviewed' | 'approved' | 'rejected';
  extractedData?: {
    employeeName?: string;
    employeeId?: string;
    courseName?: string;
    issueDate?: string;
    expiryDate?: string;
    certificateNumber?: string;
    provider?: string;
  };
  manualData?: {
    employeeId?: string;
    licenseId?: string;
    issueDate?: string;
    expiryDate?: string;
    certificateNumber?: string;
    provider?: string;
  };
  error?: string;
}

export function BulkCertificateProcessor() {
  const [certificateFiles, setCertificateFiles] = useState<CertificateFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<CertificateFile | null>(null);
  
  const { data: employees = [] } = useEmployees();
  const { data: licenses = [] } = useLicenses();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: CertificateFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'pending'
    }));
    
    setCertificateFiles(prev => [...prev, ...newFiles]);
    
    // Start processing files
    setIsProcessing(true);
    processFiles(newFiles);
  }, []);

  const processFiles = async (files: CertificateFile[]) => {
    // Simulate AI processing
    for (const file of files) {
      setCertificateFiles(prev => 
        prev.map(f => f.id === file.id ? { ...f, status: 'processing' } : f)
      );
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate AI extraction (mock data)
      const extractedData = {
        employeeName: `John Doe`, // In real implementation, this would come from AI
        courseName: `VCA Safety Training`,
        issueDate: `2024-01-15`,
        expiryDate: `2027-01-15`,
        certificateNumber: `VCA-2024-001`,
        provider: `Safety First B.V.`
      };
      
      setCertificateFiles(prev => 
        prev.map(f => f.id === file.id ? { 
          ...f, 
          status: 'reviewed', 
          extractedData 
        } : f)
      );
    }
    
    setIsProcessing(false);
    toast({
      title: "Processing Complete",
      description: `${files.length} certificate(s) have been processed and are ready for review.`,
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  const updateManualData = (fileId: string, field: string, value: string) => {
    setCertificateFiles(prev => 
      prev.map(f => f.id === fileId ? {
        ...f,
        manualData: { ...f.manualData, [field]: value }
      } : f)
    );
  };

  const approveCertificate = (fileId: string) => {
    setCertificateFiles(prev => 
      prev.map(f => f.id === fileId ? { ...f, status: 'approved' } : f)
    );
    
    toast({
      title: "Certificate Approved",
      description: "Certificate has been approved and will be added to the employee's profile.",
    });
  };

  const rejectCertificate = (fileId: string) => {
    setCertificateFiles(prev => 
      prev.map(f => f.id === fileId ? { ...f, status: 'rejected' } : f)
    );
    
    toast({
      title: "Certificate Rejected",
      description: "Certificate has been rejected and will not be processed.",
      variant: "destructive"
    });
  };

  const removeCertificate = (fileId: string) => {
    setCertificateFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getStatusColor = (status: CertificateFile['status']) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'reviewed': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: CertificateFile['status']) => {
    switch (status) {
      case 'pending': return <Upload className="h-4 w-4" />;
      case 'processing': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'reviewed': return <Eye className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <AlertTriangle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const pendingCount = certificateFiles.filter(f => f.status === 'pending').length;
  const processingCount = certificateFiles.filter(f => f.status === 'processing').length;
  const reviewedCount = certificateFiles.filter(f => f.status === 'reviewed').length;
  const approvedCount = certificateFiles.filter(f => f.status === 'approved').length;
  const rejectedCount = certificateFiles.filter(f => f.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Certificate Upload
          </CardTitle>
          <CardDescription>
            Upload multiple certificate documents for batch processing. AI will extract employee information, course details, and dates.
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
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            {isDragActive ? (
              <p className="text-lg">Drop the certificates here...</p>
            ) : (
              <div>
                <p className="text-lg mb-2">Drag & drop certificate files here, or click to select</p>
                <p className="text-sm text-gray-500">Supports PDF, PNG, JPG files</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Processing Status */}
      {certificateFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{pendingCount}</div>
                <div className="text-sm text-gray-500">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{processingCount}</div>
                <div className="text-sm text-gray-500">Processing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{reviewedCount}</div>
                <div className="text-sm text-gray-500">Ready for Review</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
                <div className="text-sm text-gray-500">Approved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
                <div className="text-sm text-gray-500">Rejected</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Certificate List */}
      {certificateFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Certificate Processing Queue</CardTitle>
            <CardDescription>
              Review and approve each certificate individually. Make manual corrections as needed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {certificateFiles.map(certFile => (
                <div key={certFile.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div>
                        <div className="font-medium">{certFile.file.name}</div>
                        <div className="text-sm text-gray-500">
                          {(certFile.file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(certFile.status)}>
                        {getStatusIcon(certFile.status)}
                        <span className="ml-1 capitalize">{certFile.status}</span>
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCertificate(certFile.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {certFile.status === 'reviewed' && (
                    <div className="space-y-4">
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-3">Extracted Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`employee-${certFile.id}`}>Employee</Label>
                            <Select
                              value={certFile.manualData?.employeeId || ''}
                              onValueChange={(value) => updateManualData(certFile.id, 'employeeId', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={certFile.extractedData?.employeeName || 'Select employee'} />
                              </SelectTrigger>
                              <SelectContent>
                                {employees.map(employee => (
                                  <SelectItem key={employee.id} value={employee.id}>
                                    {employee.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor={`license-${certFile.id}`}>Certificate Type</Label>
                            <Select
                              value={certFile.manualData?.licenseId || ''}
                              onValueChange={(value) => updateManualData(certFile.id, 'licenseId', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={certFile.extractedData?.courseName || 'Select certificate type'} />
                              </SelectTrigger>
                              <SelectContent>
                                {licenses.map(license => (
                                  <SelectItem key={license.id} value={license.id}>
                                    {license.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor={`issue-${certFile.id}`}>Issue Date</Label>
                            <Input
                              id={`issue-${certFile.id}`}
                              type="date"
                              value={certFile.manualData?.issueDate || certFile.extractedData?.issueDate || ''}
                              onChange={(e) => updateManualData(certFile.id, 'issueDate', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`expiry-${certFile.id}`}>Expiry Date</Label>
                            <Input
                              id={`expiry-${certFile.id}`}
                              type="date"
                              value={certFile.manualData?.expiryDate || certFile.extractedData?.expiryDate || ''}
                              onChange={(e) => updateManualData(certFile.id, 'expiryDate', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`cert-number-${certFile.id}`}>Certificate Number</Label>
                            <Input
                              id={`cert-number-${certFile.id}`}
                              value={certFile.manualData?.certificateNumber || certFile.extractedData?.certificateNumber || ''}
                              onChange={(e) => updateManualData(certFile.id, 'certificateNumber', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`provider-${certFile.id}`}>Provider</Label>
                            <Input
                              id={`provider-${certFile.id}`}
                              value={certFile.manualData?.provider || certFile.extractedData?.provider || ''}
                              onChange={(e) => updateManualData(certFile.id, 'provider', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => approveCertificate(certFile.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => rejectCertificate(certFile.id)}
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Files Message */}
      {certificateFiles.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg text-gray-500">No certificates uploaded yet</p>
              <p className="text-sm text-gray-400">Upload certificate files to begin batch processing</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}