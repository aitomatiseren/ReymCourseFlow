
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, ExternalLink, CheckCircle, Clock } from "lucide-react";

const upcomingCourses = [
  {
    id: 1,
    title: "VCA Safety Training",
    provider: "Safety First B.V.",
    date: "2024-07-15",
    time: "09:00",
    location: "Amsterdam Training Center",
    participants: 12,
    maxParticipants: 15,
    status: "confirmed"
  },
  {
    id: 2,
    title: "Forklift Operation Certification",
    provider: "Heavy Equipment Training",
    date: "2024-07-18",
    time: "13:00",
    location: "Rotterdam Facility",
    participants: 8,
    maxParticipants: 10,
    status: "pending"
  },
  {
    id: 3,
    title: "First Aid & CPR",
    provider: "Emergency Response Training",
    date: "2024-07-22",
    time: "10:00",
    location: "Utrecht Medical Center",
    participants: 6,
    maxParticipants: 12,
    status: "confirmed"
  }
];

const statusColors = {
  confirmed: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800"
};

export function UpcomingCourses() {
  const [courses, setCourses] = useState(upcomingCourses);

  const handleStatusChange = (courseId: number, newStatus: string) => {
    setCourses(prev => prev.map(course => 
      course.id === courseId 
        ? { ...course, status: newStatus }
        : course
    ));
    console.log(`Course ${courseId} status changed to ${newStatus}`);
  };

  const handleViewDetails = (courseId: number) => {
    console.log(`Viewing details for course ${courseId}`);
    // In a real app, this would navigate to course details page
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Upcoming Courses</CardTitle>
        <Button variant="outline" size="sm" onClick={() => console.log("Navigate to all courses")}>
          <ExternalLink className="h-4 w-4 mr-2" />
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {courses.map((course) => (
            <div key={course.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{course.title}</h4>
                  <p className="text-sm text-gray-600">{course.provider}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={statusColors[course.status as keyof typeof statusColors]}>
                    {course.status === "confirmed" ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <Clock className="h-3 w-3 mr-1" />
                    )}
                    {course.status}
                  </Badge>
                  {course.status === "pending" && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleStatusChange(course.id, "confirmed")}
                    >
                      Confirm
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600 mb-3">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {course.date} at {course.time}
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  {course.location}
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  {course.participants}/{course.maxParticipants} participants
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleViewDetails(course.id)}
                >
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
