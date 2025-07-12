
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DateTimeSectionProps {
  date: string;
  time: string;
  endTime?: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onEndTimeChange?: (endTime: string) => void;
  onDateChangeComplete?: () => void;
}

export function DateTimeSection({
  date,
  time,
  endTime,
  onDateChange,
  onTimeChange,
  onEndTimeChange,
  onDateChangeComplete
}: DateTimeSectionProps) {
  const handleDateChange = (newDate: string) => {
    onDateChange(newDate);
    if (onDateChangeComplete) {
      setTimeout(onDateChangeComplete, 100);
    }
  };

  const handleCalendarSelect = (selectedDate: Date | undefined) => {
    const dateString = selectedDate ? selectedDate.toISOString().split('T')[0] : '';
    handleDateChange(dateString);
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label htmlFor="date">Start Date</Label>
        <div className="flex gap-2">
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="flex-1"
            required
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date ? new Date(date) : undefined}
                onSelect={handleCalendarSelect}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
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
        <Label htmlFor="end-time">End Time</Label>
        <Input
          id="end-time"
          type="time"
          value={endTime || ""}
          onChange={(e) => onEndTimeChange?.(e.target.value)}
          placeholder="Optional"
        />
      </div>
    </div>
  );
}
