
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, Calendar } from "lucide-react";

interface EditMultiSessionSectionProps {
  sessions: number;
  sessionDates: string[];
  sessionTimes: string[];
  sessionEndTimes: string[];
  location: string;
  instructor: string;
  onSessionDateChange: (index: number, date: string) => void;
  onSessionTimeChange: (index: number, time: string) => void;
  onSessionEndTimeChange: (index: number, endTime: string) => void;
  onCopyTimeToAll: (sourceIndex: number) => void;
}

export function EditMultiSessionSection({
  sessions,
  sessionDates,
  sessionTimes,
  sessionEndTimes,
  location,
  instructor,
  onSessionDateChange,
  onSessionTimeChange,
  onSessionEndTimeChange,
  onCopyTimeToAll
}: EditMultiSessionSectionProps) {
  return (
    <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Multi-Session Training Schedule</h4>
      </div>
      
      {sessions > 0 && (
        <div className="space-y-4">
          <Label className="text-base font-medium">Session Details</Label>
          <div className="space-y-3">
            {Array.from({ length: sessions }, (_, index) => (
              <div key={index} className="grid grid-cols-6 gap-3 p-3 border rounded-lg bg-white">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Session {index + 1}</Label>
                  <div className="relative">
                    <Input
                      type="date"
                      value={sessionDates[index] || ''}
                      onChange={(e) => onSessionDateChange(index, e.target.value)}
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Start Time</Label>
                  <Input
                    type="time"
                    value={sessionTimes[index] || ''}
                    onChange={(e) => onSessionTimeChange(index, e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">End Time</Label>
                  <Input
                    type="time"
                    value={sessionEndTimes[index] || ''}
                    onChange={(e) => onSessionEndTimeChange(index, e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Location</Label>
                  <Input
                    type="text"
                    value={location}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Instructor</Label>
                  <Input
                    type="text"
                    value={instructor}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-1 flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onCopyTimeToAll(index)}
                    disabled={!sessionTimes[index] && !sessionEndTimes[index]}
                    title="Copy times to all sessions"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600">
            Location and instructor settings apply to all sessions. Update them in the main form above.
          </p>
        </div>
      )}
    </div>
  );
}
