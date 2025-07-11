
import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CertificateExpiryReport } from "@/components/reports/CertificateExpiryReport";
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Award,
  FileText
} from "lucide-react";

const certifications = [
  {
    id: 1,
    participantName: "John Doe",
    courseName: "VCA Safety Training",
    provider: "Safety First B.V.",
    issueDate: "2024-01-15",
    expiryDate: "2027-01-15",
    status: "valid",
    certificateNumber: "VCA-2024-001",
    category: "Safety"
  },
  {
    id: 2,
    participantName: "Sarah Wilson",
    courseName: "Forklift Operation Certification",
    provider: "Heavy Equipment Training",
    issueDate: "2023-08-20",
    expiryDate: "2024-08-20",
    status: "expiring",
    certificateNumber: "FLT-2023-045",
    category: "Equipment"
  },
  {
    id: 3,
    participantName: "Mike Johnson",
    courseName: "First Aid & CPR",
    provider: "Emergency Response Training",
    issueDate: "2023-05-10",
    expiryDate: "2024-05-10",
    status: "expired",
    certificateNumber: "FA-2023-078",
    category: "Medical"
  },
  {
    id: 4,
    participantName: "Emma Brown",
    courseName: "Chemical Handling Safety",
    provider: "ChemSafe Institute",
    issueDate: "2024-03-12",
    expiryDate: "2026-03-12",
    status: "valid",
    certificateNumber: "CHS-2024-012",
    category: "Safety"
  }
];

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

export default function Certifications() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const filteredCertifications = certifications.filter(cert => {
    const matchesSearch = cert.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cert.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cert.provider.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === "all" || cert.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleDownloadCertificate = (certId: number) => {
    console.log(`Downloading certificate ${certId}`);
    // In a real app, this would trigger a file download
  };

  const handleViewCertificate = (certId: number) => {
    console.log(`Viewing certificate ${certId}`);
    // In a real app, this would open a modal or new page
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Certificate Management</h1>
            <p className="text-gray-600 mt-1">Manage certificates, track expiry dates, and ensure compliance.</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Certification
          </Button>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              All Certificates
            </TabsTrigger>
            <TabsTrigger value="expiry" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Expiry Tracking
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {/* Search and Filter Bar */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by participant, course, or provider..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select 
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="valid">Valid</option>
                    <option value="expiring">Expiring Soon</option>
                    <option value="expired">Expired</option>
                  </select>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    More Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Certifications List */}
            <div className="space-y-4">
              {filteredCertifications.map((cert) => {
                const StatusIcon = statusIcons[cert.status as keyof typeof statusIcons];
                
                return (
                  <Card key={cert.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {cert.courseName}
                            </h3>
                            <Badge className={statusColors[cert.status as keyof typeof statusColors]}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {cert.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2" />
                              {cert.participantName}
                            </div>
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
                          
                          <p className="text-sm text-gray-500 mt-2">
                            Provided by {cert.provider}
                          </p>
                        </div>
                        
                        <div className="flex space-x-2 ml-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewCertificate(cert.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDownloadCertificate(cert.id)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredCertifications.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-gray-500">No certifications found matching your criteria.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="expiry">
            <CertificateExpiryReport />
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Certificate Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Additional certificate reporting features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
