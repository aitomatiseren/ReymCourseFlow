
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Bell, CheckSquare, UserPlus, List } from "lucide-react";
import { Training } from "@/hooks/useTrainings";
import { StatusToggle } from "./StatusToggle";
import { SessionManager } from "./SessionManager";

interface TrainingDetailsPanelProps {
  training: Training | null;
  participants: any[];
  onEdit: () => void;
  onSendNotifications: (trainingId: string) => void;
  onGenerateAttendanceList: (trainingId: string) => void;
  onAddParticipant: () => void;
  onStatusChange: (status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed') => void;
  onRemoveParticipant: (participantId: string) => void;
}

export function TrainingDetailsPanel({
  training,
  participants,
  onEdit,
  onSendNotifications,
  onGenerateAttendanceList,
  onAddParticipant,
  onStatusChange,
  onRemoveParticipant
}: TrainingDetailsPanelProps) {
  if (!training) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <List className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Select a training to view details</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{training.title}</CardTitle>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <StatusToggle
            status={training.status}
            onStatusChange={onStatusChange}
          />
          
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={() => onSendNotifications(training.id)}>
              <Bell className="h-4 w-4 mr-1" />
              Notify All
            </Button>
            <Button size="sm" variant="outline" onClick={() => onGenerateAttendanceList(training.id)}>
              <CheckSquare className="h-4 w-4 mr-1" />
              Attendance
            </Button>
          </div>
        </CardContent>
      </Card>

      <SessionManager training={training} />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Participants ({participants.length}/{training.maxParticipants})</CardTitle>
            <Button size="sm" variant="outline" onClick={onAddParticipant}>
              <UserPlus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No participants enrolled yet
            </div>
          ) : (
            <div className="space-y-2">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{participant.employees?.name}</p>
                    <p className="text-sm text-gray-600">{participant.employees?.employee_number}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{participant.status}</Badge>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onRemoveParticipant(participant.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
