
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  required?: boolean;
}

interface ChecklistManagementSectionProps {
  checklistItems: ChecklistItem[];
  onChecklistChange: (items: ChecklistItem[]) => void;
}

export function ChecklistManagementSection({
  checklistItems = [],
  onChecklistChange
}: ChecklistManagementSectionProps) {
  const [newItemText, setNewItemText] = useState("");

  const addItem = () => {
    if (newItemText.trim()) {
      const newItem: ChecklistItem = {
        id: Date.now().toString(),
        text: newItemText.trim(),
        completed: false,
        required: false
      };
      onChecklistChange([...checklistItems, newItem]);
      setNewItemText("");
    }
  };

  const removeItem = (id: string) => {
    onChecklistChange(checklistItems.filter(item => item.id !== id));
  };

  const updateItem = (id: string, text: string) => {
    onChecklistChange(
      checklistItems.map(item => 
        item.id === id ? { ...item, text } : item
      )
    );
  };

  const toggleItem = (id: string) => {
    onChecklistChange(
      checklistItems.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Training Checklist</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new item */}
        <div className="flex gap-2">
          <Input
            placeholder="Add checklist item..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addItem()}
          />
          <Button onClick={addItem} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Checklist items */}
        <div className="space-y-2">
          {checklistItems?.map((item) => (
            <div key={item.id} className="flex items-center gap-2 p-2 border rounded">
              <Checkbox
                checked={item.completed}
                onCheckedChange={() => toggleItem(item.id)}
              />
              <div className="flex-1 flex items-center gap-2">
                <Input
                  value={item.text}
                  onChange={(e) => updateItem(item.id, e.target.value)}
                  className="flex-1"
                />
                {item.required && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                    Required
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeItem(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {(!checklistItems || checklistItems.length === 0) && (
          <p className="text-gray-500 text-center py-4">
            No checklist items yet. Add one above.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
