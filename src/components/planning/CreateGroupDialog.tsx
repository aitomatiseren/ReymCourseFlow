import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Users, Award, MapPin, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useLicenses } from "@/hooks/useCertificates";
import { useProviders } from "@/hooks/useProviders";
import { useWorkLocations } from "@/hooks/useEmployees";
import { logger } from "@/utils/logger";

const groupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  description: z.string().optional(),
  certificate_id: z.string().optional(),
  group_type: z.enum(['new', 'renewal', 'mixed']),
  location: z.string().optional(),
  provider_id: z.string().optional(),
  priority: z.number().min(1).max(5).default(3),
  max_participants: z.number().min(1).max(50).optional(),
  target_completion_date: z.date().optional(),
  planned_start_date: z.date().optional(),
  planned_end_date: z.date().optional(),
  provider_recommendation: z.string().optional(),
  sessions_required: z.number().optional(),
  notes: z.string().optional(),
});

type GroupFormData = z.infer<typeof groupSchema>;

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateGroup: (groupData: GroupFormData, employeeIds: string[]) => Promise<void>;
  employeeIds: string[];
  employeeNames: string[];
  suggestedName?: string;
  suggestedType?: 'new' | 'renewal' | 'mixed';
  suggestedCertificateId?: string;
  suggestedLocation?: string;
  suggestedPriority?: number;
  suggestedDescription?: string;
  suggestedTargetDate?: Date;
  suggestedMaxParticipants?: number;
  suggestedStartDate?: Date;
  suggestedEndDate?: Date;
  suggestedEstimatedCost?: number;
  suggestedProviderRecommendation?: string;
  suggestedSessionsRequired?: number;
  suggestedSchedulingNotes?: string;
}

