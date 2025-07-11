
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  Calendar, 
  Award, 
  BookOpen, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Star
} from "lucide-react";
import { Certificate, Training, Code95Progress } from "@/types";
import { calculateCode95Points } from "@/utils/certificateUtils";

// Mock employee data
const mockEmployeeData = {
  id: "emp-001",
  name: "Jan Jansen",
  email: "jan.jansen@reym.nl",
  department: "Transport",
  employeeNumber: "EMP-001"
};

const mockEmployeeCertificates: Certificate[] = [
  {
    id: "1",
    employeeId: "emp-001",
    employeeName: "Jan Jansen",
    courseName: "Druk Vacuüm Machinist (DVM)",
    certificateNumber: "DVM-2024-001",
    issueDate: "2023-01-15",
    expiryDate: "2024-08-15",
    status: "expiring",
    category: "Safety",
    provider: "VeiligheidsInstituut Nederland",
    code95Points: 7
  },
  {
    id: "2",
    employeeId: "emp-001",
    employeeName: "Jan Jansen",
    courseName: "HDO Certificaat",
    certificateNumber: "HDO-2023-045",
    issueDate: "2023-02-20",
    expiryDate: "2026-02-20",
    status: "valid",
    category: "Equipment",
    provider: "Transport & Logistiek Nederland",
    code95Points: 5
  }
];

const mockUpcomingTrainings: Training[] = [
  {
    id: "tr-001",
    title: "DVM Recertification Training",
    description: "Druk Vacuüm Machinist recertification",
    instructor: "Piet Bakker",
    instructorId: "inst-001",
    date: "2024-08-01",
    time: "09:00",
    location: "Training Center Amsterdam",
    maxParticipants: 12,
    participants: [],
    materials: [],
    status: "confirmed",
    code95Points: 7,
    requiresApproval: false,
    organizerId: "org-001"
  }
];

export function EmployeeSelfService() {
  const [activeTab, setActiveTab] = useState<'certificates' | 'trainings' | 'code95'>('certificates');
  const [employee] = useState(mockEmployeeData);
  const [certificates] = useState(mockEmployeeCertificates);
  const [upcomingTrainings] = useState(mockUpcomingTrainings);

  const code95Progress = calculateCode95Points(certificates);
  const code95Percentage = (code95Progress.total / code95Progress.required) * 100;

  const statusColors = {
    valid: "bg-green-100 text-green-800",
    expiring: "bg-orange-100 text-orange-800",
    expired: "bg-red-100 text-red-800"
  };

  const statusIcons = {
    valid: CheckCircle,
    expiring: Clock,
    expired: AlertTriangle
  };

  const handleDownloadCertificate = (certId: string) => {
    console.log(`Downloading certificate ${certId}`);
  };

  return (
    <div className="space-y-6">
      {/* Employee Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {employee.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{employee.name}</h1>
              <p className="text-gray-600">{employee.department} • {employee.employeeNumber}</p>
              <p className="text-sm text-gray-500">{employee.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('certificates')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'certificates' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Award className="h-4 w-4 inline mr-2" />
          My Certificates
        </button>
        <button
          onClick={() => setActiveTab('trainings')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'trainings' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <BookOpen className="h-4 w-4 inline mr-2" />
          Planned Trainings
        </button>
        <button
          onClick={() => setActiveTab('code95')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'code95' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Star className="h-4 w-4 inline mr-2" />
          Code 95 Progress
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'certificates' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">My Certificates</h2>
          {certificates.map((cert) => {
            const StatusIcon = statusIcons[cert.status];
            
            return (
              <Card key={cert.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {cert.courseName}
                        </h3>
                        <Badge className={statusColors[cert.status]}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {cert.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          Issued: {cert.issueDate}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          Expires: {cert.expiryDate}
                        </div>
                        <div className="text-xs">
                          #{cert.certificateNumber}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Provided by {cert.provider}</span>
                        {cert.code95Points && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            Code 95: {cert.code95Points} points
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadCertificate(cert.id)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === 'trainings' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Planned Trainings</h2>
          {upcomingTrainings.map((training) => (
            <Card key={training.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {training.title}
                      </h3>
                      <Badge className="bg-green-100 text-green-800">
                        {training.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {training.date} at {training.time}
                      </div>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Instructor: {training.instructor}
                      </div>
                      <div className="flex items-center">
                        <Award className="h-4 w-4 mr-2" />
                        Location: {training.location}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-500">{training.description}</p>
                    
                    {training.code95Points && (
                      <div className="mt-2">
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">
                          Code 95: {training.code95Points} points
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'code95' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Code 95 Progress</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Current Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Points Earned</span>
                  <span className="text-sm text-gray-600">
                    {code95Progress.total} / {code95Progress.required} points
                  </span>
                </div>
                <Progress value={code95Percentage} className="w-full" />
                <p className="text-sm text-gray-600">
                  You need {code95Progress.required - code95Progress.total} more points to maintain your Code 95 qualification.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Points Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {certificates.filter(cert => cert.code95Points && cert.code95Points > 0).map((cert) => (
                  <div key={cert.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{cert.courseName}</p>
                      <p className="text-sm text-gray-600">Completed: {cert.issueDate}</p>
                    </div>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      {cert.code95Points} points
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
