
import { useState, useEffect, forwardRef } from "react";
import { Dialog, DialogDescription, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateTraining } from "@/hooks/useUpdateTraining";
import { useToast } from "@/hooks/use-toast";
import { Training, CostComponent } from "@/hooks/useTrainings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Minus, Calendar, Copy, DollarSign, X, Upload } from "lucide-react";
import { TrainingContentImportDialog } from "./TrainingContentImportDialog";
import { ExtractedTrainingData, TrainingContentExtractor } from "@/services/ai/training-content-extractor";

// Custom DialogContent component - defined outside to prevent re-renders
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

interface EditTrainingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  training: Training | null;
}

export function EditTrainingDialog({ open, onOpenChange, training }: EditTrainingDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    instructor: "",
    date: "",
    time: "",
    location: "",
    maxParticipants: "",
    status: "scheduled" as 'scheduled' | 'confirmed' | 'cancelled' | 'completed',
    requiresApproval: false,
    sessions: 1,
    sessionDates: [] as string[],
    sessionTimes: [] as string[],
    sessionEndTimes: [] as string[],
    checklist: [] as Array<{ id: string; text: string; completed: boolean }>,
    notes: "",
    costBreakdown: [] as CostComponent[]
  });

  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  
  const updateTraining = useUpdateTraining();
  const { toast } = useToast();

  useEffect(() => {
    if (training) {
      const sessionDates = training.session_dates ? 
        (Array.isArray(training.session_dates) ? training.session_dates : []) : [];
      const sessionTimes = training.session_times ? 
        (Array.isArray(training.session_times) ? training.session_times : []) : [];
      const sessionEndTimes = training.session_end_times ? 
        (Array.isArray(training.session_end_times) ? training.session_end_times : []) : [];

      setFormData({
        title: training.title,
        instructor: training.instructor || "",
        date: training.date,
        time: training.time?.slice(0, 5) || "",
        location: training.location,
        maxParticipants: training.maxParticipants.toString(),
        status: training.status,
        requiresApproval: training.requiresApproval,
        sessions: training.sessions_count || 1,
        sessionDates: sessionDates,
        sessionTimes: sessionTimes.map((time: string) => time?.slice(0, 5) || ""),
        sessionEndTimes: sessionEndTimes.map((time: string) => time?.slice(0, 5) || ""),
        checklist: training.checklist || [],
        notes: training.notes || "",
        costBreakdown: training.cost_breakdown || []
      });
    }
  }, [training]);


  const isMultiSession = formData.sessions > 1;

  const handleAddSession = () => {
    const newSessions = formData.sessions + 1;
    
    // If converting from single session to multi-session, preserve existing data
    let newSessionDates = [...formData.sessionDates];
    let newSessionTimes = [...formData.sessionTimes];
    let newSessionEndTimes = [...formData.sessionEndTimes];
    
    // If this is the first time converting to multi-session and we have single session data
    if (formData.sessions === 1 && formData.sessionDates.length === 0 && formData.date && formData.time) {
      newSessionDates = [formData.date];
      newSessionTimes = [formData.time];
      newSessionEndTimes = [formData.sessionEndTimes[0] || ''];
    }
    
    // Add empty slots for new sessions
    while (newSessionDates.length < newSessions) {
      newSessionDates.push('');
      newSessionTimes.push('');
      newSessionEndTimes.push('');
    }
    
    setFormData(prev => ({
      ...prev,
      sessions: newSessions,
      sessionDates: newSessionDates,
      sessionTimes: newSessionTimes,
      sessionEndTimes: newSessionEndTimes
    }));
  };

  const handleRemoveSession = () => {
    if (formData.sessions > 1) {
      const newSessions = formData.sessions - 1;
      setFormData(prev => ({
        ...prev,
        sessions: newSessions,
        sessionDates: prev.sessionDates.slice(0, newSessions),
        sessionTimes: prev.sessionTimes.slice(0, newSessions),
        sessionEndTimes: prev.sessionEndTimes.slice(0, newSessions)
      }));
    }
  };

  const updateSessionDate = (index: number, date: string) => {
    const newDates = [...formData.sessionDates];
    newDates[index] = date;
    setFormData(prev => ({ ...prev, sessionDates: newDates }));
  };

  const updateSessionTime = (index: number, time: string) => {
    const newTimes = [...formData.sessionTimes];
    newTimes[index] = time;
    setFormData(prev => ({ ...prev, sessionTimes: newTimes }));
    
    const endTime = formData.sessionEndTimes[index];
    if (endTime && time && endTime < time) {
      toast({
        title: "Invalid Time",
        description: "End time cannot be before start time",
        variant: "destructive"
      });
    }
  };

  const updateSessionEndTime = (index: number, endTime: string) => {
    const newEndTimes = [...formData.sessionEndTimes];
    newEndTimes[index] = endTime;
    setFormData(prev => ({ ...prev, sessionEndTimes: newEndTimes }));
    
    const startTime = formData.sessionTimes[index];
    if (startTime && endTime && endTime < startTime) {
      toast({
        title: "Invalid Time",
        description: "End time cannot be before start time",
        variant: "destructive"
      });
      return;
    }
  };

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

  const copyTimeToAll = (sourceIndex: number) => {
    const sourceStartTime = formData.sessionTimes[sourceIndex];
    const sourceEndTime = formData.sessionEndTimes[sourceIndex];
    const sourceDate = formData.sessionDates[sourceIndex];
    
    const newSessionTimes = [...formData.sessionTimes];
    const newSessionEndTimes = [...formData.sessionEndTimes];
    const newSessionDates = [...formData.sessionDates];
    
    if (sourceStartTime) {
      for (let i = 0; i < formData.sessions; i++) {
        if (i !== sourceIndex) {
          newSessionTimes[i] = sourceStartTime;
        }
      }
    }
    
    if (sourceEndTime) {
      for (let i = 0; i < formData.sessions; i++) {
        if (i !== sourceIndex) {
          newSessionEndTimes[i] = sourceEndTime;
        }
      }
    }

    // Smart date copying: each session gets the next business day
    if (sourceDate) {
      let currentDate = new Date(sourceDate);
      
      for (let i = 0; i < formData.sessions; i++) {
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
    
    setFormData(prev => ({
      ...prev,
      sessionTimes: newSessionTimes,
      sessionEndTimes: newSessionEndTimes,
      sessionDates: newSessionDates
    }));
  };

  const addChecklistItem = () => {
    const newItem = {
      id: Date.now().toString(),
      text: "",
      completed: false
    };
    setFormData(prev => ({
      ...prev,
      checklist: [...prev.checklist, newItem]
    }));
  };

  const updateChecklistItem = (index: number, text: string) => {
    const newChecklist = [...formData.checklist];
    newChecklist[index].text = text;
    setFormData(prev => ({ ...prev, checklist: newChecklist }));
  };

  const toggleChecklistItem = (index: number) => {
    const newChecklist = [...formData.checklist];
    newChecklist[index].completed = !newChecklist[index].completed;
    setFormData(prev => ({ ...prev, checklist: newChecklist }));
  };

  const removeChecklistItem = (index: number) => {
    const newChecklist = formData.checklist.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, checklist: newChecklist }));
  };

  const addCostComponent = () => {
    const newComponent: CostComponent = {
      name: "",
      amount: 0,
      description: ""
    };
    setFormData(prev => ({
      ...prev,
      costBreakdown: [...prev.costBreakdown, newComponent]
    }));
  };

  const updateCostComponent = (index: number, field: keyof CostComponent, value: string | number) => {
    const newCostBreakdown = [...formData.costBreakdown];
    newCostBreakdown[index] = { ...newCostBreakdown[index], [field]: value };
    setFormData(prev => ({ ...prev, costBreakdown: newCostBreakdown }));
  };

  const removeCostComponent = (index: number) => {
    const newCostBreakdown = formData.costBreakdown.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, costBreakdown: newCostBreakdown }));
  };

  const validateForm = () => {
    if (!formData.title || !formData.location || !formData.maxParticipants) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return false;
    }

    if (!isMultiSession) {
      if (!formData.date || !formData.time) {
        toast({
          title: "Validation Error", 
          description: "Please select date and time for the training",
          variant: "destructive"
        });
        return false;
      }
    } else {
      const sessionsToValidate = Math.min(formData.sessions, formData.sessionDates.length);
      for (let i = 0; i < sessionsToValidate; i++) {
        if (!formData.sessionDates[i] || !formData.sessionTimes[i]) {
          toast({
            title: "Validation Error",
            description: `Please fill in date and time for session ${i + 1}`,
            variant: "destructive"
          });
          return false;
        }
        
        if (formData.sessionEndTimes[i] && formData.sessionTimes[i] && 
            formData.sessionEndTimes[i] < formData.sessionTimes[i]) {
          toast({
            title: "Validation Error",
            description: `End time cannot be before start time for session ${i + 1}`,
            variant: "destructive"
          });
          return false;
        }
      }
    }

    return true;
  };

  // Handle imported training content
  const handleImportTrainingContent = (data: ExtractedTrainingData) => {
    console.log('📥 [EditTrainingDialog] Importing training content:', data);
    
    // Update form data with extracted data
    setFormData(prev => {
      const updated = { ...prev };
      
      // Basic information
      if (data.title) {
        console.log('✅ [EditTrainingDialog] Setting title:', data.title);
        updated.title = data.title;
      }
      
      if (data.location) {
        console.log('✅ [EditTrainingDialog] Setting location:', data.location);
        updated.location = data.location;
      }
      
      if (data.instructor) {
        console.log('✅ [EditTrainingDialog] Setting instructor:', data.instructor);
        updated.instructor = data.instructor;
      }
      
      if (data.maxParticipants) {
        console.log('✅ [EditTrainingDialog] Setting max participants:', data.maxParticipants);
        updated.maxParticipants = data.maxParticipants.toString();
      }
      
      // Handle dates and times
      if (data.startDate) {
        const formattedDate = TrainingContentExtractor.formatDateForInput(data.startDate);
        if (formattedDate) {
          updated.date = formattedDate;
          updated.sessionDates = [formattedDate];
          updated.sessions = 1;
        }
      }
      
      if (data.startTime) {
        updated.time = data.startTime;
        updated.sessionTimes = [data.startTime];
      }
      
      if (data.endTime) {
        updated.sessionEndTimes = [data.endTime];
      }
      
      // Handle notes and requirements
      let notes = updated.notes || '';
      if (data.notes) {
        notes = data.notes;
      }
      if (data.requirements && data.requirements.length > 0) {
        notes += notes ? '\n\nRequirements:\n' : 'Requirements:\n';
        notes += data.requirements.map(req => `• ${req}`).join('\n');
      }
      if (data.materials && data.materials.length > 0) {
        notes += notes ? '\n\nMaterials:\n' : 'Materials:\n';
        notes += data.materials.map(mat => `• ${mat}`).join('\n');
      }
      updated.notes = notes;
      
      // Handle cost breakdown
      if (data.costs?.breakdown && data.costs.breakdown.length > 0) {
        const costBreakdown = data.costs.breakdown.map(item => ({
          id: Math.random().toString(36).substr(2, 9),
          type: item.type,
          description: item.description || item.type,
          amount: item.amount,
          currency: data.costs?.currency || 'EUR'
        }));
        updated.costBreakdown = costBreakdown;
      }
      
      // For multi-session training, handle end date
      if (data.endDate && data.startDate && data.endDate !== data.startDate) {
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > 0) {
          updated.sessions = Math.min(daysDiff + 1, 10); // Cap at 10 sessions
          
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
          
          updated.sessionDates = dates;
          updated.sessionTimes = times;
          updated.sessionEndTimes = endTimes;
        }
      }
      
      return updated;
    });
    
    toast({
      title: "Training Content Imported",
      description: `Training information has been imported with ${data.confidence || 50}% confidence. Please review and adjust as needed.`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!training || !validateForm()) return;

    try {
      const updateData = {
        id: training.id,
        title: formData.title,
        instructor: formData.instructor,
        date: isMultiSession ? formData.sessionDates[0] : formData.date,
        time: isMultiSession ? formData.sessionTimes[0] : formData.time,
        location: formData.location,
        maxParticipants: parseInt(formData.maxParticipants),
        status: formData.status,
        requiresApproval: formData.requiresApproval,
        sessions_count: formData.sessions,
        session_dates: isMultiSession ? formData.sessionDates.slice(0, formData.sessions) : null,
        session_times: isMultiSession ? formData.sessionTimes.slice(0, formData.sessions) : null,
        session_end_times: isMultiSession 
          ? formData.sessionEndTimes.slice(0, formData.sessions) 
          : (formData.sessionEndTimes[0] ? [formData.sessionEndTimes[0]] : null),
        checklist: formData.checklist,
        notes: formData.notes,
        cost_breakdown: formData.costBreakdown,
        price: formData.costBreakdown.length > 0 ? 
          formData.costBreakdown.reduce((sum, item) => sum + item.amount, 0) : null
      };
      
      await updateTraining.mutateAsync(updateData);
      
      toast({
        title: "Success",
        description: "Training updated successfully"
      });
      
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update training",
        variant: "destructive"
      });
    }
  };

  if (!training) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange} modal>
      <CustomDialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto" onOpenChange={onOpenChange}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Edit Training</DialogTitle>
              <DialogDescription>
                Update the training session details.
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsImportDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Import Content
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Training Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Sessions ({formData.sessions})</Label>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveSession}
                  disabled={formData.sessions <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddSession}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {formData.sessions === 1 ? (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Start Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.sessionEndTimes[0] || ""}
                    onChange={(e) => {
                      const newEndTimes = [...formData.sessionEndTimes];
                      newEndTimes[0] = e.target.value;
                      setFormData(prev => ({ ...prev, sessionEndTimes: newEndTimes }));
                    }}
                    placeholder="Optional"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {Array.from({ length: formData.sessions }, (_, index) => (
                  <div key={index} className="grid grid-cols-4 gap-3 p-3 border rounded-lg bg-gray-50">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        Session {index + 1}
                      </Label>
                      <Input
                        type="date"
                        value={formData.sessionDates[index] || ''}
                        onChange={(e) => updateSessionDate(index, e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Start Time</Label>
                      <Input
                        type="time"
                        value={formData.sessionTimes[index] || ''}
                        onChange={(e) => updateSessionTime(index, e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">End Time</Label>
                      <Input
                        type="time"
                        value={formData.sessionEndTimes[index] || ''}
                        onChange={(e) => updateSessionEndTime(index, e.target.value)}
                      />
                    </div>
                    <div className="space-y-1 flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => copyTimeToAll(index)}
                        disabled={!formData.sessionTimes[index] && !formData.sessionEndTimes[index]}
                        title="Copy times to all sessions"
                        className="h-8 w-8 p-0 flex items-center justify-center"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instructor">Instructor</Label>
              <Input
                id="instructor"
                value={formData.instructor}
                onChange={(e) => setFormData(prev => ({ ...prev, instructor: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
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
                value={formData.maxParticipants}
                onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
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

          {/* Cost Breakdown Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Cost Breakdown
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={addCostComponent}>
                <Plus className="h-4 w-4 mr-2" />
                Add Cost Item
              </Button>
            </div>
            
            {formData.costBreakdown.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                <p className="text-sm">No cost items added yet</p>
                <p className="text-xs">Click "Add Cost Item" to create pricing structure</p>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.costBreakdown.map((cost, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-center p-3 border rounded-lg bg-gray-50">
                    <div className="col-span-3">
                      <Label className="text-xs text-gray-600">Name</Label>
                      <Input
                        value={cost.name}
                        onChange={(e) => updateCostComponent(index, 'name', e.target.value)}
                        placeholder="e.g., Theory"
                        className="mt-1"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-gray-600">Amount (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={cost.amount}
                        onChange={(e) => updateCostComponent(index, 'amount', parseFloat(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>
                    <div className="col-span-6">
                      <Label className="text-xs text-gray-600">Description</Label>
                      <Input
                        value={cost.description}
                        onChange={(e) => updateCostComponent(index, 'description', e.target.value)}
                        placeholder="e.g., Theoretical training session"
                        className="mt-1"
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeCostComponent(index)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {formData.costBreakdown.length > 0 && (
                  <div className="flex justify-end p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm font-semibold">
                      Total: €{formData.costBreakdown.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              checked={formData.requiresApproval}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requiresApproval: !!checked }))}
            />
            <Label htmlFor="requiresApproval">Requires approval for enrollment</Label>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Training Checklist</Label>
              <Button type="button" variant="outline" size="sm" onClick={addChecklistItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
            {formData.checklist.map((item, index) => (
              <div key={item.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={() => toggleChecklistItem(index)}
                />
                <Input
                  value={item.text}
                  onChange={(e) => updateChecklistItem(index, e.target.value)}
                  placeholder="Checklist item"
                  className={`flex-1 ${item.completed ? 'line-through text-muted-foreground' : ''}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeChecklistItem(index)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about the training"
              rows={4}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateTraining.isPending}>
              {updateTraining.isPending ? "Updating..." : "Update Training"}
            </Button>
          </div>
        </form>
      </CustomDialogContent>
    </Dialog>

    {/* Import Content Dialog */}
    <TrainingContentImportDialog
      open={isImportDialogOpen}
      onOpenChange={setIsImportDialogOpen}
      onImport={handleImportTrainingContent}
      title="Import Training Content"
    />
    </>
  );
}
