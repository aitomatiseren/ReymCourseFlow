
import { useState, useEffect, useCallback, forwardRef } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, DollarSign } from "lucide-react";
import { CostComponent } from "@/types";

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
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [title, setTitle] = useState("");
  const [instructor, setInstructor] = useState("");
  const [location, setLocation] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [status, setStatus] = useState<'scheduled' | 'confirmed' | 'cancelled' | 'completed'>('scheduled');
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [price, setPrice] = useState("");
  const [costBreakdown, setCostBreakdown] = useState<CostComponent[]>([]);
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

  // Auto-populate pricing when provider is selected
  const handleProviderChange = async (providerId: string) => {
    setSelectedProviderId(providerId);
    
    if (providerId && selectedCourseId) {
      try {
        const { data, error } = await supabase
          .from('course_provider_courses')
          .select('price, cost_breakdown')
          .eq('course_id', selectedCourseId)
          .eq('provider_id', providerId)
          .single();

        if (error) throw error;

        if (data) {
          // Auto-populate from provider-specific pricing
          if (data.cost_breakdown && Array.isArray(data.cost_breakdown)) {
            const components = data.cost_breakdown as unknown as CostComponent[];
            setCostBreakdown(components);
            const totalPrice = components.reduce((sum: number, item: CostComponent) => sum + (item.amount || 0), 0);
            setPrice(totalPrice.toString());
          } else if (data.price) {
            // Fallback to simple price
            setPrice(data.price.toString());
            setCostBreakdown([{
              name: "Course Fee",
              amount: data.price,
              description: "Base course price"
            }]);
          }
        }
      } catch (error) {
        console.error('Error fetching provider pricing:', error);
        // Don't show error to user, just keep existing pricing
      }
    }
  };

  // Handle provider details change (auto-fill location, instructor)
  const handleProviderDetailsChange = (provider: any) => {
    if (provider) {
      // Auto-fill location from provider default location
      if (provider.default_location && !location) {
        setLocation(provider.default_location);
      }
      
      // Auto-fill instructor from provider contact person if available
      if (provider.contact_person && !instructor) {
        setInstructor(provider.contact_person);
      }
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
    // Reset provider when course changes
    setSelectedProviderId("");
    setCostBreakdown([]);
    setPrice("");
    
    const course = courses.find(c => c.id === courseId);
    if (course) {
      setTitle(course.title);
      setMaxParticipants(course.max_participants?.toString() || "");
      setSessions(course.sessions_required || 1);
      
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

  const addCostComponent = () => {
    setCostBreakdown([...costBreakdown, {
      name: "",
      amount: 0,
      description: ""
    }]);
  };

  const removeCostComponent = (index: number) => {
    if (costBreakdown.length > 1) {
      setCostBreakdown(costBreakdown.filter((_, i) => i !== index));
    }
  };

  const updateCostComponent = (index: number, field: keyof CostComponent, value: string | number) => {
    const newComponents = [...costBreakdown];
    newComponents[index] = { ...newComponents[index], [field]: value };
    setCostBreakdown(newComponents);
    
    // Update total price
    const total = newComponents.reduce((sum, item) => sum + item.amount, 0);
    setPrice(total.toString());
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
    setTitle("");
    setInstructor("");
    setLocation("");
    setMaxParticipants("");
    setStatus('scheduled');
    setRequiresApproval(false);
    setPrice("");
    setCostBreakdown([]);
    setChecklist([]);
    setCourseChecklistItems([]);
    setSessions(1);
    setSessionDates([]);
    setSessionTimes([]);
    setSessionEndTimes([]);
  };

  const validateForm = () => {
    if (!selectedCourseId || !selectedProviderId || !title || !instructor || !location || !maxParticipants) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields including provider selection",
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
        provider_id: selectedProviderId,
        title,
        instructor,
        date: sessionDates[0] || "",
        time: sessionTimes[0] || "",
        location,
        max_participants: parseInt(maxParticipants),
        status,
        requires_approval: requiresApproval,
        price: parseFloat(price) || null,
        cost_breakdown: costBreakdown.length > 0 ? costBreakdown : null,
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
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create training",
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
            selectedProviderId={selectedProviderId}
            onCourseChange={handleCourseChange}
            onTitleChange={setTitle}
            onProviderChange={handleProviderChange}
            onProviderDetailsChange={handleProviderDetailsChange}
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

          {/* Cost Breakdown Section */}
          {selectedProviderId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Pricing & Cost Breakdown
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={addCostComponent}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Cost Component
                </Button>
              </div>
              
              {costBreakdown.length > 0 ? (
                <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
                  {costBreakdown.map((component, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-white rounded border">
                      <div>
                        <Label className="text-sm">Component Name</Label>
                        <Input
                          placeholder="e.g., Theory Training"
                          value={component.name}
                          onChange={(e) => updateCostComponent(index, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Amount (€)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={component.amount || ''}
                          onChange={(e) => updateCostComponent(index, 'amount', Number(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Description</Label>
                        <Input
                          placeholder="Optional description"
                          value={component.description}
                          onChange={(e) => updateCostComponent(index, 'description', e.target.value)}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCostComponent(index)}
                          disabled={costBreakdown.length <= 1}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex justify-between items-center pt-2 border-t bg-blue-50 px-3 py-2 rounded">
                    <span className="font-medium">Total Price per Participant:</span>
                    <span className="font-bold text-lg text-blue-600">
                      €{costBreakdown.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
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
                  <p className="text-sm text-gray-500">
                    💡 Select a provider first to auto-populate pricing, or enter manually
                  </p>
                </div>
              )}
            </div>
          )}

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
              <Select value={status} onValueChange={(value: 'scheduled' | 'confirmed' | 'cancelled' | 'completed') => setStatus(value)}>
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
