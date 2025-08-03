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
import { useCreateTraining } from "@/hooks/useCreateTraining";
import { useCourses } from "@/hooks/useCourses";
import { useProviders } from "@/hooks/useProviders";
import { CourseSelectionSection } from "./forms/CourseSelectionSection";
import { SmartMultiSessionSection } from "./forms/SmartMultiSessionSection";
import { ChecklistManagementSection } from "./forms/ChecklistManagementSection";
import { PlanSelectionSection } from "./forms/PlanSelectionSection";
import { TrainingContentImportDialog } from "./TrainingContentImportDialog";
import { ExtractedTrainingData } from "@/services/ai/training-content-extractor";
import { AddCourseDialog } from "@/components/courses/AddCourseDialog";
import { AddProviderDialog } from "@/components/providers/AddProviderDialog";
import { CertificateManagementDialog } from "./CertificateManagementDialog";
import { ApprovalWorkflowManager, ApprovalRequirement } from "./ApprovalWorkflowManager";
import { Plus, Upload, Sparkles, Euro } from "lucide-react";

// Comprehensive schema matching user dialog pattern
const createTrainingSchema = (t: any) => z.object({
  title: z.string().min(1, t('training:createDialog.titleRequired')),
  courseId: z.string().min(1, t('training:createDialog.courseRequired')),
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

type TrainingFormData = z.infer<ReturnType<typeof createTrainingSchema>>;

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

  // Create schema with translations
  const trainingSchema = createTrainingSchema(t);

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
  
  // Approval workflow state
  const [approvalRequirements, setApprovalRequirements] = useState<ApprovalRequirement[]>([]);
  const [participantEmployeeIds, setParticipantEmployeeIds] = useState<string[]>([]);

  // Hooks
  const { data: courses = [], isLoading: coursesLoading } = useCourses();
  const { data: providers = [], isLoading: providersLoading } = useProviders();
  const createTraining = useCreateTraining();

  // Debug logging - disabled for production
  // console.log('CreateTrainingDialog - Courses:', courses, 'Loading:', coursesLoading);
  // console.log('CreateTrainingDialog - Providers:', providers, 'Loading:', providersLoading);

  const form = useForm<TrainingFormData>({
    resolver: zodResolver(trainingSchema),
    defaultValues: {
      title: "",
      courseId: preSelectedCourseId || "",
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

  // Auto-populate course name as title when course is selected
  useEffect(() => {
    if (watchedCourseId && courses.length > 0) {
      const selectedCourse = courses.find(course => course.id === watchedCourseId);
      if (selectedCourse && !watchedTitle) {
        form.setValue('title', selectedCourse.title);
      }
    }
  }, [watchedCourseId, courses, watchedTitle, form]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        title: "",
        courseId: preSelectedCourseId || "",
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
      });
      // Reset other states
      setApprovalRequirements([]);
      setParticipantEmployeeIds([]);
      setSelectedPlanId("");
      setSelectedGroupId("");
      setPlanDetails(null);
      setSelectedProvider(null);
      // Reset dialog states
      setIsImportDialogOpen(false);
      setShowCreateCourseDialog(false);
      setShowCreateProviderDialog(false);
      setShowCertificateDialog(false);
    }
  }, [open, preSelectedCourseId, form]);

  const handleAIImport = (data: ExtractedTrainingData) => {
    console.log('AI Import - Received extracted data:', data);
    const importedFields: string[] = [];
    
    // Basic Information fields
    if (data.title) {
      console.log('AI Import - Setting title:', data.title);
      form.setValue('title', data.title);
      importedFields.push('title');
    }
    if (data.instructor) {
      console.log('AI Import - Setting instructor:', data.instructor);
      form.setValue('instructor', data.instructor);
      importedFields.push('instructor');
    }
    if (data.location) {
      console.log('AI Import - Location information found:', data.location);
      
      // Try to match location with provider locations if provider is selected
      const selectedProviderId = form.getValues('providerId');
      const selectedProvider = providers.find(p => p.id === selectedProviderId);
      let matchedLocation = data.location;
      
      if (selectedProvider) {
        console.log('AI Import - Trying to match location with provider locations');
        const locationText = data.location.toLowerCase();
        const availableLocations: Array<{value: string, label: string}> = [];
        
        // Collect all available locations for comparison
        if (selectedProvider.address || selectedProvider.city) {
          const mainAddress = [selectedProvider.address, selectedProvider.postcode, selectedProvider.city, selectedProvider.country].filter(Boolean).join(', ');
          if (mainAddress) availableLocations.push({value: mainAddress, label: 'main'});
        }
        
        if (selectedProvider.default_location) {
          availableLocations.push({value: selectedProvider.default_location, label: 'default'});
        }
        
        if (selectedProvider.additional_locations && Array.isArray(selectedProvider.additional_locations)) {
          selectedProvider.additional_locations.forEach((location: any) => {
            if (typeof location === 'string') {
              availableLocations.push({value: location, label: 'additional'});
            } else if (location && typeof location === 'object') {
              const locAddress = [location.address, location.postcode, location.city, location.country].filter(Boolean).join(', ');
              if (locAddress) availableLocations.push({value: locAddress, label: 'structured'});
            }
          });
        }
        
        // Try to find the best match
        let bestMatch = availableLocations.find(loc => 
          loc.value.toLowerCase() === locationText
        );
        
        // Fuzzy matching if exact match not found
        if (!bestMatch) {
          bestMatch = availableLocations.find(loc => 
            loc.value.toLowerCase().includes(locationText) || locationText.includes(loc.value.toLowerCase())
          );
        }
        
        // Word-based matching
        if (!bestMatch) {
          const locationWords = locationText.split(/\s+/).filter(word => word.length > 2);
          bestMatch = availableLocations.find(loc => {
            const locWords = loc.value.toLowerCase().split(/\s+/);
            const matchCount = locationWords.filter(lWord => 
              locWords.some(locWord => locWord.includes(lWord) || lWord.includes(locWord))
            ).length;
            return matchCount >= Math.min(2, locationWords.length);
          });
        }
        
        if (bestMatch) {
          console.log('AI Import - Found matching location:', bestMatch.value);
          matchedLocation = bestMatch.value;
          importedFields.push('location (matched to provider)');
        } else {
          console.log('AI Import - No matching provider location found, using original');
          importedFields.push('location (no provider match)');
        }
      } else {
        importedFields.push('location');
      }
      
      form.setValue('location', matchedLocation);
      console.log('AI Import - Setting location:', matchedLocation);
    }
    if (data.maxParticipants) {
      console.log('AI Import - Setting maxParticipants:', data.maxParticipants);
      form.setValue('maxParticipants', data.maxParticipants.toString());
      importedFields.push('max participants');
    }
    if (data.provider) {
      console.log('AI Import - Provider information found:', data.provider);
      
      // Try to match with existing providers using multiple strategies
      const providerText = data.provider.toLowerCase();
      
      // Strategy 1: Exact match
      let matchingProvider = providers.find(provider => 
        provider.name.toLowerCase() === providerText
      );
      
      // Strategy 2: Partial match (contains)
      if (!matchingProvider) {
        matchingProvider = providers.find(provider => 
          provider.name.toLowerCase().includes(providerText) ||
          providerText.includes(provider.name.toLowerCase())
        );
      }
      
      // Strategy 3: Word-based fuzzy matching
      if (!matchingProvider) {
        const providerWords = providerText.split(/\s+/).filter(word => word.length > 2);
        if (providerWords.length > 0) {
          matchingProvider = providers.find(provider => {
            const nameWords = provider.name.toLowerCase().split(/\s+/);
            const matchCount = providerWords.filter(pWord => 
              nameWords.some(nWord => nWord.includes(pWord) || pWord.includes(nWord))
            ).length;
            return matchCount >= Math.min(2, providerWords.length);
          });
        }
      }
      
      if (matchingProvider) {
        console.log('AI Import - Found matching provider, setting providerId:', matchingProvider.id, matchingProvider.name);
        form.setValue('providerId', matchingProvider.id);
        setSelectedProvider(matchingProvider);
        importedFields.push('provider (matched)');
      } else {
        console.log('AI Import - No matching provider found, adding to notes:', data.provider);
        const existingNotes = form.getValues('notes') || '';
        const providerNote = `Provider: ${data.provider}`;
        const combinedNotes = existingNotes ? `${existingNotes}\n\n${providerNote}` : providerNote;
        form.setValue('notes', combinedNotes);
        importedFields.push('provider (as note - no match)');
      }
    }
    if (data.course) {
      console.log('AI Import - Course information found:', data.course);
      
      // Try to match with existing courses using multiple strategies
      const courseText = data.course.toLowerCase();
      
      // Strategy 1: Exact match
      let matchingCourse = courses.find(course => 
        course.title.toLowerCase() === courseText
      );
      
      // Strategy 2: Partial match (contains)
      if (!matchingCourse) {
        matchingCourse = courses.find(course => 
          course.title.toLowerCase().includes(courseText) ||
          courseText.includes(course.title.toLowerCase())
        );
      }
      
      // Strategy 3: Course code matching (e.g., RVM1-C, ADR, etc.)
      if (!matchingCourse) {
        // Extract course codes from the course field
        const courseCodePatterns = [
          /RVM1-C/i, /RVM/i, /Rijbewijs C/i, /rijbewijs.*c/i,
          /ADR/i, /Code 95/i, /code.*95/i,
          /VCA/i, /BHV/i
        ];
        
        matchingCourse = courses.find(course => {
          const courseTitle = course.title.toLowerCase();
          return courseCodePatterns.some(pattern => 
            pattern.test(courseText) && pattern.test(courseTitle)
          );
        });
      }
      
      // Strategy 4: Word-based fuzzy matching
      if (!matchingCourse) {
        const courseWords = courseText.split(/\s+/).filter(word => word.length > 2);
        if (courseWords.length > 0) {
          matchingCourse = courses.find(course => {
            const titleWords = course.title.toLowerCase().split(/\s+/);
            const matchCount = courseWords.filter(cWord => 
              titleWords.some(tWord => tWord.includes(cWord) || cWord.includes(tWord))
            ).length;
            return matchCount >= Math.min(2, courseWords.length);
          });
        }
      }
      
      if (matchingCourse) {
        console.log('AI Import - Found matching course, setting courseId:', matchingCourse.id, matchingCourse.title);
        form.setValue('courseId', matchingCourse.id);
        importedFields.push('course (matched)');
        
        // Also set the title from the course if not already set
        if (!data.title) {
          form.setValue('title', matchingCourse.title);
          importedFields.push('title (from matched course)');
        }
      } else {
        console.log('AI Import - No matching course found, adding to notes:', data.course);
        const existingNotes = form.getValues('notes') || '';
        const courseNote = `Course: ${data.course}`;
        const combinedNotes = existingNotes ? `${existingNotes}\n\n${courseNote}` : courseNote;
        form.setValue('notes', combinedNotes);
        importedFields.push('course (as note - no match)');
      }
    }
    
    // Handle sessions array first (preferred over individual session fields)
    let sessionsHandled = false;
    if (data.sessions && data.sessions.length > 0) {
      console.log('AI Import - Processing sessions array:', data.sessions);
      
      // Group sessions by date to combine sessions happening on the same day
      const sessionsByDate = new Map<string, {
        formattedDate: string;
        startTime: string;
        endTime: string;
        details: string[];
      }>();
      
      data.sessions.forEach((session, index) => {
        console.log(`AI Import - Processing session ${index + 1}:`, session);
        
        if (session.date) {
          // Parse and format date to HTML date input format (YYYY-MM-DD)
          let formattedDate = session.date;
          
          console.log('AI Import - Processing session date:', session.date);
          
          if (formattedDate.includes('-') && formattedDate.split('-').length === 3) {
            const parts = formattedDate.split('-');
            if (parts[2].length === 4) {
              // DD-MM-YYYY format -> YYYY-MM-DD (for HTML input)
              formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            } else if (parts[0].length === 4) {
              // Already YYYY-MM-DD format, keep as is
              formattedDate = session.date;
            }
          } else {
            // Try to parse with JavaScript Date and convert
            try {
              const parsedDate = new Date(session.date);
              if (!isNaN(parsedDate.getTime())) {
                // Convert to YYYY-MM-DD for HTML date input
                formattedDate = parsedDate.toISOString().split('T')[0];
              }
            } catch (e) {
              console.warn('AI Import - Could not parse session date:', session.date);
              formattedDate = session.date;
            }
          }
          
          console.log('AI Import - Formatted date:', formattedDate, 'from original:', session.date);
          
          const startTime = session.startTime ? (session.startTime.length === 5 ? session.startTime : session.startTime.substring(0, 5)) : '';
          const endTime = session.endTime ? (session.endTime.length === 5 ? session.endTime : session.endTime.substring(0, 5)) : '';
          
          // Create session detail string
          const sessionDetail = session.title || `Session ${index + 1}`;
          const timeDetail = startTime && endTime ? ` (${startTime}-${endTime})` : startTime ? ` (${startTime})` : '';
          const fullDetail = sessionDetail + timeDetail;
          
          if (sessionsByDate.has(formattedDate)) {
            // Session exists for this date, merge with existing
            console.log('AI Import - Found existing session for date:', formattedDate, 'merging...');
            const existing = sessionsByDate.get(formattedDate)!;
            existing.details.push(fullDetail);
            
            // Update start time to earliest
            if (startTime && (!existing.startTime || startTime < existing.startTime)) {
              console.log('AI Import - Updating start time from', existing.startTime, 'to', startTime);
              existing.startTime = startTime;
            }
            
            // Update end time to latest
            if (endTime && (!existing.endTime || endTime > existing.endTime)) {
              console.log('AI Import - Updating end time from', existing.endTime, 'to', endTime);
              existing.endTime = endTime;
            }
          } else {
            // First session for this date
            console.log('AI Import - Creating new session group for date:', formattedDate);
            sessionsByDate.set(formattedDate, {
              formattedDate,
              startTime: startTime || '',
              endTime: endTime || '',
              details: [fullDetail]
            });
          }
        }
      });
      
      // Convert grouped sessions back to arrays
      const sessionDates: string[] = [];
      const sessionTimes: string[] = [];
      const sessionEndTimes: string[] = [];
      const sessionNotes: string[] = [];
      
      Array.from(sessionsByDate.values()).forEach(groupedSession => {
        sessionDates.push(groupedSession.formattedDate);
        sessionTimes.push(groupedSession.startTime);
        sessionEndTimes.push(groupedSession.endTime);
        sessionNotes.push(groupedSession.details.join(', '));
      });
      
      console.log('AI Import - Session grouping results:', {
        originalSessionCount: data.sessions.length,
        groupedSessionCount: sessionsByDate.size,
        sessionsByDate: Array.from(sessionsByDate.entries()),
        finalSessionDates: sessionDates,
        finalSessionTimes: sessionTimes,
        finalSessionEndTimes: sessionEndTimes,
        finalSessionNotes: sessionNotes
      });
      
      // Use instructor from first session if main instructor not set
      const firstSession = data.sessions[0];
      if (firstSession?.instructor && !data.instructor) {
        console.log('AI Import - Setting instructor from first session:', firstSession.instructor);
        form.setValue('instructor', firstSession.instructor);
        importedFields.push('instructor (from session)');
      }
      
      // Use location from first session if main location not set
      if (firstSession?.location && !data.location) {
        console.log('AI Import - Setting location from first session:', firstSession.location);
        form.setValue('location', firstSession.location);
        importedFields.push('location (from session)');
      }
      
      if (sessionDates.length > 0) {
        form.setValue('sessionDates', sessionDates);
        form.setValue('sessions', sessionDates.length);
        importedFields.push(`${sessionDates.length} session dates`);
        console.log('AI Import - Set session dates from sessions array:', sessionDates);
        sessionsHandled = true;
      }
      
      if (sessionTimes.length > 0) {
        form.setValue('sessionTimes', sessionTimes);
        importedFields.push(`${sessionTimes.length} session times`);
        console.log('AI Import - Set session times from sessions array:', sessionTimes);
      }
      
      if (sessionEndTimes.length > 0) {
        form.setValue('sessionEndTimes', sessionEndTimes);
        importedFields.push(`${sessionEndTimes.length} session end times`);
        console.log('AI Import - Set session end times from sessions array:', sessionEndTimes);
      }
      
      // Add session details to notes if available
      if (sessionNotes.length > 0) {
        const existingNotes = form.getValues('notes') || '';
        const sessionDetailsSection = `Session Details:\n${sessionNotes.map((note, index) => `${sessionDates[index]}: ${note}`).join('\n')}`;
        const combinedNotes = existingNotes ? `${existingNotes}\n\n${sessionDetailsSection}` : sessionDetailsSection;
        form.setValue('notes', combinedNotes);
        importedFields.push('session details (in notes)');
        console.log('AI Import - Added session details to notes:', sessionNotes);
      }
    }
    
    // Handle individual session dates and times (fallback if sessions array not present)
    if (!sessionsHandled && (data.startDate || data.startTime || data.endDate || data.endTime)) {
      console.log('AI Import - Processing session data:', {
        startDate: data.startDate,
        startTime: data.startTime,
        endDate: data.endDate,
        endTime: data.endTime
      });
      
      const sessionDates: string[] = [];
      const sessionTimes: string[] = [];
      const sessionEndTimes: string[] = [];
      
      // Convert extracted date/time to form format
      if (data.startDate) {
        console.log('AI Import - Original start date from AI:', data.startDate);
        // Parse different date formats and convert to YYYY-MM-DD
        let formattedDate = data.startDate;
        
        // Handle various date formats and convert to YYYY-MM-DD for HTML input
        if (formattedDate.includes('T')) {
          // ISO format: 2025-06-19T...
          formattedDate = formattedDate.split('T')[0];
        } else if (formattedDate.includes('-') && formattedDate.split('-').length === 3) {
          const parts = formattedDate.split('-');
          if (parts[2].length === 4) {
            // DD-MM-YYYY format -> YYYY-MM-DD (for HTML input)
            formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          } else if (parts[0].length === 4) {
            // Already YYYY-MM-DD format, keep as is
            formattedDate = data.startDate;
          }
        } else {
          // Try to parse with JavaScript Date and convert to YYYY-MM-DD
          try {
            const parsedDate = new Date(data.startDate);
            if (!isNaN(parsedDate.getTime())) {
              formattedDate = parsedDate.toISOString().split('T')[0];
            }
          } catch (e) {
            console.warn('AI Import - Could not parse date:', data.startDate);
            formattedDate = data.startDate; // Keep as is if can't parse
          }
        }
        
        sessionDates.push(formattedDate);
        importedFields.push('start date');
        console.log('AI Import - Added session date (formatted):', formattedDate);
      }
      
      if (data.startTime) {
        // Ensure time is in HH:MM format
        const formattedTime = data.startTime.length === 5 ? data.startTime : data.startTime.substring(0, 5);
        sessionTimes.push(formattedTime);
        importedFields.push('start time');
        console.log('AI Import - Added session time:', formattedTime);
      }
      
      if (data.endTime) {
        // Ensure time is in HH:MM format
        const formattedEndTime = data.endTime.length === 5 ? data.endTime : data.endTime.substring(0, 5);
        sessionEndTimes.push(formattedEndTime);
        importedFields.push('end time');
        console.log('AI Import - Added session end time:', formattedEndTime);
      }
      
      // If we have session data, set it
      if (sessionDates.length > 0) {
        form.setValue('sessionDates', sessionDates);
        form.setValue('sessions', sessionDates.length);
        console.log('AI Import - Set sessionDates and sessions count:', sessionDates.length);
      }
      if (sessionTimes.length > 0) {
        form.setValue('sessionTimes', sessionTimes);
        console.log('AI Import - Set sessionTimes:', sessionTimes);
      }
      if (sessionEndTimes.length > 0) {
        form.setValue('sessionEndTimes', sessionEndTimes);
        console.log('AI Import - Set sessionEndTimes:', sessionEndTimes);
      }
    }
    
    // Handle requirements as checklist items
    if (data.requirements && data.requirements.length > 0) {
      const formattedChecklist = data.requirements.map((item, index) => ({
        id: `imported-req-${index}`,
        text: item,
        completed: false
      }));
      form.setValue('checklist', formattedChecklist);
      importedFields.push('requirements (as checklist)');
    }
    
    // Handle materials as additional notes
    if (data.materials && data.materials.length > 0) {
      const materialsText = `Materials needed:\n${data.materials.map(m => `• ${m}`).join('\n')}`;
      const existingNotes = form.getValues('notes') || '';
      const combinedNotes = existingNotes ? `${existingNotes}\n\n${materialsText}` : materialsText;
      form.setValue('notes', combinedNotes);
      importedFields.push('materials (as notes)');
    }
    
    if (data.notes) {
      const existingNotes = form.getValues('notes') || '';
      const combinedNotes = existingNotes ? `${existingNotes}\n\n${data.notes}` : data.notes;
      form.setValue('notes', combinedNotes);
      importedFields.push('notes');
    }
    
    // Handle cost information
    if (data.costs?.amount) {
      form.setValue('price', data.costs.amount);
      importedFields.push('price');
    }
    
    setIsImportDialogOpen(false);
    
    console.log('AI Import - Completed. Imported fields:', importedFields);
    console.log('AI Import - Current form values after import:', form.getValues());
    
    // Force form re-render to ensure UI updates
    setTimeout(() => {
      form.trigger(); // Trigger form validation/re-render
    }, 100);
    
    toast({
      title: "AI Training Import Completed",
      description: importedFields.length > 0 
        ? `Successfully imported: ${importedFields.join(', ')}`
        : "Training information has been imported from the document.",
    });
  };

  const onSubmit = (data: TrainingFormData) => {
    console.log("Creating new training:", data);
    console.log("Approval requirements:", approvalRequirements);
    
    // Create the training data object
    const trainingData = {
      ...data,
      // Ensure proper type conversions
      sessions: Number(data.sessions),
      maxParticipants: data.maxParticipants ? parseInt(data.maxParticipants) : undefined,
      minParticipants: data.minParticipants ? parseInt(data.minParticipants) : undefined,
      price: data.price || undefined,
      // Set requires_approval based on whether there are any approval requirements
      requiresApproval: approvalRequirements.length > 0,
      // Store approval requirements for now (will be moved to separate table later)
      approvalWorkflow: approvalRequirements
    };

    // Handle training creation
    createTraining.mutate(trainingData, {
      onSuccess: (createdTraining) => {
        // TODO: After training is created, create approval records
        // This will be implemented once we add the training_approvals table
        
        const hasApprovals = approvalRequirements.length > 0;
        
        toast({
          title: t('training:createDialog.trainingCreated'),
          description: hasApprovals 
            ? `${t('training:createDialog.trainingCreatedSuccess', { title: data.title })} - ${approvalRequirements.length} approval(s) required.`
            : t('training:createDialog.trainingCreatedSuccess', { title: data.title }),
        });
        
        form.reset();
        setApprovalRequirements([]);
        setParticipantEmployeeIds([]);
        onOpenChange(false);
      },
      onError: (error) => {
        toast({
          title: t('training:createDialog.createError'),
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('training:createDialog.title')}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="participants">Participants</TabsTrigger>
                <TabsTrigger value="approvals">Approvals</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                {/* Training title display */}
                <div className="text-center py-4 border-b">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {watchedTitle || t('training:createDialog.newTraining')}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('training:createDialog.title')} *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('training:createDialog.placeholders.enterTitle')} />
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
                        <FormLabel>{t('training:createDialog.course')} *</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange} disabled={coursesLoading}>
                            <SelectTrigger>
                              <SelectValue placeholder={coursesLoading ? "Loading courses..." : t('training:createDialog.selectCourse')} />
                            </SelectTrigger>
                            <SelectContent>
                              {courses.map((course) => (
                                <SelectItem key={course.id} value={course.id}>
                                  {course.title}
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
                        <FormLabel>{t('training:createDialog.instructor')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('training:createDialog.placeholders.enterInstructor')} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => {
                      const selectedProviderId = form.watch('providerId');
                      const selectedProvider = providers.find(p => p.id === selectedProviderId);
                      const availableLocations: Array<{value: string, label: string}> = [];
                      
                      if (selectedProvider) {
                        // Add main address if available
                        if (selectedProvider.address || selectedProvider.city) {
                          const mainAddress = [
                            selectedProvider.address,
                            selectedProvider.postcode,
                            selectedProvider.city,
                            selectedProvider.country
                          ].filter(Boolean).join(', ');
                          if (mainAddress) {
                            availableLocations.push({
                              value: mainAddress,
                              label: `Main Location: ${mainAddress}`
                            });
                          }
                        }
                        
                        // Add default location if available
                        if (selectedProvider.default_location) {
                          availableLocations.push({
                            value: selectedProvider.default_location,
                            label: `Default: ${selectedProvider.default_location}`
                          });
                        }
                        
                        // Add additional locations if available
                        if (selectedProvider.additional_locations && Array.isArray(selectedProvider.additional_locations)) {
                          selectedProvider.additional_locations.forEach((location: any, index: number) => {
                            if (typeof location === 'string') {
                              availableLocations.push({
                                value: location,
                                label: `Location ${index + 1}: ${location}`
                              });
                            } else if (location && typeof location === 'object') {
                              const locAddress = [
                                location.address,
                                location.postcode,
                                location.city,
                                location.country
                              ].filter(Boolean).join(', ');
                              if (locAddress) {
                                availableLocations.push({
                                  value: locAddress,
                                  label: location.name ? `${location.name}: ${locAddress}` : `Location ${index + 1}: ${locAddress}`
                                });
                              }
                            }
                          });
                        }
                      }
                      
                      return (
                        <FormItem>
                          <FormLabel>{t('training:createDialog.location')}</FormLabel>
                          <FormControl>
                            {availableLocations.length > 0 ? (
                              <div className="space-y-2">
                                <Select 
                                  value={field.value === 'custom' || !availableLocations.find(loc => loc.value === field.value) ? 'custom' : field.value} 
                                  onValueChange={(value) => {
                                    if (value === 'custom') {
                                      field.onChange('');
                                    } else {
                                      field.onChange(value);
                                    }
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder={t('training:createDialog.placeholders.selectLocation')} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableLocations.map((location) => (
                                      <SelectItem key={location.value} value={location.value}>
                                        {location.label}
                                      </SelectItem>
                                    ))}
                                    <SelectItem value="custom">
                                      {t('training:createDialog.customLocation')}
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                {(field.value === 'custom' || (field.value && !availableLocations.find(loc => loc.value === field.value))) && (
                                  <Input 
                                    value={field.value === 'custom' ? '' : field.value}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    placeholder={t('training:createDialog.placeholders.enterLocation')} 
                                  />
                                )}
                              </div>
                            ) : (
                              <Input {...field} placeholder={t('training:createDialog.placeholders.enterLocation')} />
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('training:createDialog.status')}</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder={t('training:createDialog.selectStatus')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="scheduled">{t('training:status.scheduled')}</SelectItem>
                              <SelectItem value="confirmed">{t('training:status.confirmed')}</SelectItem>
                              <SelectItem value="cancelled">{t('training:status.cancelled')}</SelectItem>
                              <SelectItem value="completed">{t('training:status.completed')}</SelectItem>
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
                        <FormLabel>{t('training:createDialog.provider')}</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange} disabled={providersLoading}>
                            <SelectTrigger>
                              <SelectValue placeholder={providersLoading ? "Loading providers..." : t('training:createDialog.selectProvider')} />
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


                {/* AI Import Button */}
                <div className="flex justify-center pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      console.log('AI Import button clicked - opening dialog');
                      setIsImportDialogOpen(true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <Sparkles className="w-4 h-4" />
                    {t('training:createDialog.importFromDocument')}
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
                        <FormLabel>{t('training:createDialog.minParticipants')}</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder={t('training:createDialog.placeholders.minParticipants')} />
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
                        <FormLabel>{t('training:createDialog.maxParticipants')}</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder={t('training:createDialog.placeholders.maxParticipants')} />
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
                        <FormLabel>{t('training:createDialog.participantLimit')}</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder={t('training:createDialog.placeholders.overallLimit')} />
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
                            {t('training:createDialog.enableWaitingList')}
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
                      <FormLabel>{t('training:createDialog.prerequisites')}</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder={t('training:createDialog.placeholders.prerequisites')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="approvals" className="space-y-4">
                <ApprovalWorkflowManager
                  participantEmployeeIds={participantEmployeeIds}
                  courseType={courses.find(c => c.id === watchedCourseId)?.category}
                  onApprovalRequirementsChange={setApprovalRequirements}
                />
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">{t('training:createDialog.aiApprovalIntelligence')}</h4>
                  <p className="text-sm text-blue-700">
                    {t('training:createDialog.approvalDetectionDescription')}
                  </p>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1">
                    <li>• {t('training:createDialog.approvalDetectionItems.workLocations')}</li>
                    <li>• {t('training:createDialog.approvalDetectionItems.courseTypeCost')}</li>
                    <li>• {t('training:createDialog.approvalDetectionItems.providerAvailability')}</li>
                    <li>• {t('training:createDialog.approvalDetectionItems.employeeSchedules')}</li>
                  </ul>
                </div>
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
                      <FormLabel>{t('training:createDialog.additionalNotes')}</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder={t('training:createDialog.placeholders.additionalNotes')} />
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
                          {t('training:createDialog.certificateRequired')}
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
                      {t('training:createDialog.certificateSettings')}
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div className="space-y-4">
                  <h4 className="font-medium">{t('training:createDialog.costManagement')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <Euro className="w-4 h-4 inline mr-1" />
{t('training:createDialog.totalPrice')}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              step="0.01"
                              placeholder={t('training:createDialog.placeholders.price')}
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
                          <FormLabel>{t('training:createDialog.baseCost')}</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              step="0.01"
                              placeholder={t('training:createDialog.placeholders.price')}
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
                          {t('training:createDialog.automaticReminders')}
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
{t('training:createDialog.createCourse')}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateProviderDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
{t('training:createDialog.createProvider')}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('training:createDialog.cancel')}
              </Button>
              <Button type="submit" disabled={createTraining.isPending}>
                {createTraining.isPending ? t('training:createDialog.creating') : t('training:createDialog.createTraining')}
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