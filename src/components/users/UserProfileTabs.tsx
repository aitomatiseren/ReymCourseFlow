import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Award, 
  Calendar, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
  Eye,
  Activity,
  X,
} from "lucide-react";
import { EmployeeStatusManager } from "@/components/employee/EmployeeStatusManager";
import { useEmployee } from "@/hooks/useEmployees";
import { useTrainings } from "@/hooks/useTrainings";
import { useEmployeeTrainingHistory } from "@/hooks/useTrainingParticipants";
import { useCertificates } from "@/hooks/useCertificates";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserProfileTabsProps {
  userId: string;
}

// Helper function to determine certificate status
const getCertificateStatus = (expiryDate: string) => {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry < 30) return 'expiring';
  return 'valid';
};

// Helper function to format date for display
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const statusColors = {
  valid: "bg-green-100 text-green-800",
  expiring: "bg-orange-100 text-orange-800",
  expired: "bg-red-100 text-red-800",
  completed: "bg-green-100 text-green-800",
  enrolled: "bg-blue-100 text-blue-800",
  pending: "bg-yellow-100 text-yellow-800"
};

const statusIcons = {
  valid: CheckCircle,
  expiring: Clock,
  expired: AlertTriangle,
  completed: CheckCircle,
  enrolled: Clock,
  pending: Clock
};

