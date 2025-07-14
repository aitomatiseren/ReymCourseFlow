import { Tables } from '@/integrations/supabase/types';

type License = Tables<'licenses'>;
type EmployeeLicense = Tables<'employee_licenses'>;
type Course = Tables<'courses'>;

export interface CertificateValidationResult {
  isValid: boolean;
  canEnroll: boolean;
  requiresHigherLevel: boolean;
  missingPrerequisites: License[];
  recommendedLevel?: number;
  message: string;
}

export interface RenewalEligibilityResult {
  canRenewAtCurrentLevel: boolean;
  currentLevel: number;
  requiredLevel: number;
  needsRetraining: boolean;
  message: string;
}

/**
 * Validates if an employee can enroll in a training based on certificate hierarchy
 */
export const validateTrainingEnrollment = (
  course: Course,
  employeeLicenses: EmployeeLicense[],
  allLicenses: License[],
  prerequisites: Record<string, License[]>
): CertificateValidationResult => {
  
  // If course has no level requirement, allow enrollment
  if (!course.level || course.level === 1) {
    return {
      isValid: true,
      canEnroll: true,
      requiresHigherLevel: false,
      missingPrerequisites: [],
      message: 'No special requirements for this course.'
    };
  }

  // Find the license this course is related to (by category or name matching)
  const relatedLicense = allLicenses.find(license => 
    license.category === course.category ||
    license.name.toLowerCase().includes(course.title.toLowerCase())
  );

  if (!relatedLicense) {
    return {
      isValid: true,
      canEnroll: true,
      requiresHigherLevel: false,
      missingPrerequisites: [],
      message: 'Course does not require specific certificate prerequisites.'
    };
  }

  // Get employee's current achievement for this license type
  const employeeLicense = employeeLicenses.find(el => 
    el.license_id === relatedLicense.id && el.status === 'valid'
  );

  const currentLevel = employeeLicense?.level_achieved || 0;
  const courseLevel = course.level;

  // Check if employee already has the required level or higher
  if (currentLevel >= courseLevel) {
    return {
      isValid: true,
      canEnroll: true,
      requiresHigherLevel: false,
      missingPrerequisites: [],
      recommendedLevel: currentLevel,
      message: `Employee already has level ${currentLevel}, sufficient for this level ${courseLevel} course.`
    };
  }

  // Check if this is a valid progression (max 1 level jump)
  if (courseLevel > currentLevel + 1) {
    return {
      isValid: false,
      canEnroll: false,
      requiresHigherLevel: true,
      missingPrerequisites: [],
      recommendedLevel: currentLevel + 1,
      message: `Employee must complete level ${currentLevel + 1} before attempting level ${courseLevel}.`
    };
  }

  // Check prerequisites for the target level
  const coursePrerequisites = prerequisites[relatedLicense.id] || [];
  const missingPrerequisites = coursePrerequisites.filter(prereq => 
    !employeeLicenses.some(el => 
      el.license_id === prereq.id && 
      el.status === 'valid'
    )
  );

  if (missingPrerequisites.length > 0) {
    return {
      isValid: false,
      canEnroll: false,
      requiresHigherLevel: false,
      missingPrerequisites,
      message: `Missing required prerequisites: ${missingPrerequisites.map(p => p.name).join(', ')}`
    };
  }

  // Employee can enroll
  return {
    isValid: true,
    canEnroll: true,
    requiresHigherLevel: false,
    missingPrerequisites: [],
    recommendedLevel: courseLevel,
    message: `Employee eligible for level ${courseLevel} training.`
  };
};

/**
 * Checks if an employee can renew a certificate at their current level
 */
export const checkRenewalEligibility = (
  employeeLicense: EmployeeLicense,
  license: License
): RenewalEligibilityResult => {
  
  const currentLevel = employeeLicense.level_achieved || 1;
  const canRenewFromLevel = employeeLicense.can_renew_from_level || 1;
  const licenseLevel = license.level || 1;

  // Can renew if current level meets or exceeds the renewal threshold
  const canRenewAtCurrentLevel = currentLevel >= canRenewFromLevel;

  if (canRenewAtCurrentLevel) {
    return {
      canRenewAtCurrentLevel: true,
      currentLevel,
      requiredLevel: canRenewFromLevel,
      needsRetraining: false,
      message: `Can renew certificate at current level ${currentLevel}.`
    };
  }

  return {
    canRenewAtCurrentLevel: false,
    currentLevel,
    requiredLevel: canRenewFromLevel,
    needsRetraining: true,
    message: `Must retrain from level ${canRenewFromLevel} to renew certificate.`
  };
};

