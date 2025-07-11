
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, Award, AlertCircle, Eye, X } from "lucide-react";

const initialActivities = [
  {
    id: 1,
    type: "course_scheduled",
    title: "New VCA Course Scheduled",
    description: "Safety training for 12 participants",
    time: "2 hours ago",
    icon: Calendar,
    status: "scheduled",
    dismissed: false
  },
  {
    id: 2,
    type: "certification_expiring",
    title: "Certification Expiring Soon",
    description: "John Doe's forklift certification expires in 30 days",
    time: "4 hours ago",
    icon: AlertCircle,
    status: "warning",
    dismissed: false
  },
  {
    id: 3,
    type: "course_completed",
    title: "Course Completed",
    description: "First Aid training completed by 8 participants",
    time: "1 day ago",
    icon: Award,
    status: "completed",
    dismissed: false
  },
  {
    id: 4,
    type: "new_participant",
    title: "New Participant Added",
    description: "Sarah Wilson added to system",
    time: "2 days ago",
    icon: User,
    status: "new",
    dismissed: false
  }
];

const statusColors = {
  scheduled: "bg-blue-100 text-blue-800",
  warning: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  new: "bg-purple-100 text-purple-800"
};

export function RecentActivity() {
  const [activities, setActivities] = useState(initialActivities);

  const handleDismiss = (activityId: number) => {
    setActivities(prev => prev.map(activity => 
      activity.id === activityId 
        ? { ...activity, dismissed: true }
        : activity
    ));
    console.log(`Activity ${activityId} dismissed`);
  };

  const handleViewDetails = (activityId: number) => {
    console.log(`Viewing details for activity ${activityId}`);
    // In a real app, this would show more details or navigate to relevant page
  };

  const visibleActivities = activities.filter(activity => !activity.dismissed);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {visibleActivities.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recent activities</p>
        ) : (
          <div className="space-y-4">
            {visibleActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 group">
                <div className="p-2 bg-gray-100 rounded-full">
                  <activity.icon className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </p>
                    <div className="flex items-center space-x-1">
                      <Badge className={statusColors[activity.status as keyof typeof statusColors]}>
                        {activity.status}
                      </Badge>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 w-6 p-0"
                          onClick={() => handleViewDetails(activity.id)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 w-6 p-0"
                          onClick={() => handleDismiss(activity.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
