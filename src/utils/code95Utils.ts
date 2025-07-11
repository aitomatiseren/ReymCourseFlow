import { Employee, Certificate } from '@/types';
import { differenceInDays, parseISO, isBefore, addYears } from 'date-fns';

export type Code95Status = 'compliant' | 'expiring' | 'expired' | 'not_required';

export interface Code95Progress {
  pointsEarned: number;
  pointsRequired: number;
  expiryDate: string | null;
  status: Code95Status;
  daysUntilExpiry: number | null;
  needsTraining: boolean;
}

/**
 * Determines if an employee needs Code 95 certification based on their driving licenses
 */
export const requiresCode95 = (employee: Employee): boolean => {
  return !!(
    employee.drivingLicenseC ||
    employee.drivingLicenseCE ||
    employee.drivingLicenseD ||
    employee.drivingLicenseCode95
  );
};

/**
 * Determines if an employee needs Code 95 training
 */
export const needsCode95Training = (employee: Employee, certificates: Certificate[] = []): boolean => {
  if (!requiresCode95(employee)) {
    return false;
  }

  const progress = calculateCode95Progress(employee, certificates);
  
  // Needs training if expired, expiring soon, or doesn't have enough points
  return progress.status === 'expired' || 
         progress.status === 'expiring' || 
         progress.pointsEarned < progress.pointsRequired;
};

/**
 * Gets the Code 95 compliance status for an employee
 */
export const getCode95Status = (employee: Employee, certificates: Certificate[] = []): Code95Status => {
  if (!requiresCode95(employee)) {
    return 'not_required';
  }

  const progress = calculateCode95Progress(employee, certificates);
  return progress.status;
};

/**
 * Calculates Code 95 progress for an employee
 */
export const calculateCode95Progress = (employee: Employee, certificates: Certificate[] = []): Code95Progress => {
  if (!requiresCode95(employee)) {
    return {
      pointsEarned: 0,
      pointsRequired: 0,
      expiryDate: null,
      status: 'not_required',
      daysUntilExpiry: null,
      needsTraining: false
    };
  }

  // Get Code 95 expiry date from employee record
  const expiryDate = employee.drivingLicenseCode95ExpiryDate;
  
  // Calculate points from certificates
  const code95Certificates = certificates.filter(cert => 
    cert.employeeId === employee.id && 
    cert.code95Points && 
    cert.code95Points > 0
  );
  
  const pointsEarned = code95Certificates.reduce((sum, cert) => sum + (cert.code95Points || 0), 0);
  const pointsRequired = 35; // Standard Code 95 requirement (35 hours every 5 years)
  
  let status: Code95Status = 'compliant';
  let daysUntilExpiry: number | null = null;
  
  if (expiryDate) {
    const today = new Date();
    const expiry = parseISO(expiryDate);
    daysUntilExpiry = differenceInDays(expiry, today);
    
    if (isBefore(expiry, today)) {
      status = 'expired';
    } else if (daysUntilExpiry <= 90) { // Expiring within 3 months
      status = 'expiring';
    }
  } else {
    // No expiry date set - consider expired if they have Code 95 license
    if (employee.drivingLicenseCode95) {
      status = 'expired';
    }
  }
  
  // If they don't have enough points, they need training regardless of expiry
  const needsTraining = pointsEarned < pointsRequired || status === 'expired' || status === 'expiring';
  
  return {
    pointsEarned,
    pointsRequired,
    expiryDate,
    status,
    daysUntilExpiry,
    needsTraining
  };
};

/**
 * Gets the next Code 95 renewal date for an employee
 */
export const getCode95ExpiryDate = (employee: Employee): Date | null => {
  if (!requiresCode95(employee) || !employee.drivingLicenseCode95ExpiryDate) {
    return null;
  }
  
  return parseISO(employee.drivingLicenseCode95ExpiryDate);
};

/**
 * Suggests the type of Code 95 training an employee needs
 */
export const suggestCode95Training = (employee: Employee, certificates: Certificate[] = []): string | null => {
  if (!needsCode95Training(employee, certificates)) {
    return null;
  }
  
  const progress = calculateCode95Progress(employee, certificates);
  
  if (progress.status === 'expired') {
    return 'Urgent: Code 95 renewal required';
  } else if (progress.status === 'expiring') {
    return 'Code 95 renewal recommended';
  } else if (progress.pointsEarned < progress.pointsRequired) {
    const pointsNeeded = progress.pointsRequired - progress.pointsEarned;
    return `${pointsNeeded} Code 95 points needed`;
  }
  
  return null;
};

/**
 * Gets a user-friendly description of Code 95 status
 */
export const getCode95StatusDescription = (status: Code95Status, daysUntilExpiry: number | null): string => {
  switch (status) {
    case 'compliant':
      return daysUntilExpiry ? `Valid (expires in ${daysUntilExpiry} days)` : 'Valid';
    case 'expiring':
      return daysUntilExpiry ? `Expiring in ${daysUntilExpiry} days` : 'Expiring soon';
    case 'expired':
      return 'Expired - renewal required';
    case 'not_required':
      return 'Not required';
    default:
      return 'Unknown';
  }
};

/**
 * Gets the appropriate color class for Code 95 status display
 */
export const getCode95StatusColor = (status: Code95Status): string => {
  switch (status) {
    case 'compliant':
      return 'text-green-600 bg-green-100';
    case 'expiring':
      return 'text-yellow-600 bg-yellow-100';
    case 'expired':
      return 'text-red-600 bg-red-100';
    case 'not_required':
      return 'text-gray-600 bg-gray-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

/**
 * Gets the appropriate emoji indicator for Code 95 status
 */
export const getCode95StatusEmoji = (status: Code95Status): string => {
  switch (status) {
    case 'compliant':
      return '🟢';
    case 'expiring':
      return '🟡';
    case 'expired':
      return '🔴';
    case 'not_required':
      return '⚪';
    default:
      return '⚪';
  }
};