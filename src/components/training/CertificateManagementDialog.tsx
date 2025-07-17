import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus,
  Award,
  Link,
  Trash2,
  CheckCircle,
  AlertCircle,
  BookOpen
} from 'lucide-react';
import { 
  useLicenseDefinitions,
  useCertificateDefinitionManagement,
  CourseCertificateMapping
} from '@/hooks/useCertificateDefinitions';
import { useCourses } from '@/hooks/useCourses';
import { toast } from '@/hooks/use-toast';

interface CertificateManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCourseId?: string;
  onCertificateCreated?: () => void;
}

export function CertificateManagementDialog({
  open,
  onOpenChange,
  selectedCourseId,
  onCertificateCreated
}: CertificateManagementDialogProps) {
  const [activeTab, setActiveTab] = useState('create-license');
  const [newLicense, setNewLicense] = useState({
    name: '',
    description: '',
    category: '',
    validity_period_months: 12,
    level: 1,
    level_description: '',
    renewal_notice_months: 3,
    renewal_grace_period_months: 1
  });
  const [newMapping, setNewMapping] = useState<Partial<CourseCertificateMapping>>({
    course_id: selectedCourseId || '',
    license_id: '',
    grants_level: 1,
    is_required: true,
    renewal_eligible: true,
    min_score_required: 70,
    credits_awarded: 1,
    notes: ''
  });

  const { data: licenses = [] } = useLicenseDefinitions();
  const { data: courses = [] } = useCourses();
  const { 
    createLicenseDefinition: createLicense, 
    createCourseCertificateMapping,
    deleteCourseCertificateMapping 
  } = useCertificateDefinitionManagement();

  const handleCreateLicense = async () => {
    try {
      await createLicense.mutateAsync(newLicense);
      
      toast({
        title: "Certificate Created",
        description: `${newLicense.name} has been created successfully`,
      });

      // Reset form
      setNewLicense({
        name: '',
        description: '',
        category: '',
        validity_period_months: 12,
        level: 1,
        level_description: '',
        renewal_notice_months: 3,
        renewal_grace_period_months: 1
      });

      onCertificateCreated?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create certificate",
        variant: "destructive"
      });
    }
  };

  const handleCreateMapping = async () => {
    if (!newMapping.course_id || !newMapping.license_id) {
      toast({
        title: "Validation Error",
        description: "Please select both a course and certificate",
        variant: "destructive"
      });
      return;
    }

    try {
      await createCourseCertificateMapping.mutateAsync(newMapping as CourseCertificateMapping);
      
      toast({
        title: "Certificate Linked",
        description: "Certificate has been linked to the course successfully",
      });

      // Reset form
      setNewMapping({
        course_id: selectedCourseId || '',
        license_id: '',
        grants_level: 1,
        is_required: true,
        renewal_eligible: true,
        min_score_required: 70,
        credits_awarded: 1,
        notes: ''
      });

      onCertificateCreated?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to link certificate to course",
        variant: "destructive"
      });
    }
  };

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Certificate Management
          </DialogTitle>
          <DialogDescription>
            Create certificates and link them to courses for your training programs.
            {selectedCourse && (
              <span className="block mt-2 text-blue-600 font-medium">
                Working with course: {selectedCourse.title}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create-license" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Certificate
            </TabsTrigger>
            <TabsTrigger value="link-certificate" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Link to Course
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create-license" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Create New Certificate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Certificate Name *</Label>
                    <Input
                      id="name"
                      value={newLicense.name}
                      onChange={(e) => setNewLicense({ ...newLicense, name: e.target.value })}
                      placeholder="e.g., ADR Basic Certificate"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Input
                      id="category"
                      value={newLicense.category}
                      onChange={(e) => setNewLicense({ ...newLicense, category: e.target.value })}
                      placeholder="e.g., Driving, Safety, Technical"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newLicense.description}
                    onChange={(e) => setNewLicense({ ...newLicense, description: e.target.value })}
                    placeholder="Describe what this certificate covers..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="level">Level</Label>
                    <Select 
                      value={newLicense.level.toString()} 
                      onValueChange={(value) => setNewLicense({ ...newLicense, level: parseInt(value) })}
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
                    <Label htmlFor="validity">Validity (months)</Label>
                    <Input
                      id="validity"
                      type="number"
                      value={newLicense.validity_period_months}
                      onChange={(e) => setNewLicense({ ...newLicense, validity_period_months: parseInt(e.target.value) || 12 })}
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="renewal_notice">Renewal Notice (months)</Label>
                    <Input
                      id="renewal_notice"
                      type="number"
                      value={newLicense.renewal_notice_months}
                      onChange={(e) => setNewLicense({ ...newLicense, renewal_notice_months: parseInt(e.target.value) || 3 })}
                      min="1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level_description">Level Description</Label>
                  <Input
                    id="level_description"
                    value={newLicense.level_description}
                    onChange={(e) => setNewLicense({ ...newLicense, level_description: e.target.value })}
                    placeholder="e.g., Basic level certification"
                  />
                </div>

                <Button 
                  onClick={handleCreateLicense}
                  disabled={!newLicense.name || !newLicense.category || createLicense.isPending}
                  className="w-full"
                >
                  {createLicense.isPending ? 'Creating...' : 'Create Certificate'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="link-certificate" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Link Certificate to Course
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedCourseId && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Please select a course first to link certificates.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="course">Course *</Label>
                    <Select 
                      value={newMapping.course_id} 
                      onValueChange={(value) => setNewMapping({ ...newMapping, course_id: value })}
                      disabled={!!selectedCourseId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map(course => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="license">Certificate *</Label>
                    <Select 
                      value={newMapping.license_id} 
                      onValueChange={(value) => setNewMapping({ ...newMapping, license_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a certificate" />
                      </SelectTrigger>
                      <SelectContent>
                        {licenses.map(license => (
                          <SelectItem key={license.id} value={license.id}>
                            <div className="flex items-center gap-2">
                              <Award className="h-3 w-3" />
                              {license.name}
                              <Badge variant="outline" className="ml-auto text-xs">
                                {license.category}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grants_level">Grants Level</Label>
                    <Select 
                      value={newMapping.grants_level?.toString()} 
                      onValueChange={(value) => setNewMapping({ ...newMapping, grants_level: parseInt(value) })}
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
                    <Label htmlFor="min_score">Minimum Score (%)</Label>
                    <Input
                      id="min_score"
                      type="number"
                      value={newMapping.min_score_required}
                      onChange={(e) => setNewMapping({ ...newMapping, min_score_required: parseInt(e.target.value) || 70 })}
                      min="0"
                      max="100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="credits">Credits Awarded</Label>
                    <Input
                      id="credits"
                      type="number"
                      value={newMapping.credits_awarded}
                      onChange={(e) => setNewMapping({ ...newMapping, credits_awarded: parseInt(e.target.value) || 1 })}
                      min="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="required"
                      checked={newMapping.is_required}
                      onCheckedChange={(checked) => setNewMapping({ ...newMapping, is_required: checked })}
                    />
                    <Label htmlFor="required">Required Certificate</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="renewable"
                      checked={newMapping.renewal_eligible}
                      onCheckedChange={(checked) => setNewMapping({ ...newMapping, renewal_eligible: checked })}
                    />
                    <Label htmlFor="renewable">Renewable</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newMapping.notes}
                    onChange={(e) => setNewMapping({ ...newMapping, notes: e.target.value })}
                    placeholder="Additional notes about this certificate requirement..."
                    rows={2}
                  />
                </div>

                <Button 
                  onClick={handleCreateMapping}
                  disabled={!newMapping.course_id || !newMapping.license_id || createCourseCertificateMapping.isPending}
                  className="w-full"
                >
                  {createCourseCertificateMapping.isPending ? 'Linking...' : 'Link Certificate to Course'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}