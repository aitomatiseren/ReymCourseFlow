
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Edit, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Building2,
  User,
  IdCard,
  Loader2,
  Globe,
  AlertTriangle,
  Award,
  Clock
} from "lucide-react";
import { useEmployee } from "@/hooks/useEmployees";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EditEmployeeDialog } from "./EditEmployeeDialog";
import { useCertificates } from "@/hooks/useCertificates";
import { 
  calculateCode95Progress, 
  getCode95Status, 
  getCode95StatusEmoji, 
  getCode95StatusDescription,
  getCode95StatusColor,
  needsCode95Training,
  requiresCode95
} from "@/utils/code95Utils";
import { getStatusLabel } from "@/constants/employeeStatus";
import { format } from "date-fns";

const statusColors = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  on_leave: "bg-yellow-100 text-yellow-800",
  sick: "bg-red-100 text-red-800",
  terminated: "bg-red-100 text-red-800"
};

interface UserProfileHeaderProps {
  userId: string;
}

export function UserProfileHeader({ userId }: UserProfileHeaderProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { data: employee, isLoading, error } = useEmployee(userId);
  const { data: certificates = [] } = useCertificates();

  // Fetch the ACTUAL current status from status history (excluding future-dated statuses)
  const { data: currentStatusHistory } = useQuery({
    queryKey: ['employee-current-status', userId],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('employee_status_history')
        .select('*')
        .eq('employee_id', userId)
        .is('end_date', null)
        .lte('start_date', now) // Only include statuses that have already started
        .order('start_date', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone: string) => {
    // Remove all non-digit characters for validation
    const cleanPhone = phone.replace(/\D/g, '');
    // Check if it's a valid length (7-15 digits) and contains only digits, spaces, dashes, parentheses, and +
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,20}$/;
    
    // Special handling for Dutch mobile numbers (+31 6 followed by 8 digits)
    if (phone.startsWith('+31 6') || phone.startsWith('+316')) {
      const dutchMobile = phone.replace(/\D/g, '');
      // Should be 11 digits total (31 + 6 + 8 digits)
      return dutchMobile.length === 11 && dutchMobile.startsWith('316');
    }
    
    return phoneRegex.test(phone) && cleanPhone.length >= 7 && cleanPhone.length <= 15;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading employee details...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !employee) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-500">Error loading employee details</p>
        </CardContent>
      </Card>
    );
  }

  // Get ACTUAL current status (excluding future dates), fallback to employee.status
  const currentStatus = currentStatusHistory?.[0]?.status || employee.status;

  // Calculate Code 95 status for this employee
  const employeeCertificates = certificates.filter(cert => cert.employeeId === employee.id);
  const code95Progress = calculateCode95Progress(employee, employeeCertificates);
  const code95Status = getCode95Status(employee, employeeCertificates);
  const needsCode95 = needsCode95Training(employee, employeeCertificates);
  const hasCode95License = requiresCode95(employee);

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                  {getInitials(employee.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{employee.name}</h1>
                <p className="text-lg text-gray-600">{employee.jobTitle}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge className={statusColors[currentStatus as keyof typeof statusColors] || statusColors.inactive}>
                    {getStatusLabel(currentStatus as any)}
                  </Badge>
                  <span className="text-sm text-gray-500">#{employee.employeeNumber}</span>
                </div>
              </div>
            </div>
            <Button onClick={() => setShowEditDialog(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>

          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                Contact Information
              </h3>
              <div className="space-y-2 text-sm">
                {employee.phone && (
                  <div className={`flex items-center ${isValidPhone(employee.phone) ? 'text-gray-600' : 'text-red-600'}`}>
                    <Phone className="h-3 w-3 mr-2" />
                    {employee.phone} (Work)
                    {!isValidPhone(employee.phone) && (
                      <AlertTriangle className="h-3 w-3 ml-2 text-red-500" title="Invalid phone format" />
                    )}
                  </div>
                )}
                {employee.mobilePhone && (
                  <div className={`flex items-center ${isValidPhone(employee.mobilePhone) ? 'text-gray-600' : 'text-red-600'}`}>
                    <Phone className="h-3 w-3 mr-2" />
                    {employee.mobilePhone} (Private)
                    {!isValidPhone(employee.mobilePhone) && (
                      <AlertTriangle className="h-3 w-3 ml-2 text-red-500" title="Invalid phone format" />
                    )}
                  </div>
                )}
                <div className={`flex items-center ${isValidEmail(employee.email) ? 'text-gray-600' : 'text-red-600'}`}>
                  <Mail className="h-3 w-3 mr-2" />
                  {employee.email} (Work)
                  {!isValidEmail(employee.email) && (
                    <AlertTriangle className="h-3 w-3 ml-2 text-red-500" title="Invalid email format" />
                  )}
                </div>
                {employee.privateEmail && (
                  <div className={`flex items-center ${isValidEmail(employee.privateEmail) ? 'text-gray-600' : 'text-red-600'}`}>
                    <Mail className="h-3 w-3 mr-2" />
                    {employee.privateEmail} (Private)
                    {!isValidEmail(employee.privateEmail) && (
                      <AlertTriangle className="h-3 w-3 ml-2 text-red-500" title="Invalid email format" />
                    )}
                  </div>
                )}
                {employee.website && (
                  <div className="flex items-center text-gray-600">
                    <Globe className="h-3 w-3 mr-2" />
                    <a href={employee.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {employee.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Address
              </h3>
              <div className="space-y-1 text-sm text-gray-600">
                {employee.address && <div>{employee.address}</div>}
                {employee.postcode && employee.city && (
                  <div>{employee.postcode} {employee.city}</div>
                )}
                {employee.country && <div>{employee.country}</div>}
              </div>
            </div>

            {/* Employment */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <Building2 className="h-4 w-4 mr-2" />
                Employment
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>{employee.department}</div>
                {employee.workLocation && <div>Work Site: {employee.workLocation}</div>}
                {employee.hireDate && (
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-2" />
                    Since {new Date(employee.hireDate).toLocaleDateString()}
                  </div>
                )}
                {employee.contractType && (
                  <Badge variant="outline" className="text-xs">
                    {employee.contractType}
                  </Badge>
                )}
                {employee.workingHours && (
                  <div>{employee.workingHours} hours/week</div>
                )}
                {employee.salary && (
                  <div>€{employee.salary.toLocaleString()}/year</div>
                )}
              </div>
            </div>

            {/* Personal */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Personal
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                {employee.dateOfBirth && (
                  <div>Birth Date: {new Date(employee.dateOfBirth).toLocaleDateString()} ({calculateAge(employee.dateOfBirth)} years)</div>
                )}
                {employee.gender && (
                  <div>Gender: {employee.gender}</div>
                )}
                {employee.birthPlace && (
                  <div>Birth Place: {employee.birthPlace}</div>
                )}
                {employee.birthCountry && (
                  <div className="flex items-center">
                    <Globe className="h-3 w-3 mr-2" />
                    Birth Country: {employee.birthCountry}
                  </div>
                )}
                {employee.nationality && (
                  <div>Nationality: {employee.nationality}</div>
                )}
                {employee.maritalStatus && (
                  <div>Status: {employee.maritalStatus.replace('_', ' ')}</div>
                )}
                {employee.marriageDate && (
                  <div>Married: {new Date(employee.marriageDate).toLocaleDateString()}</div>
                )}
                {employee.divorceDate && (
                  <div>Divorced: {new Date(employee.divorceDate).toLocaleDateString()}</div>
                )}
                {employee.deathDate && (
                  <div className="text-red-600">Death Date: {new Date(employee.deathDate).toLocaleDateString()}</div>
                )}
                {employee.personalId && (
                  <div className="flex items-center">
                    <IdCard className="h-3 w-3 mr-2" />
                    BSN: {employee.personalId}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* KVM Section */}
          {(employee.idProofType || employee.idProofNumber || employee.idProofExpiryDate) && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold text-gray-900 mb-3">KVM</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                {employee.idProofType && (
                  <div>
                    <span className="font-medium">ID Proof Type: </span>{employee.idProofType}
                  </div>
                )}
                {employee.idProofNumber && (
                  <div>
                    <span className="font-medium">ID Number: </span>{employee.idProofNumber}
                  </div>
                )}
                {employee.idProofExpiryDate && (
                  <div>
                    <span className="font-medium">Expiry Date: </span>
                    <span className={`${new Date(employee.idProofExpiryDate) < new Date() ? 'text-red-600' : 'text-gray-600'}`}>
                      {new Date(employee.idProofExpiryDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Driving Licenses Section */}
          {(employee.drivingLicenseA || employee.drivingLicenseB || employee.drivingLicenseBE || employee.drivingLicenseC || employee.drivingLicenseCE || employee.drivingLicenseD || employee.drivingLicenseCode95) && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold text-gray-900 mb-3">Driving Licenses</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                {employee.drivingLicenseA && (
                  <div className="flex flex-col space-y-1">
                    <Badge variant="outline" className="w-fit">License A</Badge>
                    {employee.drivingLicenseAStartDate && (
                      <span className="text-xs text-gray-500">Start: {new Date(employee.drivingLicenseAStartDate).toLocaleDateString()}</span>
                    )}
                    {employee.drivingLicenseAExpiryDate && (
                      <span className={`text-xs ${new Date(employee.drivingLicenseAExpiryDate) < new Date() ? 'text-red-600' : 'text-gray-500'}`}>
                        Expires: {new Date(employee.drivingLicenseAExpiryDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
                {employee.drivingLicenseB && (
                  <div className="flex flex-col space-y-1">
                    <Badge variant="outline" className="w-fit">License B</Badge>
                    {employee.drivingLicenseBStartDate && (
                      <span className="text-xs text-gray-500">Start: {new Date(employee.drivingLicenseBStartDate).toLocaleDateString()}</span>
                    )}
                    {employee.drivingLicenseBExpiryDate && (
                      <span className={`text-xs ${new Date(employee.drivingLicenseBExpiryDate) < new Date() ? 'text-red-600' : 'text-gray-500'}`}>
                        Expires: {new Date(employee.drivingLicenseBExpiryDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
                {employee.drivingLicenseBE && (
                  <div className="flex flex-col space-y-1">
                    <Badge variant="outline" className="w-fit">License B/E</Badge>
                    {employee.drivingLicenseBEStartDate && (
                      <span className="text-xs text-gray-500">Start: {new Date(employee.drivingLicenseBEStartDate).toLocaleDateString()}</span>
                    )}
                    {employee.drivingLicenseBEExpiryDate && (
                      <span className={`text-xs ${new Date(employee.drivingLicenseBEExpiryDate) < new Date() ? 'text-red-600' : 'text-gray-500'}`}>
                        Expires: {new Date(employee.drivingLicenseBEExpiryDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
                {employee.drivingLicenseC && (
                  <div className="flex flex-col space-y-1">
                    <Badge variant="outline" className="w-fit">License C</Badge>
                    {employee.drivingLicenseCStartDate && (
                      <span className="text-xs text-gray-500">Start: {new Date(employee.drivingLicenseCStartDate).toLocaleDateString()}</span>
                    )}
                    {employee.drivingLicenseCExpiryDate && (
                      <span className={`text-xs ${new Date(employee.drivingLicenseCExpiryDate) < new Date() ? 'text-red-600' : 'text-gray-500'}`}>
                        Expires: {new Date(employee.drivingLicenseCExpiryDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
                {employee.drivingLicenseCE && (
                  <div className="flex flex-col space-y-1">
                    <Badge variant="outline" className="w-fit">License C/E</Badge>
                    {employee.drivingLicenseCEStartDate && (
                      <span className="text-xs text-gray-500">Start: {new Date(employee.drivingLicenseCEStartDate).toLocaleDateString()}</span>
                    )}
                    {employee.drivingLicenseCEExpiryDate && (
                      <span className={`text-xs ${new Date(employee.drivingLicenseCEExpiryDate) < new Date() ? 'text-red-600' : 'text-gray-500'}`}>
                        Expires: {new Date(employee.drivingLicenseCEExpiryDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
                {employee.drivingLicenseD && (
                  <div className="flex flex-col space-y-1">
                    <Badge variant="outline" className="w-fit">License D</Badge>
                    {employee.drivingLicenseDStartDate && (
                      <span className="text-xs text-gray-500">Start: {new Date(employee.drivingLicenseDStartDate).toLocaleDateString()}</span>
                    )}
                    {employee.drivingLicenseDExpiryDate && (
                      <span className={`text-xs ${new Date(employee.drivingLicenseDExpiryDate) < new Date() ? 'text-red-600' : 'text-gray-500'}`}>
                        Expires: {new Date(employee.drivingLicenseDExpiryDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
                {employee.drivingLicenseCode95 && (
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-fit">Code 95</Badge>
                      {code95Status === 'expiring' && (
                        <div className="w-4 h-4 rounded-full bg-yellow-400 border border-yellow-500"></div>
                      )}
                      {code95Status === 'expired' && (
                        <div className="w-4 h-4 rounded-full bg-red-500 border border-red-600"></div>
                      )}
                      {code95Status === 'compliant' && (
                        <div className="w-4 h-4 rounded-full bg-green-500 border border-green-600"></div>
                      )}
                      <Badge className={getCode95StatusColor(code95Status)}>
                        {code95Status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    {employee.drivingLicenseCode95StartDate && (
                      <span className="text-xs text-gray-500">Start: {new Date(employee.drivingLicenseCode95StartDate).toLocaleDateString()}</span>
                    )}
                    
                    {employee.drivingLicenseCode95ExpiryDate && (
                      <div className="space-y-1">
                        <span className={`text-xs ${new Date(employee.drivingLicenseCode95ExpiryDate) < new Date() ? 'text-red-600' : 'text-gray-500'}`}>
                          Expires: {new Date(employee.drivingLicenseCode95ExpiryDate).toLocaleDateString()}
                        </span>
                        {code95Progress.daysUntilExpiry !== null && (
                          <div className="text-xs">
                            {code95Progress.daysUntilExpiry > 0 
                              ? <span className="text-green-600">{code95Progress.daysUntilExpiry} days remaining</span>
                              : <span className="text-red-600">{Math.abs(code95Progress.daysUntilExpiry)} days overdue</span>
                            }
                          </div>
                        )}
                      </div>
                    )}
                    
                    {code95Status !== 'not_required' && (
                      <div className="space-y-2">
                        <div className="text-xs text-gray-600">
                          Training Progress: {code95Progress.pointsEarned}/{code95Progress.pointsRequired} points
                        </div>
                        <Progress 
                          value={(code95Progress.pointsEarned / code95Progress.pointsRequired) * 100} 
                          className="w-full h-2"
                        />
                        {needsCode95 && (
                          <div className="flex items-center gap-1 text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                            <Clock className="h-3 w-3" />
                            Training required
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}


          {/* Emergency Contact Section */}
          {employee.emergencyContact && (employee.emergencyContact.name || employee.emergencyContact.phone) && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold text-gray-900 mb-3">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                {employee.emergencyContact.name && (
                  <div>
                    <span className="font-medium">Name: </span>{employee.emergencyContact.name}
                  </div>
                )}
                {employee.emergencyContact.relationship && (
                  <div>
                    <span className="font-medium">Relationship: </span>{employee.emergencyContact.relationship}
                  </div>
                )}
                {employee.emergencyContact.phone && (
                  <div className={`flex items-center ${isValidPhone(employee.emergencyContact.phone) ? 'text-gray-600' : 'text-red-600'}`}>
                    <Phone className="h-3 w-3 mr-2" />
                    <span className="font-medium">Phone: </span>{employee.emergencyContact.phone}
                    {!isValidPhone(employee.emergencyContact.phone) && (
                      <AlertTriangle className="h-3 w-3 ml-2 text-red-500" title="Invalid phone format" />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {employee.licenses.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold text-gray-900 mb-3">Current Licenses & Certifications</h3>
              <div className="flex flex-wrap gap-2">
                {employee.licenses.map((license, index) => (
                  <Badge key={index} variant="outline">
                    {license}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {employee.notes && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold text-gray-900 mb-3">Notes</h3>
              <p className="text-sm text-gray-600">{employee.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <EditEmployeeDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        employee={employee}
      />
    </>
  );
}
