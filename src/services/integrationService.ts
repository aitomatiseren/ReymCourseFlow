import { NotificationService } from './notificationService';
import { Training, Employee, Certificate } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { SICK_STATUSES, INACTIVE_STATUSES } from '@/constants/employeeStatus';

/**
 * Integration service for automatic notification triggering
 * Centralizes notification logic from various system components
 */
export class IntegrationService {

    /**
     * Training-related notifications
     */
    static async handleTrainingCreated(training: Training, participantIds: string[]) {
        try {
            // Notify all participants about enrollment
            await Promise.all(
                participantIds.map(participantId =>
                    NotificationService.notifyTrainingEnrollment(
                        participantId,
                        training.title,
                        training.date,
                        training.id
                    )
                )
            );

            // Notify instructor if assigned
            if (training.instructorId) {
                await NotificationService.notifyTrainingEnrollment(
                    training.instructorId,
                    training.title,
                    training.date,
                    training.id
                );
            }

            console.log(`Training creation notifications sent for: ${training.title}`);
        } catch (error) {
            console.error('Error sending training creation notifications:', error);
        }
    }

    static async handleTrainingUpdated(training: Training, changedFields: string[]) {
        try {
            // Get all enrolled participants
            const { data: participants, error } = await supabase
                .from('training_participants')
                .select('employee_id')
                .eq('training_id', training.id)
                .in('status', ['enrolled', 'attended']);

            if (error || !participants?.length) {
                console.log('No participants found for training update notifications');
                return;
            }

            const participantIds = participants.map(p => p.employee_id);

            // Send different notifications based on what changed
            if (changedFields.includes('location')) {
                await NotificationService.notifyLocationChange(
                    participantIds,
                    training.title,
                    training.date,
                    'Previous location', // We don't have the old location, so using placeholder
                    training.location || 'TBD',
                    training.id
                );
            }

            if (changedFields.includes('instructor') || changedFields.includes('instructorId')) {
                await NotificationService.notifyInstructorChange(
                    participantIds,
                    training.title,
                    training.date,
                    'Previous instructor', // We don't have the old instructor, so using placeholder
                    training.instructor || 'TBD',
                    training.id
                );
            }

            console.log(`Training update notifications sent for: ${training.title}`);
        } catch (error) {
            console.error('Error sending training update notifications:', error);
        }
    }

    static async handleTrainingCancelled(training: Training) {
        try {
            // Get all enrolled participants
            const { data: participants, error } = await supabase
                .from('training_participants')
                .select('employee_id')
                .eq('training_id', training.id)
                .in('status', ['enrolled']);

            if (error || !participants?.length) {
                console.log('No participants found for training cancellation notifications');
                return;
            }

            const participantIds = participants.map(p => p.employee_id);

            await NotificationService.notifyTrainingCancellation(
                participantIds,
                training.title,
                training.date,
                'Training has been cancelled by the organizer',
                training.id
            );

            console.log(`Training cancellation notifications sent for: ${training.title}`);
        } catch (error) {
            console.error('Error sending training cancellation notifications:', error);
        }
    }

