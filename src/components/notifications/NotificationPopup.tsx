import { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { X, Bell, CheckCircle, AlertTriangle, Info, Calendar, MapPin, Users, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Notification } from '@/types';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NotificationPopupProps {
    userId?: string;
    enableRealTime?: boolean;
    maxVisible?: number;
    autoHideDuration?: number;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const notificationIcons = {
    certificate_expiry: AlertTriangle,
    training_reminder: Calendar,
    training_enrollment: Users,
    training_cancellation: X,
    location_change: MapPin,
    instructor_change: Users,
    approval_required: FileText,
    system_announcement: Bell,
    employee_onboarding: Users,
    employee_departure: Users,
};

const notificationColors = {
    certificate_expiry: 'bg-orange-100 text-orange-800 border-orange-200',
    training_reminder: 'bg-blue-100 text-blue-800 border-blue-200',
    training_enrollment: 'bg-green-100 text-green-800 border-green-200',
    training_cancellation: 'bg-red-100 text-red-800 border-red-200',
    location_change: 'bg-purple-100 text-purple-800 border-purple-200',
    instructor_change: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approval_required: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    system_announcement: 'bg-gray-100 text-gray-800 border-gray-200',
    employee_onboarding: 'bg-teal-100 text-teal-800 border-teal-200',
    employee_departure: 'bg-pink-100 text-pink-800 border-pink-200',
};

const priorityColors = {
    low: 'border-l-gray-400',
    medium: 'border-l-yellow-400',
    high: 'border-l-red-400',
};

export function NotificationPopup({
    userId,
    enableRealTime = true,
    maxVisible = 3,
    autoHideDuration = 8000,
    position = 'top-right'
}: NotificationPopupProps) {
    const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([]);
    const [seenNotificationIds, setSeenNotificationIds] = useState<Set<string>>(() => {
        // Load seen notification IDs from localStorage on initialization
        const storageKey = `seen-notifications-${userId || 'default'}`;
        try {
            const stored = localStorage.getItem(storageKey);
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch (error) {
            console.error('Error loading seen notification IDs:', error);
            return new Set();
        }
    });
    const navigate = useNavigate();

    const {
        notifications,
        markAsRead,
        enableRealTime: enableRT,
        disableRealTime: disableRT,
        isRealTimeEnabled
    } = useNotifications(userId);

    // Enable real-time notifications if requested
    useEffect(() => {
        if (enableRealTime && userId) {
            enableRT();
        }

        return () => {
            if (enableRealTime) {
                disableRT();
            }
        };
    }, [enableRealTime, userId, enableRT, disableRT]);

    // Save seen notification IDs to localStorage whenever they change
    useEffect(() => {
        if (userId && seenNotificationIds.size > 0) {
            const storageKey = `seen-notifications-${userId}`;
            try {
                localStorage.setItem(storageKey, JSON.stringify(Array.from(seenNotificationIds)));
            } catch (error) {
                console.error('Error saving seen notification IDs:', error);
            }
        }
    }, [seenNotificationIds, userId]);

    // Initialize seen notification IDs on first load for new users
    useEffect(() => {
        if (notifications.length > 0 && seenNotificationIds.size === 0 && userId) {
            // Only mark read notifications as seen, not all notifications
            const readNotificationIds = new Set(notifications.filter(n => n.read).map(n => n.id));
            if (readNotificationIds.size > 0) {
                setSeenNotificationIds(readNotificationIds);
                console.log('Initialized seen notification IDs for read notifications:', readNotificationIds.size);
            }
        }
    }, [notifications, seenNotificationIds.size, userId]);

    // Monitor for new notifications using ID-based detection
    useEffect(() => {
        if (!notifications.length) return;

        console.log('NotificationPopup: Checking for new notifications, total count:', notifications.length);
        console.log('NotificationPopup: Current seen IDs:', seenNotificationIds.size);

        const unreadNotifications = notifications.filter(n => !n.read);
        console.log('NotificationPopup: Unread count:', unreadNotifications.length);

        // Find truly new notifications (not previously seen)
        const newNotifications = unreadNotifications.filter(notification =>
            !seenNotificationIds.has(notification.id)
        );

        if (newNotifications.length > 0) {
            console.log('NotificationPopup: New notifications detected for popup:', newNotifications.length);
            console.log('NotificationPopup: New notification IDs:', newNotifications.map(n => n.id));

            // Add new notifications to visible list
            setVisibleNotifications(prev => {
                const combined = [...newNotifications, ...prev];
                return combined.slice(0, maxVisible);
            });

            // Update seen notification IDs
            setSeenNotificationIds(prev => {
                const newSet = new Set(prev);
                newNotifications.forEach(n => newSet.add(n.id));
                console.log('NotificationPopup: Added new notification IDs to seen set:', newNotifications.map(n => n.id));
                return newSet;
            });
        }
    }, [notifications, maxVisible]);

    // Clean up old seen IDs to prevent memory leak
    useEffect(() => {
        if (!notifications.length) return;

        setSeenNotificationIds(prev => {
            const currentNotificationIds = new Set(notifications.map(n => n.id));
            const newSet = new Set<string>();

            // Only keep seen IDs that still exist in current notifications
            prev.forEach(id => {
                if (currentNotificationIds.has(id)) {
                    newSet.add(id);
                }
            });

            // Only update if the Set actually changed to avoid unnecessary localStorage writes
            if (newSet.size !== prev.size) {
                console.log('NotificationPopup: Cleaned up old seen IDs, new count:', newSet.size);
                return newSet;
            }
            return prev;
        });
    }, [notifications]);

    // Auto-hide notifications after a delay
    useEffect(() => {
        if (visibleNotifications.length === 0) return;

        const timeouts = visibleNotifications.map((notification, index) => {
            return setTimeout(() => {
                setVisibleNotifications(prev => prev.filter(n => n.id !== notification.id));
            }, autoHideDuration + (index * 500)); // Stagger the hiding
        });

        return () => {
            timeouts.forEach(clearTimeout);
        };
    }, [visibleNotifications, autoHideDuration]);

    const handleNotificationClick = (notification: Notification) => {
        // Mark as read
        markAsRead(notification.id);

        // Navigate to related page if action_url exists
        if (notification.action_url) {
            navigate(notification.action_url);
        }

        // Remove from visible notifications
        setVisibleNotifications(prev => prev.filter(n => n.id !== notification.id));
    };

    const handleDismiss = (notificationId: string) => {
        setVisibleNotifications(prev => prev.filter(n => n.id !== notificationId));
    };

    const handleMarkAsRead = (notificationId: string) => {
        markAsRead(notificationId);
        setVisibleNotifications(prev => prev.filter(n => n.id !== notificationId));
    };

    const getPositionClasses = () => {
        switch (position) {
            case 'top-left':
                return 'top-4 left-4';
            case 'top-right':
                return 'top-4 right-4';
            case 'bottom-left':
                return 'bottom-4 left-4';
            case 'bottom-right':
                return 'bottom-4 right-4';
            default:
                return 'top-4 right-4';
        }
    };

    if (visibleNotifications.length === 0) {
        return null;
    }

    return (
        <div className={cn(
            'fixed z-50 pointer-events-none',
            getPositionClasses()
        )}>
            <div className="flex flex-col space-y-3 max-w-sm w-full">
                {visibleNotifications.map((notification, index) => {
                    const IconComponent = notificationIcons[notification.type as keyof typeof notificationIcons] || Bell;
                    const colorClasses = notificationColors[notification.type as keyof typeof notificationColors] || notificationColors.system_announcement;
                    const priorityClass = priorityColors[notification.priority as keyof typeof priorityColors] || priorityColors.medium;

                    return (
                        <Card
                            key={notification.id}
                            className={cn(
                                'pointer-events-auto cursor-pointer transition-all duration-300 hover:shadow-lg',
                                'animate-in slide-in-from-right-5 fade-in-0',
                                'border-l-4',
                                priorityClass
                            )}
                            style={{
                                animationDelay: `${index * 100}ms`,
                            }}
                            onClick={() => handleNotificationClick(notification)}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-2">
                                        <div className={cn(
                                            'p-1 rounded-full',
                                            colorClasses
                                        )}>
                                            <IconComponent className="h-3 w-3" />
                                        </div>
                                        <CardTitle className="text-sm font-medium">
                                            {notification.title}
                                        </CardTitle>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                'text-xs px-1 py-0',
                                                notification.priority === 'high' ? 'bg-red-50 text-red-600' :
                                                    notification.priority === 'medium' ? 'bg-yellow-50 text-yellow-600' :
                                                        'bg-gray-50 text-gray-600'
                                            )}
                                        >
                                            {notification.priority}
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 hover:bg-gray-100"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDismiss(notification.id);
                                            }}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <p className="text-sm text-gray-600 mb-3">
                                    {notification.message}
                                </p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">
                                        {new Date(notification.created_at).toLocaleTimeString()}
                                    </span>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-xs"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMarkAsRead(notification.id);
                                            }}
                                        >
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Mark Read
                                        </Button>
                                        {notification.action_url && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800"
                                            >
                                                View
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

export default NotificationPopup; 