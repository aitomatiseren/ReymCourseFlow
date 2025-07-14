import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Award, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight,
  BookOpen 
} from 'lucide-react';
import { 
  useLicensesWithHierarchy,
  useRenewalEligibility,
  LicenseWithPrerequisites 
} from '@/hooks/useCertificateHierarchy';
import { useEmployeeLicenses } from '@/hooks/useCertificates';
import { 
  validateTrainingEnrollment,
  checkRenewalEligibility,
  suggestNextTrainingLevel,
  getAvailableTrainingLevels,
  generateCourseRecommendations
} from '@/utils/certificateHierarchy';
import { format } from 'date-fns';

interface EmployeeCertificateHierarchyProps {
  employeeId: string;
  onEnrollTraining?: (licenseId: string, level: number) => void;
}

export const EmployeeCertificateHierarchy: React.FC<EmployeeCertificateHierarchyProps> = ({
  employeeId,
  onEnrollTraining
}) => {
  const { data: licenses, isLoading: licensesLoading } = useLicensesWithHierarchy();
  const { data: employeeLicenses, isLoading: empLicensesLoading } = useEmployeeLicenses(employeeId);

  const isLoading = licensesLoading || empLicensesLoading;

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

  const getStatusIcon = (status: 'valid' | 'expired' | 'expiring') => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'expiring':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getEmployeeLicenseLevel = (licenseId: string): number => {
    if (!employeeLicenses) return 0;
    const validLicenses = employeeLicenses.filter(el => 
      el.license_id === licenseId && el.status === 'valid'
    );
    return Math.max(...validLicenses.map(el => el.level_achieved || 1), 0);
  };

  const getEmployeeLicenseStatus = (licenseId: string): 'valid' | 'expired' | 'expiring' | 'none' => {
    if (!employeeLicenses) return 'none';
    
    const validLicense = employeeLicenses.find(el => 
      el.license_id === licenseId && el.status === 'valid'
    );
    
    if (!validLicense) return 'none';

    if (validLicense.expiry_date) {
      const expiryDate = new Date(validLicense.expiry_date);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry <= 0) return 'expired';
      if (daysUntilExpiry <= 90) return 'expiring';
    }
    
    return 'valid';
  };

  const calculateProgress = (currentLevel: number, maxLevel: number): number => {
    if (maxLevel <= 1) return currentLevel > 0 ? 100 : 0;
    return (currentLevel / maxLevel) * 100;
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading certificate hierarchy...</div>;
  }

  if (!licenses || !employeeLicenses) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No certificate data available for this employee.
        </AlertDescription>
      </Alert>
    );
  }

  // Generate recommendations
  const expiringLicenses = employeeLicenses.filter(el => {
    const status = getEmployeeLicenseStatus(el.license_id || '');
    return status === 'expiring' || status === 'expired';
  });

  const recommendations = generateCourseRecommendations(
    employeeId,
    employeeLicenses,
    licenses,
    expiringLicenses
  );

  return (
    <div className="space-y-6">
      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Training Recommendations
            </CardTitle>
            <CardDescription>
              Suggested courses based on your certificate hierarchy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {recommendations.map((rec, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      rec.urgency === 'high' ? 'bg-red-500' :
                      rec.urgency === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <div>
                      <p className="font-medium">{rec.licenseName}</p>
                      <p className="text-sm text-muted-foreground">
                        {rec.reason === 'renewal' && rec.daysUntilExpiry !== undefined && (
                          `Renewal needed - expires in ${rec.daysUntilExpiry} days`
                        )}
                        {rec.reason === 'progression' && 'Next level available'}
                        {rec.reason === 'prerequisite' && 'Required for other certificates'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Level {rec.recommendedLevel}</Badge>
                    {onEnrollTraining && (
                      <Button
                        size="sm"
                        onClick={() => onEnrollTraining(rec.licenseId, rec.recommendedLevel)}
                      >
                        Enroll
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Certificate Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {licenses.map(license => {
          const currentLevel = getEmployeeLicenseLevel(license.id);
          const status = getEmployeeLicenseStatus(license.id);
          const maxLevel = license.level || 5;
          const progress = calculateProgress(currentLevel, maxLevel);
          const availableLevels = getAvailableTrainingLevels(employeeLicenses, license, maxLevel);

          return (
            <Card key={license.id} className={`${
              status === 'expiring' || status === 'expired' ? 'border-yellow-500' : ''
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{license.name}</CardTitle>
                  {getStatusIcon(status as any)}
                </div>
                <CardDescription>{license.category}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current Level</span>
                  {currentLevel > 0 ? (
                    <Badge className={getLevelColor(currentLevel)}>
                      Level {currentLevel}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Not Certified</Badge>
                  )}
                </div>

                {/* Progress Bar */}
                {maxLevel > 1 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                {/* Prerequisites */}
                {license.prerequisites && license.prerequisites.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Prerequisites</span>
                    <div className="flex flex-wrap gap-1">
                      {license.prerequisites.map(prereq => {
                        const prereqLevel = getEmployeeLicenseLevel(prereq.id);
                        const prereqStatus = getEmployeeLicenseStatus(prereq.id);
                        return (
                          <Badge 
                            key={prereq.id} 
                            variant={prereqLevel > 0 ? "default" : "outline"}
                            className="text-xs"
                          >
                            {prereq.name}
                            {prereqLevel > 0 && prereqStatus === 'valid' && (
                              <CheckCircle className="ml-1 h-3 w-3" />
                            )}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Available Actions */}
                {availableLevels.length > 0 && onEnrollTraining && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Available Training</span>
                    <div className="flex flex-wrap gap-2">
                      {availableLevels.map(level => (
                        <Button
                          key={level}
                          size="sm"
                          variant="outline"
                          onClick={() => onEnrollTraining(license.id, level)}
                          className="text-xs"
                        >
                          <BookOpen className="mr-1 h-3 w-3" />
                          Level {level}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expiry Information */}
                {status !== 'none' && (
                  <div className="text-xs text-muted-foreground">
                    {(() => {
                      const validLicense = employeeLicenses.find(el => 
                        el.license_id === license.id && el.status === 'valid'
                      );
                      if (validLicense?.expiry_date) {
                        const expiryDate = new Date(validLicense.expiry_date);
                        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        return `Expires ${format(expiryDate, 'MMM d, yyyy')} (${daysUntilExpiry} days)`;
                      }
                      return 'No expiry date set';
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Hierarchy Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Certificate Pathway
          </CardTitle>
          <CardDescription>
            Visual representation of available certificate progressions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {licenses
              .filter(license => license.prerequisites && license.prerequisites.length > 0)
              .map(license => {
                const currentLevel = getEmployeeLicenseLevel(license.id);
                const status = getEmployeeLicenseStatus(license.id);
                
                return (
                  <div key={license.id} className="flex items-center gap-2 p-3 border rounded-lg">
                    {/* Prerequisites */}
                    <div className="flex items-center gap-2">
                      {license.prerequisites?.map((prereq, index) => {
                        const prereqLevel = getEmployeeLicenseLevel(prereq.id);
                        const prereqStatus = getEmployeeLicenseStatus(prereq.id);
                        
                        return (
                          <React.Fragment key={prereq.id}>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                              prereqLevel > 0 && prereqStatus === 'valid' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              <span>{prereq.name}</span>
                              {prereqLevel > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  L{prereqLevel}
                                </Badge>
                              )}
                            </div>
                            {index < (license.prerequisites?.length || 0) - 1 && (
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                    
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    
                    {/* Target Certificate */}
                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                      currentLevel > 0 && status === 'valid'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <span>{license.name}</span>
                      {currentLevel > 0 && (
                        <Badge variant="outline" className="text-xs">
                          L{currentLevel}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};