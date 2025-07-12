import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, MapPin, Users, User, Eye, Truck, Euro } from "lucide-react";
import { Training } from "@/hooks/useTrainings";
import { useNavigate } from "react-router-dom";

interface TrainingListViewProps {
  trainings: Training[];
  onTrainingSelect: (trainingId: string) => void;
  onCreateTraining: () => void;
  highlightedTrainingId?: string | null;
}

export function TrainingListView({
  trainings,
  onTrainingSelect,
  onCreateTraining,
  highlightedTrainingId
}: TrainingListViewProps) {
  const navigate = useNavigate();
  
  const formatTime = (time: string, endTime?: string) => {
    const formattedTime = time ? time.slice(0, 5) : '';
    if (endTime) {
      return `${formattedTime} - ${endTime.slice(0, 5)}`;
    }
    return formattedTime;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  if (trainings.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-gray-500">No trainings scheduled yet.</p>
          <Button 
            className="mt-4" 
            onClick={onCreateTraining}
          >
            Schedule First Training
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left font-medium">Training</TableHead>
              <TableHead className="text-left font-medium">Date & Time</TableHead>
              <TableHead className="text-left font-medium">Location</TableHead>
              <TableHead className="text-left font-medium">Participants</TableHead>
              <TableHead className="text-left font-medium">Instructor</TableHead>
              {/* <TableHead className="text-left font-medium">Pricing & Features</TableHead> */}
              <TableHead className="text-right font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trainings.map((training) => {
              const isMultiSession = (training.sessions_count || 1) > 1;
              
              return (
                <TableRow 
                  key={training.id}
                  className={`hover:bg-gray-50 ${highlightedTrainingId === training.id ? 'bg-blue-50' : ''}`}
                >
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <div className="font-medium">{training.title}</div>
                        <Badge variant="outline" className={
                          training.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          training.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          training.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          training.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {training.status}
                        </Badge>
                      </div>
                      {training.courseName && (
                        <div className="text-sm text-gray-500">Course: {training.courseName}</div>
                      )}
                      {isMultiSession && (
                        <Badge variant="secondary" className="text-xs">
                          {training.sessions_count} sessions
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {isMultiSession && training.session_dates && training.session_times ? (
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Multi-session training</div>
                        <div className="text-xs text-gray-500">
                          {training.session_dates.length} sessions starting {formatDate(training.session_dates[0])}
                        </div>
                        <div className="text-xs text-gray-500">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {formatTime(training.session_times[0], training.session_end_times?.[0])}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(training.date)}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTime(training.time, training.session_end_times?.[0])}
                        </div>
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <MapPin className="h-3 w-3 mr-1" />
                      {training.location || 'Not specified'}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Users className="h-3 w-3 mr-1" />
                      {training.participantCount || 0}/{training.maxParticipants || 'N/A'}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {training.instructor ? (
                      <div className="flex items-center text-sm">
                        <User className="h-3 w-3 mr-1" />
                        {training.instructor}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Not assigned</span>
                    )}
                  </TableCell>
                  
                  {/* <TableCell>
                    <div className="space-y-2">
                      Pricing info hidden
                    </div>
                  </TableCell> */}
                  
                  <TableCell className="text-right">
                    <Button 
                      size="sm"
                      className="bg-slate-800 text-white hover:bg-slate-900"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/scheduling/${training.id}`);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