export function UserProfileTabs({ userId }: UserProfileTabsProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [viewingDocument, setViewingDocument] = useState<{ url: string; name: string; type: string } | null>(null);
  
  // Fetch real data from hooks
  const { data: currentUser } = useEmployee(userId);
  const { data: allTrainings } = useTrainings();
  const { data: licenses } = useCertificates();
  const { data: employeeTrainingHistory } = useEmployeeTrainingHistory(userId);
  
  // Get user's certificates from employee_licenses
  const allUserCertificates = currentUser?.employee_licenses?.map(license => ({
    id: license.id,
    courseName: license.licenses?.name || 'Unknown Certificate',
    provider: license.issuer || 'Unknown Provider',
    issueDate: license.issue_date || '',
    expiryDate: license.expiry_date || '',
    status: license.expiry_date ? getCertificateStatus(license.expiry_date) : 'unknown',
    certificateNumber: license.certificate_number || 'N/A',
    licenseId: license.license_id,
    level: license.level_achieved || 1,
    supersedes: license.licenses?.supersedes_license_id
  })) || [];

  // Determine which certificates are active vs inactive
  const activeCertificates = allUserCertificates.filter(cert => {
    // Certificate is active if:
    // 1. Not expired
    if (cert.status === 'expired') return false;
    
    // 2. Not superseded by a higher level certificate of the same type
    const hasHigherLevel = allUserCertificates.some(otherCert => 
      otherCert.licenseId === cert.licenseId && 
      otherCert.level > cert.level &&
      otherCert.status !== 'expired'
    );
    if (hasHigherLevel) return false;
    
    // 3. Not superseded by a different certificate type that supersedes this one
    if (cert.supersedes) {
      const hasSupersedingCert = allUserCertificates.some(otherCert =>
        otherCert.licenseId === cert.supersedes &&
        otherCert.status !== 'expired'
      );
      if (hasSupersedingCert) return false;
    }
    
    return true;
  });

  const inactiveCertificates = allUserCertificates.filter(cert => 
    !activeCertificates.includes(cert)
  );
  
  // Get user's training history from employee training history
  const userTrainingHistory = employeeTrainingHistory?.map(tp => {
    const training = tp.trainings;
    return {
      id: tp.id,
      title: training?.title || 'Unknown Course',
      instructor: training?.instructor || 'Unknown Instructor',
      date: training?.date || '',
      status: tp.status || 'unknown',
      training_id: tp.training_id,
      location: training?.location || '',
      approval_status: tp.approval_status,
      registration_date: tp.registration_date
    };
  }) || [];

  // Handler functions for certificate actions
  const handleViewCertificate = async (certificateId: string) => {
    try {
      // Get certificate document from the database
      const { data: certificateDoc, error } = await supabase
        .from('certificate_documents')
        .select('file_path, file_name, mime_type')
        .eq('employee_license_id', certificateId)
        .maybeSingle(); // Use maybeSingle to avoid throwing on no results

      if (error) {
        console.error('Error fetching certificate document:', error);
        toast({
          title: "Error",
          description: "Failed to fetch certificate document",
          variant: "destructive"
        });
        return;
      }

      if (!certificateDoc) {
        toast({
          title: "No Document Found",
          description: "No document has been uploaded for this certificate yet.",
          variant: "destructive"
        });
        return;
      }

      // Get a signed URL for viewing the document
      const { data: signedUrl, error: urlError } = await supabase.storage
        .from('documents')
        .createSignedUrl(certificateDoc.file_path, 3600); // 1 hour expiry

      if (urlError || !signedUrl) {
        console.error('Signed URL error:', urlError);
        
        // Handle specific error cases
        if (urlError?.message?.includes('Object not found')) {
          toast({
            title: "Document Not Found",
            description: "The certificate document file is missing from storage. It may have been deleted or not properly uploaded.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: `Failed to generate document link: ${urlError?.message || 'Unknown error'}`,
            variant: "destructive"
          });
        }
        return;
      }

      // Open document in modal viewer
      setViewingDocument({
        url: signedUrl.signedUrl,
        name: certificateDoc.file_name,
        type: certificateDoc.mime_type
      });
    } catch (error) {
      console.error('Error viewing certificate:', error);
      toast({
        title: "Error",
        description: "Failed to view certificate document",
        variant: "destructive"
      });
    }
  };

  const handleDownloadCertificate = async (certificateId: string) => {
    try {
      // Get certificate document from the database
      const { data: certificateDoc, error } = await supabase
        .from('certificate_documents')
        .select('file_path, file_name, mime_type')
        .eq('employee_license_id', certificateId)
        .maybeSingle(); // Use maybeSingle to avoid throwing on no results

      if (error) {
        console.error('Error fetching certificate document:', error);
        toast({
          title: "Error",
          description: "Failed to fetch certificate document",
          variant: "destructive"
        });
        return;
      }

      if (!certificateDoc) {
        toast({
          title: "No Document Found",
          description: "No document has been uploaded for this certificate yet.",
          variant: "destructive"
        });
        return;
      }

      // Get a signed URL for downloading the document
      const { data: signedUrl, error: urlError } = await supabase.storage
        .from('documents')
        .createSignedUrl(certificateDoc.file_path, 3600); // 1 hour expiry

      if (urlError || !signedUrl) {
        console.error('Download signed URL error:', urlError);
        
        // Handle specific error cases
        if (urlError?.message?.includes('Object not found')) {
          toast({
            title: "Document Not Found",
            description: "The certificate document file is missing from storage. It may have been deleted or not properly uploaded.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: `Failed to generate download link: ${urlError?.message || 'Unknown error'}`,
            variant: "destructive"
          });
        }
        return;
      }

      // Force download by fetching the file and creating a blob
      try {
        const response = await fetch(signedUrl.signedUrl);
        const blob = await response.blob();
        
        // Create blob URL and trigger download
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = certificateDoc.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up blob URL
        window.URL.revokeObjectURL(blobUrl);
      } catch (fetchError) {
        console.error('Error downloading file:', fetchError);
        // Fallback to simple link download
        const link = document.createElement('a');
        link.href = signedUrl.signedUrl;
        link.download = certificateDoc.file_name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast({
        title: "Success",
        description: "Certificate download started"
      });
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast({
        title: "Error",
        description: "Failed to download certificate document",
        variant: "destructive"
      });
    }
  };

  const handleViewTrainingDetails = (trainingId: string) => {
    navigate(`/scheduling/${trainingId}`);
  };

  return (
    <>
      <Tabs defaultValue="certificates" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="certificates" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Certificates
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Training Courses
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Status History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="certificates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Certificates</CardTitle>
              <CardDescription>
                {allUserCertificates.length} total certificate(s) • {activeCertificates.length} active • {inactiveCertificates.length} inactive
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="active" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="active" className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Active ({activeCertificates.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="inactive" className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Inactive ({inactiveCertificates.length || 0})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-4">
                  {activeCertificates.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No active certificates found.</p>
                    </div>
                  ) : (
                    activeCertificates.map((cert) => {
                      const StatusIcon = statusIcons[cert.status as keyof typeof statusIcons] || CheckCircle;
                      
                      return (
                        <div key={cert.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-semibold">{cert.courseName}</h3>
                              <Badge className={statusColors[cert.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {cert.status}
                              </Badge>
                              {cert.level > 1 && (
                                <Badge variant="outline">Level {cert.level}</Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>
                                Issued: {cert.issueDate ? formatDate(cert.issueDate) : 'N/A'} • 
                                Expires: {cert.expiryDate ? formatDate(cert.expiryDate) : 'N/A'}
                              </div>
                              <div>Provider: {cert.provider}</div>
                              <div>Certificate #: {cert.certificateNumber}</div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm"
                              onClick={() => handleViewCertificate(cert.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDownloadCertificate(cert.id)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </TabsContent>

                <TabsContent value="inactive" className="space-y-4">
                  {inactiveCertificates.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No inactive certificates found.</p>
                    </div>
                  ) : (
                    inactiveCertificates.map((cert) => {
                      const StatusIcon = statusIcons[cert.status as keyof typeof statusIcons] || AlertTriangle;
                      
                      // Determine why this certificate is inactive
                      let inactiveReason = '';
                      if (cert.status === 'expired') {
                        inactiveReason = 'Expired';
                      } else {
                        const hasHigherLevel = allUserCertificates.some(otherCert => 
                          otherCert.licenseId === cert.licenseId && 
                          otherCert.level > cert.level &&
                          otherCert.status !== 'expired'
                        );
                        if (hasHigherLevel) {
                          inactiveReason = 'Superseded by higher level';
                        } else if (cert.supersedes) {
                          const hasSupersedingCert = allUserCertificates.some(otherCert =>
                            otherCert.licenseId === cert.supersedes &&
                            otherCert.status !== 'expired'
                          );
                          if (hasSupersedingCert) {
                            inactiveReason = 'Superseded by newer certificate';
                          }
                        }
                      }
                      
                      return (
                        <div key={cert.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 border-gray-200">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-semibold text-gray-700">{cert.courseName}</h3>
                              <Badge className={statusColors[cert.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {cert.status}
                              </Badge>
                              {cert.level > 1 && (
                                <Badge variant="outline">Level {cert.level}</Badge>
                              )}
                              {inactiveReason && (
                                <Badge variant="destructive" className="text-xs">
                                  {inactiveReason}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>
                                Issued: {cert.issueDate ? formatDate(cert.issueDate) : 'N/A'} • 
                                Expires: {cert.expiryDate ? formatDate(cert.expiryDate) : 'N/A'}
                              </div>
                              <div>Provider: {cert.provider}</div>
                              <div>Certificate #: {cert.certificateNumber}</div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm"
                              onClick={() => handleViewCertificate(cert.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDownloadCertificate(cert.id)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Training History & Upcoming Courses</CardTitle>
              <CardDescription>
                {userTrainingHistory.length} training(s) on record
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userTrainingHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No training history found for this employee.</p>
                  </div>
                ) : (
                  userTrainingHistory.map((course) => {
                    const StatusIcon = statusIcons[course.status as keyof typeof statusIcons] || Clock;
                    
                    return (
                      <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold">{course.title}</h3>
                            <Badge className={statusColors[course.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {course.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Instructor: {course.instructor}</div>
                            <div>Date: {course.date ? formatDate(course.date) : 'N/A'}</div>
                            {course.location && (
                              <div>Location: {course.location}</div>
                            )}
                            <div>Registered: {course.registration_date ? formatDate(course.registration_date) : 'N/A'}</div>
                            {course.approval_status && course.approval_status !== 'approved' && (
                              <div>Approval: {course.approval_status}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm"
                            onClick={() => handleViewTrainingDetails(course.training_id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <EmployeeStatusManager employeeId={userId} currentStatus="active" />
        </TabsContent>

      </Tabs>

      {/* Document Viewer Modal */}
    <Dialog open={!!viewingDocument} onOpenChange={() => setViewingDocument(null)}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>
            Viewing: {viewingDocument?.name}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 p-6 pt-4">
          {viewingDocument && (
            <div className="w-full h-[70vh] border rounded-lg overflow-hidden">
              {viewingDocument.type === 'application/pdf' ? (
                <iframe
                  src={viewingDocument.url}
                  className="w-full h-full"
                  title={viewingDocument.name}
                />
              ) : viewingDocument.type.startsWith('image/') ? (
                <img
                  src={viewingDocument.url}
                  alt={viewingDocument.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-50">
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">Cannot preview this file type</p>
                    <Button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = viewingDocument.url;
                        link.download = viewingDocument.name;
                        link.click();
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download to View
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
