
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, User, CheckCircle } from "lucide-react";

interface Session {
  id: string;
  sessionNumber: number;
  date: string;
  time: string;
  endTime?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  participantCount: number;
  maxParticipants: number;
}

interface SessionTabsProps {
  training: any;
  sessions?: Session[];
  onSessionSelect?: (sessionId: string) => void;
}

export function SessionTabs({ training, sessions = [], onSessionSelect }: SessionTabsProps) {
  const [activeSession, setActiveSession] = useState<string>('1');

  // Generate sessions from training data
  const generateSessionsFromTraining = (): Session[] => {
    if (!training) return [];
    
    const sessionCount = training.sessions_count || 1;
    const sessionDates = training.session_dates || [];
    const sessionTimes = training.session_times || [];
    const sessionEndTimes = training.session_end_times || [];
    
    return Array.from({ length: sessionCount }, (_, index) => ({
      id: `${training.id}-session-${index + 1}`,
      sessionNumber: index + 1,
      date: sessionDates[index] || training.date,
      time: (sessionTimes[index] || training.time)?.slice(0, 5) || '', // Remove seconds
      endTime: sessionEndTimes[index]?.slice(0, 5) || '', // Remove seconds
      status: 'scheduled' as const,
      participantCount: training.participantCount || 0,
      maxParticipants: training.maxParticipants || 0
    }));
  };

  const sessionsToDisplay = sessions.length > 0 ? sessions : generateSessionsFromTraining();

  const getStatusColor = (status: Session['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: Session['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  if (sessionsToDisplay.length <= 1) {
    return null; // Don't show tabs for single sessions
  }

  return (
    <div className="space-y-4">
      <h4 className="font-semibold">Training Sessions</h4>
      
      <Tabs value={activeSession} onValueChange={setActiveSession}>
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${sessionsToDisplay.length}, 1fr)` }}>
          {sessionsToDisplay.map((session) => (
            <TabsTrigger 
              key={session.id} 
              value={session.sessionNumber.toString()}
              className="flex items-center space-x-2 whitespace-nowrap"
            >
              {getStatusIcon(session.status)}
              <span>Session {session.sessionNumber}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {sessionsToDisplay.map((session) => (
          <TabsContent key={session.id} value={session.sessionNumber.toString()}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Session {session.sessionNumber}
                  </CardTitle>
                  <Badge variant="outline" className={getStatusColor(session.status)}>
                    {session.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDate(session.date)}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    {session.time}{session.endTime && ` - ${session.endTime}`}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {training.location}
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    {session.participantCount}/{session.maxParticipants}
                  </div>
                </div>

                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  <span className="text-sm">Instructor: {training.instructor}</span>
                </div>

                <div className="text-sm text-gray-600">
                  <p><strong>Date:</strong> {formatDate(session.date)}</p>
                  <p><strong>Time:</strong> {session.time}{session.endTime && ` - ${session.endTime}`}</p>
                  <p><strong>Location:</strong> {training.location}</p>
                  <p><strong>Participants:</strong> {session.participantCount}/{session.maxParticipants}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
