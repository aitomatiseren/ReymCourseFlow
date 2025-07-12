import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Notification } from '@/types';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface NotificationBellProps {
    userId?: string;
    enableRealTime?: boolean;
    maxPreviewCount?: number;
}

const notificationIcons = {
    certificate_expiry: '🚨',
    training_reminder: '📅',
    training_enrollment: '👥',
    training_cancellation: '❌',
    location_change: '📍',
    instructor_change: '👨‍🏫',
    approval_required: '📋',
    system_announcement: '📢',
    employee_onboarding: '👋',
    employee_departure: '👋',
};



export function NotificationBell({
    userId,
    enableRealTime = true,
    maxPreviewCount = 5
}: NotificationBellProps) {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const {
        notifications,
        unreadCount,
        markAsRead,
        enableRealTime: enableRT,
        disableRealTime: disableRT,
        isLoading
    } = useNotifications(userId);

    // Enable real-time notifications if requested and user has employee record
    useEffect(() => {
        if (enableRealTime && userId) {
            console.log('NotificationBell: Enabling real-time notifications for user:', userId);
            enableRT();
        }

        return () => {
            if (enableRealTime) {
                console.log('NotificationBell: Disabling real-time notifications');
                disableRT();
            }
        };
    }, [enableRealTime, userId, enableRT, disableRT]);

    // Debug: Log notification updates
    useEffect(() => {
        console.log('NotificationBell: Notifications updated, count:', notifications.length);
        console.log('NotificationBell: Unread count:', unreadCount);
    }, [notifications, unreadCount]);

    // If user has no employee record, don't show notifications
    if (!userId) {
        return (
            <Button variant="ghost" size="sm" className="relative" disabled>
                <Bell className="h-5 w-5 text-gray-400" />
            </Button>
        );
    }

    const handleNotificationClick = (notification: Notification) => {
        // Mark as read
        markAsRead(notification.id);

        // Navigate to related page if action_url exists
        if (notification.action_url) {
            navigate(notification.action_url);
        }

        // Close popover
        setIsOpen(false);
    };

    const handleViewAll = () => {
        navigate('/communications');
        setIsOpen(false);
    };

    const previewNotifications = notifications.slice(0, maxPreviewCount);
    const unreadNotifications = notifications.filter(n => !n.read);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && !isOpen && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-2 -right-2 px-1 py-0 text-xs min-w-[1.25rem] h-5 flex items-center justify-center"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[28rem] p-0" align="end">
                <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Notifications</CardTitle>
                        </div>
                        {unreadCount > 0 && (
                            <p className="text-sm text-gray-600">
                                You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                            </p>
                        )}
                    </CardHeader>
                    <Separator />
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-4 text-center text-gray-500">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
                                <p className="mt-2 text-sm">Loading notifications...</p>
                            </div>
                        ) : previewNotifications.length > 0 ? (
                            <ScrollArea className="h-64">
                                <div className="divide-y">
                                    {previewNotifications.map((notification) => {
                                        const icon = notificationIcons[notification.type as keyof typeof notificationIcons] || '📢';

                                        return (
                                            <div
                                                key={notification.id}
                                                className={cn(
                                                    'p-3 hover:bg-gray-50 cursor-pointer transition-colors',
                                                    !notification.read && 'bg-blue-50 border-l-4 border-l-blue-500'
                                                )}
                                                onClick={() => handleNotificationClick(notification)}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start space-x-3 flex-1">
                                                        <div className="text-lg">{icon}</div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center space-x-2 mb-1">
                                                                <h4 className="text-sm font-medium text-gray-900">
                                                                    {notification.title}
                                                                </h4>
                                                            </div>
                                                            <p className="text-sm text-gray-600 line-clamp-2">
                                                                {notification.message}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {new Date(notification.created_at).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        ) : (
                            <div className="p-4 text-center text-gray-500">
                                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        )}
                    </CardContent>
                    {notifications.length > maxPreviewCount && (
                        <>
                            <Separator />
                            <div className="p-3 text-center">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleViewAll}
                                    className="text-xs"
                                >
                                    View All {notifications.length} Notifications
                                </Button>
                            </div>
                        </>
                    )}
                </Card>
            </PopoverContent>
        </Popover>
    );
}

export default NotificationBell; 