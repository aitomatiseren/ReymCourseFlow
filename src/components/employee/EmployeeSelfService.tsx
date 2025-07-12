
import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation('employees');
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
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'certificates'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          <Award className="h-4 w-4 inline mr-2" />
          {t('selfService.myCertificates')}
        </button>
        <button
          onClick={() => setActiveTab('trainings')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'trainings'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          <BookOpen className="h-4 w-4 inline mr-2" />
          {t('selfService.plannedTrainings')}
        </button>
        <button
          onClick={() => setActiveTab('code95')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'code95'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          <Star className="h-4 w-4 inline mr-2" />
          {t('selfService.code95Progress')}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'certificates' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{t('selfService.myCertificates')}</h2>
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
                          {t(`selfService.certificateStatus.${cert.status}`)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {t('selfService.issued')}: {cert.issueDate}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {t('selfService.expires')}: {cert.expiryDate}
                        </div>
                        <div className="text-xs">
                          #{cert.certificateNumber}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{t('selfService.providedBy')} {cert.provider}</span>
                        {cert.code95Points && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            Code 95: {cert.code95Points} {t('selfService.points')}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadCertificate(cert.id)}
                        className="flex items-center space-x-2"
                      >
                        <Download className="h-4 w-4" />
                        <span>{t('selfService.download')}</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === 'trainings' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{t('selfService.plannedTrainings')}</h2>
          {upcomingTrainings.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{t('selfService.noUpcomingTrainings')}</p>
              </CardContent>
            </Card>
          ) : (
            upcomingTrainings.map((training) => (
              <Card key={training.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {training.title}
                      </h3>
                      <p className="text-gray-600 mb-3">{training.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {t('selfService.date')}: {training.date}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          {t('selfService.time')}: {training.time}
                        </div>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          {t('selfService.instructor')}: {training.instructor}
                        </div>
                        <div className="flex items-center">
                          <span>{t('selfService.location')}: {training.location}</span>
                        </div>
                      </div>

                      {training.code95Points && training.code95Points > 0 && (
                        <div className="mt-3">
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            Code 95: {training.code95Points} {t('selfService.points')}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div>
                      <Badge className="bg-green-100 text-green-800 capitalize">
                        {t(`selfService.trainingStatus.${training.status}`)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'code95' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t('selfService.code95Progress')}</h2>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {code95Progress.total}/{code95Progress.required} {t('selfService.points')}
            </Badge>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{t('selfService.progressOverview')}</span>
                  <span className="text-gray-500">{Math.round(code95Percentage)}%</span>
                </div>

                <Progress value={code95Percentage} className="h-3" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">{code95Progress.total}</div>
                    <div className="text-sm text-gray-600">{t('selfService.pointsEarned')}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-600">{code95Progress.required}</div>
                    <div className="text-sm text-gray-600">{t('selfService.pointsRequired')}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.max(0, code95Progress.required - code95Progress.total)}
                    </div>
                    <div className="text-sm text-gray-600">{t('selfService.pointsRemaining')}</div>
                  </div>
                </div>

                {code95Progress.total >= code95Progress.required ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-green-700 font-medium">{t('selfService.code95Complete')}</p>
                    <p className="text-green-600 text-sm">{t('selfService.code95CompleteDescription')}</p>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                    <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-yellow-700 font-medium">{t('selfService.code95Incomplete')}</p>
                    <p className="text-yellow-600 text-sm">
                      {t('selfService.code95IncompleteDescription', {
                        remaining: Math.max(0, code95Progress.required - code95Progress.total)
                      })}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
