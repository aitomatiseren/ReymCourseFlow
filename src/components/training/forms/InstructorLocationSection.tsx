
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface InstructorLocationSectionProps {
  instructor: string;
  location: string;
  maxParticipants: string;
  onInstructorChange: (instructor: string) => void;
  onLocationChange: (location: string) => void;
  onMaxParticipantsChange: (maxParticipants: string) => void;
}

export function InstructorLocationSection({
  instructor,
  location,
  maxParticipants,
  onInstructorChange,
  onLocationChange,
  onMaxParticipantsChange
}: InstructorLocationSectionProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          placeholder="Training location"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="instructor">Instructor</Label>
          <Input
            id="instructor"
            value={instructor}
            onChange={(e) => onInstructorChange(e.target.value)}
            placeholder="Instructor name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxParticipants">Max Participants</Label>
          <Input
            id="maxParticipants"
            type="number"
            min="1"
            value={maxParticipants}
            onChange={(e) => onMaxParticipantsChange(e.target.value)}
            placeholder="Maximum participants"
            required
          />
        </div>
      </div>
    </>
  );
}
