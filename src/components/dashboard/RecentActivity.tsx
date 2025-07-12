
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, User, Calendar, Award, BookOpen } from "lucide-react";
import { useTrainings } from "@/hooks/useTrainings";
import { useEmployees } from "@/hooks/useEmployees";
import { useCourses } from "@/hooks/useCourses";
import { format, formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

export function RecentActivity() {
  const { data: trainings = [], isLoading: trainingsLoading } = useTrainings();
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const { data: courses = [], isLoading: coursesLoading } = useCourses();
  const navigate = useNavigate();

  // Generate recent activity from real data
  const generateRecentActivity = () => {
    const activities = [];

    // Recent trainings
    const recentTrainings = trainings
      .filter(training => training.date) // Filter out entries without date
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);

    recentTrainings.forEach(training => {
      const timestamp = new Date(training.date);
      if (!isNaN(timestamp.getTime())) { // Validate timestamp
        activities.push({
          id: `training-${training.id}`,
          type: 'training',
          title: `Training scheduled: ${training.title}`,
          description: `${training.participantCount || 0} participants enrolled`,
          timestamp: timestamp,
          icon: Calendar,
          color: 'bg-blue-100 text-blue-800',
          href: `/trainings/${training.id}`
        });
      }
    });

    // Recent employees (sorted by created_at)
    const recentEmployees = employees
      .filter(employee => employee.created_at) // Filter out entries without created_at
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 2);
    recentEmployees.forEach((employee) => {
      const timestamp = new Date(employee.created_at);
      if (!isNaN(timestamp.getTime())) { // Validate timestamp
        activities.push({
          id: `employee-${employee.id}`,
          type: 'employee',
          title: `New employee added: ${employee.name}`,
          description: `${employee.department} department`,
          timestamp: timestamp,
          icon: User,
          color: 'bg-green-100 text-green-800',
          href: `/participants/${employee.id}`
        });
      }
    });

    // Recent courses (sorted by created_at)
    const recentCourses = courses
      .filter(course => course.created_at) // Filter out entries without created_at
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 2);
    recentCourses.forEach((course) => {
      const timestamp = new Date(course.created_at);
      if (!isNaN(timestamp.getTime())) { // Validate timestamp
        activities.push({
          id: `course-${course.id}`,
          type: 'course',
          title: `Course updated: ${course.title}`,
          description: course.description || 'Course details',
          timestamp: timestamp,
          icon: BookOpen,
          color: 'bg-purple-100 text-purple-800',
          href: `/courses/${course.id}`
        });
      }
    });

    // Sort by timestamp and return most recent
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 6);
  };

  const isLoading = trainingsLoading || employeesLoading || coursesLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activities = generateRecentActivity();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No recent activity
          </p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = activity.icon;
              return (
                <div 
                  key={activity.id} 
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => activity.href && navigate(activity.href)}
                >
                  <div className={`p-2 rounded-full ${activity.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">
                      {activity.title}
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      {activity.description}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
