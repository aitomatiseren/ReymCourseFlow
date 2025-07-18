import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { usePermissions } from "@/context/PermissionsContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Calendar,
  Award,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Star,
  Phone,
  Mail,
  MapPin,
  Building,
  FileText,
  CreditCard,
  Heart,
  ShieldCheck,
  Car,
  Users,
  Briefcase
} from "lucide-react";
import { Certificate, Training, Code95Progress } from "@/types";
import { calculateCode95Points } from "@/utils/certificateUtils";
import { format } from "date-fns";

// Helper function to format address
const formatAddress = (employee: any) => {
  const parts = [employee.address, employee.postcode, employee.city, employee.country]
    .filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
};

// Helper function to get employee initials
const getInitials = (employee: any) => {
  if (employee.first_name && employee.last_name) {
    return `${employee.first_name[0]}${employee.last_name[0]}`.toUpperCase();
  }
  if (employee.name) {
    return employee.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }
  return 'JD';
};

export function EmployeeSelfService() {
  const { t } = useTranslation('employees');
  const { userProfile } = usePermissions();
  const [activeTab, setActiveTab] = useState<'details' | 'certificates' | 'trainings' | 'code95'>('details');

  // Fetch current employee data
  const { data: employee, isLoading: employeeLoading } = useQuery({
    queryKey: ['current-employee', userProfile?.employee_id],
    queryFn: async () => {
      if (!userProfile?.employee_id) return null;
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', userProfile.employee_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userProfile?.employee_id
  });

  // Fetch employee certificates
  const { data: certificates = [], isLoading: certificatesLoading } = useQuery({
    queryKey: ['employee-certificates', employee?.id],
    queryFn: async () => {
      if (!employee?.id) return [];
      
      const { data, error } = await supabase
        .from('employee_licenses')
        .select(`
          *,
          courses (
            title,
            code95_points
          )
        `)
        .eq('employee_id', employee.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!employee?.id
  });

  // Fetch upcoming trainings
  const { data: upcomingTrainings = [], isLoading: trainingsLoading } = useQuery({
    queryKey: ['employee-trainings', employee?.id],
    queryFn: async () => {
      if (!employee?.id) return [];
      
      const { data, error } = await supabase
        .from('training_participants')
        .select(`
          *,
          trainings (
            id,
            title,
            description,
            date,
            time,
            location,
            instructor,
            status,
            courses (
              code95_points
            )
          )
        `)
        .eq('employee_id', employee.id)
        .gte('trainings.date', new Date().toISOString().split('T')[0]);
      
      if (error) throw error;
      return data?.map(tp => tp.trainings).filter(Boolean) || [];
    },
    enabled: !!employee?.id
  });

  // Fetch completed trainings for the employee
  const { data: completedTrainings = [] } = useQuery({
    queryKey: ['employee-completed-trainings', employee?.id],
    queryFn: async () => {
      if (!employee?.id) return [];
      
      const { data, error } = await supabase
        .from('training_participants')
        .select(`
          *,
          trainings (
            id,
            title,
            description,
            date,
            time,
            location,
            instructor,
            status,
            courses (
              title,
              code95_points
            )
          )
        `)
        .eq('employee_id', employee.id)
        .eq('status', 'completed')
        .lt('trainings.date', new Date().toISOString().split('T')[0]);
      
      if (error) throw error;
      return data?.map(tp => tp.trainings).filter(Boolean) || [];
    },
    enabled: !!employee?.id
  });

  const code95Progress = calculateCode95Points(certificates);
  const code95Percentage = (code95Progress.total / code95Progress.required) * 100;

  const statusColors = {
    valid: "bg-green-100 text-green-800",
    expiring: "bg-orange-100 text-orange-800",
    expired: "bg-red-100 text-red-800"
  };

  const statusIcons = {
    valid: CheckCircle,
    expiring: Clock,
    expired: AlertTriangle
  };

  const handleDownloadCertificate = (certId: string) => {
    console.log(`Downloading certificate ${certId}`);
  };

  if (employeeLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Clock className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading employee information...</span>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No employee profile found. Please contact your administrator.</p>
      </div>
    );
  }

  const employeeName = employee.roepnaam || employee.first_name || employee.name || 'Employee';
  const fullName = [employee.first_name, employee.tussenvoegsel, employee.last_name]
    .filter(Boolean).join(' ') || employee.name || 'Employee';
  const initials = getInitials(employee);
  const address = formatAddress(employee);

  return (
    <div className="space-y-6">
      {/* Employee Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {initials}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{fullName}</h1>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                {employee.job_title && (
                  <span className="flex items-center">
                    <Briefcase className="h-4 w-4 mr-1" />
                    {employee.job_title}
                  </span>
                )}
                {employee.department && (
                  <span className="flex items-center">
                    <Building className="h-4 w-4 mr-1" />
                    {employee.department}
                  </span>
                )}
                {employee.employee_number && (
                  <span className="flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    {employee.employee_number}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                {employee.email && (
                  <span className="flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    {employee.email}
                  </span>
                )}
                {employee.phone && (
                  <span className="flex items-center">
                    <Phone className="h-4 w-4 mr-1" />
                    {employee.phone}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <Badge 
                className={
                  employee.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }
              >
                {employee.status || 'Active'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Personal Details
          </TabsTrigger>
          <TabsTrigger value="certificates" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            My Certificates
          </TabsTrigger>
          <TabsTrigger value="trainings" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            My Trainings
          </TabsTrigger>
          <TabsTrigger value="code95" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Code 95 Progress
          </TabsTrigger>
        </TabsList>

        {/* Personal Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="font-medium text-gray-700">First Name</label>
                    <p className="text-gray-900">{employee.first_name || '-'}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">Last Name</label>
                    <p className="text-gray-900">{employee.last_name || '-'}</p>
                  </div>
                  {employee.tussenvoegsel && (
                    <div>
                      <label className="font-medium text-gray-700">Tussenvoegsel</label>
                      <p className="text-gray-900">{employee.tussenvoegsel}</p>
                    </div>
                  )}
                  {employee.roepnaam && (
                    <div>
                      <label className="font-medium text-gray-700">Roepnaam</label>
                      <p className="text-gray-900">{employee.roepnaam}</p>
                    </div>
                  )}
                  {employee.date_of_birth && (
                    <div>
                      <label className="font-medium text-gray-700">Date of Birth</label>
                      <p className="text-gray-900">{format(new Date(employee.date_of_birth), 'PPP')}</p>
                    </div>
                  )}
                  {employee.gender && (
                    <div>
                      <label className="font-medium text-gray-700">Gender</label>
                      <p className="text-gray-900 capitalize">{employee.gender}</p>
                    </div>
                  )}
                  {employee.nationality && (
                    <div>
                      <label className="font-medium text-gray-700">Nationality</label>
                      <p className="text-gray-900">{employee.nationality}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  {employee.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div>
                        <label className="font-medium text-gray-700">Work Email</label>
                        <p className="text-gray-900">{employee.email}</p>
                      </div>
                    </div>
                  )}
                  {employee.private_email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div>
                        <label className="font-medium text-gray-700">Private Email</label>
                        <p className="text-gray-900">{employee.private_email}</p>
                      </div>
                    </div>
                  )}
                  {employee.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <div>
                        <label className="font-medium text-gray-700">Work Phone</label>
                        <p className="text-gray-900">{employee.phone}</p>
                      </div>
                    </div>
                  )}
                  {employee.mobile_phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <div>
                        <label className="font-medium text-gray-700">Mobile Phone</label>
                        <p className="text-gray-900">{employee.mobile_phone}</p>
                      </div>
                    </div>
                  )}
                  {address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <label className="font-medium text-gray-700">Address</label>
                        <p className="text-gray-900">{address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Employment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Employment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 text-sm">
                  {employee.hire_date && (
                    <div>
                      <label className="font-medium text-gray-700">Hire Date</label>
                      <p className="text-gray-900">{format(new Date(employee.hire_date), 'PPP')}</p>
                    </div>
                  )}
                  {employee.contract_type && (
                    <div>
                      <label className="font-medium text-gray-700">Contract Type</label>
                      <p className="text-gray-900 capitalize">{employee.contract_type.replace('_', ' ')}</p>
                    </div>
                  )}
                  {employee.work_location && (
                    <div>
                      <label className="font-medium text-gray-700">Work Location</label>
                      <p className="text-gray-900">{employee.work_location}</p>
                    </div>
                  )}
                  {employee.working_hours && (
                    <div>
                      <label className="font-medium text-gray-700">Working Hours</label>
                      <p className="text-gray-900">{employee.working_hours} hours/week</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Driving License Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Driving License
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  {employee.driving_license_number && (
                    <div>
                      <label className="font-medium text-gray-700">License Number</label>
                      <p className="text-gray-900">{employee.driving_license_number}</p>
                    </div>
                  )}
                  {employee.driving_license_expiry_date && (
                    <div>
                      <label className="font-medium text-gray-700">License Expiry</label>
                      <p className="text-gray-900">{format(new Date(employee.driving_license_expiry_date), 'PPP')}</p>
                    </div>
                  )}
                  
                  {/* License Categories */}
                  <div>
                    <label className="font-medium text-gray-700">License Categories</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['A', 'B', 'BE', 'C', 'CE', 'D', 'Code95'].map(category => {
                        const hasLicense = employee[`driving_license_${category.toLowerCase()}`];
                        return hasLicense ? (
                          <Badge key={category} variant="outline" className="bg-green-50 text-green-700">
                            {category}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Certificates Tab */}
        <TabsContent value="certificates" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">My Certificates</h2>
            {certificatesLoading && <Clock className="h-5 w-5 animate-spin" />}
          </div>
          
          {certificates.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Award className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No certificates found.</p>
              </CardContent>
            </Card>
          ) : (
            certificates.map((cert) => {
              const StatusIcon = statusIcons[cert.status || 'valid'];

              return (
                <Card key={cert.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {cert.courses?.title || cert.license_type}
                          </h3>
                          <Badge className={statusColors[cert.status || 'valid']}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {cert.status || 'Valid'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            Issued: {cert.issue_date ? format(new Date(cert.issue_date), 'PPP') : '-'}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            Expires: {cert.expiry_date ? format(new Date(cert.expiry_date), 'PPP') : '-'}
                          </div>
                          <div className="text-xs">
                            #{cert.license_number || cert.id}
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          {cert.courses?.code95_points && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">
                              Code 95: {cert.courses.code95_points} points
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadCertificate(cert.id)}
                          className="flex items-center space-x-2"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Trainings Tab */}
        <TabsContent value="trainings" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Trainings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Planned Trainings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {trainingsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Clock className="h-6 w-6 animate-spin" />
                  </div>
                ) : upcomingTrainings.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No upcoming trainings.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingTrainings.map((training) => (
                      <div key={training.id} className="border rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">{training.title}</h4>
                        <p className="text-sm text-gray-600 mb-3">{training.description}</p>
                        
                        <div className="grid grid-cols-1 gap-2 text-xs text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(new Date(training.date), 'PPP')}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {training.time ? training.time.slice(0, 5) : ''}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {training.location}
                          </div>
                          {training.instructor && (
                            <div className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {training.instructor}
                            </div>
                          )}
                        </div>
                        
                        {training.courses?.code95_points && (
                          <div className="mt-2">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              Code 95: {training.courses.code95_points} points
                            </Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Completed Trainings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Completed Trainings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {completedTrainings.length === 0 ? (
                  <div className="text-center py-8">
                    <Award className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No completed trainings yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {completedTrainings.map((training) => (
                      <div key={training.id} className="border rounded-lg p-4 bg-green-50">
                        <h4 className="font-semibold text-gray-900 mb-2">{training.title}</h4>
                        
                        <div className="grid grid-cols-1 gap-2 text-xs text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Completed: {format(new Date(training.date), 'PPP')}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {training.location}
                          </div>
                        </div>
                        
                        {training.courses?.code95_points && (
                          <div className="mt-2">
                            <Badge variant="outline" className="bg-green-100 text-green-700">
                              ✓ Code 95: {training.courses.code95_points} points earned
                            </Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Code 95 Tab */}
        <TabsContent value="code95" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Code 95 Progress</h2>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {code95Progress.total}/{code95Progress.required} points
            </Badge>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Progress Overview</span>
                  <span className="text-gray-500">{Math.round(code95Percentage)}%</span>
                </div>

                <Progress value={code95Percentage} className="h-3" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">{code95Progress.total}</div>
                    <div className="text-sm text-gray-600">Points Earned</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-600">{code95Progress.required}</div>
                    <div className="text-sm text-gray-600">Points Required</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.max(0, code95Progress.required - code95Progress.total)}
                    </div>
                    <div className="text-sm text-gray-600">Points Remaining</div>
                  </div>
                </div>

                {code95Progress.total >= code95Progress.required ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-green-700 font-medium">Code 95 Requirements Complete!</p>
                    <p className="text-green-600 text-sm">You have met all Code 95 training requirements.</p>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                    <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-yellow-700 font-medium">Code 95 Incomplete</p>
                    <p className="text-yellow-600 text-sm">
                      You need {Math.max(0, code95Progress.required - code95Progress.total)} more points to complete your Code 95 requirements.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}