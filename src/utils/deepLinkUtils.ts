/**
 * Deep Link Utilities for Notification System
 * Centralized URL management for consistent navigation
 */

export type EntityType =
    | 'training'
    | 'course'
    | 'employee'
    | 'provider'
    | 'certificate'
    | 'notification'
    | 'report';

export interface DeepLinkOptions {
    entityType: EntityType;
    entityId?: string;
    tab?: string;
    action?: string;
    params?: Record<string, string>;
}

/**
 * Generate deep link URLs for different entities
 */
export function generateDeepLink(options: DeepLinkOptions): string {
    const { entityType, entityId, tab, action, params } = options;

    let baseUrl = '';

    switch (entityType) {
        case 'training':
            baseUrl = entityId ? `/scheduling/${entityId}` : '/scheduling';
            break;
        case 'course':
            baseUrl = entityId ? `/courses/${entityId}` : '/courses';
            break;
        case 'employee':
            baseUrl = entityId ? `/participants/${entityId}` : '/participants';
            break;
        case 'provider':
            baseUrl = entityId ? `/providers/${entityId}` : '/providers';
            break;
        case 'certificate':
            baseUrl = '/certifications';
            break;
        case 'notification':
            baseUrl = '/communications';
            break;
        case 'report':
            baseUrl = '/reports';
            break;
        default:
            baseUrl = '/';
    }

    // Add tab if specified
    if (tab) {
        baseUrl += `?tab=${tab}`;
    }

    // Add action if specified
    if (action) {
        const separator = baseUrl.includes('?') ? '&' : '?';
        baseUrl += `${separator}action=${action}`;
    }

    // Add additional params if specified
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            const separator = baseUrl.includes('?') ? '&' : '?';
            baseUrl += `${separator}${key}=${encodeURIComponent(value)}`;
        });
    }

    return baseUrl;
}

/**
 * Predefined deep links for common notification scenarios
 */
export const DeepLinks = {
    // Training-related
    trainingDetail: (trainingId: string) => generateDeepLink({
        entityType: 'training',
        entityId: trainingId
    }),

    trainingSchedule: () => generateDeepLink({
        entityType: 'training'
    }),

    // Course-related
    courseDetail: (courseId: string) => generateDeepLink({
        entityType: 'course',
        entityId: courseId
    }),

    courseList: () => generateDeepLink({
        entityType: 'course'
    }),

    // Employee-related
    employeeProfile: (employeeId: string, tab?: string) => generateDeepLink({
        entityType: 'employee',
        entityId: employeeId,
        tab
    }),

    employeeList: () => generateDeepLink({
        entityType: 'employee'
    }),

    // Provider-related
    providerProfile: (providerId: string, tab?: string) => generateDeepLink({
        entityType: 'provider',
        entityId: providerId,
        tab
    }),

    providerList: () => generateDeepLink({
        entityType: 'provider'
    }),

    // Certificate-related
    certificateExpiry: () => generateDeepLink({
        entityType: 'certificate',
        tab: 'expiry'
    }),

    certificateList: () => generateDeepLink({
        entityType: 'certificate'
    }),

    code95Dashboard: () => generateDeepLink({
        entityType: 'certificate',
        tab: 'code95'
    }),

    // Notification-related
    notificationCenter: () => generateDeepLink({
        entityType: 'notification'
    }),

    // Report-related
    reports: (reportType?: string) => generateDeepLink({
        entityType: 'report',
        tab: reportType
    }),
};

/**
 * Generate contextual deep links based on notification type
 */
export function getNotificationDeepLink(notificationType: string, entityId?: string, entityType?: string): string {
    switch (notificationType) {
        case 'certificate_expiry':
            return DeepLinks.certificateExpiry();

        case 'training_reminder':
        case 'training_enrollment':
        case 'training_cancellation':
            return entityId ? DeepLinks.trainingDetail(entityId) : DeepLinks.trainingSchedule();

        case 'location_change':
        case 'instructor_change':
            return entityId ? DeepLinks.trainingDetail(entityId) : DeepLinks.trainingSchedule();

        case 'approval_required':
        case 'system_announcement':
            return DeepLinks.notificationCenter();

        case 'employee_onboarding':
        case 'employee_departure':
            return entityId && entityType === 'employee'
                ? DeepLinks.employeeProfile(entityId)
                : DeepLinks.employeeList();

        default:
            return DeepLinks.notificationCenter();
    }
}

/**
 * Parse deep link URL to extract entity information
 */
export function parseDeepLink(url: string): { entityType: EntityType | null; entityId: string | null; params: Record<string, string> } {
    const urlObj = new URL(url, window.location.origin);
    const pathname = urlObj.pathname;
    const searchParams = new URLSearchParams(urlObj.search);

    let entityType: EntityType | null = null;
    let entityId: string | null = null;

    // Parse pathname to determine entity type and ID
    if (pathname.startsWith('/scheduling/')) {
        entityType = 'training';
        entityId = pathname.split('/scheduling/')[1];
    } else if (pathname.startsWith('/courses/')) {
        entityType = 'course';
        entityId = pathname.split('/courses/')[1];
    } else if (pathname.startsWith('/participants/')) {
        entityType = 'employee';
        entityId = pathname.split('/participants/')[1];
    } else if (pathname.startsWith('/providers/')) {
        entityType = 'provider';
        entityId = pathname.split('/providers/')[1];
    } else if (pathname.startsWith('/certifications')) {
        entityType = 'certificate';
    } else if (pathname.startsWith('/communications')) {
        entityType = 'notification';
    } else if (pathname.startsWith('/reports')) {
        entityType = 'report';
    }

    // Convert search params to object
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
        params[key] = value;
    });

    return { entityType, entityId, params };
}

/**
 * Validate if a deep link URL is valid
 */
export function isValidDeepLink(url: string): boolean {
    try {
        const { entityType } = parseDeepLink(url);
        return entityType !== null;
    } catch {
        return false;
    }
} 