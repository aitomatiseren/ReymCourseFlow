import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export function EditCourseDialog({ open, onOpenChange, course }: EditCourseDialogProps) {
  const { t } = useTranslation(['courses', 'common']);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    sessions_required: "1",
    is_code95: false
  });

  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);

  const updateCourse = useUpdateCourse();
  const { toast } = useToast();

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || "",
        description: course.description || "",
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

  const updateChecklistItem = (id: string, field: keyof ChecklistItem, value: string | boolean) => {
    setChecklistItems(checklistItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!course) return;

    try {
      await updateCourse.mutateAsync({
        id: course.id,
        title: formData.title,
        description: formData.description || undefined,
        code95_points: formData.is_code95 ? 7 : null,
        sessions_required: Number(formData.sessions_required),
        has_checklist: checklistItems.length > 0,
        checklist_items: checklistItems.filter(item => item.text.trim())
      });

      toast({
        title: t('courses:editDialog.success'),
        description: t('courses:editDialog.courseUpdated')
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: t('courses:editDialog.error'),
        description: t('courses:editDialog.updateFailed'),
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('courses:editDialog.title')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">{t('courses:editDialog.courseTitle')} *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">{t('courses:editDialog.description')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sessions_required">{t('courses:editDialog.sessionsRequired')}</Label>
              <Input
                id="sessions_required"
                type="number"
                min="1"
                value={formData.sessions_required}
                onChange={(e) => setFormData({ ...formData, sessions_required: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">{t('courses:editDialog.sessionsRequiredHelp')}</p>
            </div>
          </div>
          
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Session duration and maximum participants are now configured per provider in the Provider section. 
              This allows different providers to offer the same course with varying constraints.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_code95"
                checked={formData.is_code95}
                onCheckedChange={(checked) => setFormData({ ...formData, is_code95: !!checked })}
              />
              <Label htmlFor="is_code95">{t('courses:editDialog.code95Course')}</Label>
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
                  {t('courses:editDialog.addChecklistItems')}
                </Button>
              </div>
            )}
          </div>

          {(checklistItems.length > 0) && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>{t('courses:editDialog.checklistItems')}</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addChecklistItem}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {t('courses:editDialog.addItem')}
                  </Button>
                </div>

                {checklistItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                    <Input
                      placeholder={t('courses:editDialog.checklistItemPlaceholder')}
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
                      <Label htmlFor={`required-${item.id}`} className="text-sm">{t('courses:editDialog.required')}</Label>
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
              {t('courses:editDialog.cancel')}
            </Button>
            <Button type="submit" disabled={updateCourse.isPending}>
              {updateCourse.isPending ? t('courses:editDialog.updating') : t('courses:editDialog.updateCourse')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
