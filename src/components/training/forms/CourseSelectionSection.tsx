
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

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
  onCourseChange: (courseId: string) => void;
  onTitleChange: (title: string) => void;
}

export function CourseSelectionSection({
  courses,
  selectedCourseId,
  title,
  onCourseChange,
  onTitleChange
}: CourseSelectionSectionProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="course">Course</Label>
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
  );
}
