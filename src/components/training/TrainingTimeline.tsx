
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Clock, MapPin, Users, Calendar } from "lucide-react";
import { useTrainings } from "@/hooks/useTrainings";
import { Training } from "@/hooks/useTrainings";

interface TrainingTimelineProps {
  onTrainingSelect?: (trainingId: string) => void;
  selectedTrainingId?: string | null;
}

export function TrainingTimeline({ onTrainingSelect, selectedTrainingId }: TrainingTimelineProps) {
  const { data: trainings = [] } = useTrainings();

  // Sort trainings by date
  const sortedTrainings = [...trainings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      month: date.toLocaleDateString('en', { month: 'short' }),
      day: date.getDate(),
      year: date.getFullYear()
    };
  };

  const formatTime = (time: string, endTime?: string) => {
    const formattedTime = time ? time.slice(0, 5) : '';
    if (endTime) {
      return `${formattedTime} - ${endTime.slice(0, 5)}`;
    }
    return formattedTime;
  };

  const getStatusColor = (status: Training['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (trainings.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg font-medium">No trainings scheduled yet.</p>
        <p className="text-gray-400 text-sm">Create your first training to see it on the timeline.</p>
      </div>
    );
  }

  return (
    <div className="relative max-w-4xl mx-auto py-6">
      {/* Timeline line */}
      <div className="absolute left-1/2 transform -translate-x-px h-full w-0.5 bg-gradient-to-b from-blue-200 via-blue-300 to-blue-200"></div>
      
      {/* Timeline items */}
      <div className="space-y-8">
        {sortedTrainings.map((training, index) => {
          const isMultiSession = (training.sessions_count || 1) > 1;
          const dateInfo = formatDate(training.date);
          const isEven = index % 2 === 0;
          
          return (
            <div key={training.id} className={`relative flex items-center ${isEven ? 'justify-start' : 'justify-end'}`}>
              {/* Timeline node */}
              <div className="absolute left-1/2 transform -translate-x-1/2 z-10">
                <div className="w-4 h-4 bg-white border-4 border-blue-500 rounded-full shadow-md"></div>
              </div>
              
              {/* Date marker */}
              <div className="absolute left-1/2 transform -translate-x-1/2 -top-2 z-20">
                <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                  {dateInfo.month} {dateInfo.day}
                </div>
              </div>
              
              {/* Training card */}
              <div className={`w-5/12 ${isEven ? 'mr-auto pr-8' : 'ml-auto pl-8'}`}>
                <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">{training.title}</h3>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className={getStatusColor(training.status)}>
                            {training.status}
                          </Badge>
                          {isMultiSession && (
                            <Badge variant="secondary" className="text-xs">
                              {training.sessions_count} sessions
                            </Badge>
                          )}
                        </div>
                      </div>
                      {onTrainingSelect && (
                        <Button 
                          size="sm" 
                          className="bg-slate-800 text-white hover:bg-slate-900 ml-2"
                          onClick={() => onTrainingSelect(training.id)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      )}
                    </div>
                    
                    {/* Session details */}
                    {isMultiSession && training.session_dates && training.session_times ? (
                      <div className="space-y-2 mb-3">
                        {training.session_dates.slice(0, 2).map((date, sessionIndex) => (
                          <div key={sessionIndex} className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            <Clock className="h-4 w-4 mr-2 text-blue-500" />
                            <span className="font-medium">Session {sessionIndex + 1}: </span>
                            <span className="ml-2">
                              {formatDate(date).month} {formatDate(date).day} at {formatTime(
                                training.session_times?.[sessionIndex] || "",
                                training.session_end_times?.[sessionIndex]
                              )}
                            </span>
                          </div>
                        ))}
                        {training.session_dates.length > 2 && (
                          <p className="text-sm text-blue-600 font-medium">
                            +{training.session_dates.length - 2} more sessions
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center text-sm text-gray-600 mb-3 bg-gray-50 p-2 rounded">
                        <Clock className="h-4 w-4 mr-2 text-blue-500" />
                        <span>{formatTime(training.time)}</span>
                      </div>
                    )}
                    
                    {/* Training details */}
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{training.location}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Users className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{training.participantCount}/{training.maxParticipants} participants</span>
                      </div>
                      <div className="text-gray-600">
                        <span className="font-medium">Instructor: </span>{training.instructor}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
