import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, View } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  BookOpen,
  CheckCircle,
  AlertCircle,
  Star
} from 'lucide-react';
import { useEmployeeTrainingCalendar, useEmployeeTrainingProgress } from '@/hooks/useEmployeeSelfService';
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  instructor?: string;
  status: string;
  category?: string;
  duration_hours?: number;
  completion_date?: string;
  training_status: string;
}

export const EmployeeTrainingCalendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);

  const { data: calendarEvents, isLoading } = useEmployeeTrainingCalendar();
  const { data: trainingProgress } = useEmployeeTrainingProgress();

  // Get events for the selected month
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Group events by date
  const eventsByDate = calendarEvents?.reduce((acc, event) => {
    const eventDate = format(parseISO(event.start), 'yyyy-MM-dd');
    if (!acc[eventDate]) acc[eventDate] = [];
    acc[eventDate].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>) || {};

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'enrolled': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-3 w-3" />;
      case 'in_progress': return <Clock className="h-3 w-3" />;
      case 'enrolled': return <BookOpen className="h-3 w-3" />;
      case 'cancelled': return <AlertCircle className="h-3 w-3" />;
      default: return <BookOpen className="h-3 w-3" />;
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setEventDialogOpen(true);
  };

  const getDayEvents = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return eventsByDate[dateKey] || [];
  };

  const hasEvents = (date: Date) => {
    return getDayEvents(date).length > 0;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <Card>
          <CardContent className="p-6">
            <div className="h-96 bg-gray-200 rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Training Calendar</h1>
        <p className="text-gray-600 mt-1">
          View your training schedule and track progress
        </p>
      </div>

      {/* Calendar and Events Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {format(selectedDate, 'MMMM yyyy')}
              </CardTitle>
              <CardDescription>
                Click on a date to see training events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                modifiers={{
                  hasEvents: (date) => hasEvents(date)
                }}
                modifiersStyles={{
                  hasEvents: {
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    fontWeight: 'bold'
                  }
                }}
                className="rounded-md border"
              />
              
              {/* Legend */}
              <div className="mt-4 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded" />
                  <span>Has training events</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Events for Selected Date */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {format(selectedDate, 'EEEE, MMMM d')}
              </CardTitle>
              <CardDescription>
                Training events for this date
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getDayEvents(selectedDate).length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No training events</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getDayEvents(selectedDate).map((event) => (
                    <div
                      key={event.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{event.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">{event.category}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={`${getStatusColor(event.status)} text-xs`}>
                              <span className="flex items-center gap-1">
                                {getStatusIcon(event.status)}
                                {event.status}
                              </span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {event.location && (
                        <div className="flex items-center text-xs text-gray-500 mt-2">
                          <MapPin className="h-3 w-3 mr-1" />
                          {event.location}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Events</span>
                  <span className="font-medium">
                    {calendarEvents?.filter(event => {
                      const eventDate = parseISO(event.start);
                      return eventDate >= monthStart && eventDate <= monthEnd;
                    }).length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completed</span>
                  <span className="font-medium text-green-600">
                    {calendarEvents?.filter(event => {
                      const eventDate = parseISO(event.start);
                      return eventDate >= monthStart && eventDate <= monthEnd && event.status === 'completed';
                    }).length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">In Progress</span>
                  <span className="font-medium text-blue-600">
                    {calendarEvents?.filter(event => {
                      const eventDate = parseISO(event.start);
                      return eventDate >= monthStart && eventDate <= monthEnd && event.status === 'in_progress';
                    }).length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Upcoming</span>
                  <span className="font-medium text-purple-600">
                    {calendarEvents?.filter(event => {
                      const eventDate = parseISO(event.start);
                      return eventDate >= monthStart && eventDate <= monthEnd && event.status === 'enrolled';
                    }).length || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upcoming Events List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Upcoming Training Events
          </CardTitle>
          <CardDescription>
            Your scheduled training sessions in chronological order
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!calendarEvents || calendarEvents.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No training events scheduled</p>
            </div>
          ) : (
            <div className="space-y-4">
              {calendarEvents
                .filter(event => parseISO(event.start) >= new Date())
                .slice(0, 5)
                .map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{event.title}</h4>
                      <p className="text-sm text-gray-600">{event.category}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {format(parseISO(event.start), 'PPP')}
                        </div>
                        {event.location && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {event.location}
                          </div>
                        )}
                        {event.instructor && (
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {event.instructor}
                          </div>
                        )}
                        {event.duration_hours && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {event.duration_hours}h
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(event.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(event.status)}
                          {event.status}
                        </span>
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEventClick(event)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              Training event details and status
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status: </span>
                <Badge className={getStatusColor(selectedEvent.status)}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(selectedEvent.status)}
                    {selectedEvent.status}
                  </span>
                </Badge>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                  <span>
                    {format(parseISO(selectedEvent.start), 'PPP')}
                    {selectedEvent.start !== selectedEvent.end && (
                      <span> - {format(parseISO(selectedEvent.end), 'PPP')}</span>
                    )}
                  </span>
                </div>

                {selectedEvent.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}

                {selectedEvent.instructor && (
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{selectedEvent.instructor}</span>
                  </div>
                )}

                {selectedEvent.duration_hours && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{selectedEvent.duration_hours} hours</span>
                  </div>
                )}

                {selectedEvent.category && (
                  <div className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{selectedEvent.category}</span>
                  </div>
                )}
              </div>

              {selectedEvent.completion_date && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center text-green-800">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">
                      Completed on {format(parseISO(selectedEvent.completion_date), 'PPP')}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setEventDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};