import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
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
import { 
  useLicenseDefinitions,
  useCourseDefinitions,
  useCourseCertificateMappings,
  useCertificateDefinitionManagement,
  getLevelColor,
  validateCourseCertificateMapping,
  CourseCertificateMapping
} from '@/hooks/useCertificateDefinitions';
import { useCourses } from '@/hooks/useCourses';
import { toast } from '@/hooks/use-toast';

export default function CertificateDefinitions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [editingMapping, setEditingMapping] = useState<CourseCertificateMapping | null>(null);
  const [showLicenseDialog, setShowLicenseDialog] = useState(false);

  // Data hooks
  const { data: licenses, isLoading: licensesLoading } = useLicenseDefinitions();
  const { data: courses, isLoading: coursesLoading } = useCourseDefinitions();
  const { data: mappings, isLoading: mappingsLoading } = useCourseCertificateMappings();
  const { data: allCourses } = useCourses();

  // Management hooks
  const {
    createCourseCertificateMapping,
    updateCourseCertificateMapping,
    deleteCourseCertificateMapping,
    updateLicenseDefinition,
    createLicenseDefinition
  } = useCertificateDefinitionManagement();

  // Form state
  const [mappingForm, setMappingForm] = useState<CourseCertificateMapping>({
    course_id: '',
    license_id: '',
    directly_grants: true,
    is_required: true,
    renewal_eligible: true,
    min_score_required: undefined,
    credits_awarded: undefined,
    notes: ''
  });

  const [licenseForm, setLicenseForm] = useState({
    name: '',
    category: '',
    description: '',
    level: 1,
    level_description: '',
    validity_period_months: 12,
    renewal_notice_months: 6,
    renewal_grace_period_months: 3
  });

  const [errors, setErrors] = useState<string[]>([]);

  const handleCreateMapping = async () => {
    const validationErrors = validateCourseCertificateMapping(mappingForm);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await createCourseCertificateMapping.mutateAsync(mappingForm);
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

    const validationErrors = validateCourseCertificateMapping(mappingForm);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await updateCourseCertificateMapping.mutateAsync({
        id: editingMapping.id,
        updates: mappingForm
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
        description: "Certificate definition created successfully"
      });
      setShowLicenseDialog(false);
      resetLicenseForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create certificate definition. Please try again.",
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
      level: 1,
      level_description: '',
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
      directly_grants: mapping.directly_grants,
      is_required: mapping.is_required,
      renewal_eligible: mapping.renewal_eligible,
      min_score_required: mapping.min_score_required,
      credits_awarded: mapping.credits_awarded,
      notes: mapping.notes || ''
    });
    setEditingMapping(mapping);
    setShowMappingDialog(true);
  };

  const filteredLicenses = licenses?.filter(license => {
    const matchesSearch = license.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.description?.toLowerCase().includes(searchTerm.toLowerCase());
    // Categories are no longer used in the schema
    return matchesSearch;
  }) || [];

  const categories: string[] = []; // Categories removed from schema

  if (licensesLoading || coursesLoading || mappingsLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-muted-foreground">Loading certificate definitions...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Certificate Definitions</h1>
            <p className="text-muted-foreground">
              Manage certificate types and link them to training courses
            </p>
          </div>
          <div className="flex gap-2">
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

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Certificates</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{licenses?.length || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{courses?.length || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Course-Certificate Links</CardTitle>
              <Link className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mappings?.length || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Search Certificates</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
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

        {/* Main Content */}
        <Tabs defaultValue="certificates" className="space-y-4">
          <TabsList>
            <TabsTrigger value="certificates">Certificate Definitions</TabsTrigger>
            <TabsTrigger value="mappings">Course-Certificate Mappings</TabsTrigger>
          </TabsList>

          {/* Certificate Definitions Tab */}
          <TabsContent value="certificates" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredLicenses.map(license => (
                <Card key={license.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{license.name}</CardTitle>
                      <Badge className={getLevelColor(license.level || 1)}>
                        Level {license.level || 1}
                      </Badge>
                    </div>
                    <CardDescription>{license.category}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {license.description && (
                      <p className="text-sm text-muted-foreground">{license.description}</p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Valid for:</span>
                        <br />
                        <span className="text-muted-foreground">
                          {license.validity_period_months} months
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Notice period:</span>
                        <br />
                        <span className="text-muted-foreground">
                          {license.renewal_notice_months} months
                        </span>
                      </div>
                    </div>

                    {license.course_certificates && license.course_certificates.length > 0 && (
                      <div>
                        <span className="text-sm font-medium">Linked Courses:</span>
                        <div className="mt-1 space-y-1">
                          {license.course_certificates.slice(0, 3).map(cc => (
                            <div key={cc.id} className="text-xs bg-muted p-2 rounded flex items-center justify-between">
                              <span>{cc.courses?.title}</span>
                              {cc.directly_grants && (
                                <Badge variant="outline" className="text-xs">
                                  Direct
                                </Badge>
                              )}
                            </div>
                          ))}
                          {license.course_certificates.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              +{license.course_certificates.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
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
                            <p className="text-sm text-muted-foreground">{mapping.courses?.category}</p>
                          </div>
                        </div>
                        
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        
                        <div className="flex items-center space-x-2">
                          <Award className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium">{mapping.licenses?.name}</p>
                            <p className="text-sm text-muted-foreground">{mapping.licenses?.description}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {mapping.directly_grants && (
                          <Badge variant="default">
                            Directly Grants
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
                          {course.title} ({course.category})
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
                  <Label>Directly Grants Certificate</Label>
                  <Select 
                    value={mappingForm.directly_grants.toString()} 
                    onValueChange={(value) => setMappingForm(prev => ({ ...prev, directly_grants: value === 'true' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes - Directly Grants</SelectItem>
                      <SelectItem value="false">No - Prerequisite Only</SelectItem>
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
              <DialogTitle>Create New Certificate Definition</DialogTitle>
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

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Level</Label>
                  <Select 
                    value={licenseForm.level.toString()} 
                    onValueChange={(value) => setLicenseForm(prev => ({ ...prev, level: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(level => (
                        <SelectItem key={level} value={level.toString()}>
                          Level {level}
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
    </Layout>
  );
}