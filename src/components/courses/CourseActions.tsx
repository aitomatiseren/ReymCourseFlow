
import { Button } from "@/components/ui/button";
import { Edit, Calendar } from "lucide-react";

interface CourseActionsProps {
  courseId: string;
  onEdit: (courseId: string) => void;
  onSchedule: (courseId: string) => void;
}

export function CourseActions({ courseId, onEdit, onSchedule }: CourseActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onEdit(courseId)}
        className="flex items-center gap-1"
      >
        <Edit className="h-4 w-4" />
        Edit
      </Button>
      <Button
        size="sm"
        onClick={() => onSchedule(courseId)}
        className="bg-slate-800 text-white hover:bg-slate-900 flex items-center gap-1"
      >
        <Calendar className="h-4 w-4" />
        Schedule
      </Button>
    </div>
  );
}
