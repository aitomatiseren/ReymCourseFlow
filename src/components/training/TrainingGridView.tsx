
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, User, CheckSquare, Eye, Clock, Truck, Euro, Award, Shield } from "lucide-react";
import { Training } from "@/hooks/useTrainings";
import { useCertificatesForCourse } from "@/hooks/useCertificates";
import { useNavigate } from "react-router-dom";

// Component to show certificate badge for a training in grid view
function CertificateBadge({ courseId }: { courseId?: string }) {
  const { data: courseCertificates = [] } = useCertificatesForCourse(courseId || '');
  
  if (!courseId || courseCertificates.length === 0) {
    return null;
  }

  return (
    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 text-xs">
      <Award className="h-3 w-3 mr-1" />
      {courseCertificates.length} cert{courseCertificates.length > 1 ? 's' : ''}
    </Badge>
  );
}

interface TrainingGridViewProps {
  trainings: Training[];
  onTrainingSelect: (trainingId: string) => void;
  onCreateTraining: () => void;
  highlightedTrainingId?: string | null;
}

export function TrainingGridView({
  trainings,
  onTrainingSelect,
  onCreateTraining,
  highlightedTrainingId
}: TrainingGridViewProps) {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {trainings.length === 0 ? (
        <div className="col-span-full">
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
        </div>
      ) : (
        trainings.map((training) => {
          const isMultiSession = (training.sessions_count || 1) > 1;

          return (
            <Card
              key={training.id}
              className={`transition-all hover:shadow-md flex flex-col ${highlightedTrainingId === training.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{training.title}</CardTitle>
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
              </CardHeader>
              <CardContent className="space-y-4 flex-grow flex flex-col">
                {/* Session Information */}
                {isMultiSession && training.session_dates && training.session_times ? (
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">{training.sessions_count} sessions</span>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {training.session_dates.map((date, index) => (
                        <div key={index} className="bg-gray-50 rounded-md p-2 text-sm">
                          <div className="font-medium text-gray-900">Session {index + 1}</div>
                          <div className="flex items-center text-gray-600">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(date)} at {formatTime(
                              training.session_times?.[index] || "",
                              training.session_end_times?.[index]
                            )}
                          </div>
                          <div className="flex items-center text-gray-600 mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {training.location || 'Not specified'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm text-gray-600 flex-grow">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(training.date)} at {formatTime(training.time)}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      {training.location || 'Not specified'}
                    </div>
                  </div>
                )}

                {/* General Training Info */}
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    {training.participantCount || 0}/{training.maxParticipants || 'N/A'} participants
                  </div>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Instructor: {training.instructor || 'Not assigned'}
                  </div>
                  {training.courseName && (
                    <div className="flex items-center">
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Course: {training.courseName}
                    </div>
                  )}

                  {/* Features */}
                  <div className="flex flex-wrap gap-2">
                    {training.code95_points && training.code95_points > 0 && (
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">
                        <Truck className="h-3 w-3 mr-1" />
                        {training.code95_points} pts
                      </Badge>
                    )}
                    {training.requiresApproval && (
                      <Badge variant="outline" className="bg-orange-100 text-orange-800 text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Approval Required
                      </Badge>
                    )}
                    <CertificateBadge courseId={training.course_id} />
                  </div>
                </div>

                {/* Consistent Button at Bottom */}
                <div className="mt-auto pt-4">
                  <Button
                    className="w-full h-10 bg-slate-800 text-white hover:bg-slate-900"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/scheduling/${training.id}`);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
