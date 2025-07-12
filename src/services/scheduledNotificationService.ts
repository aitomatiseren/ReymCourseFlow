import { supabase } from '@/integrations/supabase/client';
import { NotificationService } from './notificationService';
import { SICK_STATUSES } from '@/constants/employeeStatus';

/**
 * Scheduled notification service for background/automated tasks
 * This service handles notifications that should be triggered on a schedule
 * rather than from user interactions
 */
export class ScheduledNotificationService {

    /**
     * Check for expiring certificates and send notifications
     * Should be run daily via cron job or database schedule
     */
    static async checkCertificateExpiry() {
        try {
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

            // Get all certificates expiring within 30 days
            const { data: expiringCertificates, error } = await supabase
                .from('employee_licenses')
                .select(`
          id,
          employee_id,
          expiry_date,
          certificate_number,
          status,
          employees!inner(name, email)
        `)
                .not('expiry_date', 'is', null)
                .gte('expiry_date', new Date().toISOString().split('T')[0]) // Not expired yet
                .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0])
                .eq('status', 'valid');

            if (error) {
                console.error('Error fetching expiring certificates:', error);
                return;
            }

            if (!expiringCertificates?.length) {
                console.log('No expiring certificates found');
                return;
            }

            // Send notifications for each expiring certificate
            const notifications = await Promise.allSettled(
                expiringCertificates.map(cert => {
                    const expiryDate = new Date(cert.expiry_date);
                    const today = new Date();
                    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                    return NotificationService.notifyCertificateExpiry(
                        cert.employee_id,
                        cert.certificate_number || 'Certificate',
                        cert.expiry_date,
                        daysUntilExpiry,
                        cert.id
                    );
                })
            );

            const successCount = notifications.filter(result => result.status === 'fulfilled').length;
            const failureCount = notifications.filter(result => result.status === 'rejected').length;

