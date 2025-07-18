
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Save, X, Calendar, Clock, MapPin, User } from "lucide-react";
import { useUpdateTraining } from "@/hooks/useUpdateTraining";
import { useToast } from "@/hooks/use-toast";

interface SessionManagerProps {
  training: any;
}

interface SessionEdit {
  date?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  instructor?: string;
}

export function SessionManager({ training }: SessionManagerProps) {
  const [editingSession, setEditingSession] = useState<number | null>(null);
  const [sessionEdits, setSessionEdits] = useState<Record<number, SessionEdit>>({});
  const updateTraining = useUpdateTraining();
  const { toast } = useToast();

  const isMultiSession = training.sessions_count > 1;
  const sessionDates = training.session_dates || [];
  const sessionTimes = training.session_times || [];
  const sessionEndTimes = training.session_end_times || [];

  const handleEditSession = (sessionIndex: number) => {
    setEditingSession(sessionIndex);
    setSessionEdits(prev => ({
      ...prev,
      [sessionIndex]: {
        date: sessionDates[sessionIndex] || training.date,
        startTime: sessionTimes[sessionIndex] || training.time,
        endTime: sessionEndTimes[sessionIndex] || '',
        location: training.location,
        instructor: training.instructor
      }
    }));
  };

  const handleSaveSession = async (sessionIndex: number) => {
    const edits = sessionEdits[sessionIndex];
    if (!edits) return;

    try {
      const updatedSessionDates = [...sessionDates];
      const updatedSessionTimes = [...sessionTimes];
      const updatedSessionEndTimes = [...sessionEndTimes];

      updatedSessionDates[sessionIndex] = edits.date || '';
      updatedSessionTimes[sessionIndex] = edits.startTime || '';
      updatedSessionEndTimes[sessionIndex] = edits.endTime || '';

      await updateTraining.mutateAsync({
        id: training.id,
        location: edits.location,
        instructor: edits.instructor,
        ...(isMultiSession && {
          session_dates: updatedSessionDates,
          session_times: updatedSessionTimes,
          session_end_times: updatedSessionEndTimes
        }),
        ...(!isMultiSession && {
          date: edits.date,
          time: edits.startTime
        })
      });

      toast({
        title: "Session Updated",
        description: `Session ${sessionIndex + 1} has been updated successfully`
      });

      setEditingSession(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update session",
        variant: "destructive"
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingSession(null);
    setSessionEdits({});
  };

  const updateSessionEdit = (sessionIndex: number, field: keyof SessionEdit, value: string) => {
    setSessionEdits(prev => ({
      ...prev,
      [sessionIndex]: {
        ...prev[sessionIndex],
        [field]: value
      }
    }));
  };

  if (!isMultiSession) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Single Session Training
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEditSession(0)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editingSession === 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={sessionEdits[0]?.date || ''}
                    onChange={(e) => updateSessionEdit(0, 'date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={sessionEdits[0]?.startTime || ''}
                    onChange={(e) => updateSessionEdit(0, 'startTime', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={sessionEdits[0]?.location || ''}
                  onChange={(e) => updateSessionEdit(0, 'location', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Instructor</Label>
                <Input
                  value={sessionEdits[0]?.instructor || ''}
                  onChange={(e) => updateSessionEdit(0, 'instructor', e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleSaveSession(0)}>
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button variant="outline" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{training.date}</span>
                <Clock className="h-4 w-4 ml-4" />
                <span>{training.time ? training.time.slice(0, 5) : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{training.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{training.instructor}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Multi-Session Training Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sessions">
          <TabsList>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sessions" className="space-y-4">
            {Array.from({ length: training.sessions_count }, (_, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Session {index + 1}</Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditSession(index)}
                      disabled={editingSession === index}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {editingSession === index ? (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Date</Label>
                          <Input
                            type="date"
                            value={sessionEdits[index]?.date || ''}
                            onChange={(e) => updateSessionEdit(index, 'date', e.target.value)}
                            className="w-full"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Start Time</Label>
                            <Input
                              type="time"
                              value={sessionEdits[index]?.startTime || ''}
                              onChange={(e) => updateSessionEdit(index, 'startTime', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>End Time</Label>
                            <Input
                              type="time"
                              value={sessionEdits[index]?.endTime || ''}
                              onChange={(e) => updateSessionEdit(index, 'endTime', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Location</Label>
                        <Input
                          value={sessionEdits[index]?.location || ''}
                          onChange={(e) => updateSessionEdit(index, 'location', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Instructor</Label>
                        <Input
                          value={sessionEdits[index]?.instructor || ''}
                          onChange={(e) => updateSessionEdit(index, 'instructor', e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handleSaveSession(index)}>
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                        <Button variant="outline" onClick={handleCancelEdit}>
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{sessionDates[index] || training.date}</span>
                        <Clock className="h-4 w-4 ml-4" />
                        <span>{(sessionTimes[index] || training.time) ? (sessionTimes[index] || training.time).slice(0, 5) : ''}</span>
                        {sessionEndTimes[index] && (
                          <>
                            <span>-</span>
                            <span>{sessionEndTimes[index]}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{training.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{training.instructor}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          
          <TabsContent value="overview">
            <div className="space-y-2">
              <p><strong>Total Sessions:</strong> {training.sessions_count}</p>
              <p><strong>Course:</strong> {training.courseName}</p>
              <p><strong>Status:</strong> {training.status}</p>
              <p><strong>Participants:</strong> {training.participantCount}/{training.maxParticipants}</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
