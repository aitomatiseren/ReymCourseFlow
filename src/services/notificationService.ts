import { supabase } from '@/integrations/supabase/client';
import { CreateNotificationData, CreateBulkNotificationData } from '@/hooks/useNotifications';
import { DeepLinks, getNotificationDeepLink } from '@/utils/deepLinkUtils';

export class NotificationService {

    // Create a single notification
    static async createNotification(data: CreateNotificationData): Promise<string | null> {
        try {
            const { data: result, error } = await supabase
                .rpc('create_notification', {
                    p_recipient_id: data.recipient_id,
                    p_type: data.type,
                    p_title: data.title,
                    p_message: data.message,
                    p_priority: data.priority || 'medium',
                    p_related_entity_type: data.related_entity_type,
                    p_related_entity_id: data.related_entity_id,
                    p_action_url: data.action_url,
                    p_metadata: data.metadata
                });

            if (error) {
                console.error('Error creating notification:', error);
                return null;
            }

            return result;
        } catch (error) {
            console.error('Error in createNotification:', error);
            return null;
        }
    }

    // Create bulk notifications
    static async createBulkNotifications(data: CreateBulkNotificationData): Promise<number> {
        try {
            const { data: result, error } = await supabase
                .rpc('create_bulk_notifications', {
                    p_recipient_ids: data.recipient_ids,
                    p_type: data.type,
                    p_title: data.title,
                    p_message: data.message,
                    p_priority: data.priority || 'medium',
                    p_related_entity_type: data.related_entity_type,
                    p_related_entity_id: data.related_entity_id,
                    p_action_url: data.action_url,
                    p_metadata: data.metadata
                });

            if (error) {
                console.error('Error creating bulk notifications:', error);
                return 0;
            }

            return result || 0;
        } catch (error) {
            console.error('Error in createBulkNotifications:', error);
            return 0;
        }
    }

    // Certificate expiry notification
    static async notifyCertificateExpiry(
        recipientId: string,
        certificateName: string,
        expiryDate: string,
        daysUntilExpiry: number,
        certificateId?: string
    ): Promise<string | null> {
        const priority = daysUntilExpiry <= 7 ? 'high' : daysUntilExpiry <= 30 ? 'medium' : 'low';

        return this.createNotification({
            recipient_id: recipientId,
            type: 'certificate_expiry',
            title: `Certificate Expiring Soon: ${certificateName}`,
            message: `Your ${certificateName} certificate will expire on ${new Date(expiryDate).toLocaleDateString()}. ${daysUntilExpiry} days remaining. Please schedule renewal training.`,
            priority,
            related_entity_type: 'certificate',
            related_entity_id: certificateId,
            action_url: DeepLinks.certificateExpiry()
        });
    }

    // Training reminder notification
    static async notifyTrainingReminder(
        recipientId: string,
        trainingTitle: string,
        trainingDate: string,
        location: string,
        trainingId?: string
    ): Promise<string | null> {
        return this.createNotification({
            recipient_id: recipientId,
            type: 'training_reminder',
            title: `Upcoming Training: ${trainingTitle}`,
            message: `You have training scheduled for ${new Date(trainingDate).toLocaleDateString()} at ${location}. Please make sure to attend.`,
            priority: 'medium',
            related_entity_type: 'training',
            related_entity_id: trainingId,
            action_url: getNotificationDeepLink('training_reminder', trainingId, 'training')
        });
    }

    // Training enrollment notification
    static async notifyTrainingEnrollment(
        recipientId: string,
        trainingTitle: string,
        trainingDate: string,
        trainingId?: string
    ): Promise<string | null> {
        return this.createNotification({
            recipient_id: recipientId,
            type: 'training_enrollment',
            title: `Successfully Enrolled: ${trainingTitle}`,
            message: `You have been successfully enrolled in ${trainingTitle} scheduled for ${new Date(trainingDate).toLocaleDateString()}.`,
            priority: 'low',
            related_entity_type: 'training',
            related_entity_id: trainingId,
            action_url: getNotificationDeepLink('training_enrollment', trainingId, 'training')
        });
    }

    // Training cancellation notification
    static async notifyTrainingCancellation(
        recipientIds: string[],
        trainingTitle: string,
        trainingDate: string,
        reason?: string,
        trainingId?: string
    ): Promise<number> {
        const reasonText = reason ? ` Reason: ${reason}` : '';

        return this.createBulkNotifications({
            recipient_ids: recipientIds,
            type: 'training_cancellation',
            title: `Training Cancelled: ${trainingTitle}`,
            message: `The training "${trainingTitle}" scheduled for ${new Date(trainingDate).toLocaleDateString()} has been cancelled.${reasonText}`,
            priority: 'high',
            related_entity_type: 'training',
            related_entity_id: trainingId,
            action_url: '/scheduling'
        });
    }

