// Employee Status Constants and Types

export type EmployeeStatus = 
  | 'active'
  | 'inactive' 
  | 'on_leave'
  | 'sick_short'
  | 'sick_long'
  | 'vacation'
  | 'unavailable'
  | 'terminated';

export interface StatusOption {
  value: EmployeeStatus;
  label: string;
  color: string;
  icon?: string;
  description?: string;
  requiresEndDate?: boolean;
  allowedTransitions?: EmployeeStatus[];
}

export const EMPLOYEE_STATUS_OPTIONS: StatusOption[] = [
  {
    value: 'active',
    label: 'Active',
    color: 'bg-green-100 text-green-800',
    description: 'Employee is actively working',
    allowedTransitions: ['inactive', 'on_leave', 'sick_short', 'sick_long', 'vacation', 'unavailable', 'terminated']
  },
  {
    value: 'inactive',
    label: 'Inactive',
    color: 'bg-gray-100 text-gray-800',
    description: 'Employee is temporarily not working',
    allowedTransitions: ['active', 'terminated']
  },
  {
    value: 'on_leave',
    label: 'On Leave',
    color: 'bg-yellow-100 text-yellow-800',
    description: 'Employee is on extended leave',
    requiresEndDate: true,
    allowedTransitions: ['active', 'terminated']
  },
  {
    value: 'sick_short',
    label: 'Short-term Sick Leave',
    color: 'bg-orange-100 text-orange-800',
    description: 'Employee is on short-term sick leave (typically up to 6 weeks)',
    requiresEndDate: false, // Optional end date
    allowedTransitions: ['active', 'sick_long', 'terminated']
  },
  {
    value: 'sick_long',
    label: 'Long-term Sick Leave',
    color: 'bg-red-100 text-red-800',
    description: 'Employee is on long-term sick leave (typically 6+ weeks)',
    requiresEndDate: false, // Optional end date
    allowedTransitions: ['active', 'sick_short', 'terminated']
  },
  {
    value: 'vacation',
    label: 'Vacation',
    color: 'bg-blue-100 text-blue-800',
    description: 'Employee is on vacation',
    requiresEndDate: true,
    allowedTransitions: ['active']
  },
  {
    value: 'unavailable',
    label: 'Unavailable',
    color: 'bg-purple-100 text-purple-800',
    description: 'Employee is temporarily unavailable',
    requiresEndDate: true,
    allowedTransitions: ['active', 'terminated']
  },
  {
    value: 'terminated',
    label: 'Terminated',
    color: 'bg-red-100 text-red-800',
    description: 'Employee employment has ended',
    allowedTransitions: [] // Cannot transition from terminated without rehire process
  }
];

// Helper functions
export const getStatusOption = (status: EmployeeStatus): StatusOption | undefined => {
  return EMPLOYEE_STATUS_OPTIONS.find(option => option.value === status);
};

export const getStatusColor = (status: EmployeeStatus): string => {
  return getStatusOption(status)?.color || 'bg-gray-100 text-gray-800';
};

export const getStatusLabel = (status: EmployeeStatus): string => {
  return getStatusOption(status)?.label || status;
};

export const isValidTransition = (fromStatus: EmployeeStatus, toStatus: EmployeeStatus): boolean => {
  const statusOption = getStatusOption(fromStatus);
  return statusOption?.allowedTransitions?.includes(toStatus) || false;
};

export const requiresEndDate = (status: EmployeeStatus): boolean => {
  return getStatusOption(status)?.requiresEndDate || false;
};

// Common status groups
export const ACTIVE_STATUSES: EmployeeStatus[] = ['active'];
export const TEMPORARY_STATUSES: EmployeeStatus[] = ['on_leave', 'sick_short', 'sick_long', 'vacation', 'unavailable'];
export const SICK_STATUSES: EmployeeStatus[] = ['sick_short', 'sick_long'];
export const INACTIVE_STATUSES: EmployeeStatus[] = ['inactive', 'terminated'];
export const ALL_STATUSES = EMPLOYEE_STATUS_OPTIONS.map(option => option.value);