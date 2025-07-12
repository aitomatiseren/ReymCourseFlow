
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Edit2, Save } from "lucide-react";

interface EditableChecklistProps {
  training: any;
  checkedItems: boolean[];
  onChecklistItemChange: (index: number, checked: boolean) => void;
  onAddItem?: (item: string) => void;
  onRemoveItem?: (index: number) => void;
  onEditItem?: (index: number, newText: string) => void;
  editable?: boolean;
}

export function EditableChecklist({
  training,
  checkedItems,
  onChecklistItemChange,
  onAddItem,
  onRemoveItem,
  onEditItem,
  editable = true
}: EditableChecklistProps) {
  const [newItem, setNewItem] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  // Helper function to safely get checklist items
  const getChecklistItems = (): string[] => {
    // Return training checklist if available
    if (training?.checklist && Array.isArray(training.checklist)) {
      return training.checklist;
    }
    
    // Only return default items if training has a course name and checklist is enabled
    if (training?.courseName && training?.enableChecklist !== false) {
      const defaultItems = [
        "Review safety procedures",
        "Complete practical exercises", 
        "Pass written assessment",
        "Obtain certification"
      ];
      return defaultItems;
    }
    
    return [];
  };

  const items = getChecklistItems();

  const handleAddItem = () => {
    if (newItem.trim() && onAddItem) {
      onAddItem(newItem.trim());
      setNewItem("");
    }
  };

  const handleEditStart = (index: number, currentText: string) => {
    setEditingIndex(index);
    setEditText(currentText);
  };

  const handleEditSave = () => {
    if (editingIndex !== null && onEditItem) {
      onEditItem(editingIndex, editText);
      setEditingIndex(null);
      setEditText("");
    }
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
    setEditText("");
  };

  if (items.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-3">Course Checklist</h4>
        <p className="text-sm text-gray-500 mb-3">No checklist items for this course</p>
        {editable && (
          <div className="flex space-x-2">
            <Input
              placeholder="Add checklist item..."
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
            />
            <Button size="sm" onClick={handleAddItem}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-50 rounded-lg">
      <h4 className="font-medium mb-3">Course Checklist</h4>
      <div className="space-y-2 mb-4">
        {items.map((item, index) => (
          <div key={index} className="flex items-center space-x-2 group">
            <Checkbox
              checked={checkedItems[index] || false}
              onCheckedChange={(checked) => onChecklistItemChange(index, !!checked)}
            />
            
            {editingIndex === index ? (
              <div className="flex-1 flex space-x-2">
                <Input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleEditSave();
                    if (e.key === 'Escape') handleEditCancel();
                  }}
                  className="text-sm"
                />
                <Button size="sm" variant="outline" onClick={handleEditSave}>
                  <Save className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleEditCancel}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <>
                <Label className="text-sm flex-1">{item}</Label>
                {editable && (
                  <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleEditStart(index, item)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => onRemoveItem?.(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {editable && (
        <div className="flex space-x-2">
          <Input
            placeholder="Add checklist item..."
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
            className="text-sm"
          />
          <Button size="sm" onClick={handleAddItem}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
