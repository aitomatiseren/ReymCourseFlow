import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  UserPlus, 
  Clock, 
  Building2, 
  Sparkles,
  Plus,
  Eye,
  Calendar,
  AlertTriangle,
  RefreshCw,
  MessageSquare,
  Send,
  MapPin,
  Filter
} from "lucide-react";
import { CertificateExpiryAnalysis, usePreliminaryPlanningMutations } from "@/hooks/usePreliminaryPlanning";
import { useTrainings } from "@/hooks/useTrainings";
import { useProviders } from "@/hooks/useProviders";
import { useProvidersForCertificate, useCoursesForCertificate } from "@/hooks/useProvidersForCertificate";
import { OpenAIService } from "@/services/ai";
import { useProviderPreferencesSummary } from "@/hooks/useProviderPreferences";
import { useEmployeeAvailabilitySummary, useEmployeeComprehensiveData } from "@/hooks/useEmployeeAvailability";
import { CreateGroupDialog } from "./CreateGroupDialog";
import { usePreliminaryPlans } from "@/hooks/usePreliminaryPlanning";
import { useToast } from "@/hooks/use-toast";

interface EmployeeGroupingViewProps {
  selectedLicenseId: string;
  expiryData: CertificateExpiryAnalysis[];
  licenses: Array<{ id: string; name: string; category?: string }>;
  onLicenseChange: (licenseId: string) => void;
  selectedPlanId?: string;
  onPlanChange?: (planId: string) => void;
}

