import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Award, 
  Calendar, 
  FileText, 
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
  Eye,
  Activity
} from "lucide-react";
import { EmployeeStatusManager } from "@/components/employee/EmployeeStatusManager";

interface UserProfileTabsProps {
  userId: string;
}

// Mock data for user's certificates and courses
const userCertificates = [
  {
    id: "1",
    courseName: "VCA Safety Training",
    provider: "Safety First B.V.",
    issueDate: "2024-01-15",
    expiryDate: "2027-01-15",
    status: "valid",
    certificateNumber: "VCA-2024-001"
  },
  {
    id: "2",
    courseName: "Forklift Operation Certification",
    provider: "Heavy Equipment Training",
    issueDate: "2023-08-20",
    expiryDate: "2024-08-20",
    status: "expiring",
    certificateNumber: "FLT-2023-045"
  }
];

const userCourses = [
  {
    id: "1",
    title: "Advanced Safety Procedures",
    instructor: "Sarah Wilson",
    date: "2024-01-20",
    status: "completed",
    score: 95
  },
  {
    id: "2",
    title: "Emergency Response Training",
    instructor: "Mike Johnson",
    date: "2024-02-15",
    status: "enrolled",
    score: null
  },
  {
    id: "3",
    title: "Leadership Development",
    instructor: "Emma Brown",
    date: "2024-03-10",
    status: "pending",
    score: null
  }
];

const statusColors = {
  valid: "bg-green-100 text-green-800",
  expiring: "bg-orange-100 text-orange-800",
  expired: "bg-red-100 text-red-800",
  completed: "bg-green-100 text-green-800",
  enrolled: "bg-blue-100 text-blue-800",
  pending: "bg-yellow-100 text-yellow-800"
};

const statusIcons = {
  valid: CheckCircle,
  expiring: Clock,
  expired: AlertTriangle,
  completed: CheckCircle,
  enrolled: Clock,
  pending: Clock
};

export function UserProfileTabs({ userId }: UserProfileTabsProps) {
  return (
    <Tabs defaultValue="certificates" className="space-y-6">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="certificates" className="flex items-center gap-2">
          <Award className="h-4 w-4" />
          Certificates
        </TabsTrigger>
        <TabsTrigger value="courses" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Training Courses
        </TabsTrigger>
        <TabsTrigger value="status" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Status History
        </TabsTrigger>
        <TabsTrigger value="documents" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Documents
        </TabsTrigger>
        <TabsTrigger value="profile" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Profile Details
        </TabsTrigger>
      </TabsList>

      <TabsContent value="certificates" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Current Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userCertificates.map((cert) => {
                const StatusIcon = statusIcons[cert.status as keyof typeof statusIcons];
                
                return (
                  <div key={cert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold">{cert.courseName}</h3>
                        <Badge className={statusColors[cert.status as keyof typeof statusColors]}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {cert.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Issued: {cert.issueDate} • Expires: {cert.expiryDate}</div>
                        <div>Provider: {cert.provider}</div>
                        <div>Certificate #: {cert.certificateNumber}</div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="courses" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Training History & Upcoming Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userCourses.map((course) => {
                const StatusIcon = statusIcons[course.status as keyof typeof statusIcons];
                
                return (
                  <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold">{course.title}</h3>
                        <Badge className={statusColors[course.status as keyof typeof statusColors]}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {course.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Instructor: {course.instructor}</div>
                        <div>Date: {course.date}</div>
                        {course.score && (
                          <div>Score: {course.score}%</div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="status" className="space-y-4">
        <EmployeeStatusManager employeeId={userId} currentStatus="active" />
      </TabsContent>

      <TabsContent value="documents">
        <Card>
          <CardHeader>
            <CardTitle>Employee Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Document management features coming soon...</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle>Detailed Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Extended profile management features coming soon...</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
