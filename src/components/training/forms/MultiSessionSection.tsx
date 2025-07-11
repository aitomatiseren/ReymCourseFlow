
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface MultiSessionSectionProps {
  selectedCourse: any;
  sessions: number;
  sessionDates: string[];
  sessionTimes: string[];
  sessionEndTimes: string[];
  onSessionsChange: (sessions: number) => void;
  onSessionDateChange: (index: number, date: string) => void;
  onSessionTimeChange: (index: number, time: string) => void;
  onSessionEndTimeChange: (index: number, endTime: string) => void;
}

export function MultiSessionSection({
  selectedCourse,
  sessions,
  sessionDates,
  sessionTimes,
  sessionEndTimes,
  onSessionsChange,
  onSessionDateChange,
  onSessionTimeChange,
  onSessionEndTimeChange
}: MultiSessionSectionProps) {
  if (!selectedCourse?.sessions_required || selectedCourse.sessions_required <= 1) {
    return null;
  }

  return (
    <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
      <h4 className="font-medium">Multi-Session Training</h4>
      
      <div className="space-y-2">
        <Label htmlFor="sessions">Number of Sessions</Label>
        <Input
          id="sessions"
          type="number"
          min="1"
          max={selectedCourse.sessions_required}
          value={sessions}
          onChange={(e) => onSessionsChange(parseInt(e.target.value) || 1)}
        />
        <p className="text-sm text-gray-600">
          This course requires {selectedCourse.sessions_required} sessions
        </p>
      </div>

      {sessions > 0 && (
        <div className="space-y-4">
          <Label className="text-base font-medium">Session Schedule</Label>
          <div className="space-y-3">
            {Array.from({ length: sessions }, (_, index) => (
              <div key={index} className="grid grid-cols-3 gap-3 p-3 border rounded-lg bg-white">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Session {index + 1} Date</Label>
                  <Input
                    type="date"
                    value={sessionDates[index] || ''}
                    onChange={(e) => onSessionDateChange(index, e.target.value)}
                  />
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
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
