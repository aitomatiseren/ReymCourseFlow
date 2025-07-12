import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO, isSameDay } from "date-fns";
import { useTrainings } from "@/hooks/useTrainings";
import { Training } from "@/hooks/useTrainings";
import { Clock, MapPin, Users, Eye } from "lucide-react";

interface TrainingCalendarProps {
  onTrainingSelect?: (trainingId: string) => void;
}

export function TrainingCalendar({ onTrainingSelect }: TrainingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { data: trainings = [] } = useTrainings();

  const getAllTrainingDates = () => {
    const dates: Date[] = [];
    
    trainings.forEach(training => {
      if (training.sessions_count && training.sessions_count > 1 && training.session_dates) {
        // Multi-session training - add all session dates
        training.session_dates.forEach(dateStr => {
          dates.push(parseISO(dateStr));
        });
      } else {
        // Single session training
        dates.push(parseISO(training.date));
      }
    });
    
    return dates;
  };

  const getTrainingsForDate = (date: Date) => {
    const trainingsForDate: Array<{ training: Training; sessionIndex?: number }> = [];
    
    trainings.forEach(training => {
      if (training.sessions_count && training.sessions_count > 1 && training.session_dates) {
        // Multi-session training - check each session date
        training.session_dates.forEach((sessionDate, index) => {
          if (isSameDay(parseISO(sessionDate), date)) {
            trainingsForDate.push({ training, sessionIndex: index });
          }
        });
      } else {
        // Single session training
        if (isSameDay(parseISO(training.date), date)) {
          trainingsForDate.push({ training });
        }
      }
    });
    
    return trainingsForDate;
  };

  const selectedDateTrainings = selectedDate ? getTrainingsForDate(selectedDate) : [];
  const trainingDates = getAllTrainingDates();

  const getStatusColor = (status: Training['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (time: string, endTime?: string) => {
    if (endTime) {
      return `${time} - ${endTime}`;
    }
    return time;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>Training Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
            modifiers={{
              hasTraining: trainingDates
            }}
            modifiersStyles={{
              hasTraining: {
                backgroundColor: 'hsl(220 70% 50%)',
                color: 'white',
                fontWeight: 'bold'
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate 
              ? format(selectedDate, 'EEEE, MMMM d, yyyy')
              : 'Select a date'
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDateTrainings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No trainings scheduled for this date
            </p>
          ) : (
            <div className="space-y-4">
              {selectedDateTrainings.map(({ training, sessionIndex }, index) => {
                const isMultiSession = (training.sessions_count || 1) > 1;
                const sessionTime = isMultiSession && sessionIndex !== undefined
                  ? training.session_times?.[sessionIndex]
                  : training.time;
                const sessionEndTime = isMultiSession && sessionIndex !== undefined
                  ? training.session_end_times?.[sessionIndex]
                  : undefined;

                return (
                  <div key={`${training.id}-${sessionIndex || 0}`} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold">{training.title}</h4>
                        {isMultiSession && (
                          <Badge variant="secondary" className="text-xs">
                            Session {(sessionIndex || 0) + 1}/{training.sessions_count}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={getStatusColor(training.status)}>
                          {training.status}
                        </Badge>
                        {onTrainingSelect && (
                          <Button 
                            size="sm" 
                            className="bg-slate-800 text-white hover:bg-slate-900"
                            onClick={() => onTrainingSelect(training.id)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        {formatTime(sessionTime || "", sessionEndTime)}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        {training.location}
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        {training.participantCount}/{training.maxParticipants} participants
                      </div>
                      {training.instructor && (
                        <p className="text-sm">Instructor: {training.instructor}</p>
                      )}
                      {training.courseName && (
                        <p className="text-sm">Course: {training.courseName}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
