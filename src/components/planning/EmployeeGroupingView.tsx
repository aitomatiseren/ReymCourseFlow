import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Send
} from "lucide-react";
import { CertificateExpiryAnalysis, useEmployeeGroupingSuggestions } from "@/hooks/usePreliminaryPlanning";
import { useTrainings } from "@/hooks/useTrainings";
import { useProviders } from "@/hooks/useProviders";
import { AIService } from "@/services/ai";

interface EmployeeGroupingViewProps {
  selectedLicenseId: string;
  expiryData: CertificateExpiryAnalysis[];
  licenses: Array<{ id: string; name: string; category?: string }>;
  onLicenseChange: (licenseId: string) => void;
}

export function EmployeeGroupingView({ 
  selectedLicenseId, 
  expiryData, 
  licenses, 
  onLicenseChange 
}: EmployeeGroupingViewProps) {
  const queryClient = useQueryClient();
  const [maxGroupSize, setMaxGroupSize] = useState(15);
  const [timeWindowDays, setTimeWindowDays] = useState(90);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [planningRequest, setPlanningRequest] = useState('');
  const [aiPlanningResult, setAiPlanningResult] = useState<any>(null);
  const [isProcessingRequest, setIsProcessingRequest] = useState(false);
  
  const aiService = AIService.getInstance();

  const { data: groupingSuggestions = [], isLoading: suggestionsLoading } = useEmployeeGroupingSuggestions(
    selectedLicenseId !== 'all' ? selectedLicenseId : '',
    maxGroupSize,
    timeWindowDays
  );

  const { data: existingTrainings = [], isLoading: trainingsLoading } = useTrainings();
  const { data: providers = [], isLoading: providersLoading } = useProviders();

  const selectedLicense = licenses.find(license => license.id === selectedLicenseId);

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
    
    // Here you would implement the actual group creation logic
    console.log('Creating group with employees:', Array.from(selectedEmployees));
    setSelectedEmployees(new Set());
  };

  const handlePreviewGroup = (suggestion: any) => {
    console.log('Previewing group:', suggestion);
    // TODO: Implement group preview dialog
    alert(`Preview group: ${suggestion.name}\nEmployees: ${suggestion.employees.length}\nDepartment: ${suggestion.department}`);
  };

  const handleCreateGroup = (suggestion: any) => {
    console.log('Creating group from suggestion:', suggestion);
    // TODO: Implement group creation dialog
    alert(`Create group: ${suggestion.name}\nThis will create a preliminary plan group with ${suggestion.employees.length} employees.`);
  };

  const handleCreateAIGroup = (group: any) => {
    console.log('Creating AI-suggested group:', group);
    // TODO: Implement actual group creation logic
    alert(`Create AI Group: ${group.name}\nEmployees: ${group.employees?.join(', ')}\nReasoning: ${group.reasoning}`);
  };

  const handleCreateAllGroups = () => {
    if (!aiPlanningResult?.groups) return;
    
    console.log('Creating all AI-suggested groups:', aiPlanningResult.groups);
    // TODO: Implement bulk group creation
    alert(`Create All Groups\nThis will create ${aiPlanningResult.groups.length} groups with a total of ${aiPlanningResult.groups.reduce((sum: number, group: any) => sum + (group.employees?.length || 0), 0)} employees.`);
  };

  const handleRequestModification = () => {
    // Pre-populate the textarea with a modification request
    const modificationPrompt = `Please modify the previous grouping suggestion. Consider these changes:\n\n- [Describe what you'd like to change]\n- [Any specific requirements]\n- [Preferences for group composition]\n\nOriginal request: "${planningRequest}"`;
    setPlanningRequest(modificationPrompt);
    
    // Scroll to the input area
    const textarea = document.querySelector('textarea[placeholder*="Describe your training planning needs"]');
    if (textarea) {
      textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (textarea as HTMLTextAreaElement).focus();
    }
  };

  const handleNaturalLanguagePlanning = async () => {
    if (!planningRequest.trim()) return;
    
    setIsProcessingRequest(true);
    setAiPlanningResult(null); // Clear previous results
    
    try {
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

      // Get provider information for the selected certificate type
      const selectedLicenseName = licenses.find(l => l.id === selectedLicenseId)?.name || 'Unknown';
      const relevantProviders = providers.filter(provider => 
        provider.course_provider_courses?.some((cpc: any) => 
          cpc.courses?.title?.toLowerCase().includes(selectedLicenseName.toLowerCase()) ||
          cpc.course_id === selectedLicenseId
        )
      );

      // Create provider constraints summary
      const providerConstraints = relevantProviders.map(provider => {
        const relevantCourses = provider.course_provider_courses?.filter((cpc: any) => 
          cpc.courses?.title?.toLowerCase().includes(selectedLicenseName.toLowerCase()) ||
          cpc.course_id === selectedLicenseId
        ) || [];
        
        return relevantCourses.map((cpc: any) => ({
          providerName: provider.name,
          maxParticipants: cpc.max_participants || 'Not specified',
          durationHours: cpc.duration_hours || 'Not specified',
          location: cpc.location || provider.city || 'Not specified',
          notes: cpc.notes || 'No special notes'
        }));
      }).flat();

      const providerSummary = providerConstraints.length > 0 
        ? providerConstraints.map(p => 
            `${p.providerName}: Max ${p.maxParticipants} participants, ${p.durationHours}h sessions, Location: ${p.location}`
          ).join('\n')
        : 'No provider constraints available for this certificate type';

      const prompt = `You are a training planning assistant for long-term preliminary planning. Help create employee groups based on this request:

REQUEST: "${planningRequest}"

CONTEXT:
- Certificate Type: ${selectedLicenseName}
- Available Employees: ${availableEmployees}
- Departments: ${departments.join(', ')}
- Current Max Group Size: ${maxGroupSize}
- Time Window: ${timeWindowDays} days

PROVIDER CONSTRAINTS FOR ${selectedLicenseName}:
${providerSummary}

EXISTING TRAINING SCHEDULE (Next 12 months):
${scheduleConflicts.length > 0 ? scheduleConflicts.join('\n\n') : 'No scheduled trainings in the next 12 months'}

TRAINING LOAD SUMMARY:
${busyPeriods.length > 0 ? busyPeriods.join('\n') : 'No training load data available'}

LONG-TERM SCHEDULING CONSIDERATIONS:
- This is preliminary planning for the next 12 months
- Distribute training load evenly across months to avoid overwhelming periods
- Consider seasonal business patterns and holiday periods
- Balance departmental training needs throughout the year
- Identify optimal months with lighter training loads
- Group employees strategically to maximize efficiency
- Consider certification expiry dates and renewal deadlines
- Plan for both new employee onboarding and renewal cycles

EMPLOYEE DATA:
${expiryData.slice(0, 20).map(emp => 
  `${emp.first_name} ${emp.last_name} - ${emp.department || 'Unknown'} - ${emp.employee_status} - ${emp.days_until_expiry || 'N/A'} days`
).join('\n')}

Please provide a JSON response with:
{
  "groups": [
    {
      "name": "Group name",
      "employees": ["employee names"],
      "reasoning": "Why this grouping makes sense for long-term planning",
      "suggested_months": ["2025-08", "2025-09"],
      "suggested_dates": ["YYYY-MM-DD", "YYYY-MM-DD"],
      "scheduling_notes": "Notes about long-term scheduling optimization",
      "priority": "high|medium|low"
    }
  ],
  "explanation": "Overall explanation of the 12-month grouping strategy",
  "recommendations": "Long-term scheduling recommendations and optimization suggestions",
  "schedule_conflicts_considered": true,
  "planning_horizon": "12 months"
}`;

      console.log('🤖 Sending planning request to AI service...');
      const response = await aiService.processMessage(
        { 
          message: prompt,
          conversationHistory: []
        },
        { currentPage: '/preliminary-planning' }
      );
      
      console.log('🤖 AI Response received:', response);
      
      if (response && response.content) {
        try {
          // Try to extract JSON from response content
          const jsonMatch = response.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            console.log('✅ Successfully parsed AI response:', result);
            setAiPlanningResult(result);
          } else {
            throw new Error('No JSON found in response');
          }
        } catch (e) {
          console.log('📝 JSON parsing failed, using raw response');
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
            Intelligent Employee Grouping
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <label className="text-sm font-medium">Max Group Size</label>
              <Input
                type="number"
                min="5"
                max="30"
                value={maxGroupSize}
                onChange={(e) => setMaxGroupSize(parseInt(e.target.value) || 15)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Time Window (days)</label>
              <Input
                type="number"
                min="30"
                max="365"
                value={timeWindowDays}
                onChange={(e) => setTimeWindowDays(parseInt(e.target.value) || 90)}
              />
            </div>

            <div className="flex items-end">
              <Button 
                className="w-full"
                onClick={() => {
                  if (selectedLicenseId && selectedLicenseId !== 'all') {
                    queryClient.invalidateQueries({ 
                      queryKey: ['employee-grouping-suggestions', selectedLicenseId, maxGroupSize, timeWindowDays] 
                    });
                  }
                }}
                disabled={suggestionsLoading || !selectedLicenseId || selectedLicenseId === 'all'}
              >
                {suggestionsLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Suggestions
                  </>
                )}
              </Button>
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
                placeholder="e.g., 'Create 3 groups for BHV training, each with 8-10 people from different departments' or 'Group employees for VCA renewal but keep night shift workers together'"
                value={planningRequest}
                onChange={(e) => setPlanningRequest(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
            <Button 
              onClick={handleNaturalLanguagePlanning}
              disabled={!planningRequest.trim() || isProcessingRequest || !selectedLicenseId || trainingsLoading || providersLoading}
              className="w-full"
            >
              {isProcessingRequest ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : trainingsLoading || providersLoading ? (
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
                          
                          {/* Long-term scheduling information */}
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

      {/* AI Suggestions */}
      {selectedLicenseId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI-Generated Group Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {suggestionsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p>Analyzing employee data and generating optimal groupings...</p>
              </div>
            ) : selectedLicenseId === 'all' ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Select a specific certificate type</p>
                <p className="text-sm">Choose a certificate type to see intelligent grouping suggestions</p>
              </div>
            ) : groupingSuggestions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No grouping suggestions available</p>
                <p className="text-sm">No employees found with expiring {selectedLicense?.name || 'certificates'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {groupingSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{suggestion.name}</h3>
                        <Badge variant="default" className="bg-blue-100 text-blue-800">
                          {selectedLicense?.name || 'Certificate'}
                        </Badge>
                        <Badge variant="secondary">
                          Priority: {suggestion.priority}
                        </Badge>
                        <Badge variant="outline">
                          {suggestion.employees.length} employees
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handlePreviewGroup(suggestion)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                        <Button size="sm" onClick={() => handleCreateGroup(suggestion)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Group
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building2 className="h-4 w-4" />
                        {suggestion.department}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        Avg: {suggestion.averageDaysUntilExpiry} days until expiry
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        Mixed group types
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Employees in this group:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {suggestion.employees.slice(0, 8).map((employee, index) => (
                          <div key={employee.employee_id || `temp-employee-${employee.first_name}-${employee.last_name}-${index}`} className="flex items-center justify-between p-2 border rounded text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {employee.first_name} {employee.last_name}
                              </span>
                              {getStatusBadge(employee.employee_status, employee.days_until_expiry)}
                            </div>
                            <span className="text-gray-500">
                              {employee.days_until_expiry ? `${employee.days_until_expiry}d` : 'New'}
                            </span>
                          </div>
                        ))}
                        {suggestion.employees.length > 8 && (
                          <div className="p-2 text-center text-gray-500 text-sm">
                            +{suggestion.employees.length - 8} more employees
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
    </div>
  );
}