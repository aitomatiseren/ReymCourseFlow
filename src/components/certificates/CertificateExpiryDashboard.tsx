
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar, User, RefreshCw } from "lucide-react";
import { Certificate } from "@/types";
import { getExpiringCertificates, calculateCertificateStatus, getReplacementCertificateType } from "@/utils/certificateUtils";

// Mock data - in real app this would come from API/database
const mockCertificates: Certificate[] = [
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
    provider: "VeiligheidsInstituut Nederland"
  },
  {
    id: "2",
    employeeId: "emp-001",
    employeeName: "Jan Jansen",
    courseName: "HDO Certificaat",
    certificateNumber: "HDO-2023-045",
    issueDate: "2023-02-20",
    expiryDate: "2024-09-20",
    status: "expiring",
    category: "Equipment",
    provider: "Transport & Logistiek Nederland",
    replacementType: "HDO-M"
  },
  {
    id: "3",
    employeeId: "emp-002",
    employeeName: "Marie de Vries",
    courseName: "Veiligheidsinstructie",
    certificateNumber: "VI-2023-078",
    issueDate: "2023-05-10",
    expiryDate: "2024-07-25",
    status: "expiring",
    category: "Safety",
    provider: "Bedrijfsveiligheid Experts"
  }
];

export function CertificateExpiryDashboard() {
  const [certificates, setCertificates] = useState<Certificate[]>(mockCertificates);
  const [expiringCerts, setExpiringCerts] = useState<Certificate[]>([]);
  const [daysAhead, setDaysAhead] = useState(30);

  useEffect(() => {
    // Update certificate statuses
    const updatedCerts = certificates.map(cert => ({
      ...cert,
      status: calculateCertificateStatus(cert.expiryDate)
    }));
    
    setCertificates(updatedCerts);
    setExpiringCerts(getExpiringCertificates(updatedCerts, daysAhead));
  }, [daysAhead]);

  const handleScheduleRenewal = (certificateId: string) => {
    console.log(`Scheduling renewal for certificate ${certificateId}`);
    // In real app, this would trigger training scheduling workflow
  };

  const handleReplaceCertificate = (certificateId: string, replacementType: string) => {
    console.log(`Replacing certificate ${certificateId} with ${replacementType}`);
    // In real app, this would initiate replacement workflow
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Certificate Expiry Monitor</h2>
          <p className="text-gray-600">Automatically generated overview of certificates expiring soon</p>
        </div>
        <div className="flex items-center space-x-4">
          <select 
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={daysAhead}
            onChange={(e) => setDaysAhead(Number(e.target.value))}
          >
            <option value={7}>Next 7 days</option>
            <option value={30}>Next 30 days</option>
            <option value={60}>Next 60 days</option>
            <option value={90}>Next 90 days</option>
          </select>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {expiringCerts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No certificates expiring in the next {daysAhead} days</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {expiringCerts.map((cert) => {
            const replacementType = getReplacementCertificateType(cert.courseName.split(' ')[0]);
            
            return (
              <Card key={cert.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {cert.courseName}
                        </h3>
                        <Badge variant="outline" className="bg-orange-100 text-orange-800">
                          Expiring Soon
                        </Badge>
                        {replacementType && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            Replacement Available: {replacementType}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          {cert.employeeName}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          Expires: {cert.expiryDate}
                        </div>
                        <div className="text-xs">
                          #{cert.certificateNumber}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-500">
                        Provided by {cert.provider}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      {replacementType ? (
                        <Button 
                          size="sm"
                          onClick={() => handleReplaceCertificate(cert.id, replacementType)}
                        >
                          Schedule {replacementType} Training
                        </Button>
                      ) : (
                        <Button 
                          size="sm"
                          onClick={() => handleScheduleRenewal(cert.id)}
                        >
                          Schedule Renewal
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
