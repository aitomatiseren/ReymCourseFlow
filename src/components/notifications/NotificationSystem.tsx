
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
  Send
} from "lucide-react";
import { Notification } from "@/types";

// Mock notifications
const mockNotifications: Notification[] = [
  {
    id: "not-001",
    type: "certificate_expiry",
    recipientId: "emp-001",
    recipientEmail: "jan.jansen@reym.nl",
    title: "Certificate Expiring Soon",
    message: "Your DVM certificate expires on 2024-08-15. Please schedule renewal training.",
    status: "sent",
    createdAt: "2024-07-08T10:00:00Z",
    relatedEntityId: "cert-001"
  },
  {
    id: "not-002",
    type: "training_reminder",
    recipientId: "emp-001",
    recipientEmail: "jan.jansen@reym.nl",
    title: "Upcoming Training Reminder",
    message: "Your DVM recertification training is scheduled for 2024-08-01 at 09:00 in Training Center Amsterdam.",
    status: "sent",
    createdAt: "2024-07-08T11:00:00Z",
    relatedEntityId: "tr-001"
  },
  {
    id: "not-003",
    type: "location_change",
    recipientId: "inst-001",
    recipientEmail: "piet.bakker@training.nl",
    title: "Training Location Changed",
    message: "The location for DVM Training on 2024-08-01 has been changed to Training Center Rotterdam.",
    status: "pending",
    createdAt: "2024-07-08T12:00:00Z",
    relatedEntityId: "tr-001"
  },
  {
    id: "not-004",
    type: "approval_required",
    recipientId: "mgr-001",
    recipientEmail: "manager@reym.nl",
    title: "Training Transfer Approval Required",
    message: "Jan Jansen requests to move from DVM Training (Aug 1) to DVM Training (Aug 15). Approval required.",
    status: "pending",
    createdAt: "2024-07-08T13:00:00Z",
    relatedEntityId: "tr-001"
  }
];

const notificationIcons = {
  certificate_expiry: AlertTriangle,
  training_reminder: Calendar,
  location_change: MapPin,
  cancellation: X,
  approval_required: Users
};

const notificationColors = {
  certificate_expiry: "bg-orange-100 text-orange-800",
  training_reminder: "bg-blue-100 text-blue-800",
  location_change: "bg-purple-100 text-purple-800",
  cancellation: "bg-red-100 text-red-800",
  approval_required: "bg-yellow-100 text-yellow-800"
};

export function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'pending' | 'sent'>('all');

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    return notification.status === filter;
  });

  const handleSendNotification = (notificationId: string) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === notificationId 
        ? { ...notification, status: 'sent' }
        : notification
    ));
    console.log(`Notification ${notificationId} sent`);
  };

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === notificationId 
        ? { ...notification, status: 'read' }
        : notification
    ));
    console.log(`Notification ${notificationId} marked as read`);
  };

  const handleApproveRequest = (notificationId: string) => {
    console.log(`Approving request from notification ${notificationId}`);
    // In real app, this would trigger the approval workflow
  };

  const handleRejectRequest = (notificationId: string) => {
    console.log(`Rejecting request from notification ${notificationId}`);
    // In real app, this would trigger the rejection workflow
  };

  const sendBulkNotifications = (type: string) => {
    console.log(`Sending bulk notifications for ${type}`);
    // In real app, this would send notifications to all relevant recipients
  };

  const pendingCount = notifications.filter(n => n.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Bell className="h-6 w-6 mr-2" />
            Notification Center
            {pendingCount > 0 && (
              <Badge className="ml-2 bg-red-100 text-red-800">
                {pendingCount} pending
              </Badge>
            )}
          </h2>
          <p className="text-gray-600">Automated notifications and communication management</p>
        </div>
        <div className="flex items-center space-x-4">
          <select 
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="all">All Notifications</option>
            <option value="pending">Pending</option>
            <option value="sent">Sent</option>
          </select>
          <Button variant="outline">
            <Send className="h-4 w-4 mr-2" />
            Send All Pending
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => sendBulkNotifications('certificate_expiry')}>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <h3 className="font-semibold">Certificate Expiry Alerts</h3>
            <p className="text-sm text-gray-600">Send to all employees with expiring certificates</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => sendBulkNotifications('training_reminder')}>
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <h3 className="font-semibold">Training Reminders</h3>
            <p className="text-sm text-gray-600">Remind participants about upcoming trainings</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => sendBulkNotifications('instructor_notifications')}>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <h3 className="font-semibold">Instructor Updates</h3>
            <p className="text-sm text-gray-600">Notify instructors about training details</p>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.map((notification) => {
          const IconComponent = notificationIcons[notification.type];
          
          return (
            <Card key={notification.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="p-2 bg-gray-100 rounded-full">
                      <IconComponent className="h-5 w-5 text-gray-600" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                        <Badge className={notificationColors[notification.type]}>
                          {notification.type.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className={
                          notification.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          notification.status === 'sent' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {notification.status}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-700 mb-2">{notification.message}</p>
                      
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <span className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {notification.recipientEmail}
                        </span>
                        <span>{new Date(notification.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    {notification.status === 'pending' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleSendNotification(notification.id)}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Send
                      </Button>
                    )}
                    
                    {notification.type === 'approval_required' && notification.status === 'sent' && (
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
                    
                    {notification.status === 'sent' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredNotifications.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">No notifications found for the selected filter.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
