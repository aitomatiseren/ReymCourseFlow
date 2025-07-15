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
import { PreliminaryPlan } from "@/hooks/usePreliminaryPlanning";
import { format } from "date-fns";

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
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Employee groups will be displayed here</p>
                  <p className="text-sm">Groups are created based on certificate expiry patterns</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trainings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Planned Trainings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Planned trainings will be displayed here</p>
                  <p className="text-sm">Trainings are scheduled based on employee groups and certificate requirements</p>
                </div>
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
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Execution timeline will be displayed here</p>
                  <p className="text-sm">Shows the planned execution schedule for all trainings</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}