import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  Tag, 
  X,
  Edit,
  Trash2,
  StickyNote,
  Calendar,
  User,
  Users,
  MapPin,
  FileText,
  Sparkles,
  ExternalLink,
  Building2,
  Award
} from "lucide-react";
import { format } from "date-fns";
import { useEmployees } from "@/hooks/useEmployees";
import { useTrainings } from "@/hooks/useTrainings";
import { useCourses } from "@/hooks/useCourses";
import { useProviders } from "@/hooks/useProviders";
import { useLicenses } from "@/hooks/useCertificates";
import { toast } from "@/hooks/use-toast";

// Types
interface PersonalNote {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  mentionedItems: MentionedItem[];
  createdAt: string;
  updatedAt: string;
  color?: string;
}

interface MentionedItem {
  id: string;
  type: 'employee' | 'training' | 'course' | 'provider' | 'certificate';
  name: string;
  reference: string;
}

interface AutocompleteItem {
  id: string;
  type: 'employee' | 'training' | 'course' | 'provider' | 'certificate';
  name: string;
  subtitle?: string;
  icon: React.ReactNode;
}

const NOTE_CATEGORIES = [
  { value: 'general', label: 'General', color: 'bg-gray-100 text-gray-800' },
  { value: 'planning', label: 'Planning', color: 'bg-blue-100 text-blue-800' },
  { value: 'meeting', label: 'Meeting', color: 'bg-green-100 text-green-800' },
  { value: 'followup', label: 'Follow-up', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
  { value: 'idea', label: 'Idea', color: 'bg-purple-100 text-purple-800' },
  { value: 'reminder', label: 'Reminder', color: 'bg-orange-100 text-orange-800' },
];

const NOTE_COLORS = [
  { value: 'default', class: 'bg-white border-gray-200' },
  { value: 'yellow', class: 'bg-yellow-50 border-yellow-200' },
  { value: 'blue', class: 'bg-blue-50 border-blue-200' },
  { value: 'green', class: 'bg-green-50 border-green-200' },
  { value: 'purple', class: 'bg-purple-50 border-purple-200' },
  { value: 'pink', class: 'bg-pink-50 border-pink-200' },
];

// Detail content components for different item types
const EmployeeDetailContent = ({ employeeId }: { employeeId: string }) => {
  const { data: employees = [] } = useEmployees();
  const { data: trainings = [] } = useTrainings();
  const { data: certificates = [] } = useLicenses();
  const employee = employees.find(e => e.id === employeeId);
  
  if (!employee) return <div className="p-4 text-center text-gray-500">Employee not found</div>;
  
  // Get employee's trainings
  const employeeTrainings = trainings.filter(training => 
    training.participants?.some(p => p.employeeId === employeeId)
  );
  
  // Get employee's certificates
  const employeeCertificates = certificates.filter(cert => 
    cert.employeeId === employeeId
  );
  
  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User className="h-5 w-5" />
          Personal Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Full Name</label>
            <p className="text-sm font-medium">{employee.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Status</label>
            <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
              {employee.status}
            </Badge>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p className="text-sm">{employee.email || 'Not provided'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Phone</label>
            <p className="text-sm">{employee.phone || 'Not provided'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Department</label>
            <p className="text-sm">{employee.department || 'Not specified'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Job Title</label>
            <p className="text-sm">{employee.jobTitle || 'Not specified'}</p>
          </div>
        </div>
      </div>

      {/* Employment Details */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Employment Details
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {employee.hireDate && (
            <div>
              <label className="text-sm font-medium text-gray-500">Hire Date</label>
              <p className="text-sm">{format(new Date(employee.hireDate), 'PPP')}</p>
            </div>
          )}
          {employee.dateOfBirth && (
            <div>
              <label className="text-sm font-medium text-gray-500">Date of Birth</label>
              <p className="text-sm">{format(new Date(employee.dateOfBirth), 'PPP')}</p>
            </div>
          )}
          {employee.salary && (
            <div>
              <label className="text-sm font-medium text-gray-500">Salary</label>
              <p className="text-sm">€{employee.salary.toLocaleString()}</p>
            </div>
          )}
          {employee.manager && (
            <div>
              <label className="text-sm font-medium text-gray-500">Manager</label>
              <p className="text-sm">{employee.manager}</p>
            </div>
          )}
        </div>
      </div>

      {/* Address Information */}
      {(employee.address || employee.city || employee.postalCode || employee.country) && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Address Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {employee.address && (
              <div>
                <label className="text-sm font-medium text-gray-500">Address</label>
                <p className="text-sm">{employee.address}</p>
              </div>
            )}
            {employee.city && (
              <div>
                <label className="text-sm font-medium text-gray-500">City</label>
                <p className="text-sm">{employee.city}</p>
              </div>
            )}
            {employee.postalCode && (
              <div>
                <label className="text-sm font-medium text-gray-500">Postal Code</label>
                <p className="text-sm">{employee.postalCode}</p>
              </div>
            )}
            {employee.country && (
              <div>
                <label className="text-sm font-medium text-gray-500">Country</label>
                <p className="text-sm">{employee.country}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trainings */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Training History ({employeeTrainings.length || 0})
        </h3>
        {employeeTrainings.length > 0 ? (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {employeeTrainings.map(training => (
              <div key={training.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <p className="text-sm font-medium">{training.title}</p>
                  <p className="text-xs text-gray-500">
                    {training.date ? format(new Date(training.date), 'PPP') : 'Not scheduled'}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {training.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No training history available</p>
        )}
      </div>

      {/* Certificates */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Award className="h-5 w-5" />
          Certificates ({employeeCertificates.length || 0})
        </h3>
        {employeeCertificates.length > 0 ? (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {employeeCertificates.map(cert => (
              <div key={cert.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <p className="text-sm font-medium">{cert.name}</p>
                  <p className="text-xs text-gray-500">
                    {cert.expiryDate ? `Expires: ${format(new Date(cert.expiryDate), 'PPP')}` : 'No expiry'}
                  </p>
                </div>
                <Badge variant={cert.status === 'valid' ? 'default' : cert.status === 'expiring' ? 'secondary' : 'destructive'} className="text-xs">
                  {cert.status === 'valid' ? 'Valid' : cert.status === 'expiring' ? 'Expiring' : 'Expired'}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No certificates available</p>
        )}
      </div>
    </div>
  );
};

const TrainingDetailContent = ({ trainingId }: { trainingId: string }) => {
  const { data: trainings = [] } = useTrainings();
  const { data: employees = [] } = useEmployees();
  const { data: courses = [] } = useCourses();
  const training = trainings.find(t => t.id === trainingId);
  
  if (!training) return <div className="p-4 text-center text-gray-500">Training not found</div>;
  
  // Get related course information
  const relatedCourse = courses.find(c => c.id === training.courseId);
  
  // Get participant details
  const participants = training.participants?.map(p => {
    const employee = employees.find(e => e.id === p.employeeId);
    return { ...p, employee };
  }) || [];
  
  return (
    <div className="space-y-6">
      {/* Training Overview */}
      <div>
        <h3 className="text-2xl font-bold mb-2">{training.title}</h3>
        {training.description && (
          <p className="text-gray-600 mb-4">{training.description}</p>
        )}
        <div className="flex items-center gap-2">
          <Badge variant={training.status === 'confirmed' ? 'default' : 'secondary'}>
            {training.status}
          </Badge>
          {training.isCode95 && (
            <Badge variant="outline">Code 95</Badge>
          )}
        </div>
      </div>

      {/* Schedule Information */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Schedule Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Date</label>
            <p className="text-sm">{training.date ? format(new Date(training.date), 'PPP') : 'Not scheduled'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Time</label>
            <p className="text-sm">{training.time ? training.time.slice(0, 5) : 'Not specified'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Duration</label>
            <p className="text-sm">{training.duration ? `${training.duration} hours` : 'Not specified'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Location</label>
            <p className="text-sm">{training.location || 'Not specified'}</p>
          </div>
        </div>
      </div>

      {/* Instructor Information */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User className="h-5 w-5" />
          Instructor Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Instructor</label>
            <p className="text-sm">{training.instructor || 'Not assigned'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Contact</label>
            <p className="text-sm">{training.instructorContact || 'Not provided'}</p>
          </div>
        </div>
      </div>

      {/* Course Information */}
      {relatedCourse && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Course Information
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium">{relatedCourse.title}</p>
            <p className="text-xs text-gray-500 mt-1">{relatedCourse.description}</p>
            <div className="flex items-center gap-2 mt-2">
              {relatedCourse.isCode95 && (
                <Badge variant="outline" className="text-xs">
                  Code 95 - {relatedCourse.code95Points} points
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                {relatedCourse.duration} hours
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Participants */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Participants ({participants.length || 0})
        </h3>
        {participants.length > 0 ? (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {participants.map(participant => (
              <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="text-sm font-medium">{participant.employee?.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">
                    {participant.employee?.department || 'No department'} - {participant.employee?.jobTitle || 'No title'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={participant.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">
                    {participant.status}
                  </Badge>
                  {participant.attended && (
                    <Badge variant="outline" className="text-xs">
                      Attended
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No participants enrolled</p>
        )}
      </div>

      {/* Training Notes */}
      {training.notes && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <StickyNote className="h-5 w-5" />
            Training Notes
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm">{training.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const CourseDetailContent = ({ courseId }: { courseId: string }) => {
  const { data: courses = [] } = useCourses();
  const { data: trainings = [] } = useTrainings();
  const { data: providers = [] } = useProviders();
  const course = courses.find(c => c.id === courseId);
  
  if (!course) return <div className="p-4 text-center text-gray-500">Course not found</div>;
  
  // Get related trainings
  const relatedTrainings = trainings.filter(t => t.courseId === courseId);
  
  // Get course providers
  const courseProviders = providers.filter(p => p.courses?.includes(courseId));
  
  return (
    <div className="space-y-6">
      {/* Course Overview */}
      <div>
        <h3 className="text-2xl font-bold mb-2">{course.title}</h3>
        {course.description && (
          <p className="text-gray-600 mb-4">{course.description}</p>
        )}
        <div className="flex items-center gap-2">
          <Badge variant="default">
            Active
          </Badge>
          {course.code95Points && (
            <Badge variant="outline">Code 95 - {course.code95Points} points</Badge>
          )}
        </div>
      </div>

      {/* Course Details */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Course Details
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Duration</label>
            <p className="text-sm">{course.duration ? `${course.duration} hours` : 'Not specified'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Sessions Required</label>
            <p className="text-sm">{course.sessions || 'Not specified'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Max Participants</label>
            <p className="text-sm">{course.maxParticipants || 'Unlimited'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Category</label>
            <p className="text-sm">{course.category || 'Not specified'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Difficulty Level</label>
            <p className="text-sm">{course.difficultyLevel || 'Not specified'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Prerequisites</label>
            <p className="text-sm">{course.prerequisites || 'None'}</p>
          </div>
        </div>
      </div>

      {/* Pricing Information */}
      {course.price && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Pricing Information
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-lg font-bold">€{course.price}</p>
            <p className="text-sm text-gray-500">Per participant</p>
          </div>
        </div>
      )}

      {/* Providers */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Available Providers ({courseProviders.length || 0})
        </h3>
        {courseProviders.length > 0 ? (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {courseProviders.map(provider => (
              <div key={provider.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="text-sm font-medium">{provider.name}</p>
                  <p className="text-xs text-gray-500">
                    {provider.city} - {provider.contactEmail}
                  </p>
                </div>
                <Badge variant={provider.active ? 'default' : 'secondary'} className="text-xs">
                  {provider.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No providers available for this course</p>
        )}
      </div>

      {/* Training Schedule */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Scheduled Trainings ({relatedTrainings.length || 0})
        </h3>
        {relatedTrainings.length > 0 ? (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {relatedTrainings.map(training => (
              <div key={training.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="text-sm font-medium">{training.title}</p>
                  <p className="text-xs text-gray-500">
                    {training.date ? format(new Date(training.date), 'PPP') : 'Not scheduled'} - {training.location || 'Location TBD'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={training.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">
                    {training.status}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {training.participants?.length || 0} participants
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No trainings scheduled for this course</p>
        )}
      </div>

      {/* Course Materials */}
      {course.materials && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Course Materials
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm">{course.materials}</p>
          </div>
        </div>
      )}

      {/* Learning Objectives */}
      {course.objectives && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award className="h-5 w-5" />
            Learning Objectives
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm">{course.objectives}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const ProviderDetailContent = ({ providerId }: { providerId: string }) => {
  const { data: providers = [] } = useProviders();
  const { data: courses = [] } = useCourses();
  const { data: trainings = [] } = useTrainings();
  const provider = providers.find(p => p.id === providerId);
  
  if (!provider) return <div className="p-4 text-center text-gray-500">Provider not found</div>;
  
  // Get provider's courses
  const providerCourses = courses.filter(c => provider.courses?.includes(c.id));
  
  // Get provider's trainings
  const providerTrainings = trainings.filter(t => t.providerId === providerId);
  
  return (
    <div className="space-y-6">
      {/* Provider Overview */}
      <div>
        <h3 className="text-2xl font-bold mb-2">{provider.name}</h3>
        {provider.description && (
          <p className="text-gray-600 mb-4">{provider.description}</p>
        )}
        <div className="flex items-center gap-2">
          <Badge variant={provider.active ? 'default' : 'secondary'}>
            {provider.active ? 'Active' : 'Inactive'}
          </Badge>
          {provider.isPreferred && (
            <Badge variant="outline">Preferred Provider</Badge>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User className="h-5 w-5" />
          Contact Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Primary Contact</label>
            <p className="text-sm">{provider.contactPerson || 'Not provided'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p className="text-sm">{provider.contactEmail || 'Not provided'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Phone</label>
            <p className="text-sm">{provider.contactPhone || 'Not provided'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Website</label>
            <p className="text-sm">{provider.website || 'Not provided'}</p>
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Address</label>
            <p className="text-sm">{provider.address || 'Not provided'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">City</label>
            <p className="text-sm">{provider.city || 'Not specified'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Postal Code</label>
            <p className="text-sm">{provider.postalCode || 'Not provided'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Country</label>
            <p className="text-sm">{provider.country || 'Not specified'}</p>
          </div>
        </div>
      </div>

      {/* Business Information */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Business Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Registration Number</label>
            <p className="text-sm">{provider.registrationNumber || 'Not provided'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">VAT Number</label>
            <p className="text-sm">{provider.vatNumber || 'Not provided'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Rating</label>
            <p className="text-sm">{provider.rating ? `${provider.rating}/5 stars` : 'Not rated'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Established</label>
            <p className="text-sm">{provider.establishedYear || 'Not specified'}</p>
          </div>
        </div>
      </div>

      {/* Available Courses */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Available Courses ({providerCourses.length || 0})
        </h3>
        {providerCourses.length > 0 ? (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {providerCourses.map(course => (
              <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="text-sm font-medium">{course.title}</p>
                  <p className="text-xs text-gray-500">
                    {course.duration} hours - {course.maxParticipants ? `Max ${course.maxParticipants} participants` : 'Unlimited'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {course.code95Points && (
                    <Badge variant="outline" className="text-xs">
                      Code 95
                    </Badge>
                  )}
                  <Badge variant="default" className="text-xs">
                    Active
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No courses available from this provider</p>
        )}
      </div>

      {/* Training History */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Training History ({providerTrainings.length || 0})
        </h3>
        {providerTrainings.length > 0 ? (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {providerTrainings.map(training => (
              <div key={training.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="text-sm font-medium">{training.title}</p>
                  <p className="text-xs text-gray-500">
                    {training.date ? format(new Date(training.date), 'PPP') : 'Not scheduled'} - {training.location || 'Location TBD'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={training.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">
                    {training.status}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {training.participants?.length || 0} participants
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No training history available</p>
        )}
      </div>

      {/* Special Notes */}
      {provider.notes && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <StickyNote className="h-5 w-5" />
            Provider Notes
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm">{provider.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const CertificateDetailContent = ({ certificateId }: { certificateId: string }) => {
  const { data: certificates = [] } = useLicenses();
  const { data: employees = [] } = useEmployees();
  const { data: courses = [] } = useCourses();
  const certificate = certificates.find(c => c.id === certificateId);
  
  if (!certificate) return <div className="p-4 text-center text-gray-500">Certificate not found</div>;
  
  // Get certificate holder (employee)
  const certificateHolder = employees.find(e => e.id === certificate.employeeId);
  
  // Get related courses that grant this certificate
  const relatedCourses = courses.filter(c => 
    c.certificatesGranted?.includes(certificateId) || 
    c.certificatesRequired?.includes(certificateId)
  );
  
  return (
    <div className="space-y-6">
      {/* Certificate Overview */}
      <div>
        <h3 className="text-2xl font-bold mb-2">{certificate.name}</h3>
        {certificate.description && (
          <p className="text-gray-600 mb-4">{certificate.description}</p>
        )}
        <div className="flex items-center gap-2">
          <Badge variant={certificate.status === 'valid' ? 'default' : certificate.status === 'expiring' ? 'secondary' : 'destructive'}>
            {certificate.status === 'valid' ? 'Valid' : certificate.status === 'expiring' ? 'Expiring' : 'Expired'}
          </Badge>
          {certificate.isCode95 && (
            <Badge variant="outline">Code 95 Certificate</Badge>
          )}
        </div>
      </div>

      {/* Certificate Details */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Certificate Details
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Category</label>
            <p className="text-sm">{certificate.category || 'Not specified'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Type</label>
            <p className="text-sm">{certificate.type || 'Not specified'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Level</label>
            <p className="text-sm">{certificate.level || 'Not specified'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Issuing Authority</label>
            <p className="text-sm">{certificate.issuingAuthority || 'Not specified'}</p>
          </div>
        </div>
      </div>

      {/* Validity Information */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Validity Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {certificate.issueDate && (
            <div>
              <label className="text-sm font-medium text-gray-500">Issue Date</label>
              <p className="text-sm">{format(new Date(certificate.issueDate), 'PPP')}</p>
            </div>
          )}
          {certificate.expiryDate && (
            <div>
              <label className="text-sm font-medium text-gray-500">Expiry Date</label>
              <p className="text-sm">{format(new Date(certificate.expiryDate), 'PPP')}</p>
            </div>
          )}
          {certificate.validityPeriod && (
            <div>
              <label className="text-sm font-medium text-gray-500">Validity Period</label>
              <p className="text-sm">{certificate.validityPeriod} months</p>
            </div>
          )}
          {certificate.renewalRequired && (
            <div>
              <label className="text-sm font-medium text-gray-500">Renewal Required</label>
              <p className="text-sm">Yes</p>
            </div>
          )}
        </div>
      </div>

      {/* Certificate Holder */}
      {certificateHolder && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="h-5 w-5" />
            Certificate Holder
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium">{certificateHolder.name}</p>
            <p className="text-xs text-gray-500">
              {certificateHolder.department} - {certificateHolder.jobTitle}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {certificateHolder.email}
            </p>
          </div>
        </div>
      )}

      {/* Related Courses */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Related Courses ({relatedCourses.length || 0})
        </h3>
        {relatedCourses.length > 0 ? (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {relatedCourses.map(course => (
              <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="text-sm font-medium">{course.title}</p>
                  <p className="text-xs text-gray-500">
                    {course.duration} hours - {course.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {course.code95Points && (
                    <Badge variant="outline" className="text-xs">
                      Code 95
                    </Badge>
                  )}
                  <Badge variant="default" className="text-xs">
                    Active
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No related courses found</p>
        )}
      </div>

      {/* Compliance Information */}
      {certificate.isCode95 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award className="h-5 w-5" />
            Code 95 Compliance
          </h3>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm">
              This certificate is part of the Code 95 professional competence requirement for professional drivers.
            </p>
            {certificate.code95Points && (
              <p className="text-sm mt-2">
                <strong>Training Points:</strong> {certificate.code95Points} hours
              </p>
            )}
          </div>
        </div>
      )}

      {/* Certificate Notes */}
      {certificate.notes && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <StickyNote className="h-5 w-5" />
            Certificate Notes
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm">{certificate.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default function PersonalNotes() {
  const { t } = useTranslation('common');
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<PersonalNote[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingNote, setEditingNote] = useState<PersonalNote | null>(null);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    category: 'general',
    color: 'default'
  });
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteItems, setAutocompleteItems] = useState<AutocompleteItem[]>([]);
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  const [currentMentionQuery, setCurrentMentionQuery] = useState('');
  const [selectedItemDialog, setSelectedItemDialog] = useState<{
    isOpen: boolean;
    item: MentionedItem | null;
  }>({ isOpen: false, item: null });
  
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const editContentRef = useRef<HTMLTextAreaElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Data hooks for autocomplete
  const { data: employees = [] } = useEmployees();
  const { data: trainings = [] } = useTrainings();
  const { data: courses = [] } = useCourses();
  const { data: providers = [] } = useProviders();
  const { data: certificates = [] } = useLicenses();

  // Load notes from localStorage on component mount
  useEffect(() => {
    const storedNotes = localStorage.getItem('personalNotes');
    if (storedNotes) {
      try {
        const parsed = JSON.parse(storedNotes);
        setNotes(parsed);
      } catch (error) {
        console.error('Error parsing stored notes:', error);
      }
    }
  }, []);

  // Handle clicking outside autocomplete to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAutocomplete && autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        // Also check if we're clicking on the textareas
        const isTextareaClick = contentRef.current?.contains(event.target as Node) || 
                               editContentRef.current?.contains(event.target as Node);
        if (!isTextareaClick) {
          console.log('Clicking outside autocomplete, closing it');
          setShowAutocomplete(false);
        }
      }
    };

    if (showAutocomplete) {
      // Add a small delay to allow click events to process
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 100);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showAutocomplete]);

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    localStorage.setItem('personalNotes', JSON.stringify(notes));
  }, [notes]);

  // Filter notes based on search and category
  useEffect(() => {
    let filtered = notes;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(note => note.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Filter by selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(note => 
        selectedTags.some(tag => note.tags.includes(tag))
      );
    }

    setFilteredNotes(filtered);
  }, [notes, selectedCategory, searchQuery, selectedTags]);

  // Generate autocomplete items
  const generateAutocompleteItems = (query: string): AutocompleteItem[] => {
    const items: AutocompleteItem[] = [];
    const queryLower = query.toLowerCase();
    
    console.log('🔍 Generating autocomplete items for query:', query);
    console.log('📊 Available data:', { employees: employees.length, trainings: trainings.length, courses: courses.length });

    // Add employees
    employees.forEach(employee => {
      if (employee.name.toLowerCase().includes(queryLower)) {
        items.push({
          id: employee.id,
          type: 'employee',
          name: employee.name,
          subtitle: `${employee.jobTitle || employee.department || 'Employee'} - ${employee.status || 'Active'}`,
          icon: <User className="h-4 w-4" />
        });
      }
    });

    // Add trainings
    trainings.forEach(training => {
      if (training.title.toLowerCase().includes(queryLower)) {
        items.push({
          id: training.id,
          type: 'training',
          name: training.title,
          subtitle: `${training.date ? format(new Date(training.date), 'MMM d, yyyy') : 'Not scheduled'} - ${training.status || 'Scheduled'}`,
          icon: <Calendar className="h-4 w-4" />
        });
      }
    });

    // Add courses
    courses.forEach(course => {
      if (course.title.toLowerCase().includes(queryLower)) {
        items.push({
          id: course.id,
          type: 'course',
          name: course.title,
          subtitle: `${course.duration_hours || 'N/A'} hours - Active`,
          icon: <FileText className="h-4 w-4" />
        });
      }
    });

    // Add providers
    providers.forEach(provider => {
      if (provider.name.toLowerCase().includes(queryLower)) {
        items.push({
          id: provider.id,
          type: 'provider',
          name: provider.name,
          subtitle: `${provider.city || 'Location N/A'} - ${provider.active ? 'Active' : 'Inactive'}`,
          icon: <MapPin className="h-4 w-4" />
        });
      }
    });

    // Add certificates
    certificates.forEach(certificate => {
      if (certificate.name.toLowerCase().includes(queryLower)) {
        items.push({
          id: certificate.id,
          type: 'certificate',
          name: certificate.name,
          subtitle: `${certificate.category || 'Certificate'} - ${certificate.status === 'valid' ? 'Valid' : certificate.status === 'expiring' ? 'Expiring' : 'Expired'}`,
          icon: <Sparkles className="h-4 w-4" />
        });
      }
    });

    const limitedItems = items.slice(0, 10); // Limit to 10 items
    console.log('✅ Generated autocomplete items:', limitedItems);
    return limitedItems;
  };

  // Handle @ mention detection
  const handleContentChange = (content: string, isEditing: boolean = false) => {
    if (isEditing) {
      setEditingNote(prev => prev ? { ...prev, content } : null);
    } else {
      setNewNote(prev => ({ ...prev, content }));
    }

    // Check for @ mentions
    const textarea = isEditing ? editContentRef.current : contentRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = content.substring(0, cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtSymbol + 1);
      const spaceIndex = textAfterAt.indexOf(' ');
      const newlineIndex = textAfterAt.indexOf('\n');
      
      // Only show autocomplete if we're still typing (no space or newline after @)
      if (spaceIndex === -1 && newlineIndex === -1 && textAfterAt.length > 0) {
        // We're still typing a mention
        setCurrentMentionQuery(textAfterAt);
        setAutocompleteItems(generateAutocompleteItems(textAfterAt));
        
        // Calculate position for autocomplete dropdown
        const rect = textarea.getBoundingClientRect();
        const lineHeight = 20;
        const lines = textBeforeCursor.split('\n').length;
        
        // Calculate position relative to viewport
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        setAutocompletePosition({
          top: rect.top + scrollTop + (lines * lineHeight) + 30,
          left: rect.left + scrollLeft + 20
        });
        
        setShowAutocomplete(true);
        return;
      }
    }
    
    setShowAutocomplete(false);
  };

  // Handle autocomplete selection
  const handleAutocompleteSelect = (item: AutocompleteItem, isEditing: boolean = false) => {
    console.log('🔍 handleAutocompleteSelect called with:', item, 'isEditing:', isEditing);
    
    const textarea = isEditing ? editContentRef.current : contentRef.current;
    if (!textarea) {
      console.error('❌ No textarea found');
      return;
    }

    const currentContent = isEditing ? editingNote?.content || '' : newNote.content;
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = currentContent.substring(0, cursorPosition);
    const textAfterCursor = currentContent.substring(cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    console.log('📝 Current content:', currentContent);
    console.log('📍 Cursor position:', cursorPosition);
    console.log('🎯 Last @ symbol at:', lastAtSymbol);
    
    if (lastAtSymbol !== -1) {
      const beforeAt = textBeforeCursor.substring(0, lastAtSymbol);
      const newContent = `${beforeAt}@${item.name} ${textAfterCursor}`;
      
      console.log('✅ New content:', newContent);
      
      // Close autocomplete first
      setShowAutocomplete(false);
      
      // Update content directly without triggering content change detection
      if (isEditing) {
        setEditingNote(prev => prev ? { ...prev, content: newContent } : null);
      } else {
        setNewNote(prev => ({ ...prev, content: newContent }));
      }
      
      // Set cursor position after the mention and maintain focus
      setTimeout(() => {
        const newPosition = lastAtSymbol + item.name.length + 2; // +2 for @ and space
        textarea.setSelectionRange(newPosition, newPosition);
        textarea.focus();
      }, 50);
    } else {
      setShowAutocomplete(false);
    }
  };

  // Extract mentions from content
  const extractMentions = (content: string): MentionedItem[] => {
    const mentions: MentionedItem[] = [];
    const mentionRegex = /@([^\s@]+(?:\s+[^\s@]+)*)/g;
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      const mentionText = match[1];
      
      // Find the actual item being mentioned
      const allItems = [
        ...employees.map(e => ({ ...e, type: 'employee' as const })),
        ...trainings.map(t => ({ ...t, type: 'training' as const, name: t.title })),
        ...courses.map(c => ({ ...c, type: 'course' as const, name: c.title })),
        ...providers.map(p => ({ ...p, type: 'provider' as const })),
        ...certificates.map(c => ({ ...c, type: 'certificate' as const }))
      ];
      
      const foundItem = allItems.find(item => item.name === mentionText);
      if (foundItem) {
        mentions.push({
          id: foundItem.id,
          type: foundItem.type,
          name: foundItem.name,
          reference: match[0]
        });
      }
    }
    
    return mentions;
  };

  // Create new note
  const handleCreateNote = () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      toast({
        title: "Error",
        description: "Please provide both title and content for the note.",
        variant: "destructive"
      });
      return;
    }

    const note: PersonalNote = {
      id: Date.now().toString(),
      title: newNote.title.trim(),
      content: newNote.content.trim(),
      category: newNote.category,
      color: newNote.color,
      tags: [], // We'll extract tags from content if needed
      mentionedItems: extractMentions(newNote.content),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setNotes(prev => [note, ...prev]);
    setNewNote({ title: '', content: '', category: 'general', color: 'default' });
    setIsCreating(false);
    
    toast({
      title: "Success",
      description: "Note created successfully!"
    });
  };

  // Update existing note
  const handleUpdateNote = () => {
    if (!editingNote || !editingNote.title.trim() || !editingNote.content.trim()) {
      toast({
        title: "Error",
        description: "Please provide both title and content for the note.",
        variant: "destructive"
      });
      return;
    }

    const updatedNote: PersonalNote = {
      ...editingNote,
      title: editingNote.title.trim(),
      content: editingNote.content.trim(),
      mentionedItems: extractMentions(editingNote.content),
      updatedAt: new Date().toISOString()
    };

    setNotes(prev => prev.map(note => 
      note.id === editingNote.id ? updatedNote : note
    ));
    setEditingNote(null);
    
    toast({
      title: "Success",
      description: "Note updated successfully!"
    });
  };

  // Delete note
  const handleDeleteNote = (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      setNotes(prev => prev.filter(note => note.id !== noteId));
      toast({
        title: "Success",
        description: "Note deleted successfully!"
      });
    }
  };

  // Handle clicking on a mentioned item
  const handleMentionClick = (mention: MentionedItem) => {
    setSelectedItemDialog({ isOpen: true, item: mention });
  };

  // Render note content with clickable mentions
  const renderContentWithMentions = (content: string) => {
    // Split by @mentions but preserve the @ symbol and handle spaces/special chars in names
    const parts = content.split(/(@[^\s@]+(?:\s+[^\s@]+)*)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const mentionText = part.substring(1);
        
        // Find the actual item being mentioned
        const allItems = [
          ...employees.map(e => ({ ...e, type: 'employee' as const })),
          ...trainings.map(t => ({ ...t, type: 'training' as const, name: t.title })),
          ...courses.map(c => ({ ...c, type: 'course' as const, name: c.title })),
          ...providers.map(p => ({ ...p, type: 'provider' as const })),
          ...certificates.map(c => ({ ...c, type: 'certificate' as const }))
        ];
        
        const foundItem = allItems.find(item => item.name === mentionText);
        
        if (foundItem) {
          const mention: MentionedItem = {
            id: foundItem.id,
            type: foundItem.type,
            name: foundItem.name,
            reference: part
          };
          
          return (
            <button
              key={index}
              onClick={() => handleMentionClick(mention)}
              className="text-blue-600 hover:text-blue-800 hover:underline font-medium bg-transparent border-none p-0 inline cursor-pointer"
            >
              {part}
            </button>
          );
        }
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Get all unique tags from notes
  const getAllTags = () => {
    const allTags = notes.flatMap(note => note.tags);
    return Array.from(new Set(allTags));
  };

  // Get category badge style
  const getCategoryBadge = (category: string) => {
    const categoryConfig = NOTE_CATEGORIES.find(c => c.value === category);
    return categoryConfig || NOTE_CATEGORIES[0];
  };

  // Get note card style
  const getNoteCardStyle = (color: string) => {
    const colorConfig = NOTE_COLORS.find(c => c.value === color);
    return colorConfig?.class || NOTE_COLORS[0].class;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Personal Notes</h1>
            <p className="text-gray-600 mt-1">
              Keep track of your planning notes with smart tagging and categorization
            </p>
          </div>
          <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Note
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="min-w-[150px]">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {NOTE_CATEGORIES.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tags Filter */}
              <div className="flex flex-wrap gap-2">
                {getAllTags().map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      if (selectedTags.includes(tag)) {
                        setSelectedTags(prev => prev.filter(t => t !== tag));
                      } else {
                        setSelectedTags(prev => [...prev, tag]);
                      }
                    }}
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map(note => (
            <Card key={note.id} className={`${getNoteCardStyle(note.color || 'default')} hover:shadow-md transition-shadow`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold mb-2">{note.title}</CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getCategoryBadge(note.category).color}>
                        {getCategoryBadge(note.category).label}
                      </Badge>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {format(new Date(note.createdAt), 'MMM d, yyyy HH:mm')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingNote(note)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNote(note.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {renderContentWithMentions(note.content)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredNotes.length === 0 && (
          <div className="text-center py-12">
            <StickyNote className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notes found</h3>
            <p className="text-gray-600 mb-4">
              {notes.length === 0
                ? "Get started by creating your first note!"
                : "Try adjusting your filters or search query."}
            </p>
            {notes.length === 0 && (
              <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Note
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create Note Dialog */}
      <Dialog 
        open={isCreating} 
        onOpenChange={(open) => {
          console.log('📝 Create dialog onOpenChange called with:', open, 'Autocomplete visible:', showAutocomplete);
          // Don't close dialog if autocomplete is visible
          if (!open && showAutocomplete) {
            console.log('🚫 Preventing dialog close - autocomplete is visible');
            return;
          }
          console.log('✅ Allowing dialog state change to:', open);
          setIsCreating(open);
        }}
      >
        <DialogContent className="max-w-2xl" onInteractOutside={(e) => {
          console.log('🔍 Dialog interact outside event, autocomplete visible:', showAutocomplete);
          // Prevent closing when autocomplete is visible
          if (showAutocomplete) {
            console.log('🚫 Preventing dialog close via interact outside - autocomplete is visible');
            e.preventDefault();
          }
        }}>
          <DialogHeader>
            <DialogTitle>Create New Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="Note title..."
                value={newNote.title}
                onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={newNote.category} onValueChange={(value) => setNewNote(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTE_CATEGORIES.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Color</label>
                <Select value={newNote.color} onValueChange={(value) => setNewNote(prev => ({ ...prev, color: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTE_COLORS.map(color => (
                      <SelectItem key={color.value} value={color.value}>
                        {color.value.charAt(0).toUpperCase() + color.value.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="relative">
              <label className="text-sm font-medium">Content</label>
              <Textarea
                ref={contentRef}
                placeholder="Write your note here... Use @name to mention people, trainings, etc."
                value={newNote.content}
                onChange={(e) => handleContentChange(e.target.value)}
                className="min-h-[200px] mt-1"
              />
              <div className="text-xs text-gray-500 mt-1">
                Use @ to mention employees, trainings, courses, providers, or certificates
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateNote}>
                Create Note
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog 
        open={!!editingNote} 
        onOpenChange={(open) => {
          console.log('✏️ Edit dialog onOpenChange called with:', open, 'Autocomplete visible:', showAutocomplete);
          // Don't close dialog if autocomplete is visible
          if (!open && showAutocomplete) {
            console.log('🚫 Preventing edit dialog close - autocomplete is visible');
            return;
          }
          console.log('✅ Allowing edit dialog state change to:', open);
          setEditingNote(null);
        }}
      >
        <DialogContent className="max-w-2xl" onInteractOutside={(e) => {
          console.log('🔍 Edit dialog interact outside event, autocomplete visible:', showAutocomplete);
          // Prevent closing when autocomplete is visible
          if (showAutocomplete) {
            console.log('🚫 Preventing edit dialog close via interact outside - autocomplete is visible');
            e.preventDefault();
          }
        }}>
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
          </DialogHeader>
          {editingNote && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  placeholder="Note title..."
                  value={editingNote.title}
                  onChange={(e) => setEditingNote(prev => prev ? ({ ...prev, title: e.target.value }) : null)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={editingNote.category} onValueChange={(value) => setEditingNote(prev => prev ? ({ ...prev, category: value }) : null)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NOTE_CATEGORIES.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Color</label>
                  <Select value={editingNote.color || 'default'} onValueChange={(value) => setEditingNote(prev => prev ? ({ ...prev, color: value }) : null)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NOTE_COLORS.map(color => (
                        <SelectItem key={color.value} value={color.value}>
                          {color.value.charAt(0).toUpperCase() + color.value.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="relative">
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  ref={editContentRef}
                  placeholder="Write your note here... Use @name to mention people, trainings, etc."
                  value={editingNote.content}
                  onChange={(e) => handleContentChange(e.target.value, true)}
                  className="min-h-[200px] mt-1"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Use @ to mention employees, trainings, courses, providers, or certificates
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingNote(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateNote}>
                  Update Note
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Autocomplete Dropdown - Direct Render */}
      {showAutocomplete && autocompleteItems.length > 0 && (
        <div
          ref={autocompleteRef}
          className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto scrollbar-thin"
          style={{
            top: autocompletePosition.top,
            left: autocompletePosition.left,
            minWidth: '250px',
            pointerEvents: 'auto'
          }}
          onWheel={(e) => {
            // Allow wheel scrolling within the autocomplete dropdown
            e.stopPropagation();
          }}
        >
          {autocompleteItems.map(item => (
            <button
              key={`${item.type}-${item.id}`}
              className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer w-full text-left border-none bg-transparent"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Autocomplete item click:', item);
                handleAutocompleteSelect(item, !!editingNote);
              }}
              onMouseDown={(e) => {
                // Prevent default to avoid losing focus from textarea
                e.preventDefault();
              }}
            >
              <div className="text-gray-400">
                {item.icon}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{item.name}</div>
                {item.subtitle && (
                  <div className="text-xs text-gray-500 truncate">{item.subtitle}</div>
                )}
              </div>
              <Badge variant="outline" className="text-xs">
                {item.type}
              </Badge>
            </button>
          ))}
        </div>
      )}

      {/* Employee Detail Dialog */}
      {selectedItemDialog.isOpen && selectedItemDialog.item?.type === 'employee' && (
        <Dialog open={selectedItemDialog.isOpen} onOpenChange={(open) => setSelectedItemDialog({ isOpen: open, item: null })}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Employee Details
              </DialogTitle>
            </DialogHeader>
            <EmployeeDetailContent employeeId={selectedItemDialog.item.id} />
          </DialogContent>
        </Dialog>
      )}

      {/* Training Detail Dialog */}
      {selectedItemDialog.isOpen && selectedItemDialog.item?.type === 'training' && (
        <Dialog open={selectedItemDialog.isOpen} onOpenChange={(open) => setSelectedItemDialog({ isOpen: open, item: null })}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Training Details
              </DialogTitle>
            </DialogHeader>
            <TrainingDetailContent trainingId={selectedItemDialog.item.id} />
          </DialogContent>
        </Dialog>
      )}

      {/* Course Detail Dialog */}
      {selectedItemDialog.isOpen && selectedItemDialog.item?.type === 'course' && (
        <Dialog open={selectedItemDialog.isOpen} onOpenChange={(open) => setSelectedItemDialog({ isOpen: open, item: null })}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Course Details
              </DialogTitle>
            </DialogHeader>
            <CourseDetailContent courseId={selectedItemDialog.item.id} />
          </DialogContent>
        </Dialog>
      )}

      {/* Provider Detail Dialog */}
      {selectedItemDialog.isOpen && selectedItemDialog.item?.type === 'provider' && (
        <Dialog open={selectedItemDialog.isOpen} onOpenChange={(open) => setSelectedItemDialog({ isOpen: open, item: null })}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Provider Details
              </DialogTitle>
            </DialogHeader>
            <ProviderDetailContent providerId={selectedItemDialog.item.id} />
          </DialogContent>
        </Dialog>
      )}

      {/* Certificate Detail Dialog */}
      {selectedItemDialog.isOpen && selectedItemDialog.item?.type === 'certificate' && (
        <Dialog open={selectedItemDialog.isOpen} onOpenChange={(open) => setSelectedItemDialog({ isOpen: open, item: null })}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Certificate Details
              </DialogTitle>
            </DialogHeader>
            <CertificateDetailContent certificateId={selectedItemDialog.item.id} />
          </DialogContent>
        </Dialog>
      )}
    </Layout>
  );
}