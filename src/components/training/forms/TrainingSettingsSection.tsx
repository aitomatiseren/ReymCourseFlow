
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface TrainingSettingsSectionProps {
  location: string;
  maxParticipants: string;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
  requiresApproval: boolean;
  onLocationChange: (value: string) => void;
  onMaxParticipantsChange: (value: string) => void;
  onStatusChange: (value: 'scheduled' | 'confirmed' | 'cancelled' | 'completed') => void;
  onRequiresApprovalChange: (checked: boolean) => void;
}

export function TrainingSettingsSection({
  location,
  maxParticipants,
  status,
  requiresApproval,
  onLocationChange,
  onMaxParticipantsChange,
  onStatusChange,
  onRequiresApprovalChange
}: TrainingSettingsSectionProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="maxParticipants">Max Participants</Label>
          <Input
            id="maxParticipants"
            type="number"
            min="1"
            value={maxParticipants}
            onChange={(e) => onMaxParticipantsChange(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          checked={requiresApproval}
          onCheckedChange={(checked) => onRequiresApprovalChange(!!checked)}
        />
        <Label htmlFor="requiresApproval">Requires approval for enrollment</Label>
      </div>
    </>
  );
}
