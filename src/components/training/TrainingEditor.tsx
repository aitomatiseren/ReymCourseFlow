import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Training, TrainingParticipant, TrainingMaterial } from "@/types";
import { EditableChecklist } from "@/components/training/EditableChecklist";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { getStatusLabel } from "@/constants/employeeStatus";

interface TrainingEditorProps {
  training: Training;
  onBack: () => void;
  onAddParticipant: () => void;
  onSendNotifications: (trainingId: string) => void;
  onGenerateAttendanceList: (trainingId: string) => void;
  onRemoveParticipant: (participantId: string) => void;
}

export function TrainingEditor({ 
  training, 
  onBack, 
  onAddParticipant, 
  onSendNotifications, 
  onGenerateAttendanceList, 
  onRemoveParticipant 
}: TrainingEditorProps) {
  const { toast } = useToast();

  // Handle Escape key to go back
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onBack();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);
  const [title, setTitle] = useState(training.title);
  const [description, setDescription] = useState(training.description);
  const [instructor, setInstructor] = useState(training.instructor);
  const [date, setDate] = useState(training.date);
  const [time, setTime] = useState(training.time);
  const [location, setLocation] = useState(training.location);
  const [maxParticipants, setMaxParticipants] = useState(training.maxParticipants);
  const [requiresApproval, setRequiresApproval] = useState(training.requiresApproval);
  const [participants, setParticipants] = useState<TrainingParticipant[]>(training.participants || []);
  const [materials, setMaterials] = useState<TrainingMaterial[]>(training.materials || []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const handleInstructorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInstructor(e.target.value);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTime(e.target.value);
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value);
  };

  const handleMaxParticipantsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxParticipants(parseInt(e.target.value));
  };

  const handleRequiresApprovalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRequiresApproval(e.target.checked);
  };

  const handleAddParticipant = () => {
    onAddParticipant();
  };

  const handleRemoveParticipant = (participantId: string) => {
    onRemoveParticipant(participantId);
  };

  const handleParticipantStatusChange = (participantId: string, newStatus: string) => {
    // Placeholder for changing participant status
    toast({
      title: "Change Participant Status",
      description: `Changing participant ${participantId} status to ${newStatus} is not yet implemented.`,
    });
  };

  const handleAddMaterial = () => {
    // Placeholder for adding a material
    toast({
      title: "Add Material",
      description: "Adding materials is not yet implemented.",
    });
  };

  const handleRemoveMaterial = (materialId: string) => {
    // Placeholder for removing a material
    toast({
      title: "Remove Material",
      description: `Removing material ${materialId} is not yet implemented.`,
    });
  };

  const handleMaterialAvailabilityChange = (materialId: string, isAvailable: boolean) => {
    // Placeholder for changing material availability
    toast({
      title: "Change Material Availability",
      description: `Changing material ${materialId} availability to ${isAvailable} is not yet implemented.`,
    });
  };

  const handleSave = () => {
    // Placeholder for saving the training
    toast({
      title: "Save Training",
      description: "Saving training is not yet implemented.",
    });
  };

  const checklistItems = [
    { id: '1', label: 'Training location confirmed', checked: false },
    { id: '2', label: 'Instructor confirmed', checked: true },
    { id: '3', label: 'Materials prepared', checked: false },
    { id: '4', label: 'Participants notified', checked: true },
  ];

  const handleBulkStatusUpdate = (status: string) => {
    // Placeholder for bulk status update
    toast({
      title: "Bulk Status Update",
      description: `Marking all participants as ${status} is not yet implemented.`,
    });
  };

  // Fetch current status for participants from employee_status_history
  const { data: participantStatuses = {} } = useQuery({
    queryKey: ['participant-current-statuses', (participants || []).map(p => p.employees?.id).filter(Boolean)],
    queryFn: async () => {
      const employeeIds = (participants || []).map(p => p.employees?.id).filter(Boolean);
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
    enabled: (participants || []).length > 0
  });

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to List</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{training.title}</h1>
            <p className="text-gray-500">
              {training.sessions_count && training.sessions_count > 1 
                ? `${training.sessions_count} sessions`
                : 'Single session'
              } • {training.status}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => onSendNotifications(training.id)}
          >
            Send Notifications
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onGenerateAttendanceList(training.id)}
          >
            Attendance List
          </Button>
        </div>
      </div>

      {/* Training Information Section */}
      <Card>
        <CardHeader>
          <CardTitle>Training Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              type="text"
              id="title"
              value={title}
              onChange={handleTitleChange}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={handleDescriptionChange}
            />
          </div>
          <div>
            <Label htmlFor="instructor">Instructor</Label>
            <Input
              type="text"
              id="instructor"
              value={instructor}
              onChange={handleInstructorChange}
            />
          </div>
          {/* Session Information */}
          <div className="space-y-4">
            <Label className="text-base font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Session Schedule
            </Label>
            
            {training.sessions_count && training.sessions_count > 1 && training.session_dates ? (
              <div className="space-y-3">
                {Array.from({ length: training.sessions_count }, (_, index) => (
                  <div key={index} className="grid grid-cols-3 gap-3 p-3 border rounded-lg bg-gray-50">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Session {index + 1} Date</Label>
                      <Input
                        type="date"
                        value={training.session_dates[index] || ''}
                        readOnly
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Start Time</Label>
                      <Input
                        type="time"
                        value={training.session_times?.[index] || ''}
                        readOnly
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">End Time</Label>
                      <Input
                        type="time"
                        value={training.session_end_times?.[index] || ''}
                        readOnly
                        className="bg-white"
                        placeholder="Not set"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    type="date"
                    id="date"
                    value={date}
                    onChange={handleDateChange}
                  />
                </div>
                <div>
                  <Label htmlFor="time">Time</Label>
                  <Input
                    type="time"
                    id="time"
                    value={time}
                    onChange={handleTimeChange}
                  />
                </div>
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              type="text"
              id="location"
              value={location}
              onChange={handleLocationChange}
            />
          </div>
          <div>
            <Label htmlFor="maxParticipants">Max Participants</Label>
            <Input
              type="number"
              id="maxParticipants"
              value={maxParticipants}
              onChange={handleMaxParticipantsChange}
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requiresApproval"
                checked={requiresApproval}
                onCheckedChange={(e) => setRequiresApproval(e.target.checked)}
              />
              <Label htmlFor="requiresApproval">Requires Approval</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Participants Section */}
      <Card>
        <CardHeader>
          <CardTitle>Participants ({(participants || []).length}/{training.maxParticipants})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <Button onClick={handleAddParticipant}>
                  Add Participant
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleBulkStatusUpdate('attended')}
                  disabled={(participants || []).length === 0}
                >
                  Mark All as Attended
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              {(participants || []).map((participant) => {
                const currentEmployeeStatus = participantStatuses[participant.employees?.id || ''] || participant.employees?.status || 'active';
                const statusColor = {
                  active: "bg-green-100 text-green-800",
                  inactive: "bg-gray-100 text-gray-800", 
                  on_leave: "bg-yellow-100 text-yellow-800",
                  sick: "bg-red-100 text-red-800",
                  terminated: "bg-red-100 text-red-800"
                }[currentEmployeeStatus as keyof typeof statusColor] || "bg-gray-100 text-gray-800";

                return (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div>
                        <div className="font-medium">{participant.employees?.name}</div>
                        <div className="text-sm text-gray-500 flex items-center space-x-2">
                          <span>{participant.employees?.department}</span>
                          <Badge className={statusColor}>
                            {getStatusLabel(currentEmployeeStatus as any)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {training.status === 'completed' && (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`attended-${participant.id}`}
                            checked={participant.status === 'attended'}
                            onCheckedChange={(checked) => {
                              const newStatus = checked ? 'attended' : 'enrolled';
                              handleParticipantStatusChange(participant.id, newStatus);
                            }}
                          />
                          <label htmlFor={`attended-${participant.id}`} className="text-sm">
                            Attended
                          </label>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveParticipant(participant.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist Section */}
      <Card>
        <CardHeader>
          <CardTitle>Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <EditableChecklist items={checklistItems} />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to List</span>
        </Button>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