    // Location change notification
    static async notifyLocationChange(
        recipientIds: string[],
        trainingTitle: string,
        trainingDate: string,
        oldLocation: string,
        newLocation: string,
        trainingId?: string
    ): Promise<number> {
        return this.createBulkNotifications({
            recipient_ids: recipientIds,
            type: 'location_change',
            title: `Location Changed: ${trainingTitle}`,
            message: `The location for "${trainingTitle}" on ${new Date(trainingDate).toLocaleDateString()} has been changed from ${oldLocation} to ${newLocation}.`,
            priority: 'medium',
            related_entity_type: 'training',
            related_entity_id: trainingId,
            action_url: getNotificationDeepLink('location_change', trainingId, 'training')
        });
    }

    // Instructor change notification
    static async notifyInstructorChange(
        recipientIds: string[],
        trainingTitle: string,
        trainingDate: string,
        oldInstructor: string,
        newInstructor: string,
        trainingId?: string
    ): Promise<number> {
        return this.createBulkNotifications({
            recipient_ids: recipientIds,
            type: 'instructor_change',
            title: `Instructor Changed: ${trainingTitle}`,
            message: `The instructor for "${trainingTitle}" on ${new Date(trainingDate).toLocaleDateString()} has been changed from ${oldInstructor} to ${newInstructor}.`,
            priority: 'low',
            related_entity_type: 'training',
            related_entity_id: trainingId,
            action_url: getNotificationDeepLink('instructor_change', trainingId, 'training')
        });
    }

    // Approval required notification
    static async notifyApprovalRequired(
        recipientId: string,
        requestType: string,
        requestorName: string,
        details: string,
        relatedEntityId?: string,
        relatedEntityType?: string
    ): Promise<string | null> {
        return this.createNotification({
            recipient_id: recipientId,
            type: 'approval_required',
            title: `Approval Required: ${requestType}`,
            message: `${requestorName} has requested ${requestType}. ${details}`,
            priority: 'medium',
            related_entity_type: relatedEntityType,
            related_entity_id: relatedEntityId,
            action_url: getNotificationDeepLink('approval_required', relatedEntityId, relatedEntityType)
        });
    }

    // System announcement notification
    static async notifySystemAnnouncement(
        recipientIds: string[],
        title: string,
        message: string,
        priority: 'low' | 'medium' | 'high' = 'medium'
    ): Promise<number> {
        return this.createBulkNotifications({
            recipient_ids: recipientIds,
            type: 'system_announcement',
            title: title,
            message: message,
            priority: priority,
            action_url: getNotificationDeepLink('system_announcement')
        });
    }

    // Employee onboarding notification
    static async notifyEmployeeOnboarding(
        recipientId: string,
        employeeName: string,
        startDate: string,
        department: string,
        employeeId?: string
    ): Promise<string | null> {
        return this.createNotification({
            recipient_id: recipientId,
            type: 'employee_onboarding',
            title: `Welcome to the Team: ${employeeName}`,
            message: `${employeeName} has joined the ${department} department starting ${new Date(startDate).toLocaleDateString()}. Please make them feel welcome!`,
            priority: 'low',
            related_entity_type: 'employee',
            related_entity_id: employeeId,
            action_url: getNotificationDeepLink('employee_onboarding', employeeId, 'employee')
        });
    }

    // Employee departure notification
    static async notifyEmployeeDeparture(
        recipientIds: string[],
        employeeName: string,
        lastWorkingDay: string,
        department: string,
        employeeId?: string
    ): Promise<number> {
        return this.createBulkNotifications({
            recipient_ids: recipientIds,
            type: 'employee_departure',
            title: `Farewell: ${employeeName}`,
            message: `${employeeName} from the ${department} department will be leaving us on ${new Date(lastWorkingDay).toLocaleDateString()}. Please join us in wishing them well.`,
            priority: 'low',
            related_entity_type: 'employee',
            related_entity_id: employeeId,
            action_url: getNotificationDeepLink('employee_departure', employeeId, 'employee')
        });
    }

    // Get all employees for bulk notifications
    static async getAllEmployeeIds(): Promise<string[]> {
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('id')
                .eq('status', 'active');

            if (error) {
                console.error('Error fetching employee IDs:', error);
                return [];
            }

            return data.map(emp => emp.id);
        } catch (error) {
            console.error('Error in getAllEmployeeIds:', error);
            return [];
        }
    }

    // Get employees by department
    static async getEmployeeIdsByDepartment(department: string): Promise<string[]> {
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('id')
                .eq('department', department)
                .eq('status', 'active');

            if (error) {
                console.error('Error fetching employee IDs by department:', error);
                return [];
            }

            return data.map(emp => emp.id);
        } catch (error) {
            console.error('Error in getEmployeeIdsByDepartment:', error);
            return [];
        }
    }

    // Get training participants
    static async getTrainingParticipantIds(trainingId: string): Promise<string[]> {
        try {
            const { data, error } = await supabase
                .from('training_participants')
                .select('employee_id')
                .eq('training_id', trainingId)
                .neq('status', 'cancelled');

            if (error) {
                console.error('Error fetching training participant IDs:', error);
                return [];
            }

            return data.map(tp => tp.employee_id).filter(Boolean);
        } catch (error) {
            console.error('Error in getTrainingParticipantIds:', error);
            return [];
        }
    }
}

export default NotificationService; 