    /**
     * Employee status change monitoring for training participants
     * Triggers notifications when enrolled participants become unavailable
     */
    static async handleEmployeeStatusChange(
        employeeId: string,
        newStatus: string,
        previousStatus: string,
        startDate: string
    ) {
        try {
            // Only notify for status changes to sick or unavailable statuses
            if (!SICK_STATUSES.includes(newStatus as any) &&
                !['unavailable', 'on_leave'].includes(newStatus)) {
                return;
            }

            // Get employee details
            const { data: employee, error: employeeError } = await supabase
                .from('employees')
                .select('id, name, department, manager_id')
                .eq('id', employeeId)
                .single();

            if (employeeError || !employee) {
                console.error('Employee not found for status change notification:', employeeError);
                return;
            }

            // Find upcoming trainings (within next 7 days) where this employee is enrolled
            const oneWeekFromNow = new Date();
            oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

            const { data: upcomingTrainings, error: trainingsError } = await supabase
                .from('training_participants')
                .select(`
          training_id,
          trainings (
            id,
            title,
            date,
            instructor_id,
            organizer_id,
            location
          )
        `)
                .eq('employee_id', employeeId)
                .in('status', ['enrolled'])
                .gte('trainings.date', new Date().toISOString().split('T')[0])
                .lte('trainings.date', oneWeekFromNow.toISOString().split('T')[0]);

            if (trainingsError || !upcomingTrainings?.length) {
                console.log('No upcoming trainings found for employee status change');
                return;
            }

            console.log(`Found ${upcomingTrainings.length} upcoming trainings for ${employee.name} who is now ${newStatus}`);

            // Notify relevant people for each training
            for (const participation of upcomingTrainings) {
                const training = participation.trainings;
                if (!training) continue;

                const notificationRecipients: string[] = [];

                // Add instructor if assigned
                if (training.instructor_id) {
                    notificationRecipients.push(training.instructor_id);
                }

                // Add organizer if assigned and different from instructor
                if (training.organizer_id && training.organizer_id !== training.instructor_id) {
                    notificationRecipients.push(training.organizer_id);
                }

                // Add manager if exists and different from instructor/organizer
                if (employee.manager_id &&
                    !notificationRecipients.includes(employee.manager_id)) {
                    notificationRecipients.push(employee.manager_id);
                }

                // Send notifications to all relevant recipients
                const statusLabel = newStatus === 'sick_short' ? 'short-term sick leave' :
                    newStatus === 'sick_long' ? 'long-term sick leave' :
                        newStatus === 'on_leave' ? 'on leave' :
                            newStatus === 'unavailable' ? 'unavailable' : newStatus;

                const message = `${employee.name} from ${employee.department} is now on ${statusLabel} ` +
                    `and may not be able to attend the training "${training.title}" ` +
                    `scheduled for ${new Date(training.date).toLocaleDateString()}.`;

                await Promise.all(
                    notificationRecipients.map(recipientId =>
                        NotificationService.createNotification({
                            recipient_id: recipientId,
                            type: 'training_enrollment',
                            title: `Participant Status Change Alert`,
                            message,
                            priority: 'high',
                            related_entity_type: 'training',
                            related_entity_id: training.id,
                            action_url: `/scheduling/${training.id}`,
                            metadata: {
                                employeeId,
                                trainingId: training.id,
                                statusChange: {
                                    from: previousStatus,
                                    to: newStatus,
                                    startDate
                                }
                            }
                        })
                    )
                );

                console.log(`Status change notifications sent for ${employee.name} - ${training.title}`);
            }

        } catch (error) {
            console.error('Error handling employee status change for training notifications:', error);
        }
    }

    /**
 * Certificate expiry monitoring
 */
    static async handleCertificateExpiry(certificate: Certificate, employeeId: string) {
        try {
            // Calculate days until expiry
            const today = new Date();
            const expiryDate = new Date(certificate.expiryDate);
            const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            await NotificationService.notifyCertificateExpiry(
                employeeId,
                certificate.courseName,
                certificate.expiryDate,
                daysUntilExpiry,
                certificate.id
            );

            // Also notify manager if exists
            const { data: employee, error } = await supabase
                .from('employees')
                .select('manager_id')
                .eq('id', employeeId)
                .single();

            if (!error && employee?.manager_id) {
                await NotificationService.notifyCertificateExpiry(
                    employee.manager_id,
                    certificate.courseName,
                    certificate.expiryDate,
                    daysUntilExpiry,
                    certificate.id
                );
            }

            console.log(`Certificate expiry notification sent for: ${certificate.courseName}`);
        } catch (error) {
            console.error('Error sending certificate expiry notifications:', error);
        }
    }

    /**
     * Employee lifecycle notifications
     */
    static async handleEmployeeStatusUpdate(
        employeeId: string,
        newStatus: string,
        previousStatus: string
    ) {
        try {
            // Get manager and department colleagues
            const managerIds = await this.getManagerIds(employeeId);

            // Get employee details for notification
            const { data: employee, error } = await supabase
                .from('employees')
                .select('name, department')
                .eq('id', employeeId)
                .single();

            if (newStatus === 'terminated' && managerIds.length > 0 && employee) {
                await NotificationService.notifyEmployeeDeparture(
                    managerIds,
                    employee.name,
                    new Date().toISOString(), // lastWorkingDay
                    employee.department
                );
            }

            // Also check for training impact
            await this.handleEmployeeStatusChange(employeeId, newStatus, previousStatus, new Date().toISOString());

            console.log(`Employee status update notifications sent for: ${employeeId}`);
        } catch (error) {
            console.error('Error sending employee status update notifications:', error);
        }
    }

    /**
     * Helper methods
     */
    private static async getManagerIds(employeeId: string): Promise<string[]> {
        try {
            const { data: employee, error } = await supabase
                .from('employees')
                .select('manager_id')
                .eq('id', employeeId)
                .single();

            if (error || !employee?.manager_id) return [];
            return [employee.manager_id];
        } catch (error) {
            console.error('Error fetching manager IDs:', error);
            return [];
        }
    }

    private static async getDepartmentColleagues(department: string): Promise<string[]> {
        try {
            const { data: colleagues, error } = await supabase
                .from('employees')
                .select('id')
                .eq('department', department)
                .eq('status', 'active');

            if (error) return [];
            return colleagues.map(c => c.id);
        } catch (error) {
            console.error('Error fetching department colleagues:', error);
            return [];
        }
    }
} 