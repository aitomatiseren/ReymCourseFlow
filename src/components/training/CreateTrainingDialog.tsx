import { useState, useEffect, useCallback, forwardRef, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogDescription, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCreateTraining } from "@/hooks/useCreateTraining";
import { useCourses } from "@/hooks/useCourses";
import { useProviderCourseDetails } from "@/hooks/useProviders";
import { useToast } from "@/hooks/use-toast";
import { CourseSelectionSection } from "./forms/CourseSelectionSection";
import { SmartMultiSessionSection } from "./forms/SmartMultiSessionSection";
import { ChecklistManagementSection } from "./forms/ChecklistManagementSection";
import { PlanSelectionSection } from "./forms/PlanSelectionSection";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Euro, Sparkles, Upload } from "lucide-react";
import { TrainingContentImportDialog } from "./TrainingContentImportDialog";
import { ExtractedTrainingData, TrainingContentExtractor } from "@/services/ai/training-content-extractor";
import { AddCourseDialog } from "@/components/courses/AddCourseDialog";
import { AddProviderDialog } from "@/components/providers/AddProviderDialog";
import { CertificateManagementDialog } from "./CertificateManagementDialog";

// Custom DialogContent that prevents outside click and has custom ESC handling
const CustomDialogContent = forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    onOpenChange?: (open: boolean) => void;
  }
>(({ className, children, onOpenChange, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      onPointerDownOutside={(e) => e.preventDefault()}
      onEscapeKeyDown={() => onOpenChange?.(false)}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));
CustomDialogContent.displayName = "CustomDialogContent";

interface CreateTrainingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedCourseId?: string;
  preSelectedLicenseId?: string;
  preSelectedEmployeeId?: string;
}


