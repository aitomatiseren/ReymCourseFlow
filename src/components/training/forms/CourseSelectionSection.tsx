
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Info, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProviderSelectionSection } from "./ProviderSelectionSection";
import { useCertificatesForCourse } from "@/hooks/useCertificates";
import { useCourses } from "@/hooks/useCourses";

interface Course {
  id: string;
  title: string;
  sessions_required?: number;
  max_participants?: number;
  has_checklist?: boolean;
  checklist_items?: any;
}

interface CourseSelectionSectionProps {
  courses: Course[];
  selectedCourseId: string;
  title: string;
  selectedProviderId: string;
  onCourseChange: (courseId: string) => void;
  onTitleChange: (title: string) => void;
  onProviderChange: (providerId: string) => void;
  onProviderDetailsChange?: (provider: any) => void;
  onCreateCourse?: () => void;
  onCreateProvider?: () => void;
  onManageCertificates?: () => void;
}

export function CourseSelectionSection({
  courses,
  selectedCourseId,
  title,
  selectedProviderId,
  onCourseChange,
  onTitleChange,
  onProviderChange,
  onProviderDetailsChange,
  onCreateCourse,
  onCreateProvider,
  onManageCertificates
}: CourseSelectionSectionProps) {
  const { data: courseCertificates = [] } = useCertificatesForCourse(selectedCourseId);
  const selectedCourse = courses.find(c => c.id === selectedCourseId);
  return (
    <div className="space-y-6">
      {/* Course and Title Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="course">Course</Label>
            {onCreateCourse && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCreateCourse}
                className="text-xs h-6"
              >
                <Plus className="h-3 w-3 mr-1" />
                Create Course
              </Button>
            )}
          </div>
          <Select 
            value={selectedCourseId} 
            onValueChange={onCourseChange}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Training Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Training session title"
            required
          />
        </div>
      </div>

      {/* Course Information Display */}
      {selectedCourse && (
        <Card className="border-blue-100 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Course Details</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Sessions Required:</span>
                  <span className="ml-2 font-medium">{selectedCourse.sessions_required || 1}</span>
                </div>
                {selectedCourse.max_participants && (
                  <div>
                    <span className="text-gray-600">Max Participants:</span>
                    <span className="ml-2 font-medium">{selectedCourse.max_participants}</span>
                  </div>
                )}
              </div>

              {/* Certificate Information */}
              {courseCertificates.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-900">Certificates Awarded</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {courseCertificates.map((cert) => (
                      <Badge
                        key={cert.id}
                        variant="outline"
                        className="bg-green-100 text-green-800 border-green-300"
                      >
                        <Award className="h-3 w-3 mr-1" />
                        {cert.licenses?.name}
                        {cert.grants_level && ` (Level ${cert.grants_level})`}
                        {cert.is_required && <span className="ml-1 text-xs">*Required</span>}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {courseCertificates.length === 0 && selectedCourseId && (
                <div className="flex items-center gap-2 text-amber-600">
                  <Info className="h-4 w-4" />
                  <span className="text-sm">No certificates configured for this course</span>
                  {onManageCertificates && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onManageCertificates}
                      className="text-xs h-6 ml-auto"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Certificate
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Provider Selection */}
      <ProviderSelectionSection
        selectedCourseId={selectedCourseId}
        selectedProviderId={selectedProviderId}
        onProviderChange={onProviderChange}
        onProviderDetailsChange={onProviderDetailsChange}
        onCreateProvider={onCreateProvider}
      />
    </div>
  );
}
