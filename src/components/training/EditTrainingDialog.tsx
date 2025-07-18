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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useUpdateTraining } from "@/hooks/useUpdateTraining";
import { useCourses } from "@/hooks/useCourses";
import { useProviders } from "@/hooks/useProviders";
import { Training, CostComponent } from "@/hooks/useTrainings";
import { CourseSelectionSection } from "./forms/CourseSelectionSection";
import { SmartMultiSessionSection } from "./forms/SmartMultiSessionSection";
import { ChecklistManagementSection } from "./forms/ChecklistManagementSection";
import { PlanSelectionSection } from "./forms/PlanSelectionSection";
import { TrainingContentImportDialog } from "./TrainingContentImportDialog";
import { ExtractedTrainingData } from "@/services/ai/training-content-extractor";
import { AddCourseDialog } from "@/components/courses/AddCourseDialog";
import { AddProviderDialog } from "@/components/providers/AddProviderDialog";
import { CertificateManagementDialog } from "./CertificateManagementDialog";
import { Plus, Upload, Sparkles, Euro } from "lucide-react";

// Comprehensive schema matching create dialog pattern
const editTrainingSchema = (t: any) => z.object({
  title: z.string().min(1, t('training:editDialog.titleRequired')),
  courseId: z.string().optional(),
  providerId: z.string().optional(),
  instructor: z.string().optional(),
  location: z.string().optional(),
  minParticipants: z.string().optional(),
  maxParticipants: z.string().optional(),
  status: z.enum(['scheduled', 'confirmed', 'cancelled', 'completed']).default('scheduled'),
  requiresApproval: z.boolean().default(false),
  sessions: z.number().min(1).default(1),
  sessionDates: z.array(z.string()).default([]),
  sessionTimes: z.array(z.string()).default([]),
  sessionEndTimes: z.array(z.string()).default([]),
  checklist: z.array(z.object({
    id: z.string(),
    text: z.string(),
    completed: z.boolean()
  })).default([]),
  price: z.number().optional(),
  costBreakdown: z.array(z.any()).default([]),
  selectedPlanId: z.string().optional(),
  selectedGroupId: z.string().optional(),
  notes: z.string().optional(),
  // Advanced settings
  automaticReminders: z.boolean().default(false),
  participantLimit: z.string().optional(),
  waitingListEnabled: z.boolean().default(false),
  certificateRequired: z.boolean().default(false),
  prerequisites: z.string().optional(),
  // Cost breakdown
  baseCost: z.number().optional(),
  additionalCosts: z.array(z.object({
    name: z.string(),
    amount: z.number(),
    type: z.enum(['fixed', 'per_participant'])
  })).default([]),
});

type TrainingFormData = z.infer<ReturnType<typeof editTrainingSchema>>;

interface EditTrainingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  training: Training | null;
}