export function CreateGroupDialog({
  open,
  onOpenChange,
  onCreateGroup,
  employeeIds,
  employeeNames,
  suggestedName,
  suggestedType,
  suggestedCertificateId,
  suggestedLocation,
  suggestedPriority,
  suggestedDescription,
  suggestedTargetDate,
  suggestedMaxParticipants,
  suggestedStartDate,
  suggestedEndDate,
  suggestedEstimatedCost,
  suggestedProviderRecommendation,
  suggestedSessionsRequired,
  suggestedSchedulingNotes,
}: CreateGroupDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [targetDate, setTargetDate] = useState<Date | undefined>();
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const { data: licenses = [] } = useLicenses();
  const { data: providers = [] } = useProviders();
  const { data: workLocations = [], isLoading: workLocationsLoading } = useWorkLocations();
  
  logger.debug('CreateGroupDialog: Available work locations', { workLocations });

  const form = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: "",
      description: "",
      certificate_id: "",
      group_type: "mixed",
      location: "",
      provider_id: "",
      priority: 3,
      max_participants: undefined,
      estimated_cost: undefined,
      sessions_required: undefined,
      notes: "",
    },
  });

  // Update form values when suggested values change
  useEffect(() => {
    if (open) {
      setIsSuccess(false);
      logger.debug('CreateGroupDialog: Setting form values', { suggestedLocation });
      form.reset({
        name: suggestedName || "",
        description: suggestedDescription || `Training group with ${employeeIds.length} employees`,
        certificate_id: suggestedCertificateId || "",
        group_type: suggestedType || "mixed",
        location: suggestedLocation || "",
        provider_id: suggestedProviderRecommendation || "none",
        priority: suggestedPriority || 3,
        max_participants: suggestedMaxParticipants || employeeIds.length,
        sessions_required: suggestedSessionsRequired || undefined,
        notes: suggestedSchedulingNotes || `Auto-generated group from employee selection. Created on ${new Date().toLocaleDateString()}`,
      });
      setTargetDate(suggestedTargetDate);
      setStartDate(suggestedStartDate);
      setEndDate(suggestedEndDate);
    }
  }, [open, suggestedName, suggestedDescription, suggestedCertificateId, suggestedType, suggestedLocation, suggestedProviderRecommendation, suggestedPriority, suggestedMaxParticipants, suggestedEstimatedCost, suggestedSessionsRequired, suggestedSchedulingNotes, suggestedTargetDate, suggestedStartDate, suggestedEndDate, employeeIds.length, form]);

  const handleSubmit = async (data: GroupFormData) => {
    setIsSubmitting(true);
    try {
      logger.debug('CreateGroupDialog: Form submission data', { data });
      const submissionData = {
        ...data,
        provider_id: data.provider_id === "none" ? undefined : data.provider_id,
        target_completion_date: targetDate,
        planned_start_date: startDate,
        planned_end_date: endDate,
      };
      logger.debug('CreateGroupDialog: Final submission data', { submissionData });
      await onCreateGroup(submissionData, employeeIds);
      setIsSuccess(true);
      
      // Show success state for 2 seconds before closing
      setTimeout(() => {
        onOpenChange(false);
        form.reset();
        setTargetDate(undefined);
        setStartDate(undefined);
        setEndDate(undefined);
        setIsSuccess(false);
      }, 2000);
    } catch (error) {
      logger.error('Error creating group', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCertificate = licenses.find(license => license.id === form.watch('certificate_id'));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create Employee Group
          </DialogTitle>
          <DialogDescription>
            Create a new employee group for training scheduling with {employeeIds.length} employees.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Group Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter group name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter group description (optional)"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Location (current: "{field.value || 'empty'}")
                  </FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      logger.debug('Location select changed', { value });
                      field.onChange(value);
                    }} 
                    value={field.value || ""}
                    defaultValue=""
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select work location (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">No specific location</SelectItem>
                      {workLocationsLoading ? (
                        <SelectItem value="loading" disabled>Loading locations...</SelectItem>
                      ) : (
                        workLocations.map((location) => (
                          <SelectItem key={location} value={location}>
                            {location}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Certificate and Group Type */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="certificate_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Award className="h-4 w-4" />
                      Certificate
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select certificate" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No specific certificate</SelectItem>
                        {licenses.map((license) => (
                          <SelectItem key={license.id} value={license.id}>
                            {license.name} - {license.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="group_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="new">New Employees</SelectItem>
                        <SelectItem value="renewal">Renewal Training</SelectItem>
                        <SelectItem value="mixed">Mixed Group</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Provider and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="provider_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      Provider
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No specific provider</SelectItem>
                        {providers.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            {provider.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 - Low</SelectItem>
                        <SelectItem value="2">2 - Below Normal</SelectItem>
                        <SelectItem value="3">3 - Normal</SelectItem>
                        <SelectItem value="4">4 - High</SelectItem>
                        <SelectItem value="5">5 - Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Max Participants and Sessions Required */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="max_participants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Participants</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="50"
                        placeholder="Maximum participants"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sessions_required"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sessions Required</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="10"
                        placeholder="Number of sessions"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>


            {/* Target Completion Date */}
            <FormItem>
              <FormLabel>Target Completion Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !targetDate && "text-muted-foreground"
                      )}
                    >
                      {targetDate ? (
                        format(targetDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={targetDate}
                    onSelect={setTargetDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </FormItem>

            {/* Planned Start and End Dates */}
            <div className="grid grid-cols-2 gap-4">
              <FormItem>
                <FormLabel>Planned Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        {startDate ? (
                          format(startDate, "PPP")
                        ) : (
                          <span>Pick start date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </FormItem>

              <FormItem>
                <FormLabel>Planned End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        {endDate ? (
                          format(endDate, "PPP")
                        ) : (
                          <span>Pick end date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </FormItem>
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes (optional)"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Employee List */}
            <div className="space-y-2">
              <FormLabel>Employees in Group ({employeeIds.length || 0})</FormLabel>
              <div className="max-h-32 overflow-y-auto border rounded-lg p-2">
                <div className="flex flex-wrap gap-1">
                  {employeeNames.map((name, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Certificate Information */}
            {selectedCertificate && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Award className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Certificate Information</span>
                </div>
                <div className="text-sm text-blue-800">
                  <div><strong>Name:</strong> {selectedCertificate.name}</div>
                  {selectedCertificate.description && (
                    <div><strong>Description:</strong> {selectedCertificate.description}</div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isSuccess}>
                {isSubmitting ? (
                  "Creating Group..."
                ) : isSuccess ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Group Created!
                  </span>
                ) : (
                  "Create Group"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}