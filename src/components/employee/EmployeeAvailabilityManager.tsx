import { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  MapPin,
  BookOpen,
  Briefcase,
  User,
  Filter
} from 'lucide-react';
import { 
  useAllEmployeeAvailability, 
  useEmployeeLearningProfile, 
  useEmployeeWorkArrangement,
  useUpsertEmployeeAvailability,
  useDeleteEmployeeAvailability,
  useUpsertEmployeeLearningProfile,
  useUpsertEmployeeWorkArrangement
} from '@/hooks/useEmployeeAvailability';
import { useEmployees } from '@/hooks/useEmployees';
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { toast } from 'sonner';

interface EmployeeAvailabilityManagerProps {
  selectedEmployeeId?: string;
  onEmployeeSelect?: (employeeId: string) => void;
  className?: string;
}

export function EmployeeAvailabilityManager({
  selectedEmployeeId,
  onEmployeeSelect,
  className = ''
}: EmployeeAvailabilityManagerProps) {
  const [activeTab, setActiveTab] = useState<'availability' | 'learning' | 'work'>('availability');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [filters, setFilters] = useState({
    employee_id: selectedEmployeeId || '',
    availability_type: '',
    status: '',
    impact_level: '',
    date_range: 'all'
  });

  // Data hooks
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const { data: availability = [], isLoading: availabilityLoading } = useAllEmployeeAvailability(filters);
  const { data: learningProfile } = useEmployeeLearningProfile(selectedEmployeeId);
  const { data: workArrangement } = useEmployeeWorkArrangement(selectedEmployeeId);

  // Mutation hooks
  const upsertAvailability = useUpsertEmployeeAvailability();
  const deleteAvailability = useDeleteEmployeeAvailability();
  const upsertLearningProfile = useUpsertEmployeeLearningProfile();
  const upsertWorkArrangement = useUpsertEmployeeWorkArrangement();

  // Filter availability by date range
  const filteredAvailability = useMemo(() => {
    if (filters.date_range === 'all') return availability;
    
    const now = new Date();
    const startDate = startOfDay(now);
    let endDate = endOfDay(now);
    
    switch (filters.date_range) {
      case 'current':
        return availability.filter(item => 
          item.start_date && item.end_date &&
          isAfter(parseISO(item.end_date), startDate) &&
          isBefore(parseISO(item.start_date), endDate)
        );
      case 'future':
        return availability.filter(item => 
          item.start_date && isAfter(parseISO(item.start_date), startDate)
        );
      case 'past':
        return availability.filter(item => 
          item.end_date && isBefore(parseISO(item.end_date), startDate)
        );
      default:
        return availability;
    }
  }, [availability, filters.date_range]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800 border-red-200';
      case 'planned': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'leave': return <Calendar className="h-4 w-4" />;
      case 'risk': return <AlertTriangle className="h-4 w-4" />;
      case 'restriction': return <XCircle className="h-4 w-4" />;
      case 'schedule': return <Clock className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getImpactColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

  if (employeesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Employee Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Employee Availability Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee-select">Select Employee</Label>
              <Select 
                value={selectedEmployeeId || ''} 
                onValueChange={(value) => {
                  setFilters(prev => ({ ...prev, employee_id: value }));
                  onEmployeeSelect?.(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an employee to manage availability" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.first_name} {employee.last_name} - {employee.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select 
                  value={filters.availability_type} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, availability_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    <SelectItem value="leave">Leave</SelectItem>
                    <SelectItem value="risk">Risk</SelectItem>
                    <SelectItem value="restriction">Restriction</SelectItem>
                    <SelectItem value="schedule">Schedule</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={filters.status} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Impact</Label>
                <Select 
                  value={filters.impact_level} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, impact_level: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All levels</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select 
                  value={filters.date_range} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, date_range: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All dates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All dates</SelectItem>
                    <SelectItem value="current">Current</SelectItem>
                    <SelectItem value="future">Future</SelectItem>
                    <SelectItem value="past">Past</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      {selectedEmployeeId && (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="availability" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Availability
            </TabsTrigger>
            <TabsTrigger value="learning" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Learning Profile
            </TabsTrigger>
            <TabsTrigger value="work" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Work Arrangement
            </TabsTrigger>
          </TabsList>

          {/* Availability Tab */}
          <TabsContent value="availability" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Availability Records
                    {selectedEmployee && (
                      <span className="text-sm font-normal text-gray-600">
                        - {selectedEmployee.first_name} {selectedEmployee.last_name}
                      </span>
                    )}
                  </CardTitle>
                  <Button 
                    onClick={() => setShowAddDialog(true)}
                    disabled={!selectedEmployeeId}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Availability
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {availabilityLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : filteredAvailability.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No availability records found.</p>
                    <p className="text-sm">Add availability records to track employee schedules and restrictions.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAvailability.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-gray-50 rounded-lg">
                              {getTypeIcon(item.availability_type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{item.title}</h3>
                                <Badge className={getStatusColor(item.status)}>
                                  {item.status}
                                </Badge>
                                <Badge variant="outline" className={getImpactColor(item.impact_level)}>
                                  {item.impact_level} impact
                                </Badge>
                              </div>
                              
                              <div className="text-sm text-gray-600 space-y-1">
                                <div className="flex items-center gap-4">
                                  <span>
                                    <strong>Type:</strong> {item.availability_type}
                                  </span>
                                  <span>
                                    <strong>Dates:</strong> {format(parseISO(item.start_date), 'MMM d, yyyy')} - {format(parseISO(item.end_date), 'MMM d, yyyy')}
                                  </span>
                                </div>
                                
                                {item.description && (
                                  <p><strong>Description:</strong> {item.description}</p>
                                )}
                                
                                {item.recurring_pattern && (
                                  <p><strong>Recurring:</strong> {item.recurring_pattern}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingItem(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this availability record?')) {
                                  deleteAvailability.mutate(item.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Learning Profile Tab */}
          <TabsContent value="learning" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Learning Profile
                  {selectedEmployee && (
                    <span className="text-sm font-normal text-gray-600">
                      - {selectedEmployee.first_name} {selectedEmployee.last_name}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LearningProfileForm 
                  learningProfile={learningProfile}
                  onSave={(data) => {
                    upsertLearningProfile.mutate({
                      ...data,
                      employee_id: selectedEmployeeId!
                    });
                  }}
                  isLoading={upsertLearningProfile.isPending}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Work Arrangement Tab */}
          <TabsContent value="work" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Work Arrangement
                  {selectedEmployee && (
                    <span className="text-sm font-normal text-gray-600">
                      - {selectedEmployee.first_name} {selectedEmployee.last_name}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WorkArrangementForm 
                  workArrangement={workArrangement}
                  onSave={(data) => {
                    upsertWorkArrangement.mutate({
                      ...data,
                      employee_id: selectedEmployeeId!
                    });
                  }}
                  isLoading={upsertWorkArrangement.isPending}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Add/Edit Availability Dialog */}
      {(showAddDialog || editingItem) && (
        <AvailabilityDialog 
          availability={editingItem}
          employeeId={selectedEmployeeId!}
          onSave={(data) => {
            upsertAvailability.mutate(data, {
              onSuccess: () => {
                setShowAddDialog(false);
                setEditingItem(null);
                toast.success('Availability record saved successfully');
              }
            });
          }}
          onCancel={() => {
            setShowAddDialog(false);
            setEditingItem(null);
          }}
          isLoading={upsertAvailability.isPending}
        />
      )}
    </div>
  );
}

// Learning Profile Form Component
function LearningProfileForm({ learningProfile, onSave, isLoading }: any) {
  const [formData, setFormData] = useState({
    preferred_learning_style: learningProfile?.preferred_learning_style || 'mixed',
    training_capacity_per_month: learningProfile?.training_capacity_per_month || 2,
    preferred_training_duration: learningProfile?.preferred_training_duration || 'half-day',
    preferred_group_size: learningProfile?.preferred_group_size || 'small',
    learning_pace: learningProfile?.learning_pace || 'medium',
    special_requirements: learningProfile?.special_requirements || '',
    certification_priorities: learningProfile?.certification_priorities || [],
    notes: learningProfile?.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Preferred Learning Style</Label>
          <Select 
            value={formData.preferred_learning_style} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, preferred_learning_style: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="visual">Visual</SelectItem>
              <SelectItem value="auditory">Auditory</SelectItem>
              <SelectItem value="kinesthetic">Kinesthetic</SelectItem>
              <SelectItem value="reading">Reading/Writing</SelectItem>
              <SelectItem value="mixed">Mixed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Training Capacity per Month</Label>
          <Input
            type="number"
            min="1"
            max="10"
            value={formData.training_capacity_per_month}
            onChange={(e) => setFormData(prev => ({ ...prev, training_capacity_per_month: parseInt(e.target.value) }))}
          />
        </div>

        <div className="space-y-2">
          <Label>Preferred Training Duration</Label>
          <Select 
            value={formData.preferred_training_duration} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, preferred_training_duration: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="half-day">Half Day</SelectItem>
              <SelectItem value="full-day">Full Day</SelectItem>
              <SelectItem value="multi-day">Multi Day</SelectItem>
              <SelectItem value="flexible">Flexible</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Preferred Group Size</Label>
          <Select 
            value={formData.preferred_group_size} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, preferred_group_size: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="small">Small (2-8)</SelectItem>
              <SelectItem value="medium">Medium (9-15)</SelectItem>
              <SelectItem value="large">Large (16+)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Learning Pace</Label>
          <Select 
            value={formData.learning_pace} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, learning_pace: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="slow">Slow</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="fast">Fast</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Special Requirements</Label>
        <Textarea
          value={formData.special_requirements}
          onChange={(e) => setFormData(prev => ({ ...prev, special_requirements: e.target.value }))}
          placeholder="Any special learning requirements or accommodations..."
        />
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Additional notes about learning preferences..."
        />
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Learning Profile'}
      </Button>
    </form>
  );
}

// Work Arrangement Form Component
function WorkArrangementForm({ workArrangement, onSave, isLoading }: any) {
  const [formData, setFormData] = useState({
    work_schedule: workArrangement?.work_schedule || 'full-time',
    work_location: workArrangement?.work_location || 'office',
    contract_type: workArrangement?.contract_type || 'permanent',
    weekly_hours: workArrangement?.weekly_hours || 40,
    start_time: workArrangement?.start_time || '09:00',
    end_time: workArrangement?.end_time || '17:00',
    lunch_break_duration: workArrangement?.lunch_break_duration || 60,
    flexible_hours: workArrangement?.flexible_hours || false,
    remote_work_eligible: workArrangement?.remote_work_eligible || false,
    travel_required: workArrangement?.travel_required || false,
    overtime_eligible: workArrangement?.overtime_eligible || true,
    preferred_training_days: workArrangement?.preferred_training_days || [],
    blackout_periods: workArrangement?.blackout_periods || [],
    notes: workArrangement?.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Work Schedule</Label>
          <Select 
            value={formData.work_schedule} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, work_schedule: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full-time">Full Time</SelectItem>
              <SelectItem value="part-time">Part Time</SelectItem>
              <SelectItem value="night-shift">Night Shift</SelectItem>
              <SelectItem value="flexible">Flexible</SelectItem>
              <SelectItem value="remote">Remote</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Work Location</Label>
          <Input
            value={formData.work_location}
            onChange={(e) => setFormData(prev => ({ ...prev, work_location: e.target.value }))}
            placeholder="Primary work location"
          />
        </div>

        <div className="space-y-2">
          <Label>Contract Type</Label>
          <Select 
            value={formData.contract_type} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, contract_type: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="permanent">Permanent</SelectItem>
              <SelectItem value="temporary">Temporary</SelectItem>
              <SelectItem value="contractor">Contractor</SelectItem>
              <SelectItem value="intern">Intern</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Weekly Hours</Label>
          <Input
            type="number"
            min="1"
            max="60"
            value={formData.weekly_hours}
            onChange={(e) => setFormData(prev => ({ ...prev, weekly_hours: parseInt(e.target.value) }))}
          />
        </div>

        <div className="space-y-2">
          <Label>Start Time</Label>
          <Input
            type="time"
            value={formData.start_time}
            onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label>End Time</Label>
          <Input
            type="time"
            value={formData.end_time}
            onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label>Lunch Break Duration (minutes)</Label>
          <Input
            type="number"
            min="0"
            max="120"
            value={formData.lunch_break_duration}
            onChange={(e) => setFormData(prev => ({ ...prev, lunch_break_duration: parseInt(e.target.value) }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="flexible-hours"
            checked={formData.flexible_hours}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, flexible_hours: checked }))}
          />
          <Label htmlFor="flexible-hours">Flexible Hours</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="remote-work"
            checked={formData.remote_work_eligible}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, remote_work_eligible: checked }))}
          />
          <Label htmlFor="remote-work">Remote Work Eligible</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="travel-required"
            checked={formData.travel_required}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, travel_required: checked }))}
          />
          <Label htmlFor="travel-required">Travel Required</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="overtime-eligible"
            checked={formData.overtime_eligible}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, overtime_eligible: checked }))}
          />
          <Label htmlFor="overtime-eligible">Overtime Eligible</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Additional notes about work arrangements..."
        />
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Work Arrangement'}
      </Button>
    </form>
  );
}

// Availability Dialog Component
function AvailabilityDialog({ availability, employeeId, onSave, onCancel, isLoading }: any) {
  const [formData, setFormData] = useState({
    employee_id: employeeId,
    availability_type: availability?.availability_type || 'leave',
    title: availability?.title || '',
    description: availability?.description || '',
    start_date: availability?.start_date || '',
    end_date: availability?.end_date || '',
    start_time: availability?.start_time || '',
    end_time: availability?.end_time || '',
    status: availability?.status || 'planned',
    impact_level: availability?.impact_level || 'medium',
    recurring_pattern: availability?.recurring_pattern || '',
    all_day: availability?.all_day || false,
    notes: availability?.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card className="fixed inset-0 z-50 bg-white m-4 overflow-auto">
      <CardHeader>
        <CardTitle>
          {availability ? 'Edit Availability' : 'Add Availability'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select 
                value={formData.availability_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, availability_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leave">Leave</SelectItem>
                  <SelectItem value="risk">Risk</SelectItem>
                  <SelectItem value="restriction">Restriction</SelectItem>
                  <SelectItem value="schedule">Schedule</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Brief title for this availability record"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="all-day"
              checked={formData.all_day}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, all_day: checked }))}
            />
            <Label htmlFor="all-day">All Day</Label>
          </div>

          {!formData.all_day && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Impact Level</Label>
            <Select 
              value={formData.impact_level} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, impact_level: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Recurring Pattern</Label>
            <Input
              value={formData.recurring_pattern}
              onChange={(e) => setFormData(prev => ({ ...prev, recurring_pattern: e.target.value }))}
              placeholder="e.g., 'Every Monday', 'Weekly', 'Monthly'"
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex items-center gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}