export function EmployeeGroupingView({ 
  selectedLicenseId, 
  expiryData, 
  licenses, 
  onLicenseChange,
  selectedPlanId = "all",
  onPlanChange
}: EmployeeGroupingViewProps) {
  const queryClient = useQueryClient();
  const [selectedWorkLocations, setSelectedWorkLocations] = useState<string[]>([]);
  const [selectedEmployeeStatus, setSelectedEmployeeStatus] = useState<string>('active');
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [planningRequest, setPlanningRequest] = useState('');
  const [aiPlanningResult, setAiPlanningResult] = useState<any>(null);
  const [isProcessingRequest, setIsProcessingRequest] = useState(false);
  
  // Dialog state
  const [isCreateGroupDialogOpen, setIsCreateGroupDialogOpen] = useState(false);
  const [currentGroupData, setCurrentGroupData] = useState<{
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
  }>({
    employeeIds: [],
    employeeNames: [],
  });
  
  const aiService = OpenAIService.getInstance();
  const { toast } = useToast();
  const { data: preliminaryPlans = [] } = usePreliminaryPlans();
  const { 
    createPreliminaryPlan, 
    createPreliminaryPlanGroup, 
    addEmployeeToGroup 
  } = usePreliminaryPlanningMutations();

  // Remove intelligent grouping suggestions - we only use manual and AI natural language grouping

  const { data: existingTrainings = [], isLoading: trainingsLoading } = useTrainings();
  const { data: providers = [], isLoading: providersLoading } = useProviders();
  
  // Use the new hook to get providers that can deliver training for the selected certificate
  const { data: certificateProviders = [], isLoading: certificateProvidersLoading } = useProvidersForCertificate(
    selectedLicenseId !== 'all' ? selectedLicenseId : undefined
  );
  
  // Get courses that can grant the selected certificate
  const { data: certificateCourses = [], isLoading: certificateCoursesLoading } = useCoursesForCertificate(
    selectedLicenseId !== 'all' ? selectedLicenseId : undefined
  );
  
  const { data: providerPreferences = {}, isLoading: preferencesLoading } = useProviderPreferencesSummary();
  const { data: employeeAvailability = {}, isLoading: availabilityLoading } = useEmployeeAvailabilitySummary();
  const { data: comprehensiveEmployeeData = [], isLoading: comprehensiveLoading } = useEmployeeComprehensiveData();

  const selectedLicense = licenses.find(license => license.id === selectedLicenseId);
  
  // Get available work locations from expiry data
  const availableWorkLocations = Array.from(new Set(
    expiryData.map(emp => emp.work_location).filter(Boolean)
  )).sort();

  const getStatusBadge = (status: string, daysUntilExpiry?: number) => {
    switch (status) {
      case 'expired':
        return <Badge className="flex items-center gap-1 bg-red-600 text-white border-red-600">
          <AlertTriangle className="h-3 w-3" />
          Expired
        </Badge>;
      case 'renewal_due':
        return <Badge className="flex items-center gap-1 bg-red-100 text-red-800 border-red-200">
          <Clock className="h-3 w-3" />
          Due ({daysUntilExpiry}d)
        </Badge>;
      case 'renewal_approaching':
        return <Badge className="flex items-center gap-1 bg-orange-100 text-orange-800 border-orange-200">
          <Clock className="h-3 w-3" />
          Approaching ({daysUntilExpiry}d)
        </Badge>;
      case 'expiring_during_period':
        return <Badge className="flex items-center gap-1 bg-yellow-100 text-yellow-800 border-yellow-200">
          <Clock className="h-3 w-3" />
          Expiring in Period ({daysUntilExpiry}d)
        </Badge>;
      case 'new':
        return <Badge className="flex items-center gap-1 bg-blue-100 text-blue-800 border-blue-200">
          <UserPlus className="h-3 w-3" />
          New
        </Badge>;
      case 'valid':
        return <Badge className="flex items-center gap-1 bg-green-100 text-green-800 border-green-200">
          <Users className="h-3 w-3" />
          Valid
        </Badge>;
      default:
        return <Badge variant="outline" className="text-gray-600">{status}</Badge>;
    }
  };

  const toggleEmployeeSelection = (employeeId: string) => {
    const newSelection = new Set(selectedEmployees);
    if (newSelection.has(employeeId)) {
      newSelection.delete(employeeId);
    } else {
      newSelection.add(employeeId);
    }
    setSelectedEmployees(newSelection);
  };

  const createGroupFromSelection = () => {
    if (selectedEmployees.size === 0) return;
    
    // Get employee names for the dialog
    const employeeNames = expiryData
      .filter(employee => selectedEmployees.has(employee.employee_id))
      .map(employee => employee.employee_name);
    
    // Determine group type based on employee statuses
    const selectedEmployeeIds = Array.from(selectedEmployees);
    const groupEmployees = selectedEmployeeIds.map(id => expiryData.find(emp => emp.employee_id === id)).filter(Boolean);
    const newEmployees = groupEmployees.filter(emp => emp.employee_status === 'new');
    const renewalEmployees = groupEmployees.filter(emp => emp.employee_status !== 'new');
    
    let determinedGroupType: 'new' | 'renewal' | 'mixed' = 'mixed';
    if (newEmployees.length === groupEmployees.length) {
      determinedGroupType = 'new';
    } else if (renewalEmployees.length === groupEmployees.length) {
      determinedGroupType = 'renewal';
    }
    
    // Calculate target completion date based on earliest expiry or end of planning period
    const earliestExpiry = groupEmployees
      .filter(emp => emp.expiry_date)
      .map(emp => new Date(emp.expiry_date!))
      .sort((a, b) => a.getTime() - b.getTime())[0];
    
    const planEndDate = selectedPlanId !== 'all' 
      ? preliminaryPlans.find(p => p.id === selectedPlanId)?.planning_period_end
      : undefined;
    
    const targetCompletionDate = earliestExpiry || (planEndDate ? new Date(planEndDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    
    // Set up the group data for the dialog
    setCurrentGroupData({
      employeeIds: selectedEmployeeIds,
      employeeNames,
      suggestedName: `${selectedLicense?.name || 'Certificate'} Group - ${new Date().toLocaleDateString()}`,
      suggestedType: determinedGroupType,
      suggestedCertificateId: selectedLicenseId !== 'all' ? selectedLicenseId : undefined,
      suggestedLocation: '',
      suggestedPriority: 3,
      suggestedDescription: `New training group for ${selectedLicense?.name || 'certificate'} certification`,
      suggestedTargetDate: targetCompletionDate,
      suggestedMaxParticipants: selectedEmployeeIds.length,
      suggestedStartDate: undefined,
      suggestedEndDate: undefined,
      suggestedEstimatedCost: undefined,
      suggestedProviderRecommendation: "",
      suggestedSessionsRequired: undefined,
      suggestedSchedulingNotes: `Manual group creation for ${selectedLicense?.name || 'certificate'} certification. Created on ${new Date().toLocaleDateString()}`,
    });
    
    setIsCreateGroupDialogOpen(true);
  };

  const handlePreviewGroup = (suggestion: any) => {
    console.log('Previewing group:', suggestion);
    // TODO: Implement group preview dialog
    alert(`Preview group: ${suggestion.name}\nEmployees: ${suggestion.employees.length}\nDepartment: ${suggestion.department}`);
  };

  const handleCreateGroup = (suggestion: any) => {
    console.log('Creating group from suggestion:', suggestion);
    
    // Determine group type based on employee statuses
    const suggestionEmployeeIds = suggestion.employees.map((emp: any) => emp.employee_id);
    const groupEmployees = suggestionEmployeeIds.map(id => expiryData.find(emp => emp.employee_id === id)).filter(Boolean);
    const newEmployees = groupEmployees.filter(emp => emp.employee_status === 'new');
    const renewalEmployees = groupEmployees.filter(emp => emp.employee_status !== 'new');
    
    let determinedGroupType: 'new' | 'renewal' | 'mixed' = 'mixed';
    if (newEmployees.length === groupEmployees.length) {
      determinedGroupType = 'new';
    } else if (renewalEmployees.length === groupEmployees.length) {
      determinedGroupType = 'renewal';
    }
    
    // Calculate target completion date based on earliest expiry or end of planning period
    const earliestExpiry = groupEmployees
      .filter(emp => emp.expiry_date)
      .map(emp => new Date(emp.expiry_date!))
      .sort((a, b) => a.getTime() - b.getTime())[0];
    
    const planEndDate = selectedPlanId !== 'all' 
      ? preliminaryPlans.find(p => p.id === selectedPlanId)?.planning_period_end
      : undefined;
    
    const targetCompletionDate = earliestExpiry || (planEndDate ? new Date(planEndDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    
    // Set up the group data for the dialog
    setCurrentGroupData({
      employeeIds: suggestionEmployeeIds,
      employeeNames: suggestion.employees.map((emp: any) => emp.employee_name),
      suggestedName: suggestion.name,
      suggestedType: determinedGroupType,
      suggestedCertificateId: selectedLicenseId !== 'all' ? selectedLicenseId : undefined,
      suggestedLocation: suggestion.department || '',
      suggestedPriority: suggestion.priority || 3,
      suggestedDescription: `Training group from suggested selection: ${suggestion.name}`,
      suggestedTargetDate: targetCompletionDate,
      suggestedMaxParticipants: suggestion.employees.length,
      suggestedStartDate: undefined,
      suggestedEndDate: undefined,
      suggestedEstimatedCost: undefined,
      suggestedProviderRecommendation: "",
      suggestedSessionsRequired: undefined,
      suggestedSchedulingNotes: `Group from suggested selection: ${suggestion.name}. Created on ${new Date().toLocaleDateString()}`,
    });
    
    setIsCreateGroupDialogOpen(true);
  };

  const handleCreateAIGroup = (group: any) => {
    console.log('Creating AI-suggested group:', group);
    
    // Parse employee data from AI result
    const employeeNames = group.employees || [];
    const employeeIds = employeeNames.map((name: string) => {
      // Find employee ID by name - check both full name formats
      const employee = expiryData.find(emp => {
        const fullName = `${emp.first_name} ${emp.last_name}`;
        return fullName === name || emp.employee_name === name;
      });
      
      if (!employee) {
        console.warn(`Employee not found for name: ${name}`);
        return null;
      }
      
      return employee.employee_id;
    }).filter(Boolean); // Remove null/undefined values
    
    // Validate that we have valid employee IDs
    if (employeeIds.length === 0) {
      console.error('No valid employee IDs found for group:', group);
      alert('Unable to create group: No valid employees found. Please check the employee names.');
      return;
    }
    
    // Filter employee names to only include those with valid IDs
    const validEmployeeNames = employeeNames.filter((name: string) => {
      const employee = expiryData.find(emp => {
        const fullName = `${emp.first_name} ${emp.last_name}`;
        return fullName === name || emp.employee_name === name;
      });
      return employee != null;
    });
    
    // Determine priority based on AI reasoning
    const determinePriority = (reasoning: string) => {
      if (reasoning.toLowerCase().includes('critical') || reasoning.toLowerCase().includes('expired')) return 5;
      if (reasoning.toLowerCase().includes('urgent') || reasoning.toLowerCase().includes('high')) return 4;
      if (reasoning.toLowerCase().includes('medium')) return 3;
      if (reasoning.toLowerCase().includes('low')) return 2;
      return 3; // default
    };
    
    // Parse suggested dates if available
    const suggestedStartDate = group.suggested_date ? new Date(group.suggested_date) : undefined;
    const suggestedEndDate = group.suggested_end_date ? new Date(group.suggested_end_date) : undefined;
    const suggestedTargetDate = group.target_date ? new Date(group.target_date) : suggestedEndDate;
    
    // Convert provider name to provider ID
    const providerFromName = providers.find(p => p.name === group.provider_recommendation);
    const suggestedProviderId = providerFromName?.id || 'none';
    
    // Determine group type based on employee statuses
    const groupEmployees = employeeIds.map(id => expiryData.find(emp => emp.employee_id === id)).filter(Boolean);
    const newEmployees = groupEmployees.filter(emp => emp.employee_status === 'new');
    const renewalEmployees = groupEmployees.filter(emp => emp.employee_status !== 'new');
    
    let determinedGroupType: 'new' | 'renewal' | 'mixed' = 'mixed';
    if (newEmployees.length === groupEmployees.length) {
      determinedGroupType = 'new';
    } else if (renewalEmployees.length === groupEmployees.length) {
      determinedGroupType = 'renewal';
    }
    
    // Calculate target completion date based on earliest expiry or end of planning period
    const earliestExpiry = groupEmployees
      .filter(emp => emp.expiry_date)
      .map(emp => new Date(emp.expiry_date!))
      .sort((a, b) => a.getTime() - b.getTime())[0];
    
    const planEndDate = selectedPlanId !== 'all' 
      ? preliminaryPlans.find(p => p.id === selectedPlanId)?.planning_period_end
      : undefined;
    
    const targetCompletionDate = earliestExpiry || (planEndDate ? new Date(planEndDate) : suggestedTargetDate);
    
    // Set up the group data for the dialog
    setCurrentGroupData({
      employeeIds,
      employeeNames: validEmployeeNames,
      suggestedName: group.name,
      suggestedType: determinedGroupType,
      suggestedCertificateId: selectedLicenseId !== 'all' ? selectedLicenseId : undefined,
      suggestedLocation: group.location || '',
      suggestedPriority: determinePriority(group.reasoning || ''),
      suggestedDescription: group.reasoning || `Training group with ${employeeIds.length} employees`,
      suggestedTargetDate: targetCompletionDate,
      suggestedMaxParticipants: employeeIds.length,
      suggestedStartDate: suggestedStartDate,
      suggestedEndDate: suggestedEndDate,
      suggestedEstimatedCost: undefined,
      suggestedProviderRecommendation: suggestedProviderId,
      suggestedSessionsRequired: group.sessions_required || undefined,
      suggestedSchedulingNotes: group.scheduling_notes || `${group.reasoning || ''}\n\nGenerated on ${new Date().toLocaleDateString()}`,
    });
    
    setIsCreateGroupDialogOpen(true);
  };

  // Main group creation function
  const handleCreateGroupFromDialog = async (groupData: any, employeeIds: string[]) => {
    try {
      // Validate that all employee IDs are valid UUIDs
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const invalidIds = employeeIds.filter(id => !uuidRegex.test(id));
      
      if (invalidIds.length > 0) {
        console.error('Invalid employee IDs detected:', invalidIds);
        alert(`Unable to create group: Invalid employee identifiers found. Please try again.`);
        return;
      }
      
      // First, find or create a preliminary plan to contain the group
      let planId = '';
      
      // Look for an existing active plan or create a new one
      const activePlan = preliminaryPlans.find(plan => 
        plan.status === 'draft' || plan.status === 'review'
      );
      
      if (activePlan) {
        planId = activePlan.id;
      } else {
        // Create a new preliminary plan
        const newPlan = await createPreliminaryPlan.mutateAsync({
          name: `Training Plan - ${new Date().toLocaleDateString()}`,
          description: `Preliminary training plan created for ${groupData.name}`,
          planning_period_start: new Date().toISOString().split('T')[0],
          planning_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
          status: 'draft',
          version: 1,
          metadata: {
            created_from: 'employee_grouping_view',
            license_id: selectedLicenseId !== 'all' ? selectedLicenseId : undefined,
          }
        });
        planId = newPlan.id;
      }

      // Create the group
      const newGroup = await createPreliminaryPlanGroup.mutateAsync({
        plan_id: planId,
        name: groupData.name,
        description: groupData.description || '',
        certificate_id: groupData.certificate_id || undefined,
        group_type: groupData.group_type,
        location: groupData.location || '',
        provider_id: groupData.provider_id || undefined,
        priority: groupData.priority,
        max_participants: groupData.max_participants || employeeIds.length,
        target_completion_date: groupData.target_completion_date 
          ? groupData.target_completion_date.toISOString().split('T')[0] 
          : undefined,
        planned_start_date: groupData.planned_start_date
          ? groupData.planned_start_date.toISOString().split('T')[0]
          : undefined,
        planned_end_date: groupData.planned_end_date
          ? groupData.planned_end_date.toISOString().split('T')[0]
          : undefined,
        estimated_cost: groupData.estimated_cost || undefined,
        provider_recommendation: groupData.provider_recommendation || '',
        sessions_required: groupData.sessions_required || undefined,
        notes: groupData.notes || '',
        metadata: {
          created_from: 'employee_grouping_view',
          license_id: selectedLicenseId !== 'all' ? selectedLicenseId : undefined,
        }
      });

      // Add employees to the group
      console.log('🔍 Adding employees to group:', newGroup.id);
      console.log('🔍 Employee IDs to add:', employeeIds);
      console.log('🔍 Available employee data:', expiryData.map(emp => ({ id: emp.employee_id, name: `${emp.first_name} ${emp.last_name}` })));
      
      const employeePromises = employeeIds.map(employeeId => {
        const employee = expiryData.find(emp => emp.employee_id === employeeId);
        console.log(`🔍 Processing employee ${employeeId}:`, employee);
        
        const employeeData = {
          group_id: newGroup.id,
          employee_id: employeeId,
          employee_type: employee?.employee_status === 'new' ? 'new' : 'renewal',
          current_certificate_id: employee?.employee_license_id || null,
          certificate_expiry_date: employee?.expiry_date || null,
          notes: `Added from employee grouping view on ${new Date().toLocaleDateString()}`,
        };
        
        console.log('🔍 Employee data to insert:', employeeData);
        
        return addEmployeeToGroup.mutateAsync(employeeData);
      });

      console.log('🔍 Executing employee promises...');
      const results = await Promise.all(employeePromises);
      console.log('🔍 Employee addition results:', results);

      // Clear selected employees
      setSelectedEmployees(new Set());

      // Show success message
      toast({
        title: "Group Created Successfully",
        description: `Created group "${groupData.name}" with ${employeeIds.length} employees.`,
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['preliminary-plans'] });
      queryClient.invalidateQueries({ queryKey: ['preliminary-plan-groups'] });

    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Error Creating Group",
        description: error instanceof Error ? error.message : "Failed to create group",
        variant: "destructive",
      });
    }
  };

  const handleCreateAllGroups = () => {
    if (!aiPlanningResult?.groups) return;
    
    console.log('Creating all AI-suggested groups:', aiPlanningResult.groups);
    // TODO: Implement bulk group creation
    alert(`Create All Groups\nThis will create ${aiPlanningResult.groups.length} groups with a total of ${aiPlanningResult.groups.reduce((sum: number, group: any) => sum + (group.employees?.length || 0), 0)} employees.`);
  };

  const handleRequestModification = () => {
    // More helpful modification request with examples
    const modificationPrompt = `Please modify the previous grouping suggestion. Examples of changes you can request:

- Change group sizes (e.g., "make smaller groups of 6 people each")
- Combine or split groups (e.g., "merge groups 1 and 2" or "split the large group")
- Adjust timing (e.g., "schedule VCA groups in different months")
- Change department groupings (e.g., "keep night shift workers together")
- Modify priorities (e.g., "prioritize the expired certificates first")
- Add constraints (e.g., "avoid scheduling during summer months")

What changes would you like to make?

Original request: "${planningRequest}"`;
    
    setPlanningRequest(modificationPrompt);
    
    // Scroll to the input area with a slight delay to ensure DOM is updated
    setTimeout(() => {
      const textarea = document.getElementById('planning-request-textarea');
      if (textarea) {
        textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (textarea as HTMLTextAreaElement).focus();
        // Also highlight the textarea briefly to show where it is
        (textarea as HTMLTextAreaElement).select();
      }
    }, 100);
  };

  const handleNaturalLanguagePlanning = async () => {
    if (!planningRequest.trim()) return;
    
    setIsProcessingRequest(true);
    setAiPlanningResult(null); // Clear previous results
    
    try {
      // Check if OpenAI is available
      const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!openaiKey) {
        throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your environment variables.');
      }
      const selectedLicenseName = licenses.find(l => l.id === selectedLicenseId)?.name || 'Unknown';
      const availableEmployees = expiryData.length;
      const departments = Array.from(new Set(expiryData.map(e => e.department || 'Unknown')));
      
      // Get next 12 months of training schedule
      const today = new Date();
      const next12Months = new Date();
      next12Months.setFullYear(today.getFullYear() + 1);
      
      const upcomingTrainings = existingTrainings.filter(training => {
        const trainingDate = new Date(training.date);
        return trainingDate >= today && trainingDate <= next12Months && training.status !== 'cancelled';
      });

      // Group trainings by month for better organization
      const trainingsByMonth = upcomingTrainings.reduce((acc, training) => {
        const date = new Date(training.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        
        if (!acc[monthKey]) {
          acc[monthKey] = { monthName, trainings: [] };
        }
        acc[monthKey].trainings.push(training);
        return acc;
      }, {} as Record<string, { monthName: string; trainings: any[] }>);

      // Create schedule conflicts information organized by month
      const scheduleConflicts = Object.entries(trainingsByMonth).map(([monthKey, monthData]) => {
        const monthTrainings = monthData.trainings.map(training => {
          const date = new Date(training.date).toLocaleDateString();
          return `  ${date}: ${training.title} (${training.participantCount}/${training.maxParticipants} participants)`;
        });
        return `${monthData.monthName}:\n${monthTrainings.join('\n')}`;
      });

      // Also create a summary of busy periods
      const busyPeriods = Object.entries(trainingsByMonth).map(([monthKey, monthData]) => {
        const count = monthData.trainings.length;
        const totalParticipants = monthData.trainings.reduce((sum, t) => sum + t.participantCount, 0);
        return `${monthData.monthName}: ${count} trainings, ${totalParticipants} total participants`;
      });

      // Get provider information with preferences for the selected certificate type
      const currentLicenseName = licenses.find(l => l.id === selectedLicenseId)?.name || 'Unknown';
      
      // Use the proper certificate-specific providers instead of flawed filtering
      const relevantProviders = selectedLicenseId !== 'all' ? certificateProviders : providers;

      // Get provider preferences for this course
      const coursePreferences = providerPreferences[selectedLicenseId] || { providers: [] };
      const preferencesSummary = coursePreferences.providers.length > 0 
        ? coursePreferences.providers.map((pref: any) => 
            `Priority ${pref.priority_rank}: ${pref.provider?.name} - Distance: ${pref.distance_from_hub_km || 'N/A'}km, Quality: ${pref.quality_rating || 'N/A'}/10, Lead time: ${pref.booking_lead_time_days || 14} days`
          ).join('\n')
        : `No provider preferences set. Available providers: ${relevantProviders.map(p => p.name).join(', ')}`;

      // Create enhanced provider constraints summary with cost and priority
      const providerConstraints = relevantProviders.map(provider => {
        // For certificate-specific providers, use all their course offerings for this certificate
        const relevantCourses = provider.course_provider_courses || [];
        
        const preferences = coursePreferences.providers?.find((pref: any) => pref.provider_id === provider.id);
        
        // If no relevant courses found, create a basic provider entry
        if (relevantCourses.length === 0) {
          return [{
            providerName: provider.name,
            maxParticipants: 'Contact provider',
            numberOfSessions: 'Contact provider',
            location: provider.city || 'Contact provider',
            notes: 'General training provider - course details not specified',
            costPerParticipant: 'Contact provider',
            costBreakdown: [],
            canDoMultipleSessions: false,
            priorityRank: preferences?.priority_rank || 99,
            qualityRating: preferences?.quality_rating || 'Not rated',
            distanceFromHub: preferences?.distance_from_hub_km || 'Unknown',
            bookingLeadTime: preferences?.booking_lead_time_days || 14,
            availabilityNotes: preferences?.availability_notes || 'No notes',
            courseTitle: 'General training course'
          }];
        }
        
        return relevantCourses.map((cpc: any) => ({
          providerName: provider.name,
          maxParticipants: cpc.max_participants || 'Contact provider',
          numberOfSessions: cpc.number_of_sessions || 1,
          location: provider.city || provider.default_location || 'Contact provider',
          notes: cpc.notes || 'No special notes',
          costPerParticipant: cpc.price || 'Contact provider',
          costBreakdown: cpc.cost_breakdown || [],
          canDoMultipleSessions: (cpc.number_of_sessions || 1) > 1,
          priorityRank: preferences?.priority_rank || 99,
          qualityRating: preferences?.quality_rating || 'Not rated',
          distanceFromHub: preferences?.distance_from_hub_km || 'Unknown',
          bookingLeadTime: preferences?.booking_lead_time_days || 14,
          availabilityNotes: preferences?.availability_notes || 'No notes',
          courseTitle: cpc.courses?.title || 'Unknown course'
        }));
      }).flat();

      const providerSummary = providerConstraints.length > 0 
        ? providerConstraints.map(p => 
            `${p.providerName} (${p.courseTitle}): Max ${p.maxParticipants} participants, ${p.numberOfSessions || 1} sessions, €${p.costPerParticipant}/person, Location: ${p.location}, Priority: ${p.priorityRank}, Quality: ${p.qualityRating}/10, Distance: ${p.distanceFromHub}km, Lead time: ${p.bookingLeadTime} days, Multi-session: ${p.canDoMultipleSessions ? 'Yes' : 'No'}`
          ).join('\n')
        : `Available providers for ${selectedLicenseName}: ${relevantProviders.map(p => p.name).join(', ') || 'None available'}`;

      // Get employee availability data
      const availabilityConflicts = Object.entries(employeeAvailability).map(([employeeId, data]: [string, any]) => {
        const employee = data.employee;
        const conflicts = data.availabilities.filter((av: any) => av.status === 'active');
        if (conflicts.length === 0) return null;
        
        return `${employee.first_name} ${employee.last_name}: ${conflicts.map((c: any) => 
          `${c.availability_type} (${c.start_date} to ${c.end_date || 'ongoing'}) - ${c.reason || 'No reason specified'}`
        ).join(', ')}`;
      }).filter(Boolean);

      const availabilitySummary = availabilityConflicts.length > 0 
        ? availabilityConflicts.join('\n')
        : 'No active availability conflicts';

      // Get comprehensive employee data for better context
      const employeeProfiles = comprehensiveEmployeeData.slice(0, 15).map((emp: any) => {
        const availability = emp.employee_availability?.find((av: any) => av.status === 'active');
        const learning = emp.employee_learning_profiles?.[0];
        const workArrangement = emp.employee_work_arrangements?.[0];
        
        return `${emp.first_name} ${emp.last_name} (${emp.department || 'Unknown'}):`
          + `\n  Work: ${workArrangement?.work_schedule || 'Standard'} at ${workArrangement?.primary_work_location || 'Main office'}`
          + `\n  Learning: ${learning?.learning_style || 'Unknown'} learner, ${learning?.performance_level || 'standard'} level`
          + `\n  Availability: ${availability ? `${availability.availability_type} until ${availability.end_date || 'ongoing'}` : 'Available'}`
          + `\n  Capacity: ${learning?.training_capacity_per_month || 2} trainings/month`;
      }).join('\n\n');

      // Filter employees based on selected work locations and status
      const filteredEmployees = expiryData.filter(emp => {
        // Filter by work location
        const locationMatch = selectedWorkLocations.length === 0 || selectedWorkLocations.includes(emp.work_location || '');
        
        // Filter by employee status would need additional data - for now we'll include all
        const statusMatch = selectedEmployeeStatus === 'all' || true; // TODO: Add actual status filtering
        
        return locationMatch && statusMatch;
      });

      // Get existing training enrollments to check for duplicates
      const existingEnrollments = existingTrainings.flatMap(training => 
        training.participants?.map((p: any) => ({
          employeeId: p.employee_id,
          trainingId: training.id,
          trainingTitle: training.title,
          trainingDate: training.date,
          status: p.status
        })) || []
      );

      // Get preliminary plan date range for context
      const selectedPlan = preliminaryPlans.find(p => p.id === selectedPlanId);
      const planDateRange = selectedPlan ? 
        `${selectedPlan.planning_period_start} to ${selectedPlan.planning_period_end}` : 
        'No specific plan selected (showing all employees)';

      // Generate suggested weekday dates for AI guidance
      const generateWeekdayDates = (startDate: Date, endDate: Date, count: number = 10) => {
        const dates = [];
        const current = new Date(startDate);
        
        while (dates.length < count && current <= endDate) {
          const dayOfWeek = current.getDay();
          // Skip weekends (0 = Sunday, 6 = Saturday)
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            dates.push(new Date(current).toISOString().split('T')[0]);
          }
          current.setDate(current.getDate() + 1);
        }
        return dates;
      };

      const suggestedWeekdayDates = selectedPlan ? 
        generateWeekdayDates(
          new Date(selectedPlan.planning_period_start), 
          new Date(selectedPlan.planning_period_end)
        ) : 
        generateWeekdayDates(new Date(), new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));

      const prompt = `You are an intelligent training planning assistant. Create employee groups for ${selectedLicenseName} training based on this request: "${planningRequest}"

IMPORTANT: Pay close attention to the specific group size requested in the user's request above. 

Current user request: "${planningRequest}"

PLANNING PERIOD CONTEXT:
- Selected Plan: ${selectedPlan?.name || 'No specific plan'}
- Planning Period: ${planDateRange}
- Only employees needing ${selectedLicenseName} training within this period are included
- Consider optimal renewal timing based on certificate-specific renewal windows

SUGGESTED WEEKDAY DATES (for scheduling reference):
${suggestedWeekdayDates.map(date => `- ${date} (${new Date(date).toLocaleDateString('en-US', { weekday: 'long' })})`).join('\n')}

WEEKEND SCHEDULING POLICY:
- DEFAULT: Schedule training on weekdays only (Monday-Friday)
- WEEKEND EXCEPTION: Only use Saturday/Sunday if user explicitly requests weekend training
- OPTIMAL DAYS: Prefer Tuesday, Wednesday, Thursday for best attendance

CERTIFICATE AND COURSE INFORMATION:
- Certificate: ${selectedLicense?.name || 'Unknown'}
- Category: ${selectedLicense?.category || 'Unknown'}
- Renewal Notice Period: Typically 6 months before expiry (configurable per certificate)
- Optimal Renewal Timing: Schedule training closer to expiry date for maximum validity period
- Grace Period: Usually 3 months after expiry for renewals (varies by certificate type)

COURSES THAT GRANT THIS CERTIFICATE:
${certificateCourses.map(course => 
  `- ${course.title} (${course.duration_hours || 'N/A'} hours, max ${course.max_participants || 'N/A'} participants)`
).join('\n') || 'No courses available for this certificate type'}

EMPLOYEES AVAILABLE FOR GROUPING (${filteredEmployees.length} total after filtering):
${filteredEmployees.slice(0, 25).map(emp => 
  `• ${emp.first_name} ${emp.last_name} (${emp.department || 'Unknown'}, ${emp.work_location || 'Unknown Location'}) - Status: ${emp.employee_status} - Expires in: ${emp.days_until_expiry || 'N/A'} days`
).join('\n')}

WORK LOCATION ANALYSIS:
${selectedWorkLocations.length > 0 ? 
  `Filtered to selected locations: ${selectedWorkLocations.join(', ')}` : 
  'All work locations included'
}

EMPLOYEE WORK LOCATION DISTRIBUTION:
${Object.entries(filteredEmployees.reduce((acc, emp) => {
  const location = emp.work_location || 'Unknown';
  acc[location] = (acc[location] || 0) + 1;
  return acc;
}, {} as Record<string, number>)).map(([location, count]) => 
  `- ${location}: ${count} employees`
).join('\n')}

EXISTING TRAINING ENROLLMENT CHECK:
${existingEnrollments.length > 0 ? 
  `Current enrollments to avoid duplicates:\n${existingEnrollments.slice(0, 20).map(enrollment => 
    `• ${enrollment.employeeId} enrolled in "${enrollment.trainingTitle}" on ${enrollment.trainingDate} (${enrollment.status})`
  ).join('\n')}` : 
  'No existing enrollments found'
}

PROVIDER CONSTRAINTS AND FACTORS:
${providerSummary}

PREFERRED PROVIDERS (by priority ranking):
${preferencesSummary}

CRITICAL PROVIDER SELECTION CRITERIA:
**These are EXTERNAL providers serving multiple companies - their capacity is NOT dedicated to you**

1. **PRIMARY SELECTION FACTORS (in order of importance):**
   - **COST**: Choose the provider with the LOWEST cost per participant (€/person)
   - **PRIORITY RANK**: Lower numbers = higher priority (1 is highest, 99 is lowest)
   - **QUALITY RATING**: Higher ratings are better (scale 1-10)
   - **BOOKING LEAD TIME**: Shorter lead times are better for urgent training
   - **DISTANCE**: Shorter distances reduce travel costs and time

2. **CAPACITY CONSTRAINTS** (not selection criteria):
   - Provider capacity is a CONSTRAINT, not a selection criteria
   - Ensure your group size ≤ provider's max participants
   - Remember: external providers serve multiple companies, so their capacity fills up with other clients
   - Don't choose a provider just because they have "the right capacity" - choose based on cost and quality

3. **SELECTION LOGIC EXAMPLE**:
   - If Provider A: €150/person, Priority 1, Quality 8/10, Max 20 participants
   - If Provider B: €300/person, Priority 2, Quality 9/10, Max 8 participants
   - For a 6-person group: Choose Provider A (cheaper, higher priority) NOT Provider B (closer capacity match)

4. **AVOID THESE MISTAKES**:
   - ❌ Don't choose expensive providers just because they have "perfect" capacity
   - ❌ Don't assume small groups should use providers with small capacity
   - ❌ Don't ignore cost differences in favor of capacity matching
   - ✅ Always prioritize cost-effectiveness and quality over capacity optimization

AVAILABLE COURSES FOR THIS CERTIFICATE:
${certificateCourses.map(course => 
  `- ${course.title} (${course.duration_hours || 'N/A'} hours, max ${course.max_participants || 'N/A'} participants, ${course.sessions_required || 1} sessions)`
).join('\n') || 'No courses available for this certificate type'}

MULTI-SESSION SCHEDULING INSTRUCTIONS:
- CRITICAL: Check each provider's session count in the provider summary above
- For courses requiring multiple sessions, schedule sessions on consecutive weekdays
- Skip weekends automatically (sessions continue on Monday if Friday is reached)
- Allow 1-2 days between sessions for better learning retention
- PREVENT SESSION CONFLICTS: Ensure different groups' sessions don't overlap on the same dates
- Check existing training dates above and avoid scheduling on those dates
- Consecutive day scheduling is acceptable when resources allow - the 1-day gap is not mandatory
- Use session_schedule array to specify exact dates for each session
- Provide both start date (first session) and end date (last session)
- Sessions_required should EXACTLY match the number of sessions shown in the provider summary
- If provider shows "2 sessions", then sessions_required must be 2, not 1
- If provider shows "3 sessions", then sessions_required must be 3, not 1

AVAILABLE PROVIDER NAMES TO USE:
${relevantProviders.map(p => `- ${p.name}`).join('\n') || 'No providers available for this certificate type'}

EMPLOYEE STATUS AND AVAILABILITY:
${filteredEmployees.map(emp => `${emp.first_name} ${emp.last_name}: Work Location: ${emp.work_location || 'Unknown'}, Status: ${selectedEmployeeStatus}, Department: ${emp.department || 'Unknown'}`).join('\n')}

EXISTING TRAININGS WITH AVAILABLE CAPACITY:
${existingTrainings.filter(t => t.participantCount < t.maxParticipants).map(training => {
  const availableSpots = training.maxParticipants - training.participantCount;
  const relevantToCertificate = training.course?.course_certificates?.some((cc: any) => cc.license_id === selectedLicenseId);
  const date = new Date(training.date).toLocaleDateString('en-US', { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
  return `  ${date}: ${training.title} (${availableSpots} spots available) ${relevantToCertificate ? '✓ RELEVANT' : '- Not relevant'}`;
}).join('\n') || 'No existing trainings with available capacity'}

CURRENT SCHEDULE CONFLICTS:
${scheduleConflicts.length > 0 ? scheduleConflicts.slice(0, 3).join('\n\n') : 'No major conflicts in next 12 months'}

EMPLOYEE AVAILABILITY CONFLICTS:
${availabilitySummary}

🚨 CRITICAL: CUSTOM AVAILABILITY CONSTRAINTS FROM USER REQUEST:
${customAvailabilityConstraints.length > 0 ? 
  customAvailabilityConstraints.map(constraint => 
    `❌ ${constraint.employeeName}: ${constraint.constraint} (from: "${constraint.originalText}")`
  ).join('\n') : 
  'No custom availability constraints specified in user request'
}

**MANDATORY SCHEDULING RULES:**
1. **NEVER schedule employees who are explicitly mentioned as unavailable in the user request**
2. **ALWAYS respect date ranges specified for employee availability**
3. **If an employee is mentioned as "on leave" or "unavailable" during specific dates, exclude them from training during those periods**
4. **Double-check each employee assignment against the custom constraints above**
5. **When in doubt about availability, exclude the employee rather than risk scheduling conflicts**

DETAILED EMPLOYEE PROFILES (first 15):
${employeeProfiles}

CERTIFICATE-COURSE-PROVIDER RELATIONSHIP:
The system follows a strict relationship chain:
1. CERTIFICATE (${selectedLicense?.name || 'Unknown'}) is granted by completing specific COURSES
2. COURSES can only be delivered by qualified PROVIDERS who have been certified for that course
3. Each provider may offer the same course with different pricing, capacity, and scheduling options
4. Only providers listed above can deliver training for this certificate - no other providers are qualified

COMPREHENSIVE PLANNING INSTRUCTIONS:

1. EXISTING TRAINING ANALYSIS:
   - Check for employees already enrolled in similar training
   - Identify scheduling conflicts with other planned training
   - Avoid duplicate enrollments for the same certificate type
   - Consider training completion timelines and certificate validity periods

2. CERTIFICATE EXPIRY PRIORITIZATION:
   - CRITICAL: Expired certificates (immediate training required) - ALWAYS SCHEDULE FIRST
   - HIGH: Renewal due within 30 days - SCHEDULE BEFORE OTHER GROUPS
   - MEDIUM: Renewal due within 90 days - SCHEDULE AFTER HIGH PRIORITY
   - LOW: New employees or long-term renewals - SCHEDULE LAST
   
   IMPORTANT GROUP ORDERING: The ORDER of groups in your response must reflect priority - groups with urgent employees first, then less critical groups. However, you CAN mix urgent and new employees within the same group if it maximizes efficiency and there's room in the training.

3. OPTIMAL RENEWAL TIMING STRATEGY:
   - Schedule renewals as close to expiry as possible while staying within the planning period
   - Earlier renewals waste validity time (new certificate starts immediately)
   - Later renewals maximize certificate validity period
   - Consider buffer time for training completion and certificate processing
   - Account for seasonal constraints and employee availability
   - WEEKDAY SCHEDULING: Default to weekdays (Monday-Friday) unless user explicitly requests weekend training
   - OPTIMAL DAYS: Prefer Tuesday-Thursday for better attendance and reduced operational impact

4. PROVIDER OPTIMIZATION:
   - Cost Analysis: Compare provider costs per participant
   - Quality Ratings: Prioritize providers with higher ratings (7-10)
   - Capacity Matching: Match group sizes to provider capabilities
   - Location Logistics: Minimize travel distance from work hubs
   - Booking Lead Times: Account for provider availability and booking requirements
   - Multi-session Capabilities: Consider providers that can handle complex training programs

5. WORK HUB AND LOCATION LOGISTICS:
   - Group employees by work location proximity
   - Consider travel time and costs between work hubs and training locations
   - Optimize for minimal disruption to daily operations
   - Account for regional provider preferences and relationships

6. EMPLOYEE STATUS AND AVAILABILITY:
   - Filter out employees on leave, sick, or unavailable
   - Consider employee status: ${selectedEmployeeStatus}
   - Account for department-specific scheduling constraints
   - Ensure adequate coverage during training periods

7. DUPLICATE PREVENTION:
   - Cross-reference existing training participants
   - Verify certificate validity and expiration dates
   - Prevent scheduling conflicts with other mandatory training
   - Ensure compliance with certification renewal requirements

8. GROUP FORMATION STRATEGY:
   - Optimal group size based on user request or 8-15 participants for cost efficiency
   - **COST-OPTIMIZED GROUPING**: Larger groups are more cost-effective per person
   - **PROVIDER CAPACITY AWARENESS**: Ensure groups don't exceed provider limits, but don't artificially make groups smaller to "match" provider capacity
   - PRIORITY-BASED GROUP ORDERING: Always list groups in priority order - urgent groups first, then less critical groups
   - GROUP COMPOSITION: Prioritize urgent employees (expired/renewal_due) but fill remaining spots with new employees if there's room
   - MIXED GROUPS ALLOWED: You can mix urgent and new employees in the same group if it maximizes efficiency
   - Department clustering for operational continuity (secondary to urgency)
   - Location-based grouping for logistics efficiency (secondary to urgency)
   - CRITICAL: The ORDER of groups in the response must reflect priority - most urgent groups listed first

9. MULTI-SESSION SCHEDULING CONSTRAINTS:
   - WEEKDAY PREFERENCE: Schedule all training sessions on weekdays (Monday-Friday) unless explicitly requested otherwise
   - OPTIMAL DAYS: Prefer Tuesday, Wednesday, Thursday for maximum attendance and minimal operational disruption
   - WEEKEND AVOIDANCE: Only schedule Saturday/Sunday if user specifically requests weekend training
   - SESSION SPACING: For multi-session training, schedule consecutive sessions with 1-2 days between them
   - CONFLICT PREVENTION: Different groups must NOT have overlapping sessions on the same dates
   - DATE CONFLICT CHECKING: Check existing training dates and avoid scheduling on those dates
   - GROUP SPACING: Space different groups at least 1 day apart to prevent resource conflicts
   - DATE RANGES: For multi-session training, provide start and end dates
   - HOLIDAY AWARENESS: Avoid scheduling during common holiday periods

CRITICAL PROVIDER NAMING RULES:
- Use ONLY actual provider/company names from the AVAILABLE PROVIDER NAMES section above
- These providers are PRE-QUALIFIED to deliver courses that grant the ${selectedLicense?.name || 'selected'} certificate
- NEVER use course names like "VCA Basic Safety Course" as provider names
- NEVER use course titles as provider recommendations
- Look for provider names in the format "Company Name B.V." or "Training Organization Name"
- Each provider listed can deliver one or more courses that grant this certificate
- If no specific provider is optimal, choose from the available provider names list based on cost, quality, and location
- REQUIRED: Always select an actual provider name from the available list, never use "Provider Not Specified"

SPECIFIC CONSTRAINTS TO ENFORCE:
- No employee in multiple groups for the same certificate
- Respect provider maximum participant limits
- Consider provider booking lead times
- Account for certificate validity periods
- Ensure training completion before expiry deadlines
- Maintain operational coverage during training periods
- Schedule all training within the planning period: ${planDateRange}
- Optimize renewal timing to maximize certificate validity while respecting expiry deadlines
- AVOID WEEKENDS: Schedule training on weekdays (Monday-Friday) only, unless explicitly requested by the user
- Prefer Tuesday-Thursday for optimal attendance and minimal operational disruption
- PREVENT DATE CONFLICTS: Ensure no two groups have sessions on the same date
- CHECK EXISTING SCHEDULES: Review existing training dates above and avoid those dates
- SPACE GROUPS: Leave at least 1 day between different groups' training sessions

RESPONSE FORMAT (JSON only):
{
  "groups": [
    {
      "name": "Group 1 - [Department/Category]",
      "employees": ["First Last", "First Last"],
      "reasoning": "Brief explanation for this grouping including provider cost, priority, and location considerations",
      "suggested_date": "2025-08-15",
      "suggested_end_date": "2025-08-17",
      "sessions_required": 2,
      "session_schedule": ["2025-08-15", "2025-08-17"],
      "provider_recommendation": "Actual Provider Company Name",
      "priority": "high/medium/low",
      "existing_training_option": "Training ID if adding to existing training",
      "cost_analysis": "Cost per participant and total estimated cost",
      "location_optimization": "Travel distance and work hub considerations",
      "duplicate_check": "Confirmation that no employees are double-booked",
      "renewal_timing_optimization": "Explanation of optimal timing within planning period to maximize certificate validity",
      "conflict_check": "Confirmation that session dates don't conflict with existing trainings or other groups"
    }
  ],
  "explanation": "Overall strategy explanation focusing on comprehensive factor consideration including renewal timing optimization",
  "recommendations": "Key scheduling recommendations with provider selection rationale and renewal timing justification",
  "timeline": "Expected completion timeframe with risk mitigation strategies and renewal timing optimization"
}

IMPORTANT SESSION SCHEDULING RULES:
- ALWAYS check the provider summary above for the exact number of sessions each provider offers
- The "sessions_required" field must match the provider's session count exactly
- If a provider shows "3 sessions" in the summary, use "sessions_required": 3
- Create session_schedule array with exact dates for each session
- Use suggested_end_date only if sessions_required > 1
- CONFLICT PREVENTION: Check existing training dates and ensure no overlapping sessions
- SPACE GROUPS: Schedule different groups on different dates with at least 1 day gap
- VALIDATE DATES: Each group's session dates must not conflict with existing trainings or other groups`;
      
      // Parse custom availability constraints from user request
      const parseAvailabilityConstraints = (request: string) => {
        const constraints = [];
        const lowerRequest = request.toLowerCase();
        
        // Look for specific employee availability mentions
        const employeeNames = expiryData.map(emp => `${emp.first_name} ${emp.last_name}`);
        
        for (const fullName of employeeNames) {
          const firstName = fullName.split(' ')[0].toLowerCase();
          const lastName = fullName.split(' ')[1]?.toLowerCase() || '';
          
          // Check for various availability constraint patterns
          const patterns = [
            // "John Doe will be on leave"
            `${firstName}.*${lastName}.*(?:will be|is|goes).*(?:on leave|unavailable|away|absent)`,
            // "John will be on leave"
            `${firstName}.*(?:will be|is|goes).*(?:on leave|unavailable|away|absent)`,
            // "John Doe on leave"
            `${firstName}.*${lastName}.*(?:on leave|unavailable|away|absent)`,
            // "skip John" or "exclude John"
            `(?:skip|exclude|remove|ignore).*${firstName}`,
            // "John won't be"
            `${firstName}.*(?:won't be|will not be|cannot|can't).*(?:with us|available|here)`
          ];
          
          for (const pattern of patterns) {
            const regex = new RegExp(pattern, 'i');
            const regexMatch = regex.exec(lowerRequest);
            if (regexMatch) {
              // Try to extract date ranges
              const datePatterns = [
                /(?:from|starting|beginning).*?(end of \d{4}|\w+ \d{4}|\d{4}).*?(?:to|until|till|through).*?(end of \w+ \d{4}|\w+ \d{4}|\d{4})/i,
                /(?:during|in|throughout).*?(\d{4}|\w+ \d{4})/i,
                /(end of \d{4}).*?(?:to|until|till).*?(end of \w+ \d{4}|\w+ \d{4}|\d{4})/i,
                /(?:starting|from).*?(end of \d{4}).*?(?:till|until|through).*?(end of \w+ \d{4})/i
              ];
              
              let dateRange = 'dates not specified';
              for (const datePattern of datePatterns) {
                const dateMatch = lowerRequest.match(datePattern);
                if (dateMatch) {
                  dateRange = dateMatch[0];
                  break;
                }
              }
              
              constraints.push({
                employeeName: fullName,
                constraint: `UNAVAILABLE - ${dateRange}`,
                originalText: regexMatch[0] || `${firstName} availability constraint`
              });
              break;
            }
          }
        }
        
        return constraints;
      };
      
      const customAvailabilityConstraints = parseAvailabilityConstraints(planningRequest);

      console.log('🔍 Parsed availability constraints:', customAvailabilityConstraints);
      console.log('🔍 Original request:', planningRequest);

      // Test the parser with the exact user example
      const testRequest = "Create 3 groups for VCA and schedule them as soon as possible. Emma will not be working for us anymore and John Doe will be on leave starting end of 2025 till end of feb 2026.";
      console.log('🧪 Testing availability parser with:', testRequest);
      console.log('🧪 Available employee names:', expiryData.map(emp => `${emp.first_name} ${emp.last_name}`));
      const testConstraints = parseAvailabilityConstraints(testRequest);
      console.log('🧪 Test constraints result:', testConstraints);

      console.log('🤖 Sending planning request to AI service...');
      console.log('📋 Planning prompt length:', prompt.length);
      console.log('📋 Employee count for planning:', expiryData.length);
      console.log('📋 Sample employees:', expiryData.slice(0, 3).map(emp => `${emp.first_name} ${emp.last_name}`));
      console.log('📋 Provider summary:', providerSummary);
      console.log('📋 Preferences summary:', preferencesSummary);
      console.log('📋 Raw provider preferences:', coursePreferences);
      console.log('📋 Relevant providers:', relevantProviders.map(p => p.name));
      console.log('📋 Certificate-specific providers:', certificateProviders.map(p => ({
        name: p.name,
        courses: p.course_provider_courses?.map(cpc => ({
          title: cpc.courses?.title,
          sessions: cpc.number_of_sessions,
          maxParticipants: cpc.max_participants
        }))
      })));
      console.log('📋 Existing trainings count:', existingTrainings.length);
      console.log('📋 Availability summary:', availabilitySummary);
      console.log('📋 Employee profiles preview:', employeeProfiles.substring(0, 200));
      console.log('📋 Full prompt preview:', prompt.substring(0, 1000) + '...');
      console.log('📋 Provider constraints with sessions:', providerConstraints.map(p => ({
        provider: p.providerName,
        course: p.courseTitle,
        sessions: p.numberOfSessions,
        canDoMultiple: p.canDoMultipleSessions
      })));
      
      const response = await aiService.processTextRequest(prompt);
      
      console.log('🤖 AI Response received:', response);
      console.log('🤖 Response content type:', typeof response.content);
      console.log('🤖 Response content preview:', response.content?.substring(0, 200));
      
      if (response && response.content) {
        try {
          // Clean the response content to extract just the JSON
          const content = response.content.trim();
          
          // Try to find JSON in the response
          let jsonMatch = content.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            // Try to find JSON wrapped in code blocks
            jsonMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/) || content.match(/```\s*(\{[\s\S]*?\})\s*```/);
            if (jsonMatch) {
              jsonMatch[0] = jsonMatch[1]; // Use the captured group
            }
          }
          
          if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            console.log('✅ Successfully parsed AI response:', result);
            
            // Ensure required fields exist
            if (!result.groups) result.groups = [];
            if (!result.explanation) result.explanation = "Groups created based on your request.";
            if (!result.recommendations) result.recommendations = "Please review the suggested groups.";
            
            setAiPlanningResult(result);
          } else {
            console.log('📝 No JSON found, treating as explanation');
            // If no JSON, treat the entire response as an explanation
            setAiPlanningResult({
              explanation: response.content,
              groups: [],
              recommendations: "The AI provided guidance but no specific groups. Try rephrasing your request with more specific requirements."
            });
          }
        } catch (e) {
          console.log('📝 JSON parsing failed, using raw response:', e);
          // If JSON parsing fails, show the raw response
          setAiPlanningResult({
            explanation: response.content,
            groups: [],
            recommendations: "The AI provided a response but it wasn't in the expected format. Please try rephrasing your request."
          });
        }
      } else {
        throw new Error('Empty response from AI service');
      }
    } catch (error) {
      console.error('❌ Error processing natural language request:', error);
      setAiPlanningResult({
        explanation: "Sorry, I couldn't process your request. Please try again.",
        groups: [],
        recommendations: "Make sure your request is clear and specific. Error: " + (error instanceof Error ? error.message : 'Unknown error')
      });
    } finally {
      setIsProcessingRequest(false);
    }
  };

  const departmentStats = expiryData.reduce((acc, employee) => {
    const dept = employee.department || 'Unknown';
    if (!acc[dept]) {
      acc[dept] = { total: 0, new: 0, renewal: 0, urgent: 0 };
    }
    acc[dept].total++;
    if (employee.employee_status === 'new') acc[dept].new++;
    if (['renewal_due', 'renewal_approaching'].includes(employee.employee_status)) acc[dept].renewal++;
    if (employee.employee_status === 'expired' || (employee.days_until_expiry && employee.days_until_expiry <= 30)) acc[dept].urgent++;
    return acc;
  }, {} as Record<string, { total: number; new: number; renewal: number; urgent: number }>);

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Employee Grouping Configuration
          </CardTitle>
          {/* Date Range Context */}
          {selectedPlanId && selectedPlanId !== 'all' && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">
                  Planning Period: {preliminaryPlans.find(p => p.id === selectedPlanId)?.planning_period_start} to {preliminaryPlans.find(p => p.id === selectedPlanId)?.planning_period_end}
                </span>
              </div>
              <p className="text-xs text-blue-700 mt-1">
                Showing employees needing {selectedLicense?.name || 'certificate'} training within this period (including optimal renewal windows)
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Preliminary Plan</label>
              <Select value={selectedPlanId} onValueChange={onPlanChange || (() => {})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All employees</SelectItem>
                  {preliminaryPlans
                    .filter(plan => plan.status === 'draft' || plan.status === 'approved' || plan.status === 'review')
                    .map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} ({plan.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Certificate Type</label>
              <Select value={selectedLicenseId} onValueChange={onLicenseChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select certificate" />
                </SelectTrigger>
                <SelectContent>
                  {licenses.map((license) => (
                    <SelectItem key={license.id} value={license.id}>
                      {license.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Employee Status</label>
              <Select value={selectedEmployeeStatus} onValueChange={setSelectedEmployeeStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All employees</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Work Locations</label>
              <div className="border rounded-md p-2 max-h-32 overflow-y-auto">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all-locations"
                      checked={selectedWorkLocations.length === availableWorkLocations.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedWorkLocations(availableWorkLocations);
                        } else {
                          setSelectedWorkLocations([]);
                        }
                      }}
                    />
                    <label htmlFor="select-all-locations" className="text-sm font-medium">
                      All Locations
                    </label>
                  </div>
                  {availableWorkLocations.map((location) => (
                    <div key={location} className="flex items-center space-x-2">
                      <Checkbox
                        id={`location-${location}`}
                        checked={selectedWorkLocations.includes(location)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedWorkLocations([...selectedWorkLocations, location]);
                          } else {
                            setSelectedWorkLocations(selectedWorkLocations.filter(l => l !== location));
                          }
                        }}
                      />
                      <label htmlFor={`location-${location}`} className="text-sm flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {location}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Natural Language Planning */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Natural Language Planning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Describe your training planning needs:</label>
              <Textarea
                id="planning-request-textarea"
                placeholder="e.g., 'Create 3 groups for BHV training, each with 8-10 people from different departments' or 'Group employees for VCA renewal but keep night shift workers together'"
                value={planningRequest}
                onChange={(e) => setPlanningRequest(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
            <Button 
              onClick={handleNaturalLanguagePlanning}
              disabled={!planningRequest.trim() || isProcessingRequest || !selectedLicenseId || trainingsLoading || providersLoading || certificateProvidersLoading || certificateCoursesLoading || preferencesLoading || availabilityLoading}
              className="w-full"
            >
              {isProcessingRequest ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : trainingsLoading || providersLoading || certificateProvidersLoading || certificateCoursesLoading || preferencesLoading || availabilityLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Loading data...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Create AI Plan
                </>
              )}
            </Button>
          </div>

          {/* Loading state */}
          {isProcessingRequest && (
            <div className="mt-6 p-4 border rounded-lg bg-blue-50">
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Processing your request...</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                The AI is analyzing your request and generating group suggestions.
              </p>
            </div>
          )}

          {/* Results */}
          {aiPlanningResult && !isProcessingRequest && (
            <div className="mt-6 p-4 border rounded-lg bg-blue-50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-blue-900">AI Planning Result:</h4>
                {aiPlanningResult.schedule_conflicts_considered && (
                  <div className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                    <Calendar className="h-3 w-3" />
                    {aiPlanningResult.planning_horizon === '12 months' ? '12-month schedule considered' : 'Schedule conflicts considered'}
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <h5 className="font-medium text-sm text-blue-800">Explanation:</h5>
                  <p className="text-sm text-gray-700 bg-white p-3 rounded border">{aiPlanningResult.explanation}</p>
                </div>
                
                {aiPlanningResult.groups && aiPlanningResult.groups.length > 0 && (
                  <div>
                    <h5 className="font-medium text-sm text-blue-800">Suggested Groups:</h5>
                    <div className="space-y-2">
                      {aiPlanningResult.groups.map((group: any, index: number) => (
                        <div key={index} className="p-3 border rounded bg-white shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <h6 className="font-medium text-gray-900">{group.name}</h6>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                {group.employees?.length || 0} employees
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCreateAIGroup(group)}
                                className="h-7 px-2 text-xs"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Create Group
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2 italic">{group.reasoning}</p>
                          
                          {/* Multi-session date information */}
                          {group.suggested_date && (
                            <div className="text-sm mb-2">
                              {group.suggested_end_date && group.suggested_end_date !== group.suggested_date ? (
                                <div>
                                  <span className="font-medium text-gray-700">Training Period: </span>
                                  <span className="text-blue-600 font-medium">
                                    {new Date(group.suggested_date).toLocaleDateString('en-US', { 
                                      weekday: 'short', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })} - {new Date(group.suggested_end_date).toLocaleDateString('en-US', { 
                                      weekday: 'short', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })}
                                  </span>
                                  {group.sessions_required && (
                                    <span className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                      {group.sessions_required} session{group.sessions_required > 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  <span className="font-medium text-gray-700">Training Date: </span>
                                  <span className="text-blue-600 font-medium">
                                    {new Date(group.suggested_date).toLocaleDateString('en-US', { 
                                      weekday: 'long', 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric' 
                                    })}
                                  </span>
                                  <span className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                    Single session
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Session schedule details */}
                          {group.session_schedule && group.session_schedule.length > 1 && (
                            <div className="text-sm mb-2">
                              <span className="font-medium text-gray-700">Session Schedule: </span>
                              <div className="mt-1 space-y-1">
                                {group.session_schedule.map((date: string, index: number) => (
                                  <div key={index} className="text-xs bg-gray-50 px-2 py-1 rounded inline-block mr-2">
                                    Session {index + 1}: {new Date(date).toLocaleDateString('en-US', { 
                                      weekday: 'short', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Provider recommendation */}
                          {group.provider_recommendation && (
                            <div className="text-sm mb-2">
                              <span className="font-medium text-gray-700">Provider: </span>
                              <span className="text-purple-600 font-medium">{group.provider_recommendation}</span>
                            </div>
                          )}
                          
                          {/* Renewal timing optimization */}
                          {group.renewal_timing_optimization && (
                            <div className="text-sm mb-2">
                              <span className="font-medium text-gray-700">Renewal Timing: </span>
                              <span className="text-green-600 italic">{group.renewal_timing_optimization}</span>
                            </div>
                          )}
                          
                          {/* Weekday scheduling confirmation */}
                          {group.weekday_scheduling && (
                            <div className="text-sm mb-2">
                              <span className="font-medium text-gray-700">Scheduling: </span>
                              <span className="text-blue-600 italic">{group.weekday_scheduling}</span>
                            </div>
                          )}
                          
                          
                          {/* Existing training option */}
                          {group.existing_training_option && (
                            <div className="text-sm mb-2">
                              <span className="font-medium text-gray-700">Existing Training: </span>
                              <span className="text-orange-600 font-medium">{group.existing_training_option}</span>
                            </div>
                          )}
                          
                          {/* Fallback for legacy format */}
                          {group.suggested_months && group.suggested_months.length > 0 && (
                            <div className="text-sm mb-2">
                              <span className="font-medium text-gray-700">Suggested Months: </span>
                              <span className="text-purple-600 font-medium">
                                {group.suggested_months.map((month: string) => {
                                  const date = new Date(month + '-01');
                                  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
                                }).join(', ')}
                              </span>
                            </div>
                          )}
                          
                          {group.suggested_dates && group.suggested_dates.length > 0 && (
                            <div className="text-sm mb-2">
                              <span className="font-medium text-gray-700">Suggested Dates: </span>
                              <span className="text-blue-600">
                                {group.suggested_dates.map((date: string) => new Date(date).toLocaleDateString()).join(', ')}
                              </span>
                            </div>
                          )}
                          
                          {group.priority && (
                            <div className="text-sm mb-2">
                              <span className="font-medium text-gray-700">Priority: </span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                group.priority === 'high' ? 'bg-red-100 text-red-800' :
                                group.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {group.priority.toUpperCase()}
                              </span>
                            </div>
                          )}
                          
                          {group.scheduling_notes && (
                            <div className="text-sm mb-2">
                              <span className="font-medium text-gray-700">Scheduling Notes: </span>
                              <span className="text-orange-600 italic">{group.scheduling_notes}</span>
                            </div>
                          )}
                          
                          {group.employees && group.employees.length > 0 && (
                            <div className="text-sm">
                              <span className="font-medium text-gray-700">Employees: </span>
                              <span className="text-gray-600">
                                {group.employees.slice(0, 5).join(', ')}
                                {group.employees.length > 5 && ` +${group.employees.length - 5} more`}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {aiPlanningResult.recommendations && (
                  <div>
                    <h5 className="font-medium text-sm text-blue-800">Recommendations:</h5>
                    <p className="text-sm text-gray-700 bg-white p-3 rounded border">{aiPlanningResult.recommendations}</p>
                  </div>
                )}
                
                {/* Timeline summary */}
                {aiPlanningResult.timeline && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <h5 className="font-medium text-sm text-green-800 mb-2">Planning Summary:</h5>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="font-medium text-green-700">Timeline: </span>
                        <span className="text-green-900">{aiPlanningResult.timeline}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {aiPlanningResult.secondary_questions_answered && (
                  <div>
                    <h5 className="font-medium text-sm text-blue-800">Additional Information:</h5>
                    <p className="text-sm text-gray-700 bg-white p-3 rounded border">{aiPlanningResult.secondary_questions_answered}</p>
                  </div>
                )}
                
                {/* Action buttons */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRequestModification}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Request Modification
                    </Button>
                    {aiPlanningResult.groups && aiPlanningResult.groups.length > 0 && (
                      <Button
                        size="sm"
                        onClick={handleCreateAllGroups}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Create All Groups
                      </Button>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setAiPlanningResult(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Clear Results
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Department Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Department Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(departmentStats).map(([department, stats]) => (
              <div key={department} className="p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{department}</h3>
                  <Badge variant="outline">{stats.total} employees</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-600">New employees:</span>
                    <span className="font-medium">{stats.new}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-orange-600">Renewals needed:</span>
                    <span className="font-medium">{stats.renewal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600">Urgent:</span>
                    <span className="font-medium">{stats.urgent}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>


      {/* Manual Selection */}
      {selectedLicenseId && expiryData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Manual Employee Selection
              </CardTitle>
              <div className="flex items-center gap-2">
                {selectedEmployees.size > 0 && (
                  <>
                    <Badge variant="secondary">
                      {selectedEmployees.size} selected
                    </Badge>
                    <Button onClick={createGroupFromSelection} size="sm">
                      Create Group
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {expiryData.map((employee, index) => (
                <div 
                  key={employee.employee_id || `manual-employee-${employee.first_name}-${employee.last_name}-${index}`}
                  className={`flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-gray-50 ${selectedEmployees.has(employee.employee_id) ? 'bg-blue-50 border-blue-200' : ''}`}
                  onClick={() => toggleEmployeeSelection(employee.employee_id)}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.has(employee.employee_id)}
                      onChange={() => toggleEmployeeSelection(employee.employee_id)}
                      className="rounded"
                    />
                    <div>
                      <div className="font-medium">
                        {employee.first_name} {employee.last_name}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <Building2 className="h-3 w-3" />
                        {employee.department || 'Unknown'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(employee.employee_status, employee.days_until_expiry)}
                    <span className="text-sm text-gray-500">
                      {employee.days_until_expiry ? `${employee.days_until_expiry}d` : 'New'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Group Dialog */}
      <CreateGroupDialog
        open={isCreateGroupDialogOpen}
        onOpenChange={setIsCreateGroupDialogOpen}
        onCreateGroup={handleCreateGroupFromDialog}
        employeeIds={currentGroupData.employeeIds}
        employeeNames={currentGroupData.employeeNames}
        suggestedName={currentGroupData.suggestedName}
        suggestedType={currentGroupData.suggestedType}
        suggestedCertificateId={currentGroupData.suggestedCertificateId}
        suggestedLocation={currentGroupData.suggestedLocation}
        suggestedPriority={currentGroupData.suggestedPriority}
        suggestedDescription={currentGroupData.suggestedDescription}
        suggestedTargetDate={currentGroupData.suggestedTargetDate}
        suggestedMaxParticipants={currentGroupData.suggestedMaxParticipants}
        suggestedStartDate={currentGroupData.suggestedStartDate}
        suggestedEndDate={currentGroupData.suggestedEndDate}
        suggestedEstimatedCost={currentGroupData.suggestedEstimatedCost}
        suggestedProviderRecommendation={currentGroupData.suggestedProviderRecommendation}
        suggestedSessionsRequired={currentGroupData.suggestedSessionsRequired}
        suggestedSchedulingNotes={currentGroupData.suggestedSchedulingNotes}
      />
    </div>
  );
}