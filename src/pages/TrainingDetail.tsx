import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const { t } = useTranslation('training');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
    { id: '1', text: t('detail.defaultChecklist.locationConfirmed'), completed: false },
    { id: '2', text: t('detail.defaultChecklist.instructorConfirmed'), completed: false },
    { id: '3', text: t('detail.defaultChecklist.materialsPrepared'), completed: false },
    { id: '4', text: t('detail.defaultChecklist.participantsNotified'), completed: false },
  ];

  const { checklist, updateChecklistItem } = useTrainingChecklist(
    id || '',
    training?.checklist || []
  );

  // Set current status when training loads
  useEffect(() => {
    if (training) {
      setCurrentStatus(training.status);
    }
  }, [training]);

  // Real-time subscriptions for automatic updates
  useEffect(() => {
    if (!id) return;

    // Subscribe to training data changes
    const trainingChannel = supabase
      .channel(`training-${id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trainings',
        filter: `id=eq.${id}`
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['trainings'] });
      })
      .subscribe();

    // Subscribe to training participants changes
    const participantsChannel = supabase
      .channel(`training-participants-${id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'training_participants',
        filter: `training_id=eq.${id}`
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['training-participants', id] });
        queryClient.invalidateQueries({ queryKey: ['trainings'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(trainingChannel);
      supabase.removeChannel(participantsChannel);
    };
  }, [id, queryClient]);

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
      title: t('detail.statusUpdated'),
      description: t('detail.statusUpdatedDescription', { status: newStatus }),
    });
  };

  const handleSendNotifications = (trainingId: string) => {
    toast({
      title: t('detail.notificationsSent'),
      description: t('detail.notificationsSentDescription'),
    });
  };

  const handleGenerateAttendanceList = (trainingId: string) => {
    toast({
      title: t('detail.attendanceListGenerated'),
      description: t('detail.attendanceListGeneratedDescription'),
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
              {t('detail.backToSchedule')}
            </Button>
          </div>

          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('detail.trainingNotFound')}</h2>
            <p className="text-gray-600">{t('detail.trainingNotFoundDescription')}</p>
            <Button className="mt-4" onClick={() => navigate("/scheduling")}>
              {t('detail.viewAllTrainings')}
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
            <h1 className="text-3xl font-bold text-gray-900">{t('detail.trainingDetail')}</h1>
            <p className="text-gray-600 mt-1">{t('detail.trainingDetailDescription')}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/scheduling")}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('detail.backToSchedule')}</span>
          </Button>
        </div>

        {/* Training Details */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{training.title}</h2>
                <p className="text-gray-600">{t('detail.course')}: {course?.title}</p>
              </div>
              <Button onClick={() => setShowEditDialog(true)} className="flex items-center space-x-2">
                <Edit className="h-4 w-4" />
                <span>{t('detail.editTraining')}</span>
              </Button>
            </div>

            {training.sessions_count && training.sessions_count > 1 && training.session_dates ? (
              <div className="space-y-4">
                <p className="font-medium">{t('detail.sessions')} ({training.sessions_count || 0})</p>
                {Array.from({ length: training.sessions_count }, (_, index) => (
                  <div key={index} className="flex items-center space-x-6 py-2">
                    <span className="font-medium">{t('detail.session')} {index + 1}</span>
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
                    {(training.end_time || training.session_end_times?.[0]) && ` - ${formatTime(training.end_time || training.session_end_times?.[0])}`}
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6 mt-6">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{t('detail.instructor')}:</span>
                <span>{training.instructor || t('detail.notAssigned')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{t('detail.location')}:</span>
                <span>{training.location}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{t('detail.capacity')}:</span>
                <span>{participants?.length || 0}/{training.maxParticipants}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{t('detail.price')}:</span>
                <span>€{training.price || '0'}</span>
              </div>
              {course?.code95_points && course.code95_points > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{t('detail.code95Points')}:</span>
                  <span>{course.code95_points}</span>
                </div>
              )}
            </div>

            {/* Training Checklist integrated into details */}
            {checklist && checklist.length > 0 && (
              <div className="mt-8">
                <h3 className="font-medium mb-3">{t('detail.trainingChecklist')}</h3>
                <div className="space-y-2">
                  {checklist.map((item) => (
                    <label key={item.id} className="flex items-center space-x-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={async (checked) => {
                          try {
                            await updateChecklistItem(item.id, !!checked);
                            toast({
                              title: t('detail.checklistUpdated'),
                              description: t('detail.checklistUpdatedDescription', {
                                item: item.text,
                                status: checked ? t('detail.completed') : t('detail.incomplete')
                              })
                            });
                          } catch (error) {
                            toast({
                              title: t('detail.error'),
                              description: t('detail.checklistUpdateError'),
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
                {t('detail.participants')} ({participants?.length || 0})
              </h2>
              <div className="flex items-center space-x-2">
                {currentStatus === 'completed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      toast({
                        title: t('detail.bulkUpdate'),
                        description: t('detail.bulkUpdateDescription')
                      });
                    }}
                  >
                    {t('detail.markAllAsAttended')}
                  </Button>
                )}
                <Button onClick={() => setShowAddParticipant(true)} size="sm">
                  {t('detail.addParticipant')}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {!participants || participants.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{t('detail.noParticipantsEnrolled')}</p>
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
                                  title: t('detail.attendanceUpdated'),
                                  description: t('detail.attendanceUpdatedDescription', {
                                    name: participant.employees?.name,
                                    status: checked ? t('detail.attended') : t('detail.enrolled')
                                  })
                                });
                              }}
                            />
                            <span className="text-sm">{t('detail.attended')}</span>
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
                                    title: t('detail.code95Updated'),
                                    description: t('detail.code95UpdatedDescription', {
                                      name: participant.employees?.name,
                                      status: checked ? t('detail.eligibleFor') : t('detail.notEligibleFor')
                                    })
                                  });
                                } catch (error) {
                                  toast({
                                    title: t('detail.error'),
                                    description: t('detail.code95UpdateError'),
                                    variant: "destructive"
                                  });
                                }
                              }}
                            />
                            <span className="text-sm text-gray-500">{t('detail.code95')}: {course.code95_points} {t('detail.points')}</span>
                          </label>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeParticipant.mutate(participant.id)}
                        >
                          {t('detail.remove')}
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
              <h2 className="text-lg font-semibold mb-4">{t('detail.notes')}</h2>
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