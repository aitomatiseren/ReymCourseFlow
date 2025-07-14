import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Award, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Download, 
  Upload,
  FileText,
  ExternalLink,
  Zap,
  BookOpen
} from 'lucide-react';
import { 
  useEmployeeCertificates, 
  useEmployeeCertificateRenewals, 
  useEmployeeRenewalCourses,
  useEmployeeDocuments 
} from '@/hooks/useEmployeeSelfService';
import { DocumentUpload } from '@/components/certificates/DocumentUpload';
import { formatDate, formatDistanceToNow } from 'date-fns';

export const EmployeeCertificateManager: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('certificates');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const { data: certificates, isLoading: certificatesLoading } = useEmployeeCertificates();
  const { data: renewals, isLoading: renewalsLoading } = useEmployeeCertificateRenewals();
  const { data: renewalCourses, isLoading: coursesLoading } = useEmployeeRenewalCourses();
  const { data: documents, isLoading: documentsLoading } = useEmployeeDocuments();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'bg-green-100 text-green-800';
      case 'expiring': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRenewalStatusColor = (status: string) => {
    switch (status) {
      case 'current': return 'bg-green-100 text-green-800';
      case 'renewal_approaching': return 'bg-yellow-100 text-yellow-800';
      case 'renewal_due': return 'bg-orange-100 text-orange-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProcessingStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'unverified': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (certificatesLoading || renewalsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-6 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const urgentRenewals = renewals?.filter(r => r.renewal_status === 'renewal_due') || [];
  const approachingRenewals = renewals?.filter(r => r.renewal_status === 'renewal_approaching') || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Certificates</h1>
        <p className="text-gray-600 mt-1">
          Manage your certificates, track renewals, and upload documents
        </p>
      </div>

      {/* Urgent Renewals Alert */}
      {urgentRenewals.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Action Required:</strong> {urgentRenewals.length} certificate{urgentRenewals.length === 1 ? '' : 's'} 
            need{urgentRenewals.length === 1 ? 's' : ''} immediate renewal. Check the renewal tab for available courses.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="certificates">
            <Award className="h-4 w-4 mr-2" />
            Certificates
          </TabsTrigger>
          <TabsTrigger value="renewals">
            <Clock className="h-4 w-4 mr-2" />
            Renewals
            {urgentRenewals.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                {urgentRenewals.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-2" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </TabsTrigger>
        </TabsList>

        {/* Certificates Tab */}
        <TabsContent value="certificates" className="space-y-4">
          {!certificates || certificates.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Award className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No certificates found</h3>
                <p className="text-gray-600 mb-4">
                  You don't have any certificates on record yet.
                </p>
                <Button onClick={() => setSelectedTab('upload')}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Certificate
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.map((cert) => (
                <Card key={cert.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{cert.licenses?.name}</CardTitle>
                        <CardDescription>{cert.licenses?.category}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(cert.status)}>
                        {cert.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Certificate Number:</span>
                        <p className="font-mono">{cert.certificate_number || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Level:</span>
                        <p>{cert.level_achieved || 1}</p>
                      </div>
                    </div>

                    {cert.issue_date && (
                      <div className="text-sm">
                        <span className="text-gray-600">Issued:</span>
                        <p>{formatDate(new Date(cert.issue_date), 'PPP')}</p>
                      </div>
                    )}

                    {cert.expiry_date && (
                      <div className="text-sm">
                        <span className="text-gray-600">Expires:</span>
                        <p className={cert.status === 'expired' ? 'text-red-600' : cert.status === 'expiring' ? 'text-yellow-600' : ''}>
                          {formatDate(new Date(cert.expiry_date), 'PPP')}
                          {cert.status !== 'expired' && (
                            <span className="text-gray-500 ml-2">
                              ({formatDistanceToNow(new Date(cert.expiry_date), { addSuffix: true })})
                            </span>
                          )}
                        </p>
                      </div>
                    )}

                    {cert.status === 'expired' || cert.status === 'expiring' ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => setSelectedTab('renewals')}
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        View Renewal Options
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="w-full" disabled>
                        <Download className="h-4 w-4 mr-2" />
                        Download Certificate
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Renewals Tab */}
        <TabsContent value="renewals" className="space-y-6">
          {/* Renewal Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Renewal Schedule
              </CardTitle>
              <CardDescription>
                Track upcoming certificate renewal requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!renewals || renewals.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No certificates requiring renewal</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {renewals.map((renewal, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{renewal.certificate_name}</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Current expiry: {formatDate(new Date(renewal.current_expiry_date), 'PPP')}</p>
                          <p>Renewal window: {formatDate(new Date(renewal.renewal_window_start), 'PPP')}</p>
                          <p className="text-xs">{renewal.days_until_expiry} days remaining</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getRenewalStatusColor(renewal.renewal_status)}>
                          {renewal.renewal_status.replace('_', ' ')}
                        </Badge>
                        {renewal.is_renewable && (
                          <Button size="sm" variant="outline">
                            Find Courses
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Renewal Courses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Available Renewal Courses
              </CardTitle>
              <CardDescription>
                Courses that can be used to renew your certificates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {coursesLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              ) : !renewalCourses || renewalCourses.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No renewal courses available at this time</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {renewalCourses.map((course, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{course.course_title}</h4>
                          <p className="text-sm text-gray-600 mb-2">
                            Renews: {course.license_name}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{course.duration_hours} hours</span>
                            {course.code95_points && (
                              <span>{course.code95_points} Code 95 pts</span>
                            )}
                            <Badge variant="outline">Level {course.grants_level}</Badge>
                            {course.is_required && (
                              <Badge variant="outline" className="text-red-600 border-red-200">
                                Required
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {course.upcoming_training_id ? (
                            <div className="space-y-1">
                              {course.upcoming_start_date && (
                                <p className="text-sm text-gray-600">
                                  {formatDate(new Date(course.upcoming_start_date), 'MMM dd')}
                                </p>
                              )}
                              {course.available_spots && (
                                <p className="text-xs text-gray-500">
                                  {course.available_spots} spots left
                                </p>
                              )}
                              <Button size="sm">
                                Enroll
                              </Button>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No sessions scheduled</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          {documentsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !documents || documents.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No documents uploaded</h3>
                <p className="text-gray-600 mb-4">
                  Upload certificate documents for verification and processing.
                </p>
                <Button onClick={() => setSelectedTab('upload')}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{doc.file_name}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {doc.license?.name || 'Unassigned certificate type'}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>Uploaded {formatDate(new Date(doc.upload_date), 'PPP')}</span>
                          <span>{Math.round(doc.file_size / 1024)} KB</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={getProcessingStatusColor(doc.processing_status)}>
                          {doc.processing_status}
                        </Badge>
                        <Badge className={getVerificationStatusColor(doc.verification_status)}>
                          {doc.verification_status}
                        </Badge>
                      </div>
                    </div>

                    {/* AI Extracted Data */}
                    {doc.processing_status === 'completed' && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                          <Zap className="h-4 w-4 mr-1 text-blue-600" />
                          AI Extracted Information
                        </h5>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {doc.extracted_certificate_number && (
                            <div>
                              <span className="text-gray-600">Certificate #:</span>
                              <p className="font-mono">{doc.extracted_certificate_number}</p>
                            </div>
                          )}
                          {doc.extracted_issue_date && (
                            <div>
                              <span className="text-gray-600">Issue Date:</span>
                              <p>{formatDate(new Date(doc.extracted_issue_date), 'PPP')}</p>
                            </div>
                          )}
                          {doc.extracted_expiry_date && (
                            <div>
                              <span className="text-gray-600">Expiry Date:</span>
                              <p>{formatDate(new Date(doc.extracted_expiry_date), 'PPP')}</p>
                            </div>
                          )}
                          {doc.extracted_issuer && (
                            <div>
                              <span className="text-gray-600">Issuer:</span>
                              <p>{doc.extracted_issuer}</p>
                            </div>
                          )}
                        </div>
                        {doc.ai_confidence_score && (
                          <div className="mt-2">
                            <span className="text-xs text-gray-600">
                              AI Confidence: {Math.round(doc.ai_confidence_score * 100)}%
                            </span>
                            <Progress value={doc.ai_confidence_score * 100} className="h-1 mt-1" />
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Certificate Document
              </CardTitle>
              <CardDescription>
                Upload certificate documents for AI processing and verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentUpload
                showEmployeeSelection={false}
                showLicenseSelection={true}
                onUploadComplete={() => {
                  // Refresh documents when upload is complete
                  setSelectedTab('documents');
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};