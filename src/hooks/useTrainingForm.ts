
import { useState } from "react";

interface UseTrainingFormProps {
  preSelectedCourseId?: string;
  courses: any[];
}

export function useTrainingForm({ preSelectedCourseId, courses }: UseTrainingFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    courseId: preSelectedCourseId || "",
    instructor: "",
    date: "",
    time: "",
    location: "",
    maxParticipants: "",
    requiresApproval: false,
    sessions: 1,
    sessionDates: [] as string[],
    sessionTimes: [] as string[],
    sessionEndTimes: [] as string[],
    checkedItems: [] as boolean[]
  });

  const selectedCourse = courses.find(c => c.id === formData.courseId);

  const handleCourseChange = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    const sessionsRequired = course?.sessions_required || 1;
    
    setFormData(prev => ({
      ...prev,
      courseId,
      title: course ? `${course.title} - Training Session` : prev.title,
      maxParticipants: course?.max_participants?.toString() || prev.maxParticipants,
      sessions: sessionsRequired,
      // Initialize arrays based on required sessions
      sessionDates: Array(sessionsRequired).fill(''),
      sessionTimes: Array(sessionsRequired).fill(''),
      sessionEndTimes: Array(sessionsRequired).fill(''),
      checkedItems: course?.has_checklist && course.checklist_items ? 
        new Array((course.checklist_items as string[]).length).fill(false) : []
    }));
  };

  const handleSessionsChange = (sessions: number) => {
    const newSessionDates = Array(sessions).fill('');
    const newSessionTimes = Array(sessions).fill('');
    const newSessionEndTimes = Array(sessions).fill('');
    
    // Keep existing values if they exist
    for (let i = 0; i < Math.min(sessions, formData.sessionDates.length); i++) {
      newSessionDates[i] = formData.sessionDates[i] || '';
      newSessionTimes[i] = formData.sessionTimes[i] || '';
      newSessionEndTimes[i] = formData.sessionEndTimes[i] || '';
    }
    
    setFormData(prev => ({
      ...prev,
      sessions,
      sessionDates: newSessionDates,
      sessionTimes: newSessionTimes,
      sessionEndTimes: newSessionEndTimes
    }));
  };

  const updateSessionDate = (index: number, date: string) => {
    const newDates = [...formData.sessionDates];
    newDates[index] = date;
    setFormData(prev => ({ ...prev, sessionDates: newDates }));
  };

  const updateSessionTime = (index: number, time: string) => {
    const newTimes = [...formData.sessionTimes];
    newTimes[index] = time;
    setFormData(prev => ({ ...prev, sessionTimes: newTimes }));
  };

  const updateSessionEndTime = (index: number, endTime: string) => {
    const newEndTimes = [...formData.sessionEndTimes];
    newEndTimes[index] = endTime;
    setFormData(prev => ({ ...prev, sessionEndTimes: newEndTimes }));
  };

  const handleChecklistItemChange = (index: number, checked: boolean) => {
    const newCheckedItems = [...formData.checkedItems];
    newCheckedItems[index] = checked;
    setFormData(prev => ({ ...prev, checkedItems: newCheckedItems }));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      courseId: preSelectedCourseId || "",
      instructor: "",
      date: "",
      time: "",
      location: "",
      maxParticipants: "",
      requiresApproval: false,
      sessions: 1,
      sessionDates: [],
      sessionTimes: [],
      sessionEndTimes: [],
      checkedItems: []
    });
  };

  return {
    formData,
    setFormData,
    selectedCourse,
    handleCourseChange,
    handleSessionsChange,
    updateSessionDate,
    updateSessionTime,
    updateSessionEndTime,
    handleChecklistItemChange,
    resetForm
  };
}
