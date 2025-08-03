import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Grid3X3, List, Clock, Calendar } from "lucide-react";

export type TrainingViewMode = 'list' | 'grid' | 'timeline' | 'calendar';

interface TrainingViewToggleProps {
  value: TrainingViewMode;
  onValueChange: (value: TrainingViewMode) => void;
}

export function TrainingViewToggle({ value, onValueChange }: TrainingViewToggleProps) {
  return (
    <ToggleGroup 
      type="single" 
      value={value} 
      onValueChange={(newValue) => {
        if (newValue) onValueChange(newValue as TrainingViewMode);
      }}
      className="border rounded-lg"
    >
      <ToggleGroupItem value="calendar" aria-label="Calendar view" className="px-3 py-2">
        <Calendar className="h-4 w-4 mr-2" />
        Calendar
      </ToggleGroupItem>
      <ToggleGroupItem value="timeline" aria-label="Timeline view" className="px-3 py-2">
        <Clock className="h-4 w-4 mr-2" />
        Timeline
      </ToggleGroupItem>
      <ToggleGroupItem value="grid" aria-label="Grid view" className="px-3 py-2">
        <Grid3X3 className="h-4 w-4 mr-2" />
        Grid
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="List view" className="px-3 py-2">
        <List className="h-4 w-4 mr-2" />
        List
      </ToggleGroupItem>
    </ToggleGroup>
  );
}