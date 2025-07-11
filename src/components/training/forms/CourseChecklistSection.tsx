
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface CourseChecklistSectionProps {
  selectedCourse: any;
  checkedItems: boolean[];
  onChecklistItemChange: (index: number, checked: boolean) => void;
}

export function CourseChecklistSection({
  selectedCourse,
  checkedItems,
  onChecklistItemChange
}: CourseChecklistSectionProps) {
  // Helper function to safely get checklist items as strings
  const getChecklistItems = (): string[] => {
    if (!selectedCourse?.checklist_items) return [];
    
    const items = selectedCourse.checklist_items;
    // Handle both string arrays and parsed JSON arrays
    if (Array.isArray(items)) {
      return items.map(item => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) {
          // If it's an object, try to extract meaningful text
          return item.text || item.title || item.name || JSON.stringify(item);
        }
        return String(item);
      });
    }
    
    // If it's a string, try to parse it as JSON
    if (typeof items === 'string') {
      try {
        const parsed = JSON.parse(items);
        if (Array.isArray(parsed)) {
          return parsed.map(item => typeof item === 'string' ? item : String(item));
        }
      } catch (e) {
        // If parsing fails, return empty array
        console.warn('Failed to parse checklist items:', items);
      }
    }
    
    return [];
  };

  if (!selectedCourse?.has_checklist || getChecklistItems().length === 0) {
    return null;
  }

  return (
    <div className="p-4 bg-green-50 rounded-lg">
      <h4 className="font-medium mb-3">Course Checklist</h4>
      <div className="space-y-2">
        {getChecklistItems().map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Checkbox
              checked={checkedItems[index] || false}
              onCheckedChange={(checked) => onChecklistItemChange(index, !!checked)}
            />
            <Label className="text-sm">{item}</Label>
          </div>
        ))}
      </div>
    </div>
  );
}
