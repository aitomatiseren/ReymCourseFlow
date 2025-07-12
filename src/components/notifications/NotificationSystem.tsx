
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Mail,
  AlertTriangle,
  Calendar,
  MapPin,
  Users,
  Check,
  X,
  Trash2
} from "lucide-react";
import { Notification } from "@/types";
import { useNotifications, CreateBulkNotificationData } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const notificationIcons = {
  certificate_expiry: AlertTriangle,
  training_reminder: Calendar,
  training_enrollment: Users,
  training_cancellation: X,
  location_change: MapPin,
  instructor_change: Users,
  approval_required: Users,
  system_announcement: Bell,
  employee_onboarding: Users,
  employee_departure: Users,
};

const notificationColors = {
  certificate_expiry: "bg-orange-100 text-orange-800",
  training_reminder: "bg-blue-100 text-blue-800",
  training_enrollment: "bg-green-100 text-green-800",
  training_cancellation: "bg-red-100 text-red-800",
  location_change: "bg-purple-100 text-purple-800",
  instructor_change: "bg-yellow-100 text-yellow-800",
  approval_required: "bg-indigo-100 text-indigo-800",
  system_announcement: "bg-gray-100 text-gray-800",
  employee_onboarding: "bg-teal-100 text-teal-800",
  employee_departure: "bg-pink-100 text-pink-800",
};

interface NotificationSystemProps {
  userId?: string;
  enableRealTime?: boolean;
}

export function NotificationSystem({
  userId,
  enableRealTime = true
}: NotificationSystemProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'read' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isLoading,
    isMarkingAsRead,
    isMarkingAllAsRead,
    isDeletingNotification,
    enableRealTime: enableRT,
    disableRealTime: disableRT
  } = useNotifications(userId);

  // Enable real-time notifications
  useEffect(() => {
    if (enableRealTime && userId) {
      console.log('Enabling real-time notifications for NotificationSystem');
      enableRT();
    }

    return () => {
      if (enableRealTime) {
        console.log('Disabling real-time notifications for NotificationSystem');
        disableRT();
      }
    };
  }, [enableRealTime, userId, enableRT, disableRT]);

  // Log notification changes for debugging
  useEffect(() => {
    console.log('NotificationSystem: notifications updated, count:', notifications.length);
    console.log('NotificationSystem: unread count:', unreadCount);
  }, [notifications, unreadCount]);

  // If user has no employee record, show appropriate message
  if (!userId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Bell className="h-6 w-6 mr-2" />
              Notification Center
            </h2>
            <p className="text-gray-600">Automated notifications and communication management</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Notifications Available</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Notifications are only available for users with employee records.
              System administrators and external users do not receive employee-specific notifications.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get unique notification types for the filter dropdown
  const notificationTypes = [...new Set(notifications.map(n => n.type))];

  const filteredNotifications = notifications.filter(notification => {
    // Status filter
    const statusMatch = statusFilter === 'all' ||
      (statusFilter === 'read' && notification.read) ||
      (statusFilter === 'unread' && !notification.read);

    // Type filter
    const typeMatch = typeFilter === 'all' || notification.type === typeFilter;

    return statusMatch && typeMatch;
  });

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    markAsRead(notification.id);

    // Navigate to related page if action_url exists
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId);
  };

  const handleDelete = (notificationId: string) => {
    deleteNotification(notificationId);
  };

  const handleApproveRequest = (notificationId: string) => {
    console.log(`Approving request from notification ${notificationId}`);
    // In real app, this would trigger the approval workflow
    // For now, just mark as read
    markAsRead(notificationId);
  };

  const handleRejectRequest = (notificationId: string) => {
    console.log(`Rejecting request from notification ${notificationId}`);
    // In real app, this would trigger the rejection workflow
    // For now, just mark as read
    markAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Bell className="h-6 w-6 mr-2" />
            Notification Center
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-red-100 text-red-800">
                {unreadCount} unread
              </Badge>
            )}
          </h2>
          <p className="text-gray-600">Automated notifications and communication management</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>

          <select
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            {notificationTypes.map(type => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>

          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead} disabled={isMarkingAllAsRead}>
              <Check className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>



      {/* Filter Results Summary */}
      <div className="text-sm text-gray-600">
        {filteredNotifications.length === notifications.length ? (
          `Showing all ${notifications.length} notifications`
        ) : (
          `Showing ${filteredNotifications.length} of ${notifications.length} notifications`
        )}
        {statusFilter !== 'all' && ` • Status: ${statusFilter}`}
        {typeFilter !== 'all' && ` • Type: ${typeFilter.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`}
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading notifications...</p>
            </CardContent>
          </Card>
        ) : filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => {
            const IconComponent = notificationIcons[notification.type as keyof typeof notificationIcons];

            return (
              <Card
                key={notification.id}
                className={cn(
                  "hover:shadow-md transition-shadow cursor-pointer",
                  !notification.read && "bg-blue-50 border-l-4 border-l-blue-500"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="p-2 bg-gray-100 rounded-full">
                        <IconComponent className="h-5 w-5 text-gray-600" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                          <Badge className={notificationColors[notification.type as keyof typeof notificationColors]}>
                            {notification.type.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className={
                            notification.priority === 'high' ? 'bg-red-100 text-red-800' :
                              notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                          }>
                            {notification.priority}
                          </Badge>
                        </div>

                        <p className="text-gray-700 mb-2">{notification.message}</p>

                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <span className="flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {notification.recipient?.email || 'Unknown'}
                          </span>
                          <span>{new Date(notification.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAsRead(notification.id)}
                          disabled={isMarkingAsRead}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Mark Read
                        </Button>
                      )}

                      {notification.type === 'approval_required' && !notification.read && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApproveRequest(notification.id)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectRequest(notification.id)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(notification.id)}
                        disabled={isDeletingNotification}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No notifications found for the selected filter.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
