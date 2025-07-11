
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BasicTrainingInfoSectionProps {
  title: string;
  instructor: string;
  onTitleChange: (value: string) => void;
  onInstructorChange: (value: string) => void;
  readonly?: boolean;
}

export function BasicTrainingInfoSection({
  title,
  instructor,
  onTitleChange,
  onInstructorChange,
  readonly = false
}: BasicTrainingInfoSectionProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="title">Training Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          readOnly={readonly}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="instructor">Instructor</Label>
        <Input
          id="instructor"
          value={instructor}
          onChange={(e) => onInstructorChange(e.target.value)}
          required
        />
      </div>
    </div>
  );
}
