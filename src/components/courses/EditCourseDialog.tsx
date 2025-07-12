import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { useUpdateCourse, Course } from "@/hooks/useCourses";
import { useToast } from "@/hooks/use-toast";

interface EditCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course | null;
}

interface ChecklistItem {
  id: string;
  text: string;
  required: boolean;
}

interface CostComponent {
  id: string;
  name: string;
  amount: number;
  description: string;
}

export function EditCourseDialog({ open, onOpenChange, course }: EditCourseDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    max_participants: "",
    price: "",
    sessions_required: "1",
    is_code95: false
  });

  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [costComponents, setCostComponents] = useState<CostComponent[]>([]);

  const updateCourse = useUpdateCourse();
  const { toast } = useToast();

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || "",
        description: course.description || "",
        max_participants: course.max_participants?.toString() || "",
        price: course.price?.toString() || "",
        sessions_required: course.sessions_required?.toString() || "1",
        is_code95: !!(course.code95_points && course.code95_points > 0)
      });

      // Handle checklist items if they exist
      if (course.checklist_items && Array.isArray(course.checklist_items)) {
        setChecklistItems(course.checklist_items.map((item: any, index: number) => ({
          id: item.id || index.toString(),
          text: item.text || "",
          required: item.required || false
        })));
      } else {
        setChecklistItems([]);
      }

      // Handle cost breakdown if it exists, otherwise create from price
      if (course.cost_breakdown && Array.isArray(course.cost_breakdown)) {
        setCostComponents(course.cost_breakdown.map((component: any, index: number) => ({
          id: component.id || index.toString(),
          name: component.name || "",
          amount: component.amount || 0,
          description: component.description || ""
        })));
      } else if (course.price && course.price > 0) {
        // Legacy data: convert single price to cost breakdown
        setCostComponents([{
          id: Date.now().toString(),
          name: "Course Fee",
          amount: course.price,
          description: "Total course price"
        }]);
      } else {
        setCostComponents([{
          id: Date.now().toString(),
          name: "Course Fee",
          amount: 0,
          description: "Base course price"
        }]);
      }
    }
  }, [course]);

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

  const addCostComponent = () => {
    setCostComponents([...costComponents, {
      id: Date.now().toString(),
      name: "",
      amount: 0,
      description: ""
    }]);
  };

  const removeCostComponent = (id: string) => {
    if (costComponents.length > 1) {
      setCostComponents(costComponents.filter(item => item.id !== id));
    }
  };

  const updateCostComponent = (id: string, field: keyof CostComponent, value: string | number) => {
    setCostComponents(costComponents.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const calculateTotalPrice = () => {
    return costComponents.reduce((total, component) => total + component.amount, 0);
  };

  const updateChecklistItem = (id: string, field: keyof ChecklistItem, value: string | boolean) => {
    setChecklistItems(checklistItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!course) return;
    
    try {
      const totalPrice = calculateTotalPrice();
      const validCostComponents = costComponents.filter(component => 
        component.name.trim() && component.amount > 0
      );

      await updateCourse.mutateAsync({
        id: course.id,
        title: formData.title,
        description: formData.description || undefined,
        max_participants: formData.max_participants ? Number(formData.max_participants) : undefined,
        price: totalPrice || undefined,
        cost_breakdown: validCostComponents.map(({ id, ...component }) => component),
        code95_points: formData.is_code95 ? 7 : null,
        sessions_required: Number(formData.sessions_required),
        has_checklist: checklistItems.length > 0,
        checklist_items: checklistItems.filter(item => item.text.trim())
      });
      
      toast({
        title: "Success",
        description: "Course updated successfully"
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update course",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Course</DialogTitle>
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
              <Label htmlFor="max_participants">Max Participants</Label>
              <Input
                id="max_participants"
                type="number"
                value={formData.max_participants}
                onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
              />
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
            <div className="flex items-center justify-between mb-2">
              <Label>Cost Breakdown</Label>
              <Button type="button" variant="outline" size="sm" onClick={addCostComponent}>
                <Plus className="h-4 w-4 mr-1" />
                Add Cost Component
              </Button>
            </div>
            
            <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
              {costComponents.map((component) => (
                <div key={component.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-white rounded border">
                  <div>
                    <Label className="text-sm">Component Name</Label>
                    <Input
                      placeholder="e.g., Theory Training"
                      value={component.name}
                      onChange={(e) => updateCostComponent(component.id, 'name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Amount (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={component.amount || ''}
                      onChange={(e) => updateCostComponent(component.id, 'amount', Number(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Description</Label>
                    <Input
                      placeholder="Optional description"
                      value={component.description}
                      onChange={(e) => updateCostComponent(component.id, 'description', e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCostComponent(component.id)}
                      disabled={costComponents.length <= 1}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-between items-center pt-2 border-t bg-gray-100 px-3 py-2 rounded">
                <span className="font-medium">Total Price:</span>
                <span className="font-bold text-lg">€{calculateTotalPrice().toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_code95"
                checked={formData.is_code95}
                onCheckedChange={(checked) => setFormData({ ...formData, is_code95: !!checked })}
              />
              <Label htmlFor="is_code95">Code 95 Course (7 points)</Label>
            </div>
            
            {checklistItems.length === 0 && (
              <div className="flex items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addChecklistItem}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Checklist Items
                </Button>
              </div>
            )}
          </div>

          {(checklistItems.length > 0) && (
            <div className="space-y-4">
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
            </div>
          )}
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateCourse.isPending}>
              {updateCourse.isPending ? "Updating..." : "Update Course"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
