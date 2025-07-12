import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCallback, useEffect, useState } from 'react';
import { Notification } from '@/types';
import { useToast } from '@/hooks/use-toast';

export interface CreateNotificationData {
    recipient_id: string;
    type: string;
    title: string;
    message: string;
    priority?: 'low' | 'medium' | 'high';
    related_entity_type?: string;
    related_entity_id?: string;
    action_url?: string;
    metadata?: any;
}

export interface CreateBulkNotificationData {
    recipient_ids: string[];
    type: string;
    title: string;
    message: string;
    priority?: 'low' | 'medium' | 'high';
    related_entity_type?: string;
    related_entity_id?: string;
    action_url?: string;
    metadata?: any;
}

export function useNotifications(userId?: string) {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false);

    // Get current user's notifications
    const {
        data: notifications = [],
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ['notifications', userId],
        queryFn: async () => {
            if (!userId) return [];

            console.log('Fetching notifications for user:', userId);

            // Explicitly filter by recipient_id (employee_id) + RLS policy provides additional security
            const { data, error } = await supabase
                .from('notifications')
                .select(`
          *,
          recipient:employees(id, name, email, first_name, last_name)
        `)
                .eq('recipient_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching notifications:', error);
                throw error;
            }

            console.log('Fetched notifications:', data?.length || 0);
            return data as any[];
        },
        enabled: !!userId,
        refetchOnWindowFocus: false,
        staleTime: isRealTimeEnabled ? 1000 * 30 : 1000 * 60 * 5, // 30 seconds when real-time is enabled, 5 minutes otherwise
        refetchInterval: isRealTimeEnabled ? false : 1000 * 60, // Poll every minute when real-time is disabled
    });

    // Get unread notification count
    const { data: unreadCount = 0 } = useQuery({
        queryKey: ['notifications', 'unread-count', userId],
        queryFn: async () => {
            if (!userId) return 0;

            // Explicitly filter by recipient_id (employee_id) + RLS policy provides additional security
            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('recipient_id', userId)
                .eq('read', false);

            if (error) {
                console.error('Error fetching unread count:', error);
                throw error;
            }

            return count || 0;
        },
        enabled: !!userId,
        refetchInterval: 30000, // Refetch every 30 seconds
    });

    // Mark notification as read
    const markAsReadMutation = useMutation({
        mutationFn: async (notificationId: string) => {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', notificationId);

            if (error) throw error;

            return notificationId;
        },
        onSuccess: (notificationId) => {
            // Update the notifications in the cache
            queryClient.setQueryData(['notifications', userId], (oldData: Notification[]) => {
                return oldData?.map(notification =>
                    notification.id === notificationId
                        ? { ...notification, read: true, read_at: new Date().toISOString() }
                        : notification
                ) || [];
            });

            // Update unread count
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count', userId] });
        },
        onError: (error) => {
            console.error('Error marking notification as read:', error);
            toast({
                title: "Error",
                description: "Failed to mark notification as read",
                variant: "destructive"
            });
        }
    });

    // Mark all notifications as read
    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            if (!userId) throw new Error('No user ID provided');

            // Explicitly filter by recipient_id (employee_id) + RLS policy provides additional security
            const { error } = await supabase
                .from('notifications')
                .update({ read: true, read_at: new Date().toISOString() })
                .eq('recipient_id', userId)
                .eq('read', false);

            if (error) throw error;
        },
        onSuccess: () => {
            // Invalidate and refetch notifications
            queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count', userId] });

            toast({
                title: "Success",
                description: "All notifications marked as read",
            });
        },
        onError: (error) => {
            console.error('Error marking all notifications as read:', error);
            toast({
                title: "Error",
                description: "Failed to mark all notifications as read",
                variant: "destructive"
            });
        }
    });

    // Create notification
    const createNotificationMutation = useMutation({
        mutationFn: async (data: CreateNotificationData) => {
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

            if (error) throw error;

            return result;
        },
        onSuccess: () => {
            // Invalidate notifications for all users (in case it's for the current user)
            queryClient.invalidateQueries({ queryKey: ['notifications'] });

            toast({
                title: "Success",
                description: "Notification created successfully",
            });
        },
        onError: (error) => {
            console.error('Error creating notification:', error);
            toast({
                title: "Error",
                description: "Failed to create notification",
                variant: "destructive"
            });
        }
    });

    // Create bulk notifications
    const createBulkNotificationsMutation = useMutation({
        mutationFn: async (data: CreateBulkNotificationData) => {
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

            if (error) throw error;

            return result;
        },
        onSuccess: (count) => {
            // Invalidate notifications for all users
            queryClient.invalidateQueries({ queryKey: ['notifications'] });

            toast({
                title: "Success",
                description: `${count} notifications created successfully`,
            });
        },
        onError: (error) => {
            console.error('Error creating bulk notifications:', error);
            toast({
                title: "Error",
                description: "Failed to create bulk notifications",
                variant: "destructive"
            });
        }
    });

    // Delete notification
    const deleteNotificationMutation = useMutation({
        mutationFn: async (notificationId: string) => {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId);

            if (error) throw error;

            return notificationId;
        },
        onSuccess: () => {
            // Invalidate and refetch notifications
            queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count', userId] });

            toast({
                title: "Success",
                description: "Notification deleted successfully",
            });
        },
        onError: (error) => {
            console.error('Error deleting notification:', error);
            toast({
                title: "Error",
                description: "Failed to delete notification",
                variant: "destructive"
            });
        }
    });

    // Real-time subscription
    useEffect(() => {
        if (!userId || !isRealTimeEnabled) return;

        console.log('Setting up real-time subscription for user:', userId);

        const channel = supabase
            .channel(`notifications-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `recipient_id=eq.${userId}`,
                },
                async (payload) => {
                    console.log('New notification received via real-time:', payload.new);

                    // Force immediate refetch of both queries
                    await Promise.all([
                        queryClient.refetchQueries({ queryKey: ['notifications', userId] }),
                        queryClient.refetchQueries({ queryKey: ['notifications', 'unread-count', userId] })
                    ]);

                    console.log('Forced refetch completed for new notification');

                    // Show toast for new notification
                    const newNotification = payload.new as Notification;
                    toast({
                        title: "New Notification",
                        description: newNotification.title,
                        duration: 5000,
                    });
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notifications',
                    filter: `recipient_id=eq.${userId}`,
                },
                async (payload) => {
                    console.log('Notification updated via real-time:', payload.new);

                    // Force immediate refetch of both queries
                    await Promise.all([
                        queryClient.refetchQueries({ queryKey: ['notifications', userId] }),
                        queryClient.refetchQueries({ queryKey: ['notifications', 'unread-count', userId] })
                    ]);

                    console.log('Forced refetch completed for updated notification');
                }
            )
            .subscribe((status) => {
                console.log('Real-time subscription status:', status);
            });

        return () => {
            console.log('Cleaning up real-time subscription for user:', userId);
            supabase.removeChannel(channel);
        };
    }, [userId, isRealTimeEnabled, queryClient, toast]);

    // Enable real-time notifications
    const enableRealTime = useCallback(() => {
        setIsRealTimeEnabled(true);
    }, []);

    // Disable real-time notifications
    const disableRealTime = useCallback(() => {
        setIsRealTimeEnabled(false);
    }, []);

    // Helper functions
    const getNotificationsByType = useCallback((type: string) => {
        return notifications.filter(n => n.type === type);
    }, [notifications]);

    const getUnreadNotifications = useCallback(() => {
        return notifications.filter(n => !n.read);
    }, [notifications]);

    const getReadNotifications = useCallback(() => {
        return notifications.filter(n => n.read);
    }, [notifications]);

    const getNotificationsByPriority = useCallback((priority: 'low' | 'medium' | 'high') => {
        return notifications.filter(n => n.priority === priority);
    }, [notifications]);

    return {
        // Data
        notifications,
        unreadCount,
        isLoading,
        error,

        // Actions
        markAsRead: markAsReadMutation.mutate,
        markAllAsRead: markAllAsReadMutation.mutate,
        createNotification: createNotificationMutation.mutate,
        createBulkNotifications: createBulkNotificationsMutation.mutate,
        deleteNotification: deleteNotificationMutation.mutate,
        refetch,

        // Real-time
        enableRealTime,
        disableRealTime,
        isRealTimeEnabled,

        // Helpers
        getNotificationsByType,
        getUnreadNotifications,
        getReadNotifications,
        getNotificationsByPriority,

        // Loading states
        isMarkingAsRead: markAsReadMutation.isPending,
        isMarkingAllAsRead: markAllAsReadMutation.isPending,
        isCreatingNotification: createNotificationMutation.isPending,
        isCreatingBulkNotifications: createBulkNotificationsMutation.isPending,
        isDeletingNotification: deleteNotificationMutation.isPending,
    };
} 