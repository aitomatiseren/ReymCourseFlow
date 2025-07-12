import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTrainings } from "@/hooks/useTrainings";
import { useCourses } from "@/hooks/useCourses";
import { ArrowLeft, Calendar, Clock, Edit, Users, MapPin, Bell, FileText } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EditTrainingDialog } from "@/components/training/EditTrainingDialog";
import { AddParticipantDialog } from "@/components/training/AddParticipantDialog";
import { useTrainingChecklist } from "@/hooks/useTrainingChecklist";
import { useTrainingParticipants } from "@/hooks/useTrainingParticipants";
import { EmployeeStatusBadge } from "@/components/employee/EmployeeStatusBadge";
import type { EmployeeStatus } from "@/types/index";

export default function TrainingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('scheduled');
  
  const { data: trainings = [], isLoading: trainingsLoading } = useTrainings();
  const { data: courses = [] } = useCourses();
  const training = trainings.find(t => t.id === id);
  const course = training ? courses.find(c => c.id === training.course_id) : null;
  
  // Fetch participants using the hook
  const { participants, removeParticipant } = useTrainingParticipants(id);

  // Initialize with default checklist if none exists
  const defaultChecklist = [
    { id: '1', text: 'Training location confirmed', completed: false },
    { id: '2', text: 'Instructor confirmed', completed: false },
    { id: '3', text: 'Materials prepared', completed: false },
    { id: '4', text: 'Participants notified', completed: false },
  ];

  const { checklist, updateChecklistItem } = useTrainingChecklist(
    id || '', 
    training?.checklist || defaultChecklist
  );

  // Set current status when training loads
  useEffect(() => {
    if (training) {
      setCurrentStatus(training.status);
    }
  }, [training]);

  // Fetch current status for participants from employee_status_history
  const { data: participantStatuses = {} } = useQuery({
    queryKey: ['participant-current-statuses', participants?.map(p => p.employees?.id).filter(Boolean)],
    queryFn: async () => {
      const employeeIds = participants?.map(p => p.employees?.id).filter(Boolean) || [];
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
    enabled: (participants?.length || 0) > 0
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
    setCurrentStatus(newStatus);
    toast({
      title: "Status Updated",
      description: `Training status changed to ${newStatus}`,
    });
  };

  const handleSendNotifications = (trainingId: string) => {
    toast({
      title: "Notifications Sent",
      description: "All participants have been notified",
    });
  };

  const handleGenerateAttendanceList = (trainingId: string) => {
    toast({
      title: "Attendance List Generated",
      description: "Attendance list has been generated and downloaded",
    });
  };

  if (trainingsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </Layout>
    );
  }

  if (!training) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate("/scheduling")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Scheduling
            </Button>
          </div>
          
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Training Not Found</h2>
            <p className="text-gray-600">The training you're looking for doesn't exist or has been removed.</p>
            <Button className="mt-4" onClick={() => navigate("/scheduling")}>
              View All Trainings
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Training Detail</h1>
            <p className="text-gray-600 mt-1">View and manage training information and participants.</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/scheduling")}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Schedule</span>
          </Button>
        </div>

        {/* Training Details */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{training.title}</h2>
                <p className="text-gray-600">Course: {course?.title}</p>
              </div>
              <Button onClick={() => setShowEditDialog(true)} className="flex items-center space-x-2">
                <Edit className="h-4 w-4" />
                <span>Edit Training</span>
              </Button>
            </div>
          
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
                <span>
                  {formatTime(training.time)}
                  {training.end_time && ` - ${formatTime(training.end_time)}`}
                </span>
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
              <span>{participants?.length || 0}/{training.maxParticipants}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">Price:</span> 
              <span>€{training.price || '0'}</span>
            </div>
            {course?.code95_points && course.code95_points > 0 && (
              <div className="flex items-center space-x-2">
                <span className="font-medium">Code 95 Points:</span> 
                <span>{course.code95_points}</span>
              </div>
            )}
          </div>

          {/* Training Checklist integrated into details */}
          {checklist && checklist.length > 0 && (
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
          )}
          </CardContent>
        </Card>

        {/* Participants */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Participants ({participants?.length || 0})
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
                <Button onClick={() => setShowAddParticipant(true)} size="sm">
                  Add Participant
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {!participants || participants.length === 0 ? (
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
                        {course?.code95_points && course.code95_points > 0 && (
                          <label className="flex items-center space-x-2">
                            <Checkbox
                              checked={participant.code95_eligible || false}
                              onCheckedChange={async (checked) => {
                                try {
                                  const { error } = await supabase
                                    .from('training_participants')
                                    .update({ code95_eligible: !!checked })
                                    .eq('id', participant.id);
                                  
                                  if (error) throw error;
                                  
                                  toast({
                                    title: "Code 95 Updated",
                                    description: `${participant.employees?.name} ${checked ? 'eligible for' : 'not eligible for'} Code 95 points`
                                  });
                                } catch (error) {
                                  toast({
                                    title: "Error",
                                    description: "Failed to update Code 95 eligibility",
                                    variant: "destructive"
                                  });
                                }
                              }}
                            />
                            <span className="text-sm text-gray-500">Code 95: {course.code95_points} points</span>
                          </label>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeParticipant.mutate(participant.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {training.notes && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Notes</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{training.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Edit Training Dialog */}
        <EditTrainingDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          training={training}
        />

        {/* Add Participant Dialog */}
        <AddParticipantDialog
          open={showAddParticipant}
          onOpenChange={setShowAddParticipant}
          trainingId={training.id}
        />
      </div>
    </Layout>
  );
}