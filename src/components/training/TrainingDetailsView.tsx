import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowLeft, 
  Edit, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  User, 
  Bell, 
  FileText, 
  CheckSquare,
  DollarSign,
  Euro,
  Award,
  Trophy,
  UserPlus
} from "lucide-react";
import { Training } from "@/hooks/useTrainings";
import { EmployeeStatusBadge } from "@/components/employee/EmployeeStatusBadge";
import { EmployeeStatus } from "@/constants/employeeStatus";
import { useToast } from "@/hooks/use-toast";
import { EditTrainingDialog } from "./EditTrainingDialog";
import { AddEmployeesToTrainingDialog } from "./AddEmployeesToTrainingDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTrainingParticipants } from "@/hooks/useTrainingParticipants";
import { useCertificatesForCourse } from "@/hooks/useCertificates";
import { requiresCode95 } from "@/utils/code95Utils";

interface TrainingDetailsViewProps {
  training: Training;
  participants?: any[];
  onBack: () => void;
  onEdit: () => void;
  onAddParticipant: () => void;
  onSendNotifications: (trainingId: string) => void;
  onGenerateAttendanceList: (trainingId: string) => void;
  onRemoveParticipant: (participantId: string) => void;
}

export function TrainingDetailsView({ 
  training, 
  participants: propsParticipants, 
  onBack, 
  onEdit,
  onAddParticipant, 
  onSendNotifications, 
  onGenerateAttendanceList,
  onRemoveParticipant 
}: TrainingDetailsViewProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddEmployeesDialog, setShowAddEmployeesDialog] = useState(false);
  const { toast } = useToast();
  const { participants: hookParticipants, updateParticipantCode95Status } = useTrainingParticipants(training.id);
  const { data: courseCertificates = [], isLoading: certificatesLoading } = useCertificatesForCourse(training.course_id || '');
  
  // Use participants from hook (which includes code95_eligible) or fallback to props
  const participants = hookParticipants.length > 0 ? hookParticipants : (propsParticipants || []);
  
  const currentStatus = training.status;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const formatTime = (timeString: string) => {
    return timeString ? timeString.slice(0, 5) : '';
  };

  // Fetch current status for participants from employee_status_history
  const { data: participantStatuses = {} } = useQuery({
    queryKey: ['participant-current-statuses', participants.map(p => p.employees?.id).filter(Boolean)],
    queryFn: async () => {
      const employeeIds = participants.map(p => p.employees?.id).filter(Boolean);
      if (employeeIds.length === 0) return {};
      
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('employee_status_history')
        .select('employee_id, status, start_date')
        .in('employee_id', employeeIds)
        .is('end_date', null)
        .lte('start_date', now)
        .order('start_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching employee statuses:', error);
        throw error;
      }
      
      // Create a map of employee_id -> current status
      const statusMap: Record<string, string> = {};
      data.forEach(record => {
        if (!statusMap[record.employee_id]) {
          statusMap[record.employee_id] = record.status;
        }
      });
      
      return statusMap;
    },
    enabled: participants.length > 0
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Schedule
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{training.title}</h1>
              <p className="text-gray-600">Training Session Details</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => setShowEditDialog(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Training
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Training Details */}
          <div className="bg-white rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-6 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Training Details
            </h2>
            
            {training.sessions_count && training.sessions_count > 1 && training.session_dates ? (
              <div className="space-y-4">
                <p className="font-medium">Sessions ({training.sessions_count})</p>
                {Array.from({ length: training.sessions_count }, (_, index) => (
                  <div key={index} className="flex items-center space-x-6 py-2">
                    <span className="font-medium">Session {index + 1}</span>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>{formatDate(training.session_dates[index])}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{formatTime(training.session_times?.[index] || '')}</span>
                      {training.session_end_times?.[index] && (
                        <span>- {formatTime(training.session_end_times[index])}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center space-x-8 mb-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>{formatDate(training.date)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{formatTime(training.time)}</span>
                  {(training.session_end_times?.[0] || training.end_time) && (
                    <span>- {formatTime(training.session_end_times?.[0] || training.end_time)}</span>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6 mt-6">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Instructor: </span>
                <span>{training.instructor || 'Not assigned'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Location: </span>
                <span>{training.location}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Capacity: </span>
                <span>{participants.length}/{training.maxParticipants}</span>
              </div>
              {training.code95_points && training.code95_points > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Code 95 Points: </span>
                  <span>{training.code95_points}</span>
                </div>
              )}
            </div>
          </div>

          {/* Certificates Granted */}
          <div className="bg-white rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Award className="h-5 w-5 mr-2" />
              Certificates Granted upon Completion
            </h2>
            {certificatesLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              </div>
            ) : courseCertificates.length > 0 ? (
              <div className="space-y-3">
                {courseCertificates.map((cert) => (
                  <div key={cert.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Trophy className="h-5 w-5 text-yellow-600" />
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {cert.licenses?.name || 'Unknown Certificate'}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            {cert.licenses?.description && (
                              <span className="text-sm text-gray-600">
                                {cert.licenses.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex space-x-1 justify-end mb-1">
                          {cert.directly_grants && (
                            <Badge variant="default" className="text-xs">
                              Directly Grants
                            </Badge>
                          )}
                        </div>
                        <div className="flex space-x-2 mt-1">
                          {cert.is_required && (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          )}
                          {cert.renewal_eligible && (
                            <Badge variant="secondary" className="text-xs">
                              Renewal Eligible
                            </Badge>
                          )}
                        </div>
                        {cert.licenses?.validity_period_months && (
                          <div className="text-xs text-gray-500 mt-1">
                            Valid for {cert.licenses.validity_period_months} months
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Award className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No certificates granted upon completion</p>
                <p className="text-sm mt-1">This training doesn't grant any certificates.</p>
              </div>
            )}
          </div>

          {/* Cost Breakdown */}
          {training.cost_breakdown && training.cost_breakdown.length > 0 && (
            <div className="bg-white rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Cost Breakdown
              </h2>
              <div className="space-y-3">
                {training.cost_breakdown.map((cost, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{cost.name}</div>
                      {cost.description && (
                        <div className="text-sm text-gray-500">{cost.description}</div>
                      )}
                    </div>
                    <span className="font-medium">€{cost.amount}</span>
                  </div>
                ))}
                <div className="border-t pt-3 flex items-center justify-between font-semibold">
                  <span>Total per Participant</span>
                  <span>€{training.price}</span>
                </div>
              </div>
            </div>
          )}

          {/* Participants */}
          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Participants ({participants.length})
              </h2>
              <div className="flex items-center space-x-2">
                {currentStatus === 'completed' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      toast({
                        title: "Bulk Update",
                        description: "All participants marked as attended"
                      });
                    }}
                  >
                    Mark All as Attended
                  </Button>
                )}
                <Button onClick={() => setShowAddEmployeesDialog(true)} size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Employees
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {participants.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No participants enrolled yet</p>
              ) : (
                participants.map((participant) => {
                  const currentEmployeeStatus = participantStatuses[participant.employees?.id || ''] || participant.employees?.status || 'active';

                  return (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <div className="font-medium">
                          {participant.employees?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {participant.employees?.email}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <EmployeeStatusBadge status={currentEmployeeStatus as EmployeeStatus} />
                        {currentStatus === 'completed' && (
                          <label className="flex items-center space-x-2">
                            <Checkbox
                              checked={participant.status === 'attended'}
                              onCheckedChange={(checked) => {
                                toast({
                                  title: "Attendance Updated",
                                  description: `${participant.employees?.name} marked as ${checked ? 'attended' : 'enrolled'}`
                                });
                              }}
                            />
                            <span className="text-sm">Attended</span>
                          </label>
                        )}
                        {training.code95_points && training.code95_points > 0 && (
                          <div className="flex items-center space-x-3">
                            <span className="text-sm text-gray-500">Code 95: {training.code95_points} points</span>
                            {participant.employees && requiresCode95(participant.employees) ? (
                              <label className="flex items-center space-x-2">
                                <Checkbox
                                  checked={participant.code95_eligible}
                                  onCheckedChange={(checked) => {
                                    updateParticipantCode95Status.mutate({
                                      participantId: participant.id,
                                      code95Eligible: !!checked
                                    }, {
                                      onSuccess: () => {
                                        toast({
                                          title: "Code 95 Status Updated",
                                          description: `${participant.employees?.name} ${checked ? 'will' : 'will not'} receive Code 95 points`
                                        });
                                      },
                                      onError: () => {
                                        toast({
                                          title: "Error",
                                          description: "Failed to update Code 95 status",
                                          variant: "destructive"
                                        });
                                      }
                                    });
                                  }}
                                  disabled={updateParticipantCode95Status.isPending}
                                />
                                <span className="text-sm">Eligible for Code 95</span>
                              </label>
                            ) : (
                              <span className="text-xs text-gray-500">
                                (Requires C, CE, or D license)
                              </span>
                            )}
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveParticipant(participant.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 p-6">
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => onSendNotifications(training.id)} 
                  className="w-full" 
                  variant="outline"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Send Notifications
                </Button>
                <Button 
                  onClick={() => onGenerateAttendanceList(training.id)} 
                  className="w-full" 
                  variant="outline"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Attendance List
                </Button>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge 
                  className={`${
                    currentStatus === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                    currentStatus === 'confirmed' ? 'bg-green-100 text-green-800' :
                    currentStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                    currentStatus === 'completed' ? 'bg-gray-100 text-gray-800' :
                    'bg-gray-100 text-gray-800'
                  } text-sm px-3 py-1`}
                >
                  {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                </Badge>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {training.courseName && (
                  <p><strong>Course:</strong> {training.courseName}</p>
                )}
                <p><strong>Requires Approval:</strong> {training.requiresApproval ? 'Yes' : 'No'}</p>
                {training.code95_points && (
                  <p className="text-sm text-gray-500">Code 95 Points: {training.code95_points}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Training Dialog */}
      <EditTrainingDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        training={training}
      />

      {/* Add Employees Dialog */}
      <AddEmployeesToTrainingDialog
        open={showAddEmployeesDialog}
        onOpenChange={setShowAddEmployeesDialog}
        trainingId={training.id}
        trainingTitle={training.title}
        onEmployeesAdded={() => {
          // This will trigger a refresh of the participants data
          toast({
            title: "Employees Added",
            description: "The participant list has been updated.",
          });
        }}
      />
    </div>
  );
}