import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { useCreateCourse } from "@/hooks/useCourses";
import { useToast } from "@/hooks/use-toast";

interface AddCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ChecklistItem {
  id: string;
  text: string;
  required: boolean;
}

export function AddCourseDialog({ open, onOpenChange }: AddCourseDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    max_participants: "",
    price: "",
    code95_points: "",
    sessions_required: "1",
    has_checklist: false
  });

  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);

  const createCourse = useCreateCourse();
  const { toast } = useToast();

  const addChecklistItem = () => {
    setChecklistItems([...checklistItems, {
      id: Date.now().toString(),
      text: "",
      required: false
    }]);
  };

  const removeChecklistItem = (id: string) => {
    setChecklistItems(checklistItems.filter(item => item.id !== id));
  };

  const updateChecklistItem = (id: string, field: keyof ChecklistItem, value: string | boolean) => {
    setChecklistItems(checklistItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createCourse.mutateAsync({
        title: formData.title,
        description: formData.description || undefined,
        category: formData.category || undefined,
        max_participants: formData.max_participants ? Number(formData.max_participants) : undefined,
        price: formData.price ? Number(formData.price) : undefined,
        code95_points: formData.code95_points ? Number(formData.code95_points) : undefined,
        sessions_required: Number(formData.sessions_required),
        has_checklist: formData.has_checklist,
        checklist_items: formData.has_checklist ? checklistItems.filter(item => item.text.trim()) : []
      });
      
      toast({
        title: "Success",
        description: "Course created successfully"
      });
      
      setFormData({
        title: "",
        description: "",
        category: "",
        max_participants: "",
        price: "",
        code95_points: "",
        sessions_required: "1",
        has_checklist: false
      });
      setChecklistItems([]);
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create course",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Course</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Course Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Safety">Safety</SelectItem>
                  <SelectItem value="Equipment">Equipment</SelectItem>
                  <SelectItem value="Medical">Medical</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Management">Management</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sessions_required">Number of Sessions Required</Label>
              <Input
                id="sessions_required"
                type="number"
                min="1"
                value={formData.sessions_required}
                onChange={(e) => setFormData({ ...formData, sessions_required: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">How many sessions this course requires</p>
            </div>
          </div>
          
          <div>
            <Label htmlFor="max_participants">Max Participants</Label>
            <Input
              id="max_participants"
              type="number"
              value={formData.max_participants}
              onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price (€)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="code95_points">Code 95 Points</Label>
              <Input
                id="code95_points"
                type="number"
                value={formData.code95_points}
                onChange={(e) => setFormData({ ...formData, code95_points: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has_checklist"
                checked={formData.has_checklist}
                onCheckedChange={(checked) => setFormData({ ...formData, has_checklist: !!checked })}
              />
              <Label htmlFor="has_checklist">This course requires a checklist</Label>
            </div>

            {formData.has_checklist && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Checklist Items</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addChecklistItem}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>
                
                {checklistItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                    <Input
                      placeholder="Checklist item..."
                      value={item.text}
                      onChange={(e) => updateChecklistItem(item.id, 'text', e.target.value)}
                      className="flex-1"
                    />
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`required-${item.id}`}
                        checked={item.required}
                        onCheckedChange={(checked) => updateChecklistItem(item.id, 'required', !!checked)}
                      />
                      <Label htmlFor={`required-${item.id}`} className="text-sm">Required</Label>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeChecklistItem(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCourse.isPending}>
              {createCourse.isPending ? "Creating..." : "Create Course"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
