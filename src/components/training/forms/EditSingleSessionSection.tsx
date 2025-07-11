
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditSingleSessionSectionProps {
  date: string;
  time: string;
  endTime?: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  onEndTimeChange?: (value: string) => void;
}

export function EditSingleSessionSection({
  date,
  time,
  endTime,
  onDateChange,
  onTimeChange,
  onEndTimeChange
}: EditSingleSessionSectionProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="time">Start Time</Label>
        <Input
          id="time"
          type="time"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="endTime">End Time</Label>
        <Input
          id="endTime"
          type="time"
          value={endTime || ""}
          onChange={(e) => onEndTimeChange?.(e.target.value)}
          placeholder="Optional"
        />
      </div>
    </div>
  );
}
