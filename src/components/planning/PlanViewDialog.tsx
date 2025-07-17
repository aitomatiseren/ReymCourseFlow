import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Users, 
  FileText, 
  CheckCircle, 
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  Clock
} from "lucide-react";
import { PreliminaryPlan, usePreliminaryPlanGroups, usePreliminaryPlanTrainings, usePreliminaryPlanningMutations } from "@/hooks/usePreliminaryPlanning";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface PlanViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: PreliminaryPlan | null;
  onEdit?: (plan: PreliminaryPlan) => void;
  onDelete?: (plan: PreliminaryPlan) => void;
  onConvert?: (plan: PreliminaryPlan) => void;
}

export function PlanViewDialog({ 
  open, 
  onOpenChange, 
  plan, 
  onEdit, 
  onDelete, 
  onConvert 
}: PlanViewDialogProps) {
  // Fetch groups and trainings for this plan
  const { data: groups = [], isLoading: groupsLoading } = usePreliminaryPlanGroups(plan?.id || '');
  const { data: trainings = [], isLoading: trainingsLoading } = usePreliminaryPlanTrainings(plan?.id || '');
  const { deletePreliminaryPlanGroup } = usePreliminaryPlanningMutations();
  const { toast } = useToast();

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (window.confirm(`Are you sure you want to delete the group "${groupName}"? This action cannot be undone.`)) {
      try {
        await deletePreliminaryPlanGroup.mutateAsync(groupId);
        toast({
          title: "Group deleted",
          description: `Group "${groupName}" has been successfully deleted.`,
        });
      } catch (error) {
        console.error('Error deleting group:', error);
        toast({
          title: "Error",
          description: "Failed to delete the group. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  if (!plan) return null;

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: { variant: "outline" as const, icon: FileText, color: "text-gray-600", bg: "bg-gray-100" },
      review: { variant: "secondary" as const, icon: Eye, color: "text-blue-600", bg: "bg-blue-100" },
      approved: { variant: "secondary" as const, icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
      finalized: { variant: "default" as const, icon: CheckCircle, color: "text-green-800", bg: "bg-green-200" },
      archived: { variant: "outline" as const, icon: Trash2, color: "text-gray-400", bg: "bg-gray-50" }
    };

    const config = variants[status as keyof typeof variants] || variants.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={`flex items-center gap-1 ${config.color} ${config.bg}`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Plan is being created and can be edited';
      case 'review':
        return 'Plan is under review by management';
      case 'approved':
        return 'Plan has been approved and can be converted to definitive planning';
      case 'finalized':
        return 'Plan has been converted to definitive training schedules';
      case 'archived':
        return 'Plan has been archived and is no longer active';
      default:
        return 'Unknown status';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-2xl">{plan.name}</DialogTitle>
              {getStatusBadge(plan.status)}
              <span className="text-sm text-gray-500">v{plan.version}</span>
            </div>
            <div className="flex items-center gap-2">
              {plan.status === 'draft' && onEdit && (
                <Button variant="outline" size="sm" onClick={() => onEdit(plan)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {plan.status === 'approved' && onConvert && (
                <Button variant="default" size="sm" onClick={() => onConvert(plan)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Convert
                </Button>
              )}
              {onDelete && (
                <Button variant="outline" size="sm" onClick={() => onDelete(plan)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="trainings">Trainings</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Plan Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Description</p>
                    <p className="text-sm mt-1">{plan.description || 'No description provided'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(plan.status)}
                      <span className="text-sm text-gray-500">{getStatusDescription(plan.status)}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600">Version</p>
                    <p className="text-sm mt-1">v{plan.version}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Planning Period
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Start Date</p>
                    <p className="text-sm mt-1">{format(new Date(plan.planning_period_start), 'PPP')}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-600">End Date</p>
                    <p className="text-sm mt-1">{format(new Date(plan.planning_period_end), 'PPP')}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600">Duration</p>
                    <p className="text-sm mt-1">
                      {Math.ceil((new Date(plan.planning_period_end).getTime() - new Date(plan.planning_period_start).getTime()) / (1000 * 60 * 60 * 24))} days
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Created</p>
                      <p className="text-sm text-gray-600">{format(new Date(plan.created_at), 'PPp')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Last Updated</p>
                      <p className="text-sm text-gray-600">{format(new Date(plan.updated_at), 'PPp')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {plan.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{plan.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="groups" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Employee Groups
                  <Badge variant="outline" className="ml-2">
                    {groups.length} groups
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {groupsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Loading groups...</p>
                  </div>
                ) : groups.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No employee groups created yet</p>
                    <p className="text-sm">Groups are created based on certificate expiry patterns</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groups.map((group) => (
                      <Card key={group.id} className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{group.name}</CardTitle>
                              {group.description && (
                                <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-blue-50">
                                {group.preliminary_plan_group_employees?.length || 0} employees
                              </Badge>
                              <Badge variant={group.group_type === 'new' ? 'default' : group.group_type === 'renewal' ? 'secondary' : 'outline'}>
                                {group.group_type}
                              </Badge>
                              {(plan.status === 'draft' || plan.status === 'review') && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDeleteGroup(group.id, group.name)}
                                  disabled={deletePreliminaryPlanGroup.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-2">Employees</p>
                              <div className="space-y-1">
                                {group.preliminary_plan_group_employees?.map((emp) => (
                                  <div key={emp.id} className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span className="text-sm">
                                      {emp.employees.first_name} {emp.employees.last_name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      ({emp.employees.department || 'No department'})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-2">
                              {group.location && (
                                <div>
                                  <p className="text-sm font-medium text-gray-600">Location</p>
                                  <p className="text-sm">{group.location}</p>
                                </div>
                              )}
                              {group.target_completion_date && (
                                <div>
                                  <p className="text-sm font-medium text-gray-600">Target Completion</p>
                                  <p className="text-sm">{format(new Date(group.target_completion_date), 'PPP')}</p>
                                </div>
                              )}
                              {group.estimated_cost && (
                                <div>
                                  <p className="text-sm font-medium text-gray-600">Estimated Cost</p>
                                  <p className="text-sm">€{group.estimated_cost}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-medium text-gray-600">Priority</p>
                                <p className="text-sm">{group.priority}</p>
                              </div>
                            </div>
                          </div>
                          {group.notes && (
                            <div className="mt-4 pt-4 border-t">
                              <p className="text-sm font-medium text-gray-600 mb-1">Notes</p>
                              <p className="text-sm text-gray-700">{group.notes}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trainings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Planned Trainings
                  <Badge variant="outline" className="ml-2">
                    {trainings.length} trainings
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {trainingsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Loading trainings...</p>
                  </div>
                ) : trainings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No planned trainings yet</p>
                    <p className="text-sm">Trainings are scheduled based on employee groups and certificate requirements</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {trainings.map((training) => (
                      <Card key={training.id} className="border-l-4 border-l-green-500">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{training.title}</CardTitle>
                              {training.preliminary_plan_groups && (
                                <p className="text-sm text-gray-600 mt-1">
                                  For: {training.preliminary_plan_groups.name}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={training.status === 'proposed' ? 'outline' : 
                                           training.status === 'confirmed' ? 'default' : 
                                           training.status === 'converted' ? 'secondary' : 'destructive'}>
                                {training.status}
                              </Badge>
                              <Badge variant="outline" className="bg-green-50">
                                Priority: {training.priority}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              {training.proposed_date && (
                                <div>
                                  <p className="text-sm font-medium text-gray-600">Proposed Date</p>
                                  <p className="text-sm">{format(new Date(training.proposed_date), 'PPP')}</p>
                                </div>
                              )}
                              {training.proposed_time && (
                                <div>
                                  <p className="text-sm font-medium text-gray-600">Proposed Time</p>
                                  <p className="text-sm">{training.proposed_time}</p>
                                </div>
                              )}
                              {training.proposed_location && (
                                <div>
                                  <p className="text-sm font-medium text-gray-600">Location</p>
                                  <p className="text-sm">{training.proposed_location}</p>
                                </div>
                              )}
                            </div>
                            <div className="space-y-2">
                              {training.estimated_participants && (
                                <div>
                                  <p className="text-sm font-medium text-gray-600">Estimated Participants</p>
                                  <p className="text-sm">{training.estimated_participants}</p>
                                </div>
                              )}
                              {training.max_participants && (
                                <div>
                                  <p className="text-sm font-medium text-gray-600">Max Participants</p>
                                  <p className="text-sm">{training.max_participants}</p>
                                </div>
                              )}
                              {training.estimated_cost && (
                                <div>
                                  <p className="text-sm font-medium text-gray-600">Estimated Cost</p>
                                  <p className="text-sm">€{training.estimated_cost}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {training.preliminary_plan_groups?.preliminary_plan_group_employees && (
                            <div className="mt-4 pt-4 border-t">
                              <p className="text-sm font-medium text-gray-600 mb-2">Participants</p>
                              <div className="flex flex-wrap gap-2">
                                {training.preliminary_plan_groups.preliminary_plan_group_employees.map((emp) => (
                                  <Badge key={emp.employees.id} variant="outline" className="bg-blue-50">
                                    {emp.employees.first_name} {emp.employees.last_name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {training.notes && (
                            <div className="mt-4 pt-4 border-t">
                              <p className="text-sm font-medium text-gray-600 mb-1">Notes</p>
                              <p className="text-sm text-gray-700">{training.notes}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Execution Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                {groupsLoading || trainingsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Loading timeline...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Plan Overview */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-blue-900 mb-2">Planning Period</h3>
                      <p className="text-sm text-blue-800">
                        {format(new Date(plan.planning_period_start), 'PPP')} - {format(new Date(plan.planning_period_end), 'PPP')}
                      </p>
                    </div>

                    {/* Groups Timeline */}
                    {groups.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Employee Groups ({groups.length})
                        </h3>
                        <div className="space-y-3">
                          {groups
                            .filter(group => group.target_completion_date)
                            .sort((a, b) => new Date(a.target_completion_date!).getTime() - new Date(b.target_completion_date!).getTime())
                            .map((group) => (
                              <div key={group.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-medium">{group.name}</h4>
                                    <span className="text-sm text-gray-500">
                                      {group.target_completion_date && format(new Date(group.target_completion_date), 'PPP')}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {group.preliminary_plan_group_employees?.length || 0} employees • {group.group_type}
                                  </p>
                                  {group.location && (
                                    <p className="text-sm text-gray-500 mt-1">📍 {group.location}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Trainings Timeline */}
                    {trainings.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Planned Trainings ({trainings.length})
                        </h3>
                        <div className="space-y-3">
                          {trainings
                            .filter(training => training.proposed_date)
                            .sort((a, b) => new Date(a.proposed_date!).getTime() - new Date(b.proposed_date!).getTime())
                            .map((training) => (
                              <div key={training.id} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-medium">{training.title}</h4>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-gray-500">
                                        {training.proposed_date && format(new Date(training.proposed_date), 'PPP')}
                                      </span>
                                      <Badge variant={training.status === 'proposed' ? 'outline' : 
                                                   training.status === 'confirmed' ? 'default' : 
                                                   training.status === 'converted' ? 'secondary' : 'destructive'}
                                             className="text-xs">
                                        {training.status}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                    {training.proposed_time && (
                                      <span>🕐 {training.proposed_time}</span>
                                    )}
                                    {training.proposed_location && (
                                      <span>📍 {training.proposed_location}</span>
                                    )}
                                    {training.estimated_participants && (
                                      <span>👥 {training.estimated_participants} participants</span>
                                    )}
                                    {training.estimated_cost && (
                                      <span>💰 €{training.estimated_cost}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {groups.length === 0 && trainings.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>No timeline data available yet</p>
                        <p className="text-sm">Groups and trainings will appear here when created</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}