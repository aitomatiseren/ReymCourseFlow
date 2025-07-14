import { useState, useEffect, useCallback, forwardRef, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogDescription, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCreateTraining } from "@/hooks/useCreateTraining";
import { useCourses } from "@/hooks/useCourses";
import { useToast } from "@/hooks/use-toast";
import { CourseSelectionSection } from "./forms/CourseSelectionSection";
import { SmartMultiSessionSection } from "./forms/SmartMultiSessionSection";
import { ChecklistManagementSection } from "./forms/ChecklistManagementSection";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2 } from "lucide-react";

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
}


export function CreateTrainingDialog({ open, onOpenChange, preSelectedCourseId }: CreateTrainingDialogProps) {
  const { t } = useTranslation(['training', 'common']);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [instructor, setInstructor] = useState("");
  const [location, setLocation] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [status, setStatus] = useState<'scheduled' | 'confirmed' | 'cancelled' | 'completed'>('scheduled');
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [checklist, setChecklist] = useState<Array<{ id: string; text: string; completed: boolean }>>([]);

  // Multi-session state
  const [sessions, setSessions] = useState(1);
  const [sessionDates, setSessionDates] = useState<string[]>([]);
  const [sessionTimes, setSessionTimes] = useState<string[]>([]);
  const [sessionEndTimes, setSessionEndTimes] = useState<string[]>([]);

  const { data: courses = [] } = useCourses();
  const createTraining = useCreateTraining();
  const { toast } = useToast();
  const prevProviderId = useRef<string | null>(null);

  const selectedCourse = courses.find(course => course.id === selectedCourseId);

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
    setMaxParticipants("");
    setStatus('scheduled');
    setRequiresApproval(false);
    setChecklist([]);
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

    if (!title || !instructor || !location || !maxParticipants) {
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
        max_participants: parseInt(maxParticipants),
        status,
        requires_approval: requiresApproval,
        sessions_count: sessions,
        session_dates: sessionDates.length > 0 ? sessionDates : null,
        session_times: sessionTimes.length > 0 ? sessionTimes : null,
        session_end_times: sessionEndTimes.length > 0 ? sessionEndTimes : null,
        checklist: checklist.length > 0 ? checklist : null
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
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <CustomDialogContent
        className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto"
        onOpenChange={onOpenChange}
      >
        <DialogHeader>
          <DialogTitle>{t('training:createDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('training:createDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <CourseSelectionSection
            courses={courses}
            selectedCourseId={selectedCourseId}
            title={title}
            selectedProviderId={selectedProviderId}
            onCourseChange={handleCourseChange}
            onTitleChange={setTitle}
            onProviderChange={handleProviderChange}
            onProviderDetailsChange={handleProviderDetailsChange}
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
                <Input
                  id="instructor"
                  value={instructor}
                  onChange={(e) => setInstructor(e.target.value)}
                  placeholder={!selectedProviderId ? "Select a provider first" : (selectedProvider ? t('training:createDialog.instructorPlaceholder') : "Instructor name")}
                  disabled={!selectedProviderId}
                  required
                />
              )}
            </div>

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
          </div>

          <div className="grid grid-cols-2 gap-4">
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
      </CustomDialogContent>
    </Dialog>
  );
}
