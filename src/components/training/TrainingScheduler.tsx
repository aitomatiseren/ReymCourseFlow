
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { useTrainings } from "@/hooks/useTrainings";
import { useCourses } from "@/hooks/useCourses";
import { useTrainingParticipants } from "@/hooks/useTrainingParticipants";
import { CreateTrainingDialog } from "./CreateTrainingDialog";
import { AddParticipantDialog } from "./AddParticipantDialog";
import { EnhancedTrainingCalendar } from "./EnhancedTrainingCalendar";
import { TrainingTimeline } from "./TrainingTimeline";
import { TrainingListView } from "./TrainingListView";
import { TrainingSchedulerHeader } from "./TrainingSchedulerHeader";
import { TrainingGridView } from "./TrainingGridView";
import { TrainingDetailsView } from "./TrainingDetailsView";
import { TrainingViewMode } from "./TrainingViewToggle";
import { useToast } from "@/hooks/use-toast";

export function TrainingScheduler() {
  const { t } = useTranslation(['training']);
  const [searchParams] = useSearchParams();
  const [selectedTrainingId, setSelectedTrainingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'view' | 'edit'>('list');
  const [displayMode, setDisplayMode] = useState<TrainingViewMode>(() => {
    const saved = localStorage.getItem('training-scheduler-view');
    return (saved as TrainingViewMode) || 'list';
  });
  const [highlightedTrainingId, setHighlightedTrainingId] = useState<string | null>(null);

  const handleDisplayModeChange = (mode: TrainingViewMode) => {
    setDisplayMode(mode);
    localStorage.setItem('training-scheduler-view', mode);
  };

  const preSelectedCourseId = searchParams.get('courseId');
  const preSelectedLicenseId = searchParams.get('licenseId');
  const preSelectedEmployeeId = searchParams.get('employeeId');
  const { toast } = useToast();

  const { data: trainings = [], isLoading: trainingsLoading, error: trainingsError } = useTrainings();
  const { data: courses = [], isLoading: coursesLoading } = useCourses();
  const { participants, removeParticipant } = useTrainingParticipants(selectedTrainingId || undefined);

  const selectedTraining = trainings.find(t => t.id === selectedTrainingId);

  // Auto-open create dialog if courseId or licenseId is provided
  useEffect(() => {
    if ((preSelectedCourseId || preSelectedLicenseId) && courses.length > 0) {
      setShowCreateForm(true);
    }
  }, [preSelectedCourseId, preSelectedLicenseId, courses.length]);

  // Check for highlight parameter in URL
  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    if (highlightId) {
      setHighlightedTrainingId(highlightId);
      // Clear the highlight after a few seconds
      setTimeout(() => setHighlightedTrainingId(null), 3000);
    }
  }, [searchParams]);

  const handleTrainingSelect = (trainingId: string) => {
    setSelectedTrainingId(trainingId);
    setViewMode('view');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedTrainingId(null);
  };

  const handleEditTraining = () => {
    // Edit is now handled by the EditTrainingDialog in TrainingDetailsView
  };

  const handleSendNotifications = (trainingId: string) => {
    console.log(`Sending notifications for training ${trainingId}`);
    toast({
      title: t('training:scheduler.notificationsSent'),
      description: t('training:scheduler.notificationsSentDesc')
    });
  };

  const handleGenerateAttendanceList = (trainingId: string) => {
    console.log(`Generating attendance list for training ${trainingId}`);
    toast({
      title: t('training:scheduler.attendanceListGenerated'),
      description: t('training:scheduler.attendanceListDesc')
    });
  };

  if (trainingsLoading || coursesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>{t('training:scheduler.loadingData')}</span>
      </div>
    );
  }

  if (trainingsError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{t('training:scheduler.errorLoading')} {trainingsError.message}</p>
      </div>
    );
  }

  // Show view or editor based on mode
  if (viewMode === 'view' && selectedTraining) {
    return (
      <>
        <TrainingDetailsView
          training={selectedTraining}
          onBack={handleBackToList}
          onEdit={handleEditTraining}
          onAddParticipant={() => setShowAddParticipant(true)}
          onSendNotifications={handleSendNotifications}
          onGenerateAttendanceList={handleGenerateAttendanceList}
          onRemoveParticipant={(id) => removeParticipant.mutate(id)}
        />
        {selectedTrainingId && (
          <AddParticipantDialog
            open={showAddParticipant}
            onOpenChange={setShowAddParticipant}
            trainingId={selectedTrainingId}
          />
        )}
      </>
    );
  }


  return (
    <div className="space-y-6">
      <TrainingSchedulerHeader
        onCreateTraining={() => setShowCreateForm(true)}
        viewMode={displayMode}
        onViewModeChange={handleDisplayModeChange}
      />

      {displayMode === 'list' && (
        <TrainingListView
          trainings={trainings}
          onTrainingSelect={handleTrainingSelect}
          onCreateTraining={() => setShowCreateForm(true)}
          highlightedTrainingId={highlightedTrainingId}
        />
      )}

      {displayMode === 'grid' && (
        <TrainingGridView
          trainings={trainings}
          onTrainingSelect={handleTrainingSelect}
          onCreateTraining={() => setShowCreateForm(true)}
          highlightedTrainingId={highlightedTrainingId}
        />
      )}

      {displayMode === 'timeline' && (
        <TrainingTimeline
          onTrainingSelect={handleTrainingSelect}
          selectedTrainingId={selectedTrainingId}
        />
      )}

      {displayMode === 'calendar' && (
        <EnhancedTrainingCalendar
          onTrainingSelect={handleTrainingSelect}
          onCreateTraining={() => setShowCreateForm(true)}
        />
      )}

      <CreateTrainingDialog
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        preSelectedCourseId={preSelectedCourseId || undefined}
        preSelectedLicenseId={preSelectedLicenseId || undefined}
        preSelectedEmployeeId={preSelectedEmployeeId || undefined}
      />

      {selectedTrainingId && (
        <AddParticipantDialog
          open={showAddParticipant}
          onOpenChange={setShowAddParticipant}
          trainingId={selectedTrainingId}
        />
      )}
    </div>
  );
}
