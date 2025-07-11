import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Training, TrainingParticipant } from "@/types";
import { ArrowLeft, Calendar, Clock, Edit, Users, MapPin, GraduationCap, Bell, FileText, CheckSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EditTrainingDialog } from "./EditTrainingDialog";
import { useTrainingChecklist } from "@/hooks/useTrainingChecklist";
import { useTrainingParticipants } from "@/hooks/useTrainingParticipants";

interface TrainingDetailsViewProps {
  training: Training;
  onBack: () => void;
  onEdit: () => void;
  onAddParticipant: () => void;
  onSendNotifications: (trainingId: string) => void;
  onGenerateAttendanceList: (trainingId: string) => void;
  onRemoveParticipant: (participantId: string) => void;
}

export function TrainingDetailsView({ 
  training, 
  onBack, 
  onEdit,
  onAddParticipant, 
  onSendNotifications, 
  onGenerateAttendanceList, 
  onRemoveParticipant 
}: TrainingDetailsViewProps) {
  const { toast } = useToast();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(training.status);
  
  // Fetch participants using the hook
  const { participants } = useTrainingParticipants(training.id);

  // Initialize with default checklist if none exists
  const defaultChecklist = [
    { id: '1', text: 'Training location confirmed', completed: false },
    { id: '2', text: 'Instructor confirmed', completed: false },
    { id: '3', text: 'Materials prepared', completed: false },
    { id: '4', text: 'Participants notified', completed: false },
  ];

  const { checklist, updateChecklistItem } = useTrainingChecklist(
    training.id, 
    training.checklist || defaultChecklist
  );

  // Handle Escape key to go back
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !showEditDialog) {
        onBack();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onBack, showEditDialog]);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString.slice(0, 5);
  };

  const statusColor = {
    scheduled: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800"
  };

  const handleStatusChange = (newStatus: string) => {
    setCurrentStatus(newStatus as typeof training.status);
    toast({
      title: "Status Updated",
      description: `Training status changed to ${newStatus}`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Schedule</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{training.title}</h1>
              <p className="text-gray-500">Course: {training.courses?.title}</p>
            </div>
          </div>
          <Button onClick={() => setShowEditDialog(true)} className="flex items-center space-x-2">
            <Edit className="h-4 w-4" />
            <span>Edit Training</span>
          </Button>
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
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6 mt-6">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Instructor:</span> 
                <span>{training.instructor || 'Not assigned'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Location:</span> 
                <span>{training.location}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Capacity:</span> 
                <span>{participants.length}/{training.maxParticipants}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Price:</span> 
                <span>€{training.price || '0'}</span>
              </div>
            </div>

            {/* Training Checklist integrated into details */}
            <div className="mt-8">
              <h3 className="font-medium mb-3">Training Checklist</h3>
              <div className="space-y-2">
                {checklist.map((item) => (
                  <label key={item.id} className="flex items-center space-x-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={async (checked) => {
                        try {
                          await updateChecklistItem(item.id, !!checked);
                          toast({
                            title: "Checklist Updated",
                            description: `${item.text} marked as ${checked ? 'completed' : 'incomplete'}`
                          });
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to update checklist item",
                            variant: "destructive"
                          });
                        }
                      }}
                    />
                    <span className={item.completed ? 'line-through text-gray-500' : ''}>{item.text}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

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
                <Button onClick={onAddParticipant} size="sm">
                  Add Participant
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {participants.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No participants enrolled yet</p>
              ) : (
                participants.map((participant) => {
                  const currentEmployeeStatus = participantStatuses[participant.employees?.id || ''] || participant.employees?.status || 'active';
                  const employeeStatusBadge = {
                    active: <Badge className="bg-green-100 text-green-800">active</Badge>,
                    inactive: <Badge className="bg-gray-100 text-gray-800">inactive</Badge>,
                    on_leave: <Badge className="bg-yellow-100 text-yellow-800">on leave</Badge>,
                    sick: <Badge className="bg-red-100 text-red-800">sick</Badge>,
                    terminated: <Badge className="bg-red-100 text-red-800">terminated</Badge>
                  }[currentEmployeeStatus] || <Badge variant="secondary">{currentEmployeeStatus}</Badge>;

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
                        {employeeStatusBadge}
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
                        {training.courses?.code95_points && training.courses.code95_points > 0 && (
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500">Code 95: {training.courses.code95_points} points</span>
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


          {/* Training Materials */}
          {training.materials && training.materials.length > 0 && (
            <div className="bg-white rounded-lg p-6 mt-6">
              <h2 className="text-lg font-semibold mb-4">Training Materials</h2>
              <div className="space-y-2">
                {training.materials.map((material) => (
                  <div key={material.id} className="flex items-center justify-between p-2 border rounded">
                    <span>{material.name}</span>
                    <Badge variant={material.available ? "default" : "secondary"}>
                      {material.available ? 'Available' : 'Not Available'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {training.notes && (
            <div className="bg-white rounded-lg p-6 mt-6">
              <h2 className="text-lg font-semibold mb-4">Notes</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{training.notes}</p>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-white border-l p-6 space-y-6">
          {/* Current Status */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Current Status</h3>
            <Select value={currentStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <div className="mt-2">
              <Badge className={statusColor[currentStatus]}>
                {currentStatus}
              </Badge>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => onSendNotifications(training.id)}
              >
                <Bell className="h-4 w-4 mr-2" />
                Send Notifications
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => onGenerateAttendanceList(training.id)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate Attendance List
              </Button>
            </div>
          </div>

          {/* Course Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Course Information</h3>
            <div className="space-y-2">
              <div>
                <p className="font-medium">{training.courses?.title}</p>
                {training.courses?.code95_points && (
                  <p className="text-sm text-gray-500">Code 95 Points: {training.courses.code95_points}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Training Dialog */}
      <EditTrainingDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        training={training}
      />
    </div>
  );
}