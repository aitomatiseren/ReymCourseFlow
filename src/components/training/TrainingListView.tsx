import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, User, Eye, Truck } from "lucide-react";
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

  return (
    <div className="space-y-4">
      {trainings.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No trainings scheduled yet.</p>
            <Button 
              className="mt-4" 
              onClick={onCreateTraining}
            >
              Schedule First Training
            </Button>
          </CardContent>
        </Card>
      ) : (
        trainings.map((training) => {
          const isMultiSession = (training.sessions_count || 1) > 1;
          
          return (
            <Card 
              key={training.id} 
              className={`transition-all hover:shadow-md ${
                highlightedTrainingId === training.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-lg">{training.title}</h3>
                        <Badge variant="outline" className={
                          training.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          training.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          training.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          training.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {training.status}
                        </Badge>
                        {isMultiSession && (
                          <Badge variant="secondary" className="text-xs">
                            {training.sessions_count} sessions
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Session Information */}
                    {isMultiSession && training.session_dates && training.session_times ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {training.session_dates.map((date, index) => (
                          <div key={index} className="bg-gray-50 rounded-md p-3 border">
                            <div className="font-medium text-sm text-gray-900 mb-1">
                              Session {index + 1}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center text-gray-600 text-xs">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(date)}
                              </div>
                              <div className="flex items-center text-gray-600 text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatTime(
                                  training.session_times?.[index] || "",
                                  training.session_end_times?.[index]
                                )}
                              </div>
                              <div className="flex items-center text-gray-600 text-xs">
                                <MapPin className="h-3 w-3 mr-1" />
                                {training.location}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(training.date)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatTime(training.time)}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {training.location}
                        </div>
                      </div>
                    )}

                    {/* Additional Info */}
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {training.participantCount}/{training.maxParticipants}
                      </div>
                      {training.instructor && (
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {training.instructor}
                        </div>
                      )}
                    </div>

                    {/* Course and Price */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        {training.courseName && (
                          <span>Course: {training.courseName}</span>
                        )}
                        {training.price && (
                          <span className="text-green-600 font-medium">€{training.price}</span>
                        )}
                        {training.code95_points && training.code95_points > 0 && (
                          <div className="flex items-center text-blue-600">
                            <Truck className="h-4 w-4 mr-1" />
                            <span className="font-medium">Code 95: {training.code95_points} points</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="ml-6">
                    <Button 
                      size="sm" 
                      className="bg-slate-800 text-white hover:bg-slate-900"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/trainings/${training.id}`);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