export function CreateTrainingDialog({ 
  open, 
  onOpenChange, 
  preSelectedCourseId,
  preSelectedLicenseId,
  preSelectedEmployeeId
}: CreateTrainingDialogProps) {
  const { t } = useTranslation(['training', 'common']);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [instructor, setInstructor] = useState("");
  const [location, setLocation] = useState("");
  const [minParticipants, setMinParticipants] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [status, setStatus] = useState<'scheduled' | 'confirmed' | 'cancelled' | 'completed'>('scheduled');
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [checklist, setChecklist] = useState<Array<{ id: string; text: string; completed: boolean }>>([]);
  const [price, setPrice] = useState<number | undefined>();
  const [costBreakdown, setCostBreakdown] = useState<any[]>([]);

  // Plan selection state
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [planDetails, setPlanDetails] = useState<any>(null);

  // Multi-session state
  const [sessions, setSessions] = useState(1);
  const [sessionDates, setSessionDates] = useState<string[]>([]);
  const [sessionTimes, setSessionTimes] = useState<string[]>([]);
  const [sessionEndTimes, setSessionEndTimes] = useState<string[]>([]);

  // Import dialog state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  
  // Quick create dialogs state
  const [showCreateCourseDialog, setShowCreateCourseDialog] = useState(false);
  const [showCreateProviderDialog, setShowCreateProviderDialog] = useState(false);
  const [showCertificateManagementDialog, setShowCertificateManagementDialog] = useState(false);

  const { data: courses = [] } = useCourses();
  const createTraining = useCreateTraining();
  const { toast } = useToast();
  
  // Auto-populate fields when a preliminary plan group is selected
  useEffect(() => {
    if (planDetails && planDetails.group) {
      const group = planDetails.group;
      let autoPopulatedFields = [];
      
      // Auto-populate min participants if not already set
      if (group.min_participants && !minParticipants) {
        setMinParticipants(group.min_participants.toString());
        autoPopulatedFields.push('min participants');
      }
      
      // Auto-populate max participants if not already set
      if (group.max_participants && !maxParticipants) {
        setMaxParticipants(group.max_participants.toString());
        autoPopulatedFields.push('max participants');
      }
      
      // Auto-populate location if not already set
      if (group.location && !location) {
        setLocation(group.location);
        autoPopulatedFields.push('location');
      }
      
      // Auto-populate title if not already set and group has a name
      if (group.name && !title) {
        setTitle(`${group.name} - Training`);
        autoPopulatedFields.push('title');
      }
      
      // Auto-populate sessions count if available
      if (group.sessions_required && sessions === 1) {
        setSessions(group.sessions_required);
        autoPopulatedFields.push('sessions count');
      }
      
      // Auto-populate estimated cost if available
      if (group.estimated_cost && !price) {
        setPrice(group.estimated_cost);
        autoPopulatedFields.push('estimated cost');
      }
      
      // Auto-populate provider if available
      if (group.provider_id && !selectedProviderId) {
        setSelectedProviderId(group.provider_id);
        autoPopulatedFields.push('training provider');
      }
      
      // Auto-populate session dates if available
      if (group.planned_start_date && sessionDates.length === 0) {
        const startDate = new Date(group.planned_start_date);
        const endDate = group.planned_end_date ? new Date(group.planned_end_date) : startDate;
        const sessionsRequired = group.sessions_required || 1;
        
        // Generate session dates
        const dates = [];
        const currentDate = new Date(startDate);
        
        for (let i = 0; i < sessionsRequired; i++) {
          if (i === 0) {
            dates.push(currentDate.toISOString().split('T')[0]);
          } else {
            // Add one day for each subsequent session, skipping weekends
            do {
              currentDate.setDate(currentDate.getDate() + 1);
            } while (currentDate.getDay() === 0 || currentDate.getDay() === 6); // Skip weekends
            dates.push(currentDate.toISOString().split('T')[0]);
          }
        }
        
        setSessionDates(dates);
        
        // Set default session times (9:00 AM - 5:00 PM)
        const defaultStartTime = '09:00';
        const defaultEndTime = '17:00';
        setSessionTimes(Array(sessionsRequired).fill(defaultStartTime));
        setSessionEndTimes(Array(sessionsRequired).fill(defaultEndTime));
        autoPopulatedFields.push('session dates and times');
      }
      
      // Auto-populate certificate if group has one
      if (group.certificate_id && !preSelectedLicenseId) {
        // Find courses that grant this certificate
        const certificateCourses = courses.filter(course => 
          course.course_certificates?.some(cc => cc.license_id === group.certificate_id)
        );
        
        // If only one course available, auto-select it
        if (certificateCourses.length === 1 && !selectedCourseId) {
          setSelectedCourseId(certificateCourses[0].id);
          autoPopulatedFields.push('course selection');
        }
      }
      
      // Show toast notification if fields were auto-populated
      if (autoPopulatedFields.length > 0) {
        toast({
          title: t('training:createDialog.fieldsAutoPopulated', 'Fields Auto-populated'),
          description: t('training:createDialog.fieldsAutoPopulatedDesc', `The following fields have been filled from the preliminary plan: ${autoPopulatedFields.join(', ')}`),
          duration: 4000,
        });
      }
    }
  }, [planDetails, minParticipants, maxParticipants, location, title, courses, selectedCourseId, preSelectedLicenseId, sessions, price, sessionDates.length, selectedProviderId, toast, t]);
  
  const prevProviderId = useRef<string | null>(null);
  
  // Fetch provider-course specific details (pricing, etc.)
  const { data: providerCourseDetails } = useProviderCourseDetails(selectedProviderId, selectedCourseId);
  
  

  const selectedCourse = courses.find(course => course.id === selectedCourseId);

  // Filter courses based on pre-selected license if provided
  const filteredCourses = preSelectedLicenseId 
    ? courses.filter(course => 
        course.course_certificates?.some(cc => cc.license_id === preSelectedLicenseId)
      )
    : courses;

  const handleProviderChange = (providerId: string) => {
    setSelectedProviderId(providerId);
  };

  // Handle provider details change (store provider data and clear selections)
  const handleProviderDetailsChange = (provider: any) => {
    setSelectedProvider(provider);
    // Only reset instructor/location if provider actually changed
    if (provider?.id !== prevProviderId.current) {
      setLocation("");
      setInstructor("");
      prevProviderId.current = provider?.id || null;
    }
  };

  // Update cost data and participants when provider-course details change
  useEffect(() => {
    if (providerCourseDetails) {
      console.log('Updating data from provider-course details:', providerCourseDetails);
      setPrice(providerCourseDetails.price ? Number(providerCourseDetails.price) : undefined);
      setCostBreakdown(providerCourseDetails.cost_breakdown || []);
      
      // Update min and max participants from provider course data
      if (providerCourseDetails.min_participants) {
        setMinParticipants(providerCourseDetails.min_participants.toString());
      }
      if (providerCourseDetails.max_participants) {
        setMaxParticipants(providerCourseDetails.max_participants.toString());
      }
    } else {
      // Clear data if no provider-course details
      setPrice(undefined);
      setCostBreakdown([]);
      // Don't clear participants as they might be set from other sources (course, preliminary plan, etc.)
    }
  }, [providerCourseDetails]);

  // Set pre-selected course
  useEffect(() => {
    if (preSelectedCourseId && courses.length > 0) {
      const course = courses.find(c => c.id === preSelectedCourseId);
      if (course) {
        setSelectedCourseId(preSelectedCourseId);
        setTitle(course.title);
        setMaxParticipants(course.max_participants?.toString() || "");
        setSessions(course.sessions_required || 1);

      }
    }
  }, [preSelectedCourseId, courses]);

  // Auto-select first course if license is provided but no specific course is selected
  useEffect(() => {
    if (preSelectedLicenseId && courses.length > 0 && !preSelectedCourseId && !selectedCourseId) {
      const relevantCourses = courses.filter(course => 
        course.course_certificates?.some(cc => cc.license_id === preSelectedLicenseId)
      );
      
      if (relevantCourses.length > 0) {
        const firstCourse = relevantCourses[0];
        setSelectedCourseId(firstCourse.id);
        setTitle(firstCourse.title);
        setMaxParticipants(firstCourse.max_participants?.toString() || "");
        setSessions(firstCourse.sessions_required || 1);
      }
    }
  }, [preSelectedLicenseId, courses, preSelectedCourseId, selectedCourseId]);

  // Update sessions arrays when sessions count changes
  useEffect(() => {
    if (sessions > 1) {
      setSessionDates(prev => {
        const newDates = Array(sessions).fill('');
        for (let i = 0; i < Math.min(prev.length, sessions); i++) {
          newDates[i] = prev[i] || '';
        }
        return newDates;
      });

      setSessionTimes(prev => {
        const newTimes = Array(sessions).fill('');
        for (let i = 0; i < Math.min(prev.length, sessions); i++) {
          newTimes[i] = prev[i] || '';
        }
        return newTimes;
      });

      setSessionEndTimes(prev => {
        const newEndTimes = Array(sessions).fill('');
        for (let i = 0; i < Math.min(prev.length, sessions); i++) {
          newEndTimes[i] = prev[i] || '';
        }
        return newEndTimes;
      });
    }
  }, [sessions]);

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    // Reset provider when course changes
    setSelectedProviderId("");

    const course = courses.find(c => c.id === courseId);
    if (course) {
      setTitle(course.title);
      setMaxParticipants(course.max_participants?.toString() || "");
      setSessions(course.sessions_required || 1);
      
      // Auto-populate approval requirement from course setting
      setRequiresApproval(course.requires_approval || false);

      // Initialize checklist from course
      if (course.has_checklist && course.checklist_items) {
        const items = Array.isArray(course.checklist_items) ? course.checklist_items : [];
        const trainingChecklistItems = items.map((item: any) => ({
          id: Date.now().toString() + Math.random(),
          text: typeof item === 'string' ? item : (item.text || item.name || ''),
          completed: false,
          required: typeof item === 'object' ? (item.required || false) : false
        }));
        setChecklist(trainingChecklistItems);
      } else {
        // Clear training checklist if course has no checklist
        setChecklist([]);
      }
    }
  };


  const handleSessionDateChange = useCallback((index: number, date: string) => {
    setSessionDates(prev => {
      const newDates = [...prev];
      newDates[index] = date;
      return newDates;
    });
  }, []);

  const handleSessionTimeChange = useCallback((index: number, time: string) => {
    setSessionTimes(prev => {
      const newTimes = [...prev];
      newTimes[index] = time;
      return newTimes;
    });
  }, []);

  const handleSessionEndTimeChange = useCallback((index: number, endTime: string) => {
    setSessionEndTimes(prev => {
      const newEndTimes = [...prev];
      newEndTimes[index] = endTime;
      return newEndTimes;
    });
  }, []);

  const handleCopyTimeToAll = useCallback((sourceIndex: number) => {
    // Get current values at the time of execution
    setSessionTimes(currentTimes => {
      setSessionEndTimes(currentEndTimes => {
        setSessionDates(currentDates => {
          const sourceStartTime = currentTimes[sourceIndex];
          const sourceEndTime = currentEndTimes[sourceIndex];
          const sourceDate = currentDates[sourceIndex];

          // Utility function to get next business day (skip weekends)
          const getNextBusinessDay = (date: Date): Date => {
            const nextDay = new Date(date);
            nextDay.setDate(date.getDate() + 1);

            // If it's Saturday (6) or Sunday (0), move to Monday
            while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
              nextDay.setDate(nextDay.getDate() + 1);
            }

            return nextDay;
          };

          const newSessionDates = [...currentDates];

          // Smart date copying: each session gets the next business day
          if (sourceDate) {
            let currentDate = new Date(sourceDate);

            for (let i = 0; i < sessions; i++) {
              if (i === sourceIndex) {
                // Keep the source date as is
                continue;
              } else if (i < sourceIndex) {
                // For sessions before the source, go backwards
                const daysBack = sourceIndex - i;
                const targetDate = new Date(sourceDate);
                let daysSubtracted = 0;

                while (daysSubtracted < daysBack) {
                  targetDate.setDate(targetDate.getDate() - 1);
                  // Skip weekends when going backwards too
                  if (targetDate.getDay() !== 0 && targetDate.getDay() !== 6) {
                    daysSubtracted++;
                  }
                }

                newSessionDates[i] = targetDate.toISOString().split('T')[0];
              } else {
                // For sessions after the source, go forwards
                const daysForward = i - sourceIndex;
                currentDate = new Date(sourceDate);

                for (let d = 0; d < daysForward; d++) {
                  currentDate = getNextBusinessDay(currentDate);
                }

                newSessionDates[i] = currentDate.toISOString().split('T')[0];
              }
            }
          }

          return newSessionDates;
        });

        // Copy end times
        if (currentEndTimes[sourceIndex]) {
          const newEndTimes = [...currentEndTimes];
          for (let i = 0; i < sessions; i++) {
            if (i !== sourceIndex) {
              newEndTimes[i] = currentEndTimes[sourceIndex];
            }
          }
          return newEndTimes;
        }
        return currentEndTimes;
      });

      // Copy start times
      if (currentTimes[sourceIndex]) {
        const newTimes = [...currentTimes];
        for (let i = 0; i < sessions; i++) {
          if (i !== sourceIndex) {
            newTimes[i] = currentTimes[sourceIndex];
          }
        }
        return newTimes;
      }
      return currentTimes;
    });
  }, [sessions]);

  const resetForm = () => {
    setSelectedCourseId("");
    setSelectedProviderId("");
    setSelectedProvider(null);
    setTitle("");
    setInstructor("");
    setLocation("");
    setMinParticipants("");
    setMaxParticipants("");
    setStatus('scheduled');
    setRequiresApproval(false);
    setChecklist([]);
    setSelectedPlanId("");
    setSelectedGroupId("");
    setPlanDetails(null);
    setSessions(1);
    setSessionDates([]);
    setSessionTimes([]);
    setSessionEndTimes([]);
  };


  const validateForm = () => {
    if (!selectedCourseId) {
      toast({
        title: t('training:createDialog.validationError'),
        description: t('training:createDialog.selectCourse', 'Please select a course first'),
        variant: "destructive"
      });
      return false;
    }

    if (!selectedProviderId) {
      toast({
        title: t('training:createDialog.validationError'),
        description: t('training:createDialog.selectProvider', 'Please select a training provider first'),
        variant: "destructive"
      });
      return false;
    }

    if (!title || !instructor || !location || !minParticipants || !maxParticipants) {
      toast({
        title: t('training:createDialog.validationError'),
        description: t('training:createDialog.fillRequiredFields'),
        variant: "destructive"
      });
      return false;
    }

    // Validate all sessions have date and time
    for (let i = 0; i < sessions; i++) {
      if (!sessionDates[i] || !sessionTimes[i]) {
        toast({
          title: t('training:createDialog.validationError'),
          description: sessions === 1
            ? t('training:createDialog.selectDateTime')
            : t('training:createDialog.selectDateTimeSession', { session: i + 1 }),
          variant: "destructive"
        });
        return false;
      }
    }

    return true;
  };

  // Handle imported training content
  const handleImportTrainingContent = useCallback((data: ExtractedTrainingData) => {
    console.log('📥 Importing training content:', data);
    
    // Pre-fill form fields with extracted data
    if (data.title) {
      console.log('✅ Setting title:', data.title);
      setTitle(data.title);
    }
    
    if (data.location) {
      console.log('✅ Setting location:', data.location);
      setLocation(data.location);
    }
    
    if (data.instructor) {
      console.log('✅ Setting instructor:', data.instructor);
      setInstructor(data.instructor);
    }
    
    if (data.maxParticipants) {
      console.log('✅ Setting max participants:', data.maxParticipants);
      setMaxParticipants(data.maxParticipants.toString());
    }
    
    // Handle dates and times
    if (data.startDate) {
      const formattedDate = TrainingContentExtractor.formatDateForInput(data.startDate);
      if (formattedDate) {
        console.log('✅ Setting session date:', formattedDate);
        setSessionDates([formattedDate]);
        setSessions(1);
      }
    }
    
    if (data.startTime) {
      console.log('✅ Setting session time:', data.startTime);
      setSessionTimes([data.startTime]);
    }
    
    if (data.endTime) {
      console.log('✅ Setting session end time:', data.endTime);
      setSessionEndTimes([data.endTime]);
    }
    
    // Handle cost information
    if (data.costs?.amount) {
      console.log('✅ Setting price:', data.costs.amount);
      setPrice(data.costs.amount);
      
      // If there's a cost breakdown, convert it to our format
      if (data.costs.breakdown && data.costs.breakdown.length > 0) {
        const breakdown = data.costs.breakdown.map(item => ({
          name: item.type,
          description: item.description || item.type,
          amount: item.amount
        }));
        console.log('✅ Setting cost breakdown:', breakdown);
        setCostBreakdown(breakdown);
      }
    }
    
    // Handle notes and requirements - add to checklist
    if (data.requirements && data.requirements.length > 0) {
      const requirementItems = data.requirements.map(req => ({
        id: `req-${Date.now()}-${Math.random()}`,
        text: req,
        completed: false
      }));
      console.log('✅ Adding requirements to checklist:', requirementItems);
      setChecklist(prev => [...prev, ...requirementItems]);
    }
    
    if (data.materials && data.materials.length > 0) {
      const materialItems = data.materials.map(mat => ({
        id: `mat-${Date.now()}-${Math.random()}`,
        text: `Material: ${mat}`,
        completed: false
      }));
      console.log('✅ Adding materials to checklist:', materialItems);
      setChecklist(prev => [...prev, ...materialItems]);
    }
    
    // For multi-session training, handle end date
    if (data.endDate && data.startDate && data.endDate !== data.startDate) {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > 0) {
        const sessionCount = Math.min(daysDiff + 1, 10); // Cap at 10 sessions
        console.log('✅ Setting multi-session training:', sessionCount, 'sessions');
        setSessions(sessionCount);
        
        // Generate session dates
        const dates = [];
        const times = [];
        const endTimes = [];
        
        for (let i = 0; i <= daysDiff; i++) {
          const sessionDate = new Date(startDate);
          sessionDate.setDate(startDate.getDate() + i);
          dates.push(sessionDate.toISOString().split('T')[0]);
          times.push(data.startTime || '09:00');
          endTimes.push(data.endTime || '17:00');
        }
        
        setSessionDates(dates);
        setSessionTimes(times);
        setSessionEndTimes(endTimes);
      }
    }
    
    toast({
      title: "Training Content Imported",
      description: `Training information has been imported with ${data.confidence || 50}% confidence. Please review and adjust as needed.`,
    });
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const trainingData = {
        course_id: selectedCourseId,
        provider_id: selectedProviderId,
        title,
        instructor,
        date: sessionDates[0] || "",
        time: sessionTimes[0] || "",
        location,
        min_participants: parseInt(minParticipants),
        max_participants: parseInt(maxParticipants),
        status,
        requires_approval: requiresApproval,
        sessions_count: sessions,
        session_dates: sessionDates.length > 0 ? sessionDates : null,
        session_times: sessionTimes.length > 0 ? sessionTimes : null,
        session_end_times: sessionEndTimes.length > 0 ? sessionEndTimes : null,
        checklist: checklist.length > 0 ? checklist : null,
        price: price,
        cost_breakdown: costBreakdown.length > 0 ? costBreakdown : null,
        preliminary_plan_id: selectedPlanId || null,
        preliminary_plan_group_id: selectedGroupId || null
      };

      await createTraining.mutateAsync(trainingData);

      toast({
        title: t('training:createDialog.success'),
        description: t('training:createDialog.trainingCreated')
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: t('training:createDialog.error'),
        description: error instanceof Error ? error.message : t('training:createDialog.failedToCreate'),
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange} modal>
      <CustomDialogContent
        className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto"
        onOpenChange={onOpenChange}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DialogTitle className="flex items-center gap-2">
                {t('training:createDialog.title')}
                <Sparkles className="h-5 w-5 text-blue-500" />
              </DialogTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImportDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Import Content
            </Button>
          </div>
          <DialogDescription>
            {t('training:createDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
          <PlanSelectionSection
            selectedPlanId={selectedPlanId}
            selectedGroupId={selectedGroupId}
            onPlanChange={setSelectedPlanId}
            onGroupChange={setSelectedGroupId}
            onPlanDetailsChange={setPlanDetails}
            preSelectedLicenseId={preSelectedLicenseId}
          />

          <CourseSelectionSection
            courses={filteredCourses}
            selectedCourseId={selectedCourseId}
            title={title}
            selectedProviderId={selectedProviderId}
            onCourseChange={handleCourseChange}
            onTitleChange={setTitle}
            onProviderChange={handleProviderChange}
            onProviderDetailsChange={handleProviderDetailsChange}
            onCreateCourse={() => setShowCreateCourseDialog(true)}
            onCreateProvider={() => setShowCreateProviderDialog(true)}
            onManageCertificates={() => setShowCertificateManagementDialog(true)}
          />

          <SmartMultiSessionSection
            selectedCourse={selectedCourse}
            sessions={sessions}
            sessionDates={sessionDates}
            sessionTimes={sessionTimes}
            sessionEndTimes={sessionEndTimes}
            onSessionsChange={setSessions}
            onSessionDateChange={handleSessionDateChange}
            onSessionTimeChange={handleSessionTimeChange}
            onSessionEndTimeChange={handleSessionEndTimeChange}
            onCopyTimeToAll={handleCopyTimeToAll}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">{t('training:createDialog.locationLabel')}</Label>
              {selectedProvider && selectedProvider.additional_locations && Array.isArray(selectedProvider.additional_locations) && selectedProvider.additional_locations.length > 0 ? (
                <Select value={location} onValueChange={setLocation} required disabled={!selectedProviderId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('training:createDialog.locationPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedProvider.additional_locations
                      .filter((loc: any) => {
                        const locationName = typeof loc === 'string' ? loc : (loc.name || loc.city || 'Unnamed Location');
                        // Exclude office location (default_location)
                        return locationName !== selectedProvider.default_location;
                      })
                      .map((loc: any, index: number) => {
                        const locationName = typeof loc === 'string' ? loc : (loc.name || loc.city || 'Unnamed Location');
                        const locationAddress = typeof loc === 'object' && loc.address ? ` - ${loc.address}` : '';
                        const displayName = `${locationName}${locationAddress}`;
                        return (
                          <SelectItem key={index} value={locationName}>
                            {displayName}
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={!selectedProviderId ? "Select a provider first" : (selectedProvider ? "No locations available - enter manually" : "Training location")}
                  disabled={!selectedProviderId}
                  required
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructor">{t('training:createDialog.instructorLabel')}</Label>
              {selectedProvider && selectedProvider.instructors && Array.isArray(selectedProvider.instructors) && selectedProvider.instructors.length > 0 ? (
                <Select value={instructor} onValueChange={setInstructor} required disabled={!selectedProviderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedProvider.instructors
                      .filter((inst: string) => inst !== selectedProvider.contact_person)
                      .map((inst: string, index: number) => (
                        <SelectItem key={index} value={inst}>
                          {inst}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select value={instructor} onValueChange={setInstructor} required disabled={!selectedProviderId}>
                  <SelectTrigger>
                    <SelectValue placeholder={!selectedProviderId ? "Select a provider first" : "Select an instructor"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual-entry" disabled>
                      <span className="text-gray-500 italic">No instructors configured - enter manually below</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
              {(!selectedProvider || !selectedProvider.instructors || !Array.isArray(selectedProvider.instructors) || selectedProvider.instructors.length === 0) && selectedProviderId && (
                <Input
                  id="instructor-manual"
                  value={instructor}
                  onChange={(e) => setInstructor(e.target.value)}
                  placeholder={t('training:createDialog.instructorPlaceholder')}
                  required
                  className="mt-2"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minParticipants">{t('training:createDialog.minParticipantsLabel', 'Min Participants')}</Label>
              <Input
                id="minParticipants"
                type="number"
                min="1"
                value={minParticipants}
                onChange={(e) => setMinParticipants(e.target.value)}
                placeholder={t('training:createDialog.minParticipantsPlaceholder', 'Minimum participants')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxParticipants">{t('training:createDialog.maxParticipantsLabel')}</Label>
              <Input
                id="maxParticipants"
                type="number"
                min="1"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                placeholder={t('training:createDialog.maxParticipantsPlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">{t('training:createDialog.statusLabel')}</Label>
              <Select value={status} onValueChange={(value: 'scheduled' | 'confirmed' | 'cancelled' | 'completed') => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">{t('training:status.scheduled')}</SelectItem>
                  <SelectItem value="confirmed">{t('training:status.confirmed')}</SelectItem>
                  <SelectItem value="cancelled">{t('training:status.cancelled')}</SelectItem>
                  <SelectItem value="completed">{t('training:status.completed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cost Breakdown Display */}
          {selectedProviderId && (costBreakdown.length > 0 || price) && (
            <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Euro className="h-4 w-4" />
                Cost Breakdown
              </h4>
              {costBreakdown.length > 0 ? (
                <div className="space-y-2">
                  {costBreakdown.map((cost, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div>
                        <div className="font-medium">{cost.name}</div>
                        {cost.description && (
                          <div className="text-gray-500 text-xs">{cost.description}</div>
                        )}
                      </div>
                      <span className="font-medium">€{cost.amount}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex items-center justify-between font-semibold">
                    <span>Total per Participant</span>
                    <span>€{price || costBreakdown.reduce((sum, cost) => sum + (cost.amount || 0), 0)}</span>
                  </div>
                </div>
              ) : price ? (
                <div className="flex items-center justify-between font-semibold">
                  <span>Total per Participant</span>
                  <span>€{price}</span>
                </div>
              ) : null}
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              checked={requiresApproval}
              onCheckedChange={(checked) => setRequiresApproval(!!checked)}
            />
            <Label htmlFor="requiresApproval">{t('training:createDialog.requiresApproval')}</Label>
          </div>

          <ChecklistManagementSection
            checklistItems={checklist}
            onChecklistChange={setChecklist}
          />

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {t('training:createDialog.cancel')}
                </Button>
                <Button 
                  type="submit" 
                  disabled={createTraining.isPending || !selectedProviderId}
                >
                  {createTraining.isPending ? t('training:createDialog.creating') : t('training:createDialog.createTraining')}
                </Button>
              </div>
            </form>
        </div>
      </CustomDialogContent>
    </Dialog>

    {/* Import Content Dialog */}
    <TrainingContentImportDialog
      open={isImportDialogOpen}
      onOpenChange={setIsImportDialogOpen}
      onImport={handleImportTrainingContent}
      title="Import Training Content"
    />

    {/* Quick Create Course Dialog */}
    <AddCourseDialog
      open={showCreateCourseDialog}
      onOpenChange={setShowCreateCourseDialog}
    />

    {/* Quick Create Provider Dialog */}
    <AddProviderDialog
      open={showCreateProviderDialog}
      onOpenChange={setShowCreateProviderDialog}
    />

    {/* Certificate Management Dialog */}
    <CertificateManagementDialog
      open={showCertificateManagementDialog}
      onOpenChange={setShowCertificateManagementDialog}
      selectedCourseId={selectedCourseId}
      onCertificateCreated={() => {
        // Refresh courses data to show updated certificate information
        // The query will be invalidated by the CertificateManagementDialog mutations
      }}
    />
    </>
  );
}
