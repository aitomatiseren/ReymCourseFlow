import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { EventClickArg, DateSelectArg, EventDropArg, EventResizeArg } from '@fullcalendar/core';


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, MapPin, Users, User, Search, Filter } from "lucide-react";

import { useTrainings, Training } from "@/hooks/useTrainings";
import { useCourses } from "@/hooks/useCourses";
import { useProviders } from "@/hooks/useProviders";
import { useToast } from "@/hooks/use-toast";
import { parseISO, format } from "date-fns";

interface EnhancedTrainingCalendarProps {
  onTrainingSelect?: (trainingId: string) => void;
  onCreateTraining?: (date?: Date) => void;
  onEditTraining?: (trainingId: string) => void;
}

export function EnhancedTrainingCalendar({ 
  onTrainingSelect, 
  onCreateTraining,
  onEditTraining 
}: EnhancedTrainingCalendarProps) {
  const { t } = useTranslation(['training', 'common']);
  const { toast } = useToast();
  
  // State management
  const [currentView, setCurrentView] = useState('dayGridMonth');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [courseTypeFilter, setCourseTypeFilter] = useState<string>('all');
  
  // Data hooks
  const { data: trainings = [], isLoading } = useTrainings();
  const { data: courses = [] } = useCourses();
  const { data: providers = [] } = useProviders();

  // Status color mapping
  const getStatusColor = useCallback((status: Training['status']) => {
    const colorMap = {
      'scheduled': '#3B82F6',   // Blue
      'confirmed': '#10B981',   // Green
      'in_progress': '#F59E0B', // Amber
      'completed': '#6B7280',   // Gray
      'cancelled': '#EF4444',   // Red
      'draft': '#9CA3AF'        // Light Gray
    };
    return colorMap[status] || '#6B7280';
  }, []);

  // Transform trainings to calendar events
  const calendarEvents = useMemo(() => {
    const events: any[] = [];
    
    trainings.forEach(training => {
      // Apply filters
      if (searchTerm && !training.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !training.location?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !training.instructor?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return;
      }
      
      if (statusFilter !== 'all' && training.status !== statusFilter) {
        return;
      }
      
      // Filter by provider
      if (providerFilter !== 'all' && training.providerId !== providerFilter) {
        return;
      }
      
      // Filter by course type
      const trainingCourse = courses.find(c => c.id === training.course_id);
      if (courseTypeFilter !== 'all' && (!trainingCourse || trainingCourse.title !== courseTypeFilter)) {
        return;
      }

      // Handle multi-session trainings
      if (training.sessions_count && training.sessions_count > 1 && training.session_dates) {
        training.session_dates.forEach((sessionDate, index) => {
          const sessionTime = training.session_times?.[index] || training.time;
          const sessionEndTime = training.session_end_times?.[index];
          
          let startDateTime, endDateTime;
          
          if (sessionTime) {
            const dateTimeString = `${sessionDate}T${sessionTime}`;
            startDateTime = new Date(dateTimeString);
            endDateTime = sessionEndTime 
              ? new Date(`${sessionDate}T${sessionEndTime}`)
              : new Date(startDateTime.getTime() + (2 * 60 * 60 * 1000)); // Default 2 hours
          } else {
            startDateTime = new Date(sessionDate + 'T09:00:00'); // Default to 9 AM
            endDateTime = new Date(startDateTime.getTime() + (2 * 60 * 60 * 1000));
          }

          events.push({
            id: `${training.id}-session-${index}`,
            title: `${training.title} (${index + 1}/${training.sessions_count})`,
            start: startDateTime,
            end: endDateTime,
            backgroundColor: getStatusColor(training.status),
            borderColor: getStatusColor(training.status),
            textColor: '#ffffff',
            display: 'block',
            allDay: false,
            extendedProps: {
              trainingId: training.id,
              training: training,
              sessionIndex: index,
              isMultiSession: true,
              location: training.location,
              instructor: training.instructor,
              participantCount: training.participantCount || 0,
              maxParticipants: training.maxParticipants || 0,
              status: training.status
            }
          });
        });
      } else {
        // Single session training
        let startDateTime, endDateTime;
        
        if (training.time) {
          const dateTimeString = `${training.date}T${training.time}`;
          startDateTime = new Date(dateTimeString);
          endDateTime = training.session_end_times?.[0] 
            ? new Date(`${training.date}T${training.session_end_times[0]}`)
            : new Date(startDateTime.getTime() + (2 * 60 * 60 * 1000)); // Default 2 hours
        } else {
          startDateTime = new Date(training.date + 'T09:00:00'); // Default to 9 AM
          endDateTime = new Date(startDateTime.getTime() + (2 * 60 * 60 * 1000));
        }

        events.push({
          id: training.id,
          title: training.title,
          start: startDateTime,
          end: endDateTime,
          backgroundColor: getStatusColor(training.status),
          borderColor: getStatusColor(training.status),
          textColor: '#ffffff',
          display: 'block',
          allDay: false,
          extendedProps: {
            trainingId: training.id,
            training: training,
            isMultiSession: false,
            location: training.location,
            instructor: training.instructor,
            participantCount: training.participantCount || 0,
            maxParticipants: training.maxParticipants || 0,
            status: training.status
          }
        });
      }
    });
    
    
    // Debug: log events to console
    console.log('Generated events for calendar:', events);
    
    return events;
  }, [trainings, searchTerm, statusFilter, providerFilter, courseTypeFilter, getStatusColor, providers, courses]);

  // Get unique course types for filter
  const uniqueCourseTypes = useMemo(() => {
    console.log('All courses:', courses);
    const courseTypes = new Set<string>();
    courses.forEach(course => {
      console.log('Course:', course.title, 'level_description:', course.level_description);
      // For now, let's just use the course title as the type until we figure out the right field
      if (course.title) {
        courseTypes.add(course.title);
      }
    });
    console.log('Unique course types:', Array.from(courseTypes));
    return Array.from(courseTypes).sort();
  }, [courses]);

  // Event handlers
  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const { trainingId } = clickInfo.event.extendedProps;
    if (onTrainingSelect) {
      onTrainingSelect(trainingId);
    }
  }, [onTrainingSelect]);

  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    if (onCreateTraining) {
      onCreateTraining(selectInfo.start);
    }
  }, [onCreateTraining]);

  const handleEventDrop = useCallback((dropInfo: EventDropArg) => {
    const { trainingId, isMultiSession, sessionIndex } = dropInfo.event.extendedProps;
    
    toast({
      title: "Event Moved",
      description: `Training "${dropInfo.event.title}" moved to ${format(dropInfo.event.start!, 'PPP')}`,
    });

    // TODO: Implement actual training update logic
    console.log('Event dropped:', {
      trainingId,
      newDate: dropInfo.event.start,
      isMultiSession,
      sessionIndex
    });
  }, [toast]);

  const handleEventResize = useCallback((resizeInfo: EventResizeArg) => {
    const { trainingId } = resizeInfo.event.extendedProps;
    
    toast({
      title: "Event Resized",
      description: `Training duration updated`,
    });

    // TODO: Implement actual training duration update logic
    console.log('Event resized:', {
      trainingId,
      newStart: resizeInfo.event.start,
      newEnd: resizeInfo.event.end
    });
  }, [toast]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setProviderFilter('all');
    setCourseTypeFilter('all');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">{t('training:scheduler.loadingData')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <div className="flex items-center space-x-2">
              <CardTitle>{t('training:scheduler.calendar.title', 'Training Calendar')}</CardTitle>
            </div>
            
            <div className="flex flex-col space-y-3 lg:flex-row lg:space-y-0 lg:space-x-2">
              {/* Search - Full width on mobile */}
              <div className="relative w-full lg:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t('training:scheduler.calendar.searchPlaceholder', 'Search trainings...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>

              {/* Filter row - Stack on mobile */}
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                {/* Provider Filter */}
                <Select value={providerFilter} onValueChange={setProviderFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Providers</SelectItem>
                    {providers.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Course Type Filter */}
                <Select value={courseTypeFilter} onValueChange={setCourseTypeFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Course Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {uniqueCourseTypes.map((courseType) => (
                      <SelectItem key={courseType} value={courseType}>
                        {courseType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action buttons row */}
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                {/* Clear Filters */}
                <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto">
                  <Filter className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar */}
      <Card>
        <CardContent className="p-6">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView={currentView}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
            }}
            events={calendarEvents}
            selectable={true}
            selectMirror={true}
            editable={true}
            droppable={true}
            dayMaxEvents={true}
            weekends={true}
            height="auto"
            contentHeight="600px"
            aspectRatio={1.8}
            displayEventTime={true}
            displayEventEnd={false}
            eventDisplay="block"
            eventMaxStack={3}
            eventShortHeight={16}
            eventMinHeight={14}
            slotEventOverlap={false}
            
            // List view specific settings
            listDayFormat={{ weekday: 'long', month: 'long', day: 'numeric' }}
            listDaySideFormat={false}
            noEventsText="No training sessions scheduled"
            
            // Event handlers
            eventClick={handleEventClick}
            select={handleDateSelect}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            
            // Customization
            slotMinTime="07:00:00"
            slotMaxTime="22:00:00"
            allDaySlot={false}
            slotDuration="00:30:00"
            
            // Enhanced event rendering for different views
            eventContent={(eventInfo) => {
              const { extendedProps } = eventInfo.event;
              const startTime = eventInfo.event.start ? format(eventInfo.event.start, 'HH:mm') : '';
              const endTime = eventInfo.event.end ? format(eventInfo.event.end, 'HH:mm') : '';
              const isMonthView = currentView === 'dayGridMonth';
              const isWeekView = currentView === 'timeGridWeek';
              const isDayView = currentView === 'timeGridDay';
              const isListView = currentView === 'listWeek';
              
              // For list view, create custom content to force title display
              if (isListView) {
                return (
                  <div className="w-full py-1">
                    <div className="font-medium text-gray-900 text-sm leading-tight">
                      {eventInfo.event.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 space-y-1">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {startTime}{endTime ? ` - ${endTime}` : ''}
                      </div>
                      {extendedProps.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {extendedProps.location}
                        </div>
                      )}
                      {extendedProps.instructor && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {extendedProps.instructor}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
              
              // Simplified rendering for month view
              if (isMonthView) {
                return (
                  <div 
                    className="w-full h-full px-1 py-0.5 cursor-pointer"
                    style={{ 
                      backgroundColor: 'inherit',
                      color: 'white',
                      fontSize: '11px',
                      lineHeight: '1.2'
                    }}
                    title={`${eventInfo.event.title}
${startTime}${endTime ? ' - ' + endTime : ''}
${extendedProps.location ? 'Location: ' + extendedProps.location : ''}
${extendedProps.instructor ? 'Instructor: ' + extendedProps.instructor : ''}
Participants: ${extendedProps.participantCount}/${extendedProps.maxParticipants}
Status: ${extendedProps.status}`}
                  >
                    <div className="font-medium truncate" style={{ color: 'white' }}>
                      {eventInfo.event.title}
                    </div>
                    {startTime && (
                      <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '10px' }}>
                        {startTime}
                      </div>
                    )}
                  </div>
                );
              }
              
              // Compact rendering for week view
              if (isWeekView) {
                return (
                  <div 
                    className="p-1 cursor-pointer h-full overflow-hidden"
                    style={{ 
                      backgroundColor: 'inherit',
                      color: 'white',
                      fontSize: '10px',
                      lineHeight: '1.1'
                    }}
                    title={`${eventInfo.event.title}
${startTime}${endTime ? ' - ' + endTime : ''}
${extendedProps.location ? 'Location: ' + extendedProps.location : ''}
${extendedProps.instructor ? 'Instructor: ' + extendedProps.instructor : ''}
Participants: ${extendedProps.participantCount}/${extendedProps.maxParticipants}
Status: ${extendedProps.status}`}
                  >
                    <div className="font-semibold truncate mb-0.5" style={{ color: 'white', fontSize: '10px' }}>
                      {eventInfo.event.title}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '9px' }}>
                      {startTime}
                    </div>
                    {extendedProps.location && (
                      <div className="truncate" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '8px' }}>
                        📍 {extendedProps.location}
                      </div>
                    )}
                  </div>
                );
              }
              
              // Detailed rendering for day view
              if (isDayView) {
                return (
                  <div 
                    className="p-2 cursor-pointer h-full overflow-hidden"
                    style={{ 
                      backgroundColor: 'inherit',
                      color: 'white',
                      fontSize: '11px',
                      lineHeight: '1.2'
                    }}
                    title={`${eventInfo.event.title}
${startTime}${endTime ? ' - ' + endTime : ''}
${extendedProps.location ? 'Location: ' + extendedProps.location : ''}
${extendedProps.instructor ? 'Instructor: ' + extendedProps.instructor : ''}
Participants: ${extendedProps.participantCount}/${extendedProps.maxParticipants}
Status: ${extendedProps.status}`}
                  >
                    <div className="font-semibold truncate mb-1" style={{ color: 'white' }}>
                      {eventInfo.event.title}
                    </div>
                    <div className="flex items-center mb-1" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '10px' }}>
                      <Clock className="h-3 w-3 mr-1" />
                      {startTime}{endTime ? ` - ${endTime}` : ''}
                    </div>
                    {extendedProps.location && (
                      <div className="flex items-center mb-1" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '10px' }}>
                        <MapPin className="h-3 w-3 mr-1" />
                        <span className="truncate">{extendedProps.location}</span>
                      </div>
                    )}
                    {extendedProps.instructor && (
                      <div className="truncate" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '10px' }}>
                        👨‍🏫 {extendedProps.instructor}
                      </div>
                    )}
                    <div className="flex items-center mt-1" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '9px' }}>
                      <Users className="h-2.5 w-2.5 mr-1" />
                      {extendedProps.participantCount}/{extendedProps.maxParticipants}
                    </div>
                  </div>
                );
              }
              
              // Default rendering for other views
              return (
                <div 
                  className="p-1 text-xs cursor-pointer hover:opacity-90 transition-opacity h-full overflow-hidden"
                  style={{ backgroundColor: 'inherit', color: 'white' }}
                  title={`${eventInfo.event.title}
${startTime}${endTime ? ' - ' + endTime : ''}
${extendedProps.location ? 'Location: ' + extendedProps.location : ''}
${extendedProps.instructor ? 'Instructor: ' + extendedProps.instructor : ''}
Participants: ${extendedProps.participantCount}/${extendedProps.maxParticipants}
Status: ${extendedProps.status}`}
                >
                  <div className="font-medium truncate text-white">{eventInfo.event.title}</div>
                  <div className="text-xs text-white/90 mt-1">{startTime}</div>
                </div>
              );
            }}
            
            // View change handler
            viewDidMount={(view) => {
              setCurrentView(view.view.type);
            }}
          />
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium">{t('training:scheduler.calendar.legend', 'Status Legend')}:</span>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded bg-blue-500"></div>
              <span className="text-xs">Scheduled</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span className="text-xs">Confirmed</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded bg-amber-500"></div>
              <span className="text-xs">In Progress</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded bg-gray-500"></div>
              <span className="text-xs">Completed</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded bg-red-500"></div>
              <span className="text-xs">Cancelled</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}