import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Trash2,
  ArrowRight,
  Calendar,
  Users,
  GraduationCap,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useViewMode } from '@/hooks/useViewMode';
import { 
  useLicenseDefinitions,
  useCourseDefinitions,
  useCourseCertificateMappings,
  useCertificateDefinitionManagement,
  getLevelColor,
  validateCourseCertificateMapping,
  CourseCertificateMapping
} from '@/hooks/useCertificateDefinitions';
import { 
  useLicensesWithHierarchy,
  useCertificateHierarchy,
  useCertificateHierarchyManagement
} from '@/hooks/useCertificateHierarchy';
import { useCourses } from '@/hooks/useCourses';
import { toast } from '@/hooks/use-toast';

export function CertificateTemplatesTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [editingMapping, setEditingMapping] = useState<CourseCertificateMapping | null>(null);
  const [showLicenseDialog, setShowLicenseDialog] = useState(false);
  const [viewMode, setViewMode] = useViewMode('certificates');

  // Data hooks
  const { data: licenses, isLoading: licensesLoading } = useLicenseDefinitions();
  const { data: courses, isLoading: coursesLoading } = useCourseDefinitions();
  const { data: mappings, isLoading: mappingsLoading } = useCourseCertificateMappings();
  const { data: allCourses } = useCourses();
  const { data: licensesWithHierarchy, isLoading: hierarchyLoading } = useLicensesWithHierarchy();
  const { data: certificateHierarchy } = useCertificateHierarchy();

  // Management hooks
  const {
    createCourseCertificateMapping,
    updateCourseCertificateMapping,
    deleteCourseCertificateMapping,
    updateLicenseDefinition,
    createLicenseDefinition
  } = useCertificateDefinitionManagement();

  // Form state - Updated to remove confusing grants_level
  const [mappingForm, setMappingForm] = useState({
    course_id: '',
    license_id: '',
    directly_grants: true,
    is_required: true,
    renewal_eligible: true,
    progression_course: false,
    min_score_required: undefined,
    credits_awarded: undefined,
    notes: ''
  });

  const [licenseForm, setLicenseForm] = useState({
    name: '',
    category: '',
    description: '',
    hierarchy_order: 1,
    is_base_level: true,
    supersedes_license_id: null as string | null,
    validity_period_months: 12,
    renewal_notice_months: 6,
    renewal_grace_period_months: 3
  });

  const [errors, setErrors] = useState<string[]>([]);

  const handleCreateMapping = async () => {
    // Basic validation
    if (!mappingForm.course_id || !mappingForm.license_id) {
      setErrors(['Course and certificate are required']);
      return;
    }

    try {
      // Convert form to the expected format (keeping grants_level for backwards compatibility)
      const mappingData = {
        ...mappingForm,
        grants_level: 1, // Set to 1 since we're moving away from this concept
      };
      
      await createCourseCertificateMapping.mutateAsync(mappingData);
      toast({
        title: "Success",
        description: "Course-certificate mapping created successfully"
      });
      setShowMappingDialog(false);
      resetMappingForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create mapping. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateMapping = async () => {
    if (!editingMapping?.id) return;

    // Basic validation
    if (!mappingForm.course_id || !mappingForm.license_id) {
      setErrors(['Course and certificate are required']);
      return;
    }

    try {
      // Convert form to the expected format (keeping grants_level for backwards compatibility)
      const mappingData = {
        ...mappingForm,
        grants_level: 1, // Set to 1 since we're moving away from this concept
      };
      
      await updateCourseCertificateMapping.mutateAsync({
        id: editingMapping.id,
        updates: mappingData
      });
      toast({
        title: "Success",
        description: "Course-certificate mapping updated successfully"
      });
      setShowMappingDialog(false);
      resetMappingForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update mapping. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteMapping = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course-certificate mapping?')) return;

    try {
      await deleteCourseCertificateMapping.mutateAsync(id);
      toast({
        title: "Success",
        description: "Course-certificate mapping deleted successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete mapping. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCreateLicense = async () => {
    if (!licenseForm.name.trim() || !licenseForm.category.trim()) {
      setErrors(['Name and category are required']);
      return;
    }

    try {
      await createLicenseDefinition.mutateAsync(licenseForm);
      toast({
        title: "Success",
        description: "Certificate created successfully"
      });
      setShowLicenseDialog(false);
      resetLicenseForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create certificate. Please try again.",
        variant: "destructive"
      });
    }
  };

  const resetMappingForm = () => {
    setMappingForm({
      course_id: '',
      license_id: '',
      directly_grants: true,
      is_required: true,
      renewal_eligible: true,
      progression_course: false,
      min_score_required: undefined,
      credits_awarded: undefined,
      notes: ''
    });
    setEditingMapping(null);
    setErrors([]);
  };

  const resetLicenseForm = () => {
    setLicenseForm({
      name: '',
      category: '',
      description: '',
      hierarchy_order: 1,
      is_base_level: true,
      supersedes_license_id: null,
      validity_period_months: 12,
      renewal_notice_months: 6,
      renewal_grace_period_months: 3
    });
    setErrors([]);
  };

  const openEditMapping = (mapping: any) => {
    setMappingForm({
      course_id: mapping.course_id,
      license_id: mapping.license_id,
      directly_grants: mapping.directly_grants ?? true,
      is_required: mapping.is_required,
      renewal_eligible: mapping.renewal_eligible,
      progression_course: mapping.progression_course ?? false,
      min_score_required: mapping.min_score_required,
      credits_awarded: mapping.credits_awarded,
      notes: mapping.notes || ''
    });
    setEditingMapping(mapping);
    setShowMappingDialog(true);
  };

  const filteredLicenses = licenses?.filter(license => {
    const matchesSearch = license.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || license.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const categories = [...new Set(licenses?.map(l => l.category).filter(Boolean))] || [];

  if (licensesLoading || coursesLoading || mappingsLoading || hierarchyLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-muted-foreground">Loading certificates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Match Courses/Providers pattern */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Certificates</h1>
          <p className="text-gray-600 mt-1">
            Manage certificate types and link them to training courses
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <ViewToggle value={viewMode} onValueChange={setViewMode} />
          <Button variant="outline" onClick={() => setShowLicenseDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Certificate
          </Button>
          <Button onClick={() => setShowMappingDialog(true)}>
            <Link className="h-4 w-4 mr-2" />
            Link Course to Certificate
          </Button>
        </div>
      </div>

      {/* Search and Filter Bar - Match Courses pattern with Card wrapper */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search certificates by name or category..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  <CardTitle className="text-lg">{license.name}</CardTitle>
                  <div className="flex flex-col gap-1">
                    {license.is_base_level ? (
                      <Badge className="bg-blue-100 text-blue-800">
                        Base Level
                      </Badge>
                    ) : (
                      <Badge className="bg-purple-100 text-purple-800">
                        Advanced
                      </Badge>
                    )}
                    {license.hierarchy_order && (
                      <Badge variant="outline" className="text-xs">
                        Tier {license.hierarchy_order}
                      </Badge>
                    )}
                  </div>
                </div>
                <CardDescription>{license.category}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 flex flex-col flex-grow">
                {license.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{license.description}</p>
                )}
                
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

                  {/* Show superseding information */}
                  {license.supersedes_license_id && (
                    <div className="mb-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                      <p className="text-xs text-yellow-800">
                        <strong>Supersedes:</strong> This certificate makes lower-tier certificates unnecessary
                      </p>
                    </div>
                  )}

                  {/* Show hierarchy information */}
                  {licensesWithHierarchy?.find(l => l.supersedes_license_id === license.id) && (
                    <div className="mb-3 p-2 bg-green-50 rounded border border-green-200">
                      <p className="text-xs text-green-800">
                        <strong>Progression available:</strong> Can advance to higher-tier certificates
                      </p>
                    </div>
                  )}
                </div>

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
            </Card>
          ))}
        </div>
      )}

      {/* Certificates List View */}
      {viewMode === 'list' && (
        <Tabs defaultValue="certificates" className="space-y-4">
          <TabsList>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
            <TabsTrigger value="mappings">Course-Certificate Mappings</TabsTrigger>
          </TabsList>

          {/* Certificates Tab */}
          <TabsContent value="certificates" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <div className="space-y-4 p-6">
                  {filteredLicenses.map(license => (
                    <div key={license.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h3 className="font-medium">{license.name}</h3>
                            <p className="text-sm text-gray-600">{license.category}</p>
                            {license.supersedes_license_id && (
                              <p className="text-xs text-yellow-700">Supersedes lower-tier certificates</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {license.is_base_level ? (
                              <Badge className="bg-blue-100 text-blue-800">
                                Base Level
                              </Badge>
                            ) : (
                              <Badge className="bg-purple-100 text-purple-800">
                                Advanced
                              </Badge>
                            )}
                            {license.hierarchy_order && (
                              <Badge variant="outline" className="text-xs">
                                Tier {license.hierarchy_order}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {license.description && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-1">{license.description}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="text-center">
                          <div className="font-medium">{license.validity_period_months}mo</div>
                          <div className="text-gray-500">Valid</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{license.course_certificates?.length || 0}</div>
                          <div className="text-gray-500">Courses</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Course-Certificate Mappings Tab */}
          <TabsContent value="mappings" className="space-y-4">
            <div className="space-y-4">
              {mappings?.map(mapping => (
                <Card key={mapping.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <BookOpen className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium">{mapping.courses?.title}</p>
                            <p className="text-sm text-muted-foreground">Course</p>
                          </div>
                        </div>
                        
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        
                        <div className="flex items-center space-x-2">
                          <Award className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium">{mapping.licenses?.name}</p>
                            <p className="text-sm text-muted-foreground">{mapping.licenses?.category}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {mapping.directly_grants ? (
                          <Badge className="bg-green-100 text-green-800">
                            Directly Grants
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-800">
                            Progression Course
                          </Badge>
                        )}
                        {mapping.is_required && (
                          <Badge variant="outline">Required</Badge>
                        )}
                        {mapping.renewal_eligible && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            Renewal Eligible
                          </Badge>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => openEditMapping(mapping)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteMapping(mapping.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {mapping.notes && (
                      <div className="mt-3 p-3 bg-muted rounded-md">
                        <p className="text-sm text-muted-foreground">{mapping.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* No Results */}
      {filteredLicenses.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">No certificates found matching your criteria.</p>
          </CardContent>
        </Card>
      )}

      {/* Course-Certificate Mapping Dialog */}
      <Dialog open={showMappingDialog} onOpenChange={setShowMappingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMapping ? 'Edit Course-Certificate Mapping' : 'Link Course to Certificate'}
            </DialogTitle>
            <DialogDescription>
              Create a relationship between a training course and the certificate it can grant.
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
                <Label>Course</Label>
                <Select 
                  value={mappingForm.course_id} 
                  onValueChange={(value) => setMappingForm(prev => ({ ...prev, course_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select course..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allCourses?.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Certificate</Label>
                <Select 
                  value={mappingForm.license_id} 
                  onValueChange={(value) => setMappingForm(prev => ({ ...prev, license_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select certificate..." />
                  </SelectTrigger>
                  <SelectContent>
                    {licenses?.map(license => (
                      <SelectItem key={license.id} value={license.id}>
                        {license.name} ({license.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Course Type</Label>
                <Select 
                  value={mappingForm.directly_grants ? "direct" : "progression"} 
                  onValueChange={(value) => setMappingForm(prev => ({ 
                    ...prev, 
                    directly_grants: value === "direct",
                    progression_course: value === "progression"
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">
                      Directly Grants Certificate
                    </SelectItem>
                    <SelectItem value="progression">
                      Progression/Prerequisite Course
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Min Score Required (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={mappingForm.min_score_required || ''}
                  onChange={(e) => setMappingForm(prev => ({ 
                    ...prev, 
                    min_score_required: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <Label>Credits Awarded</Label>
                <Input
                  type="number"
                  min="0"
                  value={mappingForm.credits_awarded || ''}
                  onChange={(e) => setMappingForm(prev => ({ 
                    ...prev, 
                    credits_awarded: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={mappingForm.is_required}
                  onCheckedChange={(checked) => setMappingForm(prev => ({ ...prev, is_required: checked }))}
                />
                <Label>Required for certificate</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={mappingForm.renewal_eligible}
                  onCheckedChange={(checked) => setMappingForm(prev => ({ ...prev, renewal_eligible: checked }))}
                />
                <Label>Can be used for renewal</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={mappingForm.notes}
                onChange={(e) => setMappingForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional notes about this relationship..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowMappingDialog(false);
              resetMappingForm();
            }}>
              Cancel
            </Button>
            <Button onClick={editingMapping ? handleUpdateMapping : handleCreateMapping}>
              {editingMapping ? 'Update Mapping' : 'Create Mapping'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Certificate Dialog */}
      <Dialog open={showLicenseDialog} onOpenChange={setShowLicenseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Certificate</DialogTitle>
            <DialogDescription>
              Define a new certificate type that employees can earn through training.
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

              <div className="space-y-2">
                <Label>Category *</Label>
                <Input
                  value={licenseForm.category}
                  onChange={(e) => setLicenseForm(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., Safety, Driver License"
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

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Hierarchy Order</Label>
                <Input
                  type="number"
                  min="1"
                  value={licenseForm.hierarchy_order}
                  onChange={(e) => setLicenseForm(prev => ({ ...prev, hierarchy_order: parseInt(e.target.value) }))}
                  placeholder="1 = base, 2 = intermediate..."
                />
              </div>

              <div className="space-y-2">
                <Label>Supersedes Certificate</Label>
                <Select 
                  value={licenseForm.supersedes_license_id || ""} 
                  onValueChange={(value) => setLicenseForm(prev => ({ 
                    ...prev, 
                    supersedes_license_id: value || null,
                    is_base_level: !value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None (Base Level)</SelectItem>
                    {licenses?.filter(l => l.category === licenseForm.category || !licenseForm.category).map(license => (
                      <SelectItem key={license.id} value={license.id}>
                        {license.name}
                      </SelectItem>
                    ))}
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowLicenseDialog(false);
              resetLicenseForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateLicense}>
              Create Certificate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}