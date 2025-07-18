import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { useUpdateCourse, Course } from "@/hooks/useCourses";
import { Plus, Trash2, Award, Sparkles } from "lucide-react";

// Comprehensive schema matching create dialog pattern
const editCourseSchema = (t: any) => z.object({
  title: z.string().min(1, t('courses:editDialog.titleRequired')),
  description: z.string().optional(),
  sessions_required: z.number().min(1).default(1),
  is_code95: z.boolean().default(false),
  requires_approval: z.boolean().default(false),
  checklist_items: z.array(z.object({
    id: z.string(),
    text: z.string(),
    required: z.boolean()
  })).default([]),
});

type CourseFormData = z.infer<ReturnType<typeof editCourseSchema>>;

interface EditCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course | null;
}

export function EditCourseDialog({ open, onOpenChange, course }: EditCourseDialogProps) {
  const { t } = useTranslation(['courses', 'common']);

  // Create schema with translations
  const courseSchema = editCourseSchema(t);

  // Hooks
  const updateCourse = useUpdateCourse();

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      sessions_required: 1,
      is_code95: false,
      requires_approval: false,
      checklist_items: [],
    },
  });

  // Watch title for dynamic display
  const watchedTitle = form.watch('title');
  const watchedChecklistItems = form.watch('checklist_items');

  // Populate form when course data is available
  useEffect(() => {
    if (course) {
      form.reset({
        title: course.title || "",
        description: course.description || "",
        sessions_required: course.sessions_required || 1,
        is_code95: !!(course.code95_points && course.code95_points > 0),
        requires_approval: course.requires_approval || false,
        checklist_items: course.checklist_items && Array.isArray(course.checklist_items) 
          ? course.checklist_items.map((item: any, index: number) => ({
              id: item.id || index.toString(),
              text: item.text || "",
              required: item.required || false
            })) 
          : [],
      });
    }
  }, [course, form]);

  const addChecklistItem = () => {
    const currentItems = form.getValues('checklist_items');
    const newItems = [...currentItems, {
      id: Date.now().toString(),
      text: "",
      required: false
    }];
    form.setValue('checklist_items', newItems);
  };

  const removeChecklistItem = (id: string) => {
    const currentItems = form.getValues('checklist_items');
    const filteredItems = currentItems.filter(item => item.id !== id);
    form.setValue('checklist_items', filteredItems);
  };

  const updateChecklistItem = (id: string, field: string, value: string | boolean) => {
    const currentItems = form.getValues('checklist_items');
    const updatedItems = currentItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    );
    form.setValue('checklist_items', updatedItems);
  };

  const onSubmit = (data: CourseFormData) => {
    if (!course) return;

    console.log("Updating course:", data);
    
    // Create the course data object
    const courseData = {
      id: course.id,
      title: data.title,
      description: data.description || undefined,
      code95_points: data.is_code95 ? 7 : null,
      sessions_required: data.sessions_required,
      has_checklist: data.checklist_items.length > 0,
      checklist_items: data.checklist_items.filter(item => item.text.trim()),
      requires_approval: data.requires_approval,
    };

    // Handle course update
    updateCourse.mutate(courseData, {
      onSuccess: () => {
        toast({
          title: t('courses:editDialog.success'),
          description: t('courses:editDialog.courseUpdated'),
        });
        onOpenChange(false);
      },
      onError: (error) => {
        toast({
          title: t('courses:editDialog.error'),
          description: t('courses:editDialog.updateFailed'),
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('courses:editDialog.title')}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Course title display */}
            <div className="text-center py-4 border-b">
              <h2 className="text-2xl font-bold text-gray-900">
                {watchedTitle || t('courses:editDialog.editingCourse')}
              </h2>
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('courses:editDialog.courseTitle')} *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter course title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('courses:editDialog.description')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Enter course description" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sessions_required"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('courses:editDialog.sessionsRequired')}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        min="1"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500 mt-1">{t('courses:editDialog.sessionsRequiredHelp')}</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <FormField
                  control={form.control}
                  name="is_code95"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-medium">
                        <Award className="w-4 h-4 inline mr-1" />
                        {t('courses:editDialog.code95Course')}
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center space-x-2">
                <FormField
                  control={form.control}
                  name="requires_approval"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-medium">
                        {t('courses:editDialog.requiresApproval')}
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Checklist Management */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Course Checklist</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addChecklistItem}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {t('courses:editDialog.addChecklistItems')}
                </Button>
              </div>

              {watchedChecklistItems.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No checklist items added yet. Click "Add Checklist Items" to create checklist items.
                </p>
              )}

              {watchedChecklistItems.map((item, index) => (
                <div key={item.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                  <Input
                    placeholder={t('courses:editDialog.checklistItemPlaceholder')}
                    value={item.text}
                    onChange={(e) => updateChecklistItem(item.id, 'text', e.target.value)}
                    className="flex-1"
                  />
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={item.required}
                      onCheckedChange={(checked) => updateChecklistItem(item.id, 'required', !!checked)}
                    />
                    <label className="text-sm">{t('courses:editDialog.required')}</label>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeChecklistItem(item.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* AI Enhancement Button */}
            <div className="flex justify-center pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  // AI-powered course enhancement feature
                  toast({
                    title: "AI Enhancement",
                    description: "AI-powered course optimization coming soon!",
                  });
                }}
                className="flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Enhance with AI
              </Button>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('courses:editDialog.cancel')}
              </Button>
              <Button type="submit" disabled={updateCourse.isPending}>
                {updateCourse.isPending ? t('courses:editDialog.updating') : t('courses:editDialog.updateCourse')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}