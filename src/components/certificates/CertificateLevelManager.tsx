import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Plus, Trash2, ArrowRight, Users, Award } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  useLicensesWithHierarchy, 
  useCertificatePrerequisiteManagement,
  useLicenseLevelManagement,
  LicenseWithPrerequisites 
} from '@/hooks/useCertificateHierarchy';
import { toast } from '@/hooks/use-toast';

export const CertificateLevelManager: React.FC = () => {
  const { data: licenses, isLoading, error } = useLicensesWithHierarchy();
  const { updateLicenseLevel } = useLicenseLevelManagement();
  const { addPrerequisite, removePrerequisite } = useCertificatePrerequisiteManagement();
  
  const [selectedLicense, setSelectedLicense] = useState<string>('');
  const [editingLevel, setEditingLevel] = useState<{ id: string; level: number; description: string } | null>(null);
  const [newPrerequisite, setNewPrerequisite] = useState<string>('');

  const handleUpdateLevel = async () => {
    if (!editingLevel) return;

    try {
      await updateLicenseLevel.mutateAsync({
        licenseId: editingLevel.id,
        level: editingLevel.level,
        levelDescription: editingLevel.description
      });
      
      toast({
        title: "Success",
        description: "Certificate level updated successfully"
      });
      
      setEditingLevel(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update certificate level",
        variant: "destructive"
      });
    }
  };

  const handleAddPrerequisite = async (certificateId: string) => {
    if (!newPrerequisite) return;

    try {
      await addPrerequisite.mutateAsync({
        certificateId,
        prerequisiteId: newPrerequisite
      });
      
      toast({
        title: "Success",
        description: "Prerequisite added successfully"
      });
      
      setNewPrerequisite('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add prerequisite",
        variant: "destructive"
      });
    }
  };

  const handleRemovePrerequisite = async (certificateId: string, prerequisiteId: string) => {
    try {
      await removePrerequisite.mutateAsync({
        certificateId,
        prerequisiteId
      });
      
      toast({
        title: "Success",
        description: "Prerequisite removed successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove prerequisite",
        variant: "destructive"
      });
    }
  };

  const getLevelColor = (level: number) => {
    const colors = {
      1: 'bg-green-100 text-green-800',
      2: 'bg-blue-100 text-blue-800',
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-orange-100 text-orange-800',
      5: 'bg-red-100 text-red-800'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const selectedLicenseData = licenses?.find(l => l.id === selectedLicense);

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading certificate hierarchy...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load certificate hierarchy: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Certificate Level Hierarchy</h2>
          <p className="text-muted-foreground">
            Manage certificate levels and prerequisite relationships
          </p>
        </div>
      </div>

      {/* License Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Certificate</CardTitle>
          <CardDescription>
            Choose a certificate to manage its level and prerequisites
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedLicense} onValueChange={setSelectedLicense}>
            <SelectTrigger>
              <SelectValue placeholder="Select a certificate..." />
            </SelectTrigger>
            <SelectContent>
              {licenses?.map(license => (
                <SelectItem key={license.id} value={license.id}>
                  <div className="flex items-center gap-2">
                    <span>{license.name}</span>
                    {license.level && (
                      <Badge variant="outline" className={getLevelColor(license.level)}>
                        Level {license.level}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Certificate Details */}
      {selectedLicenseData && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Level Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Level Configuration
              </CardTitle>
              <CardDescription>
                Set the level and description for this certificate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Current Level</Label>
                  <Badge className={`mt-1 ${getLevelColor(selectedLicenseData.level || 1)}`}>
                    Level {selectedLicenseData.level || 1}
                  </Badge>
                </div>
                <div>
                  <Label>Category</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedLicenseData.category || 'No category'}
                  </p>
                </div>
              </div>

              {selectedLicenseData.level_description && (
                <div>
                  <Label>Level Description</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedLicenseData.level_description}
                  </p>
                </div>
              )}

              {editingLevel?.id === selectedLicenseData.id ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="level">Level</Label>
                    <Select 
                      value={editingLevel.level.toString()} 
                      onValueChange={(value) => setEditingLevel({
                        ...editingLevel,
                        level: parseInt(value)
                      })}
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
                  
                  <div>
                    <Label htmlFor="description">Level Description</Label>
                    <Input
                      id="description"
                      value={editingLevel.description}
                      onChange={(e) => setEditingLevel({
                        ...editingLevel,
                        description: e.target.value
                      })}
                      placeholder="Describe what this level represents..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleUpdateLevel}
                      disabled={updateLicenseLevel.isPending}
                    >
                      Save Changes
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setEditingLevel(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button 
                  onClick={() => setEditingLevel({
                    id: selectedLicenseData.id,
                    level: selectedLicenseData.level || 1,
                    description: selectedLicenseData.level_description || ''
                  })}
                >
                  Edit Level
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Prerequisites Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Prerequisites
              </CardTitle>
              <CardDescription>
                Manage required certificates before this one
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Prerequisites */}
              {selectedLicenseData.prerequisites && selectedLicenseData.prerequisites.length > 0 ? (
                <div className="space-y-2">
                  <Label>Required Prerequisites</Label>
                  {selectedLicenseData.prerequisites.map(prereq => (
                    <div key={prereq.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{prereq.name}</span>
                        {prereq.level && (
                          <Badge variant="outline" className={getLevelColor(prereq.level)}>
                            Level {prereq.level}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePrerequisite(selectedLicenseData.id, prereq.id)}
                        disabled={removePrerequisite.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No prerequisites required</p>
              )}

              <Separator />

              {/* Add New Prerequisite */}
              <div className="space-y-2">
                <Label>Add Prerequisite</Label>
                <div className="flex gap-2">
                  <Select value={newPrerequisite} onValueChange={setNewPrerequisite}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select prerequisite..." />
                    </SelectTrigger>
                    <SelectContent>
                      {licenses
                        ?.filter(l => 
                          l.id !== selectedLicenseData.id && 
                          !selectedLicenseData.prerequisites?.some(p => p.id === l.id)
                        )
                        .map(license => (
                          <SelectItem key={license.id} value={license.id}>
                            <div className="flex items-center gap-2">
                              <span>{license.name}</span>
                              {license.level && (
                                <Badge variant="outline" className={getLevelColor(license.level)}>
                                  Level {license.level}
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => handleAddPrerequisite(selectedLicenseData.id)}
                    disabled={!newPrerequisite || addPrerequisite.isPending}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Hierarchy Overview */}
      {selectedLicenseData && (
        <Card>
          <CardHeader>
            <CardTitle>Certificate Chain</CardTitle>
            <CardDescription>
              Visual representation of the certificate progression path
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedLicenseData.prerequisites && selectedLicenseData.prerequisites.length > 0 ? (
              <div className="flex items-center gap-2 flex-wrap">
                {selectedLicenseData.prerequisites.map((prereq, index) => (
                  <React.Fragment key={prereq.id}>
                    <div className="flex items-center gap-2 p-2 border rounded-lg">
                      <span className="text-sm font-medium">{prereq.name}</span>
                      {prereq.level && (
                        <Badge variant="outline" className={getLevelColor(prereq.level)}>
                          L{prereq.level}
                        </Badge>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </React.Fragment>
                ))}
                <div className="flex items-center gap-2 p-2 border-2 border-primary rounded-lg bg-primary/5">
                  <span className="text-sm font-medium">{selectedLicenseData.name}</span>
                  {selectedLicenseData.level && (
                    <Badge className={getLevelColor(selectedLicenseData.level)}>
                      L{selectedLicenseData.level}
                    </Badge>
                  )}
                </div>
                {selectedLicenseData.dependents && selectedLicenseData.dependents.length > 0 && (
                  <>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    {selectedLicenseData.dependents.map(dependent => (
                      <div key={dependent.id} className="flex items-center gap-2 p-2 border rounded-lg">
                        <span className="text-sm font-medium">{dependent.name}</span>
                        {dependent.level && (
                          <Badge variant="outline" className={getLevelColor(dependent.level)}>
                            L{dependent.level}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                This certificate has no prerequisites and stands alone in the hierarchy.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};