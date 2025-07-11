
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Grid3X3, List } from "lucide-react";

interface ViewToggleProps {
  value: 'grid' | 'list';
  onValueChange: (value: 'grid' | 'list') => void;
}

export function ViewToggle({ value, onValueChange }: ViewToggleProps) {
  return (
    <ToggleGroup 
      type="single" 
      value={value} 
      onValueChange={(newValue) => {
        if (newValue) onValueChange(newValue as 'grid' | 'list');
      }}
      className="border rounded-lg"
    >
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
