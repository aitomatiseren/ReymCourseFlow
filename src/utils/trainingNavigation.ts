import { useNavigate } from 'react-router-dom';

export interface TrainingNavigationParams {
  courseId?: string;
  licenseId?: string;
  employeeId?: string;
}

export function useTrainingNavigation() {
  const navigate = useNavigate();

  const navigateToTrainingScheduler = (params: TrainingNavigationParams) => {
    const searchParams = new URLSearchParams();
    
    if (params.courseId) {
      searchParams.append('courseId', params.courseId);
    }
    
    if (params.licenseId) {
      searchParams.append('licenseId', params.licenseId);
    }
    
    if (params.employeeId) {
      searchParams.append('employeeId', params.employeeId);
    }

    const searchString = searchParams.toString();
    const url = `/training-scheduler${searchString ? `?${searchString}` : ''}`;
    
    navigate(url);
  };

  const navigateToTrainingSchedulerForCertificate = (licenseId: string, employeeId?: string) => {
    navigateToTrainingScheduler({
      licenseId,
      employeeId
    });
  };

  return {
    navigateToTrainingScheduler,
    navigateToTrainingSchedulerForCertificate
  };
}

// Helper functions for generating URLs
export function generateTrainingSchedulerUrl(params: TrainingNavigationParams): string {
  const searchParams = new URLSearchParams();
  
  if (params.courseId) {
    searchParams.append('courseId', params.courseId);
  }
  
  if (params.licenseId) {
    searchParams.append('licenseId', params.licenseId);
  }
  
  if (params.employeeId) {
    searchParams.append('employeeId', params.employeeId);
  }

  const searchString = searchParams.toString();
  return `/training-scheduler${searchString ? `?${searchString}` : ''}`;
}

export function generateTrainingSchedulerUrlForCertificate(licenseId: string, employeeId?: string): string {
  return generateTrainingSchedulerUrl({
    licenseId,
    employeeId
  });
}