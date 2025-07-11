
import { useState, useEffect } from "react";
import { Dialog, DialogDescription, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCreateTraining } from "@/hooks/useCreateTraining";
import { useCourses } from "@/hooks/useCourses";
import { useToast } from "@/hooks/use-toast";
import { CourseSelectionSection } from "./forms/CourseSelectionSection";
import { SmartMultiSessionSection } from "./forms/SmartMultiSessionSection";
import { CourseInfoSection } from "./forms/CourseInfoSection";
import { CourseChecklistSection } from "./forms/CourseChecklistSection";
import { ChecklistManagementSection } from "./forms/ChecklistManagementSection";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface CreateTrainingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedCourseId?: string;
}

export function CreateTrainingDialog({ open, onOpenChange, preSelectedCourseId }: CreateTrainingDialogProps) {
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [instructor, setInstructor] = useState("");
  const [location, setLocation] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [status, setStatus] = useState<'scheduled' | 'confirmed' | 'cancelled' | 'completed'>('scheduled');
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [price, setPrice] = useState("");
  const [checklist, setChecklist] = useState<Array<{ id: string; text: string; completed: boolean }>>([]);
  const [courseChecklistItems, setCourseChecklistItems] = useState<boolean[]>([]);

  // Multi-session state
  const [sessions, setSessions] = useState(1);
  const [sessionDates, setSessionDates] = useState<string[]>([]);
  const [sessionTimes, setSessionTimes] = useState<string[]>([]);
  const [sessionEndTimes, setSessionEndTimes] = useState<string[]>([]);

  const { data: courses = [] } = useCourses();
  const createTraining = useCreateTraining();
  const { toast } = useToast();

  const selectedCourse = courses.find(course => course.id === selectedCourseId);

  // Set pre-selected course
  useEffect(() => {
    if (preSelectedCourseId && courses.length > 0) {
      const course = courses.find(c => c.id === preSelectedCourseId);
      if (course) {
        setSelectedCourseId(preSelectedCourseId);
        setTitle(course.title);
        setMaxParticipants(course.max_participants?.toString() || "");
        setSessions(course.sessions_required || 1);
        setPrice(course.price?.toString() || "");
        
        // Initialize checklist from course
        if (course.has_checklist && course.checklist_items) {
          const items = Array.isArray(course.checklist_items) ? course.checklist_items : [];
          setCourseChecklistItems(new Array(items.length).fill(false));
        }
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
    const course = courses.find(c => c.id === courseId);
    if (course) {
      setTitle(course.title);
      setMaxParticipants(course.max_participants?.toString() || "");
      setSessions(course.sessions_required || 1);
      setPrice(course.price?.toString() || "");
      
      // Reset and initialize checklist
      setCourseChecklistItems([]);
      if (course.has_checklist && course.checklist_items) {
        const items = Array.isArray(course.checklist_items) ? course.checklist_items : [];
        setCourseChecklistItems(new Array(items.length).fill(false));
      }
    }
  };

  const handleCourseChecklistChange = (index: number, checked: boolean) => {
    const newItems = [...courseChecklistItems];
    newItems[index] = checked;
    setCourseChecklistItems(newItems);
  };

  const resetForm = () => {
    setSelectedCourseId("");
    setTitle("");
    setInstructor("");
    setLocation("");
    setMaxParticipants("");
    setStatus('scheduled');
    setRequiresApproval(false);
    setPrice("");
    setChecklist([]);
    setCourseChecklistItems([]);
    setSessions(1);
    setSessionDates([]);
    setSessionTimes([]);
    setSessionEndTimes([]);
  };

  const validateForm = () => {
    if (!selectedCourseId || !title || !instructor || !location || !maxParticipants) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return false;
    }

    // Validate all sessions have date and time
    for (let i = 0; i < sessions; i++) {
      if (!sessionDates[i] || !sessionTimes[i]) {
        toast({
          title: "Validation Error",
          description: sessions === 1 
            ? "Please select date and time for the training"
            : `Please fill in date and time for session ${i + 1}`,
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
        session_end_times: sessionEndTimes.length > 0 ? sessionEndTimes : null
      };
      
      await createTraining.mutateAsync(trainingData);
      
      toast({
        title: "Success",
        description: "Training created successfully"
      });
      
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create training",
        variant: "destructive"
      });
    }
  };

  // Custom DialogContent without close button and outside click disabled
  const CustomDialogContent = ({ className, children, ...props }: any) => (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
          className
        )}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={() => onOpenChange(false)}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <CustomDialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Training</DialogTitle>
          <DialogDescription>
            Set up a new training session. Fill in all the details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <CourseSelectionSection
            courses={courses}
            selectedCourseId={selectedCourseId}
            title={title}
            onCourseChange={handleCourseChange}
            onTitleChange={setTitle}
          />

          {selectedCourse && (
            <>
              <CourseInfoSection selectedCourse={selectedCourse} />
              
              {selectedCourse.has_checklist && (
                <CourseChecklistSection
                  selectedCourse={selectedCourse}
                  checkedItems={courseChecklistItems}
                  onChecklistItemChange={handleCourseChecklistChange}
                />
              )}
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="price">Price per Participant (€)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Enter price"
            />
          </div>

          <SmartMultiSessionSection
            selectedCourse={selectedCourse}
            sessions={sessions}
            sessionDates={sessionDates}
            sessionTimes={sessionTimes}
            sessionEndTimes={sessionEndTimes}
            onSessionsChange={setSessions}
            onSessionDateChange={(index, date) => {
              const newDates = [...sessionDates];
              newDates[index] = date;
              setSessionDates(newDates);
            }}
            onSessionTimeChange={(index, time) => {
              const newTimes = [...sessionTimes];
              newTimes[index] = time;
              setSessionTimes(newTimes);
            }}
            onSessionEndTimeChange={(index, endTime) => {
              const newEndTimes = [...sessionEndTimes];
              newEndTimes[index] = endTime;
              setSessionEndTimes(newEndTimes);
            }}
            onCopyTimeToAll={(sourceIndex) => {
              const sourceStartTime = sessionTimes[sourceIndex];
              const sourceEndTime = sessionEndTimes[sourceIndex];
              const sourceDate = sessionDates[sourceIndex];
              
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
              
              const newSessionTimes = [...sessionTimes];
              const newSessionEndTimes = [...sessionEndTimes];
              const newSessionDates = [...sessionDates];
              
              if (sourceStartTime) {
                for (let i = 0; i < sessions; i++) {
                  if (i !== sourceIndex) {
                    newSessionTimes[i] = sourceStartTime;
                  }
                }
                setSessionTimes(newSessionTimes);
              }
              
              if (sourceEndTime) {
                for (let i = 0; i < sessions; i++) {
                  if (i !== sourceIndex) {
                    newSessionEndTimes[i] = sourceEndTime;
                  }
                }
                setSessionEndTimes(newSessionEndTimes);
              }

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
                
                setSessionDates(newSessionDates);
              }
            }}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instructor">Instructor</Label>
              <Input
                id="instructor"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                placeholder="Instructor name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Training location"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Max Participants</Label>
              <Input
                id="maxParticipants"
                type="number"
                min="1"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                placeholder="Maximum participants"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              checked={requiresApproval}
              onCheckedChange={(checked) => setRequiresApproval(!!checked)}
            />
            <Label htmlFor="requiresApproval">Requires approval for enrollment</Label>
          </div>

          <ChecklistManagementSection
            checklistItems={checklist}
            onChecklistChange={setChecklist}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTraining.isPending}>
              {createTraining.isPending ? "Creating..." : "Create Training"}
            </Button>
          </div>
        </form>
      </CustomDialogContent>
    </Dialog>
  );
}