export function EditTrainingDialog({ open, onOpenChange, training }: EditTrainingDialogProps) {
  const { t } = useTranslation(['training', 'common']);

  // Create schema with translations
  const trainingSchema = editTrainingSchema(t);

  // State for dialogs
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [showCreateCourseDialog, setShowCreateCourseDialog] = useState(false);
  const [showCreateProviderDialog, setShowCreateProviderDialog] = useState(false);
  const [showCertificateDialog, setShowCertificateDialog] = useState(false);
  
  // Plan selection state
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [planDetails, setPlanDetails] = useState<any>(null);
  
  // Selected provider state
  const [selectedProvider, setSelectedProvider] = useState<any>(null);

  // Hooks
  const { data: courses = [] } = useCourses();
  const { data: providers = [] } = useProviders();
  const updateTraining = useUpdateTraining();

  const form = useForm<TrainingFormData>({
    resolver: zodResolver(trainingSchema),
    defaultValues: {
      title: "",
      courseId: "",
      providerId: "",
      instructor: "",
      location: "",
      minParticipants: "",
      maxParticipants: "",
      status: 'scheduled',
      requiresApproval: false,
      sessions: 1,
      sessionDates: [],
      sessionTimes: [],
      sessionEndTimes: [],
      checklist: [],
      price: undefined,
      costBreakdown: [],
      selectedPlanId: "",
      selectedGroupId: "",
      notes: "",
      automaticReminders: false,
      participantLimit: "",
      waitingListEnabled: false,
      certificateRequired: false,
      prerequisites: "",
      baseCost: undefined,
      additionalCosts: [],
    },
  });

  // Watch title for dynamic display
  const watchedTitle = form.watch('title');
  const watchedCourseId = form.watch('courseId');
  const watchedSessions = form.watch('sessions');

  // Populate form when training data is available
  useEffect(() => {
    if (training) {
      const sessionDates = training.session_dates ? 
        (Array.isArray(training.session_dates) ? training.session_dates : []) : [];
      const sessionTimes = training.session_times ? 
        (Array.isArray(training.session_times) ? training.session_times : []) : [];
      const sessionEndTimes = training.session_end_times ? 
        (Array.isArray(training.session_end_times) ? training.session_end_times : []) : [];
      
      // Parse checklist data
      const checklist = training.checklist ? 
        (Array.isArray(training.checklist) ? training.checklist : []) : [];
      
      // Parse cost breakdown
      const costBreakdown = training.cost_breakdown ? 
        (Array.isArray(training.cost_breakdown) ? training.cost_breakdown : []) : [];

      form.reset({
        title: training.title || "",
        courseId: training.course_id || "",
        providerId: training.provider_id || "",
        instructor: training.instructor || "",
        location: training.location || "",
        minParticipants: training.min_participants?.toString() || "",
        maxParticipants: training.maxParticipants?.toString() || "",
        status: training.status || 'scheduled',
        requiresApproval: training.requiresApproval || false,
        sessions: training.sessions_count || 1,
        sessionDates: sessionDates,
        sessionTimes: sessionTimes,
        sessionEndTimes: sessionEndTimes,
        checklist: checklist,
        price: training.price || undefined,
        costBreakdown: costBreakdown,
        selectedPlanId: training.plan_id || "",
        selectedGroupId: training.group_id || "",
        notes: training.notes || "",
        automaticReminders: training.automatic_reminders || false,
        participantLimit: training.participant_limit?.toString() || "",
        waitingListEnabled: training.waiting_list_enabled || false,
        certificateRequired: training.certificate_required || false,
        prerequisites: training.prerequisites || "",
        baseCost: training.base_cost || undefined,
        additionalCosts: training.additional_costs || [],
      });

      // Set plan state
      if (training.plan_id) {
        setSelectedPlanId(training.plan_id);
      }
      if (training.group_id) {
        setSelectedGroupId(training.group_id);
      }
    }
  }, [training, form]);

  const handleAIImport = (data: ExtractedTrainingData) => {
    if (data.title) form.setValue('title', data.title);
    if (data.instructor) form.setValue('instructor', data.instructor);
    if (data.location) form.setValue('location', data.location);
    if (data.maxParticipants) form.setValue('maxParticipants', data.maxParticipants.toString());
    if (data.checklist?.length > 0) {
      const formattedChecklist = data.checklist.map((item, index) => ({
        id: `imported-${index}`,
        text: item,
        completed: false
      }));
      form.setValue('checklist', formattedChecklist);
    }
    if (data.notes) form.setValue('notes', data.notes);
    
    setIsImportDialogOpen(false);
    toast({
      title: "Training data imported",
      description: "Training information has been imported from the document.",
    });
  };

  const onSubmit = (data: TrainingFormData) => {
    if (!training) return;
    
    console.log("Updating training:", data);
    
    // Create the training data object
    const trainingData = {
      ...data,
      // Ensure proper type conversions
      sessions: Number(data.sessions),
      maxParticipants: data.maxParticipants ? parseInt(data.maxParticipants) : undefined,
      minParticipants: data.minParticipants ? parseInt(data.minParticipants) : undefined,
      price: data.price || undefined,
    };

    // Handle training update
    updateTraining.mutate(
      { id: training.id, data: trainingData },
      {
        onSuccess: () => {
          toast({
            title: t('training:editDialog.trainingUpdated'),
            description: t('training:editDialog.trainingUpdatedSuccess', { title: data.title }),
          });
          onOpenChange(false);
        },
        onError: (error) => {
          toast({
            title: t('training:editDialog.updateError'),
            description: error.message,
            variant: "destructive",
          });
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('training:editDialog.title')}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="participants">Participants</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                {/* Training title display */}
                <div className="text-center py-4 border-b">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {watchedTitle || t('training:editDialog.editingTraining')}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('training:editDialog.title')} *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter training title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="courseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('training:editDialog.course')}</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select course" />
                            </SelectTrigger>
                            <SelectContent>
                              {courses.map((course) => (
                                <SelectItem key={course.id} value={course.id}>
                                  {course.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="instructor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('training:editDialog.instructor')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter instructor name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('training:editDialog.location')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter training location" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('training:editDialog.status')}</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="scheduled">Scheduled</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="providerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('training:editDialog.provider')}</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select provider" />
                            </SelectTrigger>
                            <SelectContent>
                              {providers.map((provider) => (
                                <SelectItem key={provider.id} value={provider.id}>
                                  {provider.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name="requiresApproval"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-medium">
                          {t('training:editDialog.requiresApproval')}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                {/* AI Import Button */}
                <div className="flex justify-center pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsImportDialogOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <Sparkles className="w-4 h-4" />
                    {t('training:editDialog.importFromDocument')}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4">
                <SmartMultiSessionSection
                  sessions={watchedSessions}
                  onSessionsChange={(sessions) => form.setValue('sessions', sessions)}
                  sessionDates={form.watch('sessionDates')}
                  onSessionDatesChange={(dates) => form.setValue('sessionDates', dates)}
                  sessionTimes={form.watch('sessionTimes')}
                  onSessionTimesChange={(times) => form.setValue('sessionTimes', times)}
                  sessionEndTimes={form.watch('sessionEndTimes')}
                  onSessionEndTimesChange={(endTimes) => form.setValue('sessionEndTimes', endTimes)}
                />

                <PlanSelectionSection
                  selectedPlanId={selectedPlanId}
                  onPlanSelect={setSelectedPlanId}
                  selectedGroupId={selectedGroupId}
                  onGroupSelect={setSelectedGroupId}
                  onPlanDetailsChange={setPlanDetails}
                />
              </TabsContent>

              <TabsContent value="participants" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="minParticipants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('training:editDialog.minParticipants')}</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="Min participants" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxParticipants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('training:editDialog.maxParticipants')}</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="Max participants" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="participantLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Participant Limit</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="Overall limit" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center space-x-2">
                    <FormField
                      control={form.control}
                      name="waitingListEnabled"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-medium">
                            Enable Waiting List
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="prerequisites"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prerequisites</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="List any prerequisites for this training" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                <ChecklistManagementSection
                  checklist={form.watch('checklist')}
                  onChecklistChange={(checklist) => form.setValue('checklist', checklist)}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Any additional notes about this training" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name="certificateRequired"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-medium">
                          Certificate Required
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                {form.watch('certificateRequired') && (
                  <div className="flex justify-center pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowCertificateDialog(true)}
                      className="flex items-center gap-2"
                    >
                      Certificate Settings
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Cost Management</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <Euro className="w-4 h-4 inline mr-1" />
                            Total Price
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              step="0.01"
                              placeholder="0.00"
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="baseCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Base Cost</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              step="0.01"
                              placeholder="0.00"
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name="automaticReminders"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-medium">
                          Automatic Reminders
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-center space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateCourseDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Course
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateProviderDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Provider
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('training:editDialog.cancel')}
              </Button>
              <Button type="submit" disabled={updateTraining.isPending}>
                {updateTraining.isPending ? t('training:editDialog.updating') : t('training:editDialog.updateTraining')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>

      {/* AI Import Dialog */}
      <TrainingContentImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImport={handleAIImport}
      />

      {/* Quick Create Dialogs */}
      <AddCourseDialog
        open={showCreateCourseDialog}
        onOpenChange={setShowCreateCourseDialog}
      />

      <AddProviderDialog
        open={showCreateProviderDialog}
        onOpenChange={setShowCreateProviderDialog}
      />

      <CertificateManagementDialog
        open={showCertificateDialog}
        onOpenChange={setShowCertificateDialog}
      />
    </Dialog>
  );
}