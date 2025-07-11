
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Clock } from "lucide-react";

interface SmartMultiSessionSectionProps {
  selectedCourse: any;
  sessions: number;
  sessionDates: string[];
  sessionTimes: string[];
  sessionEndTimes: string[];
  onSessionsChange: (sessions: number) => void;
  onSessionDateChange: (index: number, date: string) => void;
  onSessionTimeChange: (index: number, time: string) => void;
  onSessionEndTimeChange: (index: number, endTime: string) => void;
  onCopyTimeToAll?: (sourceIndex: number) => void;
}

export function SmartMultiSessionSection({
  selectedCourse,
  sessions,
  sessionDates,
  sessionTimes,
  sessionEndTimes,
  onSessionsChange,
  onSessionDateChange,
  onSessionTimeChange,
  onSessionEndTimeChange,
  onCopyTimeToAll
}: SmartMultiSessionSectionProps) {
  const copyTimeToAll = (sourceIndex: number) => {
    if (onCopyTimeToAll) {
      onCopyTimeToAll(sourceIndex);
    } else {
      const sourceStartTime = sessionTimes[sourceIndex];
      const sourceEndTime = sessionEndTimes[sourceIndex];
      
      if (sourceStartTime) {
        for (let i = 0; i < sessions; i++) {
          if (i !== sourceIndex) {
            onSessionTimeChange(i, sourceStartTime);
          }
        }
      }
      
      if (sourceEndTime) {
        for (let i = 0; i < sessions; i++) {
          if (i !== sourceIndex) {
            onSessionEndTimeChange(i, sourceEndTime);
          }
        }
      }
    }
  };

  const generateWeeklyDates = (startDate: string) => {
    if (!startDate) return;
    
    const start = new Date(startDate);
    for (let i = 1; i < sessions; i++) {
      const nextDate = new Date(start);
      nextDate.setDate(start.getDate() + (i * 7)); // Add weeks
      onSessionDateChange(i, nextDate.toISOString().split('T')[0]);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Multi-Session Training</h4>
        <div className="flex gap-2">
          {sessionDates[0] && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => generateWeeklyDates(sessionDates[0])}
            >
              <Clock className="h-4 w-4 mr-1" />
              Weekly Schedule
            </Button>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="sessions">Number of Sessions</Label>
        <Input
          id="sessions"
          type="number"
          min="1"
          max="20"
          value={sessions}
          onChange={(e) => onSessionsChange(parseInt(e.target.value) || 1)}
        />
        <p className="text-sm text-gray-600">
          {selectedCourse?.sessions_required && selectedCourse.sessions_required > 1 
            ? `This course typically requires ${selectedCourse.sessions_required} sessions (you can adjust as needed)`
            : "Set the number of sessions for this training (default: 1 session)"
          }
        </p>
      </div>

      {sessions > 0 && (
        <div className="space-y-4">
          <Label className="text-base font-medium">Session Schedule</Label>
          <div className="space-y-3">
            {Array.from({ length: sessions }, (_, index) => (
              <div key={index} className="grid grid-cols-4 gap-3 p-3 border rounded-lg bg-white">
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
                <div className="space-y-1 flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyTimeToAll(index)}
                    disabled={!sessionTimes[index] && !sessionEndTimes[index]}
                    title="Copy times to all sessions"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
