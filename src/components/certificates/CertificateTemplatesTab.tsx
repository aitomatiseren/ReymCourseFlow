import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ViewToggle } from '@/components/ui/view-toggle';
import { 
  Plus,
  Search,
  Settings,
  Award,
  BookOpen,
  Link,
  Edit,
  ArrowRight,
  Calendar,
  Users,
  GraduationCap,
  AlertCircle,
  CheckCircle,
  Eye,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useViewMode } from '@/hooks/useViewMode';
import { 
  useLicenseDefinitions,
  useCourseDefinitions,
  useCertificateDefinitionManagement,
  getLevelColor
} from '@/hooks/useCertificateDefinitions';
import { 
  useLicensesWithHierarchy,
  useCertificateHierarchy,
  useCertificateHierarchyManagement
} from '@/hooks/useCertificateHierarchy';
import { useCourses } from '@/hooks/useCourses';
import { toast } from '@/hooks/use-toast';

interface CertificateTemplatesTabProps {
  viewMode?: string;
  onViewModeChange?: (mode: string) => void;
  showAddDialog?: boolean;
  onShowAddDialogChange?: (show: boolean) => void;
}

export function CertificateTemplatesTab({
  viewMode: externalViewMode,
  onViewModeChange: externalOnViewModeChange,
  showAddDialog: externalShowAddDialog,
  onShowAddDialogChange: externalOnShowAddDialogChange
}: CertificateTemplatesTabProps = {}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [internalShowLicenseDialog, setInternalShowLicenseDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [internalViewMode, setInternalViewMode] = useViewMode('certificates');
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);

  // Use external props when available, fallback to internal state
  const viewMode = externalViewMode || internalViewMode;
  const setViewMode = externalOnViewModeChange || setInternalViewMode;
  // For edit operations, prioritize internal state to avoid conflicts
  const showLicenseDialog = isEditing ? internalShowLicenseDialog : (externalShowAddDialog ?? internalShowLicenseDialog);
  const setShowLicenseDialog = externalOnShowAddDialogChange || setInternalShowLicenseDialog;


  // Data hooks
  const { data: licenses, isLoading: licensesLoading } = useLicenseDefinitions();
  const { data: courses, isLoading: coursesLoading } = useCourseDefinitions();
  const { data: allCourses } = useCourses();
  const { data: licensesWithHierarchy, isLoading: hierarchyLoading } = useLicensesWithHierarchy();
  const { data: certificateHierarchy } = useCertificateHierarchy();

  // Management hooks
  const {
    updateLicenseDefinition,
    createLicenseDefinition,
    createCourseCertificateMapping,
    updateCourseCertificateMapping,
    deleteCourseCertificateMapping
  } = useCertificateDefinitionManagement();

  const {
    addPrerequisite,
    removePrerequisite
  } = useCertificateHierarchyManagement();


  const [licenseForm, setLicenseForm] = useState({
    name: '',
    description: '',
    is_base_level: true,
    supersedes_license_id: null as string | null,
    validity_period_months: 12,
    renewal_notice_months: 6
  });

  // Course linking state
  const [linkedCourses, setLinkedCourses] = useState<Array<{
    course_id: string;
    directly_grants: boolean;
    is_required: boolean;
    renewal_eligible: boolean;
    min_score_required?: number;
    credits_awarded?: number;
    notes?: string;
  }>>([]);

  const [selectedPrerequisites, setSelectedPrerequisites] = useState<string[]>([]);

  const [errors, setErrors] = useState<string[]>([]);




  const handleCreateLicense = async () => {
    if (!licenseForm.name.trim()) {
      setErrors(['Name is required']);
      return;
    }

    // Allow certificate to require prerequisite that it supersedes (normal progression)
    // This validation is removed because it's valid for VCA Vol to require VCA Basic AND supersede it

    // Check if we're trying to supersede a certificate that already supersedes us (bidirectional superseding)
    if (licenseForm.supersedes_license_id) {
      const targetCertificate = licensesWithHierarchy?.find(l => l.id === licenseForm.supersedes_license_id);
      if (targetCertificate?.supersedes_license_id === selectedLicense?.id) {
        toast({
          title: "Validation Error",
          description: `${targetCertificate.name} already supersedes this certificate. You cannot create a bidirectional superseding relationship.`,
          variant: "destructive"
        });
        return;
      }
    }

    try {
      let licenseId: string;
      
      if (selectedLicense) {
        // Update existing license
        await updateLicenseDefinition.mutateAsync({
          id: selectedLicense.id,
          updates: licenseForm
        });
        licenseId = selectedLicense.id;
        
        // Handle prerequisites changes
        const existingPrerequisites = selectedLicense.prerequisites?.map((p: any) => p.id) || [];
        const prerequisitesToAdd = selectedPrerequisites.filter(id => !existingPrerequisites.includes(id));
        const prerequisitesToRemove = existingPrerequisites.filter((id: string) => !selectedPrerequisites.includes(id));
        
        // Add new prerequisites
        for (const prerequisiteId of prerequisitesToAdd) {
          await addPrerequisite.mutateAsync({
            certificateId: licenseId,
            prerequisiteId
          });
        }
        
        // Remove old prerequisites
        for (const prerequisiteId of prerequisitesToRemove) {
          await removePrerequisite.mutateAsync({
            certificateId: licenseId,
            prerequisiteId
          });
        }
        
        toast({
          title: "Success",
          description: "Certificate updated successfully"
        });
      } else {
        // Create new license
        const newLicense = await createLicenseDefinition.mutateAsync(licenseForm);
        licenseId = newLicense.id;
        
        // Add prerequisites
        for (const prerequisiteId of selectedPrerequisites) {
          await addPrerequisite.mutateAsync({
            certificateId: licenseId,
            prerequisiteId
          });
        }
        
        toast({
          title: "Success",
          description: "Certificate created successfully"
        });
      }

      // Handle course links for both create and update
      if (linkedCourses.length > 0) {
        // Check for duplicate course IDs in the linkedCourses array
        const courseIds = linkedCourses.map(lc => lc.course_id);
        const uniqueCourseIds = [...new Set(courseIds)];
        
        if (courseIds.length !== uniqueCourseIds.length) {
          toast({
            title: "Error",
            description: "Cannot link the same course multiple times to a certificate.",
            variant: "destructive"
          });
          return;
        }
        
        if (selectedLicense) {
          // For updates, get existing course links and handle changes
          const existingCourseLinks = selectedLicense.course_certificates || [];
          const existingCourseLinkIds = existingCourseLinks.map((cc: any) => cc.course_id);
          const newCourseLinkIds = linkedCourses.map(lc => lc.course_id);
          
          // Remove course links that are no longer present
          for (const existingLink of existingCourseLinks) {
            if (!newCourseLinkIds.includes(existingLink.course_id)) {
              try {
                await deleteCourseCertificateMapping.mutateAsync(existingLink.id);
              } catch (error: any) {
                // If the record doesn't exist (already deleted), continue
                if (error.code === 'PGRST116' || error.message?.includes('not found')) {
                  console.log(`Course link ${existingLink.id} already deleted, skipping...`);
                  continue;
                } else {
                  throw error;
                }
              }
            }
          }
          
          // Add or update course links
          for (const linkedCourse of linkedCourses) {
            const existingLink = existingCourseLinks.find((cc: any) => cc.course_id === linkedCourse.course_id);
            
            if (existingLink) {
              // Update existing link
              await updateCourseCertificateMapping.mutateAsync({
                id: existingLink.id,
                updates: {
                  directly_grants: linkedCourse.directly_grants,
                  is_required: linkedCourse.is_required,
                  renewal_eligible: linkedCourse.renewal_eligible,
                  min_score_required: linkedCourse.min_score_required,
                  credits_awarded: linkedCourse.credits_awarded,
                  notes: linkedCourse.notes
                }
              });
            } else {
              // Create new link - only if it doesn't already exist
              try {
                await createCourseCertificateMapping.mutateAsync({
                  course_id: linkedCourse.course_id,
                  license_id: licenseId,
                  directly_grants: linkedCourse.directly_grants,
                  is_required: linkedCourse.is_required,
                  renewal_eligible: linkedCourse.renewal_eligible,
                  min_score_required: linkedCourse.min_score_required,
                  credits_awarded: linkedCourse.credits_awarded,
                  notes: linkedCourse.notes
                });
              } catch (linkError: any) {
                if (linkError.code === '23505') {
                  console.warn(`Course ${linkedCourse.course_id} already linked to certificate ${licenseId}, skipping...`);
                  continue;
                } else {
                  throw linkError;
                }
              }
            }
          }
        } else {
          // For new certificates, create all course links
          for (const linkedCourse of linkedCourses) {
            try {
              await createCourseCertificateMapping.mutateAsync({
                course_id: linkedCourse.course_id,
                license_id: licenseId,
                directly_grants: linkedCourse.directly_grants,
                is_required: linkedCourse.is_required,
                renewal_eligible: linkedCourse.renewal_eligible,
                min_score_required: linkedCourse.min_score_required,
                credits_awarded: linkedCourse.credits_awarded,
                notes: linkedCourse.notes
              });
            } catch (linkError: any) {
              if (linkError.code === '23505') {
                console.warn(`Course ${linkedCourse.course_id} already linked to certificate ${licenseId}, skipping...`);
                continue;
              } else {
                throw linkError;
              }
            }
          }
        }
      }
      if (isEditing) {
        setInternalShowLicenseDialog(false);
      } else {
        setShowLicenseDialog(false);
      }
      resetLicenseForm();
      setSelectedLicense(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Certificate creation/update error:', error);
      let errorMessage = selectedLicense ? "Failed to update certificate. Please try again." : "Failed to create certificate. Please try again.";
      
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes('duplicate') || error.message.includes('unique constraint')) {
          if (error.message.includes('course_certificates')) {
            errorMessage = "A course is already linked to this certificate. Please remove duplicate course links.";
          } else {
            errorMessage = "Duplicate data detected. Please check your inputs.";
          }
        } else if (error.message.includes('course_certificates')) {
          errorMessage = "Error linking course to certificate. Please try again.";
        } else if (error.message.includes('foreign key')) {
          errorMessage = "Invalid course or certificate reference. Please refresh the page and try again.";
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };


  const resetLicenseForm = () => {
    setLicenseForm({
      name: '',
      description: '',
      is_base_level: true,
      supersedes_license_id: null,
      validity_period_months: 12,
      renewal_notice_months: 6
    });
    setSelectedPrerequisites([]);
    setLinkedCourses([]);
    setErrors([]);
  };

  // Handle external dialog trigger
  useEffect(() => {
    console.log('useEffect triggered - externalShowAddDialog:', externalShowAddDialog, 'internalShowLicenseDialog:', internalShowLicenseDialog, 'isEditing:', isEditing);
    // Only reset if it's a new external request for adding (not editing)
    if (externalShowAddDialog && externalShowAddDialog !== internalShowLicenseDialog && !isEditing) {
      console.log('Resetting form due to external add dialog trigger');
      setSelectedLicense(null);
      setIsEditing(false);
      resetLicenseForm();
    }
  }, [externalShowAddDialog, internalShowLicenseDialog, isEditing]);

  const openLicenseDetails = (license: any) => {
    // Get the license with full hierarchy data
    const licenseWithHierarchy = licensesWithHierarchy?.find(l => l.id === license.id) || license;
    setSelectedLicense(licenseWithHierarchy);
    setShowDetailsDialog(true);
  };

  const openEditLicense = (license: any) => {
    console.log('openEditLicense called with:', license);
    // Get the license with full hierarchy data AND course certificates
    const licenseWithHierarchy = licensesWithHierarchy?.find(l => l.id === license.id) || license;
    const licenseWithCourses = licenses?.find(l => l.id === license.id) || license;
    
    // Combine both data sources
    const fullLicenseData = {
      ...licenseWithHierarchy,
      course_certificates: licenseWithCourses.course_certificates || []
    };
    console.log('Setting selectedLicense to:', fullLicenseData);
    
    setLicenseForm({
      name: fullLicenseData.name,
      description: fullLicenseData.description || '',
      is_base_level: fullLicenseData.is_base_level ?? true,
      supersedes_license_id: fullLicenseData.supersedes_license_id || null,
      validity_period_months: fullLicenseData.validity_period_months || 12,
      renewal_notice_months: fullLicenseData.renewal_notice_months || 6
    });
    // Load existing prerequisites
    const existingPrerequisites = fullLicenseData.prerequisites?.map((p: any) => p.id) || [];
    setSelectedPrerequisites(existingPrerequisites);
    
    // Load existing course links
    const existingCourseLinks = fullLicenseData.course_certificates?.map((cc: any) => ({
      course_id: cc.course_id,
      directly_grants: cc.directly_grants ?? true,
      is_required: cc.is_required ?? true,
      renewal_eligible: cc.renewal_eligible ?? true,
      min_score_required: cc.min_score_required,
      credits_awarded: cc.credits_awarded,
      notes: cc.notes || ''
    })) || [];
    setLinkedCourses(existingCourseLinks);
    
    setSelectedLicense(fullLicenseData);
    setIsEditing(true);
    setShowDetailsDialog(false);
    console.log('About to set showLicenseDialog to true, current external props:', {
      externalShowAddDialog,
      internalShowLicenseDialog
    });
    // For editing, always use internal state to avoid external interference
    setInternalShowLicenseDialog(true);
  };


  // Combine hierarchy data with course certificates data
  const combinedLicenses = licensesWithHierarchy?.map(hierarchyLicense => {
    const licenseWithCourses = licenses?.find(l => l.id === hierarchyLicense.id);
    return {
      ...hierarchyLicense,
      course_certificates: licenseWithCourses?.course_certificates || []
    };
  }) || [];

  let filteredLicenses = combinedLicenses.filter(license => {
    const matchesSearch = license.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Apply sorting
  if (sortConfig) {
    filteredLicenses = [...filteredLicenses].sort((a, b) => {
      if (sortConfig.key === 'name') {
        const aValue = a.name.toLowerCase();
        const bValue = b.name.toLowerCase();
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      return 0;
    });
  }

  if (licensesLoading || coursesLoading || hierarchyLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-muted-foreground">Loading certificates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Search and Filter Bar - Match Courses pattern with Card wrapper */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search certificates by name or description..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificates Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLicenses.map(license => (
            <Card key={license.id} className="hover:shadow-lg transition-shadow flex flex-col h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{license.name}</CardTitle>
                    {license.supersedes_license_id && (
                      <p className="text-xs text-yellow-700 mt-1">
                        Supersedes: {license.supersedes?.name || 'Lower-tier certificate'}
                      </p>
                    )}
                    {license.superseded_by && license.superseded_by.length > 0 && (
                      <p className="text-xs text-blue-700 mt-1">
                        Superseded by: {license.superseded_by.map((cert: any) => cert.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    {license.is_base_level ? (
                      <Badge className="bg-green-100 text-green-800">
                        Base Level
                      </Badge>
                    ) : (
                      <Badge className="bg-purple-100 text-purple-800">
                        Advanced
                      </Badge>
                    )}
                  </div>
                </div>
                {license.description && (
                  <CardDescription className="line-clamp-1">{license.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3 flex flex-col flex-grow">
                
                <div className="flex-grow">
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <span className="font-medium">Valid for:</span>
                      <br />
                      <span className="text-gray-600">
                        {license.validity_period_months} months
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Notice period:</span>
                      <br />
                      <span className="text-gray-600">
                        {license.renewal_notice_months} months
                      </span>
                    </div>
                  </div>


                  {/* Show prerequisites information */}
                  {license.prerequisites && license.prerequisites.length > 0 && (
                    <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs text-blue-800">
                        <strong>Prerequisites:</strong> Requires {license.prerequisites.length} certificate{license.prerequisites.length !== 1 ? 's' : ''}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {license.prerequisites.slice(0, 2).map((prereq: any) => (
                          <Badge key={prereq.id} variant="outline" className="text-xs">
                            {prereq.name}
                          </Badge>
                        ))}
                        {license.prerequisites.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{license.prerequisites.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}



                  {license.course_certificates && license.course_certificates.length > 0 && (
                    <div className="mt-3">
                      <span className="text-sm font-medium">Linked Courses:</span>
                      <div className="mt-1 space-y-1">
                        {license.course_certificates.slice(0, 2).map(cc => (
                          <div key={cc.id} className="text-xs bg-gray-50 p-2 rounded flex items-center justify-between">
                            <span>{cc.courses?.title}</span>
                            {cc.directly_grants ? (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                Direct
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                Prog
                              </Badge>
                            )}
                          </div>
                        ))}
                        {license.course_certificates.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{license.course_certificates.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              
              {/* View Button Section */}
              <div className="p-4 pt-0 mt-auto">
                <Button
                  size="sm"
                  className="w-full bg-slate-800 text-white hover:bg-slate-900"
                  onClick={() => openLicenseDetails(license)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Certificates List View */}
      {viewMode === 'list' && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left font-medium">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-medium"
                      onClick={() => {
                        setSortConfig(prev => {
                          if (prev?.key === 'name') {
                            return prev.direction === 'asc' 
                              ? { key: 'name', direction: 'desc' }
                              : null;
                          }
                          return { key: 'name', direction: 'asc' };
                        });
                      }}
                    >
                      Certificate
                      {sortConfig?.key === 'name' ? (
                        sortConfig.direction === 'asc' ? (
                          <ArrowUp className="ml-1 h-3 w-3" />
                        ) : (
                          <ArrowDown className="ml-1 h-3 w-3" />
                        )
                      ) : (
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="text-left font-medium">Type</TableHead>
                  <TableHead className="text-left font-medium">Validity</TableHead>
                  <TableHead className="text-left font-medium">Hierarchy</TableHead>
                  <TableHead className="text-right font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLicenses.map((license) => (
                  <TableRow key={license.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <div className="font-medium">{license.name}</div>
                        {license.description && (
                          <div className="text-sm text-gray-500 line-clamp-1">{license.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {license.is_base_level ? (
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          Base Level
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-purple-100 text-purple-800">
                          Advanced
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {license.validity_period_months ? (
                        <Badge variant="outline">
                          {license.validity_period_months} months
                        </Badge>
                      ) : (
                        <span className="text-gray-500">No expiry</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {license.supersedes_license_id && (
                          <div className="text-xs text-yellow-700">
                            Supersedes: {license.supersedes?.name || 'Lower-tier'}
                          </div>
                        )}
                        {license.superseded_by && license.superseded_by.length > 0 && (
                          <div className="text-xs text-blue-700">
                            Superseded by: {license.superseded_by.map((cert: any) => cert.name).join(', ')}
                          </div>
                        )}
                        {!license.supersedes_license_id && (!license.superseded_by || license.superseded_by.length === 0) && (
                          <span className="text-gray-500 text-xs">Independent</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          size="sm"
                          className="bg-slate-800 text-white hover:bg-slate-900"
                          onClick={() => openLicenseDetails(license)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {filteredLicenses.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">No certificates found matching your criteria.</p>
          </CardContent>
        </Card>
      )}


      {/* New Certificate Dialog */}
      <Dialog open={showLicenseDialog} onOpenChange={(open) => {
        console.log('Dialog onOpenChange called with:', open, 'isEditing:', isEditing);
        if (isEditing) {
          setInternalShowLicenseDialog(open);
        } else {
          setShowLicenseDialog(open);
        }
        if (!open) {
          // Only reset when dialog is actually closed by user, not when opening for edit
          setTimeout(() => {
            setSelectedLicense(null);
            setIsEditing(false);
            resetLicenseForm();
          }, 100);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {console.log('Dialog rendering - isEditing:', isEditing, 'selectedLicense:', selectedLicense) || ''}
              {isEditing ? 'Edit Certificate' : 'Create New Certificate'}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update certificate information and settings.' : 'Define a new certificate type that employees can earn through training.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Certificate Name *</Label>
                <Input
                  value={licenseForm.name}
                  onChange={(e) => setLicenseForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., VCA Basic Safety, Forklift License"
                />
              </div>

            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={licenseForm.description}
                onChange={(e) => setLicenseForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this certificate represents..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">

              <div className="space-y-2">
                <Label>Supersedes Certificate</Label>
                <Select 
                  value={licenseForm.supersedes_license_id || "none"} 
                  onValueChange={(value) => setLicenseForm(prev => ({ 
                    ...prev, 
                    supersedes_license_id: value === "none" ? null : value,
                    is_base_level: value === "none"
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Base Level)</SelectItem>
                    {licenses?.map(license => {
                      // Skip current license
                      if (license.id === selectedLicense?.id) return null;
                      
                      // Only block if this license already supersedes the current one (bidirectional superseding)
                      // Allow superseding prerequisites (normal progression: VCA Vol can supersede VCA Basic even if it requires it)
                      const alreadySupersedingCurrent = license.supersedes_license_id === selectedLicense?.id;
                      const isCircular = alreadySupersedingCurrent;
                      
                      return (
                        <SelectItem key={license.id} value={license.id} disabled={isCircular}>
                          {license.name}
                          {alreadySupersedingCurrent && " (Already supersedes this certificate)"}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Valid for (months)</Label>
                <Input
                  type="number"
                  min="1"
                  value={licenseForm.validity_period_months}
                  onChange={(e) => setLicenseForm(prev => ({ ...prev, validity_period_months: parseInt(e.target.value) }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Renewal notice (months)</Label>
                <Input
                  type="number"
                  min="1"
                  value={licenseForm.renewal_notice_months}
                  onChange={(e) => setLicenseForm(prev => ({ ...prev, renewal_notice_months: parseInt(e.target.value) }))}
                />
              </div>
            </div>

            {/* Prerequisites Management */}
            <div className="space-y-2">
              <Label>Prerequisites</Label>
              <p className="text-sm text-muted-foreground">
                Select certificates that must be obtained before this certificate
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                {licenses?.filter(license => license.id !== selectedLicense?.id).map(license => {
                  // Allow VCA Vol to require VCA Basic even if it supersedes it
                  // Only block if the prerequisite certificate supersedes this one (would create circular superseding)
                  const prerequisiteSupersedingThis = license.supersedes_license_id === selectedLicense?.id;
                  const isCircular = prerequisiteSupersedingThis;
                  
                  return (
                    <div key={license.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`prereq-${license.id}`}
                        checked={selectedPrerequisites.includes(license.id)}
                        disabled={isCircular}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPrerequisites(prev => [...prev, license.id]);
                          } else {
                            setSelectedPrerequisites(prev => prev.filter(id => id !== license.id));
                          }
                        }}
                        className="rounded"
                      />
                      <label htmlFor={`prereq-${license.id}`} className={`text-sm flex-1 ${isCircular ? 'cursor-not-allowed text-gray-400' : 'cursor-pointer'}`}>
                        {license.name}
                        {license.supersedes && (
                          <span className="text-xs text-muted-foreground ml-1">
                            (Supersedes: {license.supersedes.name})
                          </span>
                        )}
                        {isCircular && (
                          <span className="text-xs text-red-500 ml-1">
                            (This certificate supersedes the current one)
                          </span>
                        )}
                      </label>
                    </div>
                  );
                })}
                {(!licenses || licenses.length <= 1) && (
                  <p className="text-sm text-muted-foreground py-2">
                    No other certificates available as prerequisites
                  </p>
                )}
              </div>
              {selectedPrerequisites.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedPrerequisites.map(prereqId => {
                    const prereq = licenses?.find(l => l.id === prereqId);
                    return prereq ? (
                      <Badge key={prereqId} variant="secondary" className="text-xs">
                        {prereq.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            {/* Linked Courses Section */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Linked Courses</Label>
              <p className="text-sm text-muted-foreground">
                Select courses that can grant this certificate when completed
              </p>
              
              <div className="border rounded-lg p-4 space-y-3">
                {linkedCourses.length > 0 ? (
                  <div className="space-y-2">
                    {linkedCourses.map((linkedCourse, index) => {
                      const course = allCourses?.find(c => c.id === linkedCourse.course_id);
                      return (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{course?.title || 'Unknown Course'}</div>
                            <div className="text-xs text-muted-foreground">
                              {linkedCourse.directly_grants ? 'Directly grants certificate' : 'Prerequisite course'} •{' '}
                              {linkedCourse.is_required ? 'Required' : 'Optional'} •{' '}
                              {linkedCourse.renewal_eligible ? 'Can renew' : 'Cannot renew'}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              // If editing an existing certificate, delete from database immediately
                              if (selectedLicense) {
                                const existingCourseLinks = selectedLicense.course_certificates || [];
                                const existingLink = existingCourseLinks.find((cc: any) => cc.course_id === linkedCourse.course_id);
                                
                                if (existingLink) {
                                  try {
                                    await deleteCourseCertificateMapping.mutateAsync(existingLink.id);
                                    toast({
                                      title: "Success",
                                      description: "Course link removed successfully"
                                    });
                                  } catch (error) {
                                    console.error('Failed to remove course link:', error);
                                    toast({
                                      title: "Error",
                                      description: "Failed to remove course link. Please try again.",
                                      variant: "destructive"
                                    });
                                    return; // Don't update local state if server deletion failed
                                  }
                                }
                              }
                              
                              // Update local state
                              setLinkedCourses(prev => prev.filter((_, i) => i !== index));
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No courses linked to this certificate yet
                  </p>
                )}
                
                <div className="border-t pt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Add Course</Label>
                      <Select 
                        value="" 
                        onValueChange={(courseId) => {
                          if (courseId) {
                            // Check if course is already linked
                            const existingLink = linkedCourses.find(lc => lc.course_id === courseId);
                            if (existingLink) {
                              toast({
                                title: "Course Already Linked",
                                description: "This course is already linked to this certificate.",
                                variant: "destructive"
                              });
                              return;
                            }
                            
                            // Add new course link
                            setLinkedCourses(prev => [...prev, {
                              course_id: courseId,
                              directly_grants: true,
                              is_required: true,
                              renewal_eligible: true,
                              min_score_required: undefined,
                              credits_awarded: undefined,
                              notes: ''
                            }]);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select course..." />
                        </SelectTrigger>
                        <SelectContent>
                          {allCourses?.filter(course => 
                            !linkedCourses.find(lc => lc.course_id === course.id)
                          ).map(course => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm">Quick Actions</Label>
                      <div className="text-xs text-muted-foreground">
                        Courses will be added with default settings (directly grants, required, renewable)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              if (isEditing) {
                setInternalShowLicenseDialog(false);
              } else {
                setShowLicenseDialog(false);
              }
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateLicense}>
              {isEditing ? 'Update Certificate' : 'Create Certificate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Certificate Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              {selectedLicense?.name}
            </DialogTitle>
            <DialogDescription>
              Certificate details and linked courses
            </DialogDescription>
          </DialogHeader>

          {selectedLicense && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Basic Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Validity Period:</span>
                        <span className="font-medium">{selectedLicense.validity_period_months} months</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Renewal Notice:</span>
                        <span className="font-medium">{selectedLicense.renewal_notice_months} months</span>
                      </div>
                      {selectedLicense.hierarchy_order && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Hierarchy Tier:</span>
                          <span className="font-medium">{selectedLicense.hierarchy_order}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedLicense.description && (
                    <div>
                      <h4 className="font-medium mb-2">Description</h4>
                      <p className="text-sm text-muted-foreground">{selectedLicense.description}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Hierarchy Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Level:</span>
                        <Badge className={selectedLicense.is_base_level ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}>
                          {selectedLicense.is_base_level ? "Base Level" : "Advanced"}
                        </Badge>
                      </div>
                      {selectedLicense.supersedes_license_id && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Supersedes:</span>
                          <span className="text-sm text-yellow-700">
                            {selectedLicense.supersedes?.name || 'Lower-tier certificate'}
                          </span>
                        </div>
                      )}
                      {selectedLicense.superseded_by && selectedLicense.superseded_by.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Superseded by:</span>
                          <span className="text-sm text-orange-700">
                            {selectedLicense.superseded_by.map((cert: any) => cert.name).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Prerequisites */}
                  {selectedLicense.prerequisites && selectedLicense.prerequisites.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Prerequisites</h4>
                      <div className="space-y-1">
                        {selectedLicense.prerequisites.map((prereq: any) => (
                          <div key={prereq.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm font-medium">{prereq.name}</span>
                            {prereq.supersedes && (
                              <Badge variant="outline" className="text-xs">
                                Supersedes: {prereq.supersedes.name}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!selectedLicense.prerequisites || selectedLicense.prerequisites.length === 0) && (
                    <div className="p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>No Prerequisites:</strong> This certificate can be obtained directly
                      </p>
                    </div>
                  )}


                </div>
              </div>

              {/* Linked Courses */}
              {selectedLicense.course_certificates && selectedLicense.course_certificates.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Linked Courses ({selectedLicense.course_certificates.length || 0})</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedLicense.course_certificates.map((cc: any) => (
                      <div key={cc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <BookOpen className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium">{cc.courses?.title}</p>
                            <p className="text-sm text-muted-foreground">{cc.courses?.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {cc.directly_grants ? (
                            <Badge className="bg-green-100 text-green-800">
                              Directly Grants
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-800">
                              Progression Course
                            </Badge>
                          )}
                          {cc.is_required && (
                            <Badge variant="outline">Required</Badge>
                          )}
                          {cc.renewal_eligible && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              Renewal Eligible
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
            <Button onClick={() => openEditLicense(selectedLicense)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Certificate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}