            console.log(`Certificate expiry notifications sent: ${successCount} success, ${failureCount} failed`);
        } catch (error) {
            console.error('Error in checkCertificateExpiry:', error);
        }
    }

    /**
     * Send training reminders for upcoming trainings
     * Should be run daily to remind participants
     */
    static async sendTrainingReminders() {
        try {
            const threeDaysFromNow = new Date();
            threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

            // Get trainings happening in the next 3 days
            const { data: upcomingTrainings, error } = await supabase
                .from('trainings')
                .select(`
          id,
          title,
          date,
          location,
          status,
          training_participants!inner(employee_id, status)
        `)
                .gte('date', new Date().toISOString().split('T')[0])
                .lte('date', threeDaysFromNow.toISOString().split('T')[0])
                .in('status', ['scheduled', 'confirmed'])
                .eq('training_participants.status', 'enrolled');

            if (error) {
                console.error('Error fetching upcoming trainings:', error);
                return;
            }

            if (!upcomingTrainings?.length) {
                console.log('No upcoming trainings found');
                return;
            }

            // Send reminders for each training
            let successCount = 0;
            let failureCount = 0;

            for (const training of upcomingTrainings) {
                const participantIds = training.training_participants.map(tp => tp.employee_id);

                const results = await Promise.allSettled(
                    participantIds.map(participantId =>
                        NotificationService.notifyTrainingReminder(
                            participantId,
                            training.title,
                            training.date,
                            training.location,
                            training.id
                        )
                    )
                );

                successCount += results.filter(result => result.status === 'fulfilled').length;
                failureCount += results.filter(result => result.status === 'rejected').length;
            }

            console.log(`Training reminders sent: ${successCount} success, ${failureCount} failed`);
        } catch (error) {
            console.error('Error in sendTrainingReminders:', error);
        }
    }

    /**
     * Check for courses starting in 1 week with sick participants
     * Should be run daily to identify training conflicts
     */
    static async checkUpcomingCoursesWithSickParticipants() {
        try {
            // Calculate date range - courses starting in exactly 1 week
            const oneWeekFromNow = new Date();
            oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
            const oneWeekStart = oneWeekFromNow.toISOString().split('T')[0];

            const oneWeekAndOneDay = new Date(oneWeekFromNow);
            oneWeekAndOneDay.setDate(oneWeekAndOneDay.getDate() + 1);
            const oneWeekEnd = oneWeekAndOneDay.toISOString().split('T')[0];

            console.log(`Checking for courses between ${oneWeekStart} and ${oneWeekEnd} with sick participants`);

            // Get all trainings starting in 1 week with their participants
            const { data: upcomingTrainings, error: trainingsError } = await supabase
                .from('trainings')
                .select(`
          id,
          title,
          date,
          time,
          location,
          instructor_id,
          organizer_id,
          max_participants,
          training_participants (
            id,
            employee_id,
            status,
            employees (
              id,
              name,
              department,
              manager_id
            )
          )
        `)
                .gte('date', oneWeekStart)
                .lt('date', oneWeekEnd)
                .in('status', ['scheduled', 'confirmed'])
                .not('training_participants.status', 'eq', 'cancelled');

            if (trainingsError) {
                console.error('Error fetching upcoming trainings:', trainingsError);
                return;
            }

            if (!upcomingTrainings?.length) {
                console.log('No trainings found starting in 1 week');
                return;
            }

            console.log(`Found ${upcomingTrainings.length} trainings starting in 1 week`);

            // For each training, check if any enrolled participants are currently sick
            let alertCount = 0;

            for (const training of upcomingTrainings) {
                const enrolledParticipants = training.training_participants?.filter(tp =>
                    tp.status === 'enrolled' || tp.status === 'attended'
                ) || [];

                if (enrolledParticipants.length === 0) {
                    continue;
                }

                // Get current status for all enrolled participants
                const participantIds = enrolledParticipants.map(tp => tp.employee_id).filter(Boolean);

                if (participantIds.length === 0) {
                    continue;
                }

                // Query current employee statuses
                const { data: currentStatuses, error: statusError } = await supabase
                    .from('employee_status_history')
                    .select('employee_id, status, start_date')
                    .in('employee_id', participantIds)
                    .is('end_date', null) // Only get active statuses
                    .lte('start_date', new Date().toISOString());

                if (statusError) {
                    console.error('Error fetching employee statuses:', statusError);
                    continue;
                }

                // Find participants who are currently sick or unavailable
                const sickParticipants = currentStatuses?.filter(status =>
                    SICK_STATUSES.includes(status.status as any) ||
                    ['unavailable', 'on_leave'].includes(status.status)
                ) || [];

                if (sickParticipants.length === 0) {
                    continue;
                }

                // Get details of sick participants
                const sickParticipantDetails = sickParticipants.map(sp => {
                    const participant = enrolledParticipants.find(ep => ep.employee_id === sp.employee_id);
                    return {
                        ...sp,
                        employee: participant?.employees
                    };
                }).filter(sp => sp.employee);

                console.log(`Training "${training.title}" has ${sickParticipantDetails.length} sick/unavailable participants`);

                // Prepare notification recipients
                const notificationRecipients: Set<string> = new Set();

                // Add instructor
                if (training.instructor_id) {
                    notificationRecipients.add(training.instructor_id);
                }

                // Add organizer (if different from instructor)
                if (training.organizer_id && training.organizer_id !== training.instructor_id) {
                    notificationRecipients.add(training.organizer_id);
                }

                // Add managers of sick participants
                sickParticipantDetails.forEach(sp => {
                    if (sp.employee?.manager_id) {
                        notificationRecipients.add(sp.employee.manager_id);
                    }
                });

                // Create notification message
                const statusList = sickParticipantDetails.map(sp => {
                    const statusLabel = sp.status === 'sick_short' ? 'short-term sick' :
                        sp.status === 'sick_long' ? 'long-term sick' :
                            sp.status === 'on_leave' ? 'on leave' :
                                sp.status === 'unavailable' ? 'unavailable' : sp.status;
                    return `${sp.employee?.name} (${statusLabel})`;
                }).join(', ');

                const message = `Training "${training.title}" scheduled for ${new Date(training.date).toLocaleDateString()} ` +
                    `at ${training.time || 'TBD'} in ${training.location || 'TBD'} has ${sickParticipantDetails.length} ` +
                    `participant(s) who may not be able to attend: ${statusList}. ` +
                    `Please consider alternative arrangements or replacements.`;

                // Send notifications to all relevant recipients
                const notifications = await Promise.allSettled(
                    Array.from(notificationRecipients).map(recipientId =>
                        NotificationService.createNotification({
                            recipient_id: recipientId,
                            type: 'training_reminder',
                            title: `Training Alert: Sick Participants - ${training.title}`,
                            message,
                            priority: 'high',
                            related_entity_type: 'training',
                            related_entity_id: training.id,
                            action_url: `/training-scheduler/${training.id}`,
                            metadata: {
                                trainingId: training.id,
                                sickParticipants: sickParticipantDetails.map(sp => ({
                                    employeeId: sp.employee_id,
                                    employeeName: sp.employee?.name,
                                    status: sp.status,
                                    department: sp.employee?.department
                                })),
                                checkDate: new Date().toISOString(),
                                trainingDate: training.date
                            }
                        })
                    )
                );

                const successfulNotifications = notifications.filter(n => n.status === 'fulfilled').length;
                const failedNotifications = notifications.filter(n => n.status === 'rejected').length;

                console.log(`Sick participant alert sent for "${training.title}": ${successfulNotifications} success, ${failedNotifications} failed`);
                alertCount++;
            }

            console.log(`Sick participant check completed: ${alertCount} trainings with sick participants found`);

        } catch (error) {
            console.error('Error checking courses with sick participants:', error);
        }
    }

    /**
 * Check for Code 95 compliance issues
 * Should be run weekly to check for employees who need Code 95 training
 */
    static async checkCode95Compliance() {
        try {
            console.log('Code 95 compliance check - implementation pending');
            // TODO: Implement Code 95 compliance check
            // This requires proper database schema verification
        } catch (error) {
            console.error('Error in checkCode95Compliance:', error);
        }
    }

    /**
     * Run all scheduled notification checks
     * This can be called from a single cron job or scheduled task
     */
    static async runAllScheduledChecks() {
        console.log('Starting scheduled notification checks...');

        await Promise.allSettled([
            this.checkCertificateExpiry(),
            this.sendTrainingReminders(),
            this.checkUpcomingCoursesWithSickParticipants(),
            this.checkCode95Compliance()
        ]);

        console.log('Scheduled notification checks completed');
    }
} 