/**
 * Suggests the next training level for an employee
 */
export const suggestNextTrainingLevel = (
  employeeLicenses: EmployeeLicense[],
  license: License
): number => {
  const currentLicenses = employeeLicenses.filter(el => 
    el.license_id === license.id && el.status === 'valid'
  );

  if (currentLicenses.length === 0) {
    return 1; // Start with level 1
  }

  const highestLevel = Math.max(...currentLicenses.map(el => el.level_achieved || 1));
  const maxLevel = license.level || 5; // Assume max 5 levels if not specified

  return Math.min(highestLevel + 1, maxLevel);
};

/**
 * Gets all available training levels for a license based on employee's current achievement
 */
export const getAvailableTrainingLevels = (
  employeeLicenses: EmployeeLicense[],
  license: License,
  maxLevel: number = 5
): number[] => {
  const currentLevel = employeeLicenses
    .filter(el => el.license_id === license.id && el.status === 'valid')
    .reduce((max, el) => Math.max(max, el.level_achieved || 0), 0);

  const availableLevels: number[] = [];
  
  // Always allow level 1
  if (currentLevel === 0) {
    availableLevels.push(1);
  }
  
  // Allow next level if not at max
  if (currentLevel > 0 && currentLevel < maxLevel) {
    availableLevels.push(currentLevel + 1);
  }
  
  // Allow renewal at current level if has renewal privileges
  const currentLicense = employeeLicenses.find(el => 
    el.license_id === license.id && el.status === 'valid'
  );
  
  if (currentLicense && 
      currentLevel > 0 && 
      currentLevel >= (currentLicense.can_renew_from_level || 1)) {
    if (!availableLevels.includes(currentLevel)) {
      availableLevels.push(currentLevel);
    }
  }

  return availableLevels.sort((a, b) => a - b);
};

/**
 * Calculates certificate expiry extension based on level achieved
 */
export const calculateExpiryExtension = (
  level: number,
  baseValidityMonths: number
): number => {
  // Higher levels get longer validity periods
  const levelMultiplier = {
    1: 1.0,
    2: 1.2,
    3: 1.5,
    4: 2.0,
    5: 3.0
  }[level] || 1.0;

  return Math.round(baseValidityMonths * levelMultiplier);
};

/**
 * Generates automatic course recommendations based on certificate hierarchy
 */
export const generateCourseRecommendations = (
  employeeId: string,
  employeeLicenses: EmployeeLicense[],
  allLicenses: License[],
  expiringLicenses: EmployeeLicense[]
): Array<{
  licenseId: string;
  licenseName: string;
  recommendedLevel: number;
  reason: 'renewal' | 'progression' | 'prerequisite';
  urgency: 'high' | 'medium' | 'low';
  daysUntilExpiry?: number;
}> => {
  const recommendations: Array<{
    licenseId: string;
    licenseName: string;
    recommendedLevel: number;
    reason: 'renewal' | 'progression' | 'prerequisite';
    urgency: 'high' | 'medium' | 'low';
    daysUntilExpiry?: number;
  }> = [];

  // Add renewal recommendations for expiring licenses
  expiringLicenses.forEach(expiring => {
    const license = allLicenses.find(l => l.id === expiring.license_id);
    if (!license) return;

    const daysUntilExpiry = expiring.expiry_date ? 
      Math.ceil((new Date(expiring.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 
      999;

    recommendations.push({
      licenseId: license.id,
      licenseName: license.name,
      recommendedLevel: expiring.level_achieved || 1,
      reason: 'renewal',
      urgency: daysUntilExpiry <= 30 ? 'high' : daysUntilExpiry <= 90 ? 'medium' : 'low',
      daysUntilExpiry
    });
  });

  // Add progression recommendations
  allLicenses.forEach(license => {
    const currentLevel = employeeLicenses
      .filter(el => el.license_id === license.id && el.status === 'valid')
      .reduce((max, el) => Math.max(max, el.level_achieved || 0), 0);

    if (currentLevel > 0 && currentLevel < (license.level || 5)) {
      recommendations.push({
        licenseId: license.id,
        licenseName: license.name,
        recommendedLevel: currentLevel + 1,
        reason: 'progression',
        urgency: 'low'
      });
    }
  });

  return recommendations;
};