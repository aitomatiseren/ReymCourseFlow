
import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CertificateExpiryReport } from "@/components/reports/CertificateExpiryReport";
import { Code95Dashboard } from "@/components/certificates/Code95Dashboard";
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
  FileText,
  Truck
} from "lucide-react";
import { useCertificates } from "@/hooks/useCertificates";
import { format } from "date-fns";

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

  const { data: certificates = [], isLoading } = useCertificates();

  const filteredCertifications = certificates.filter(cert => {
    const matchesSearch = cert.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.licenseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === "all" || cert.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const handleDownloadCertificate = (certId: string) => {
    console.log(`Downloading certificate ${certId}`);
    // In a real app, this would trigger a file download
  };

  const handleViewCertificate = (certId: string) => {
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              All Certificates
            </TabsTrigger>
            <TabsTrigger value="expiry" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Expiry Tracking
            </TabsTrigger>
            <TabsTrigger value="code95" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Code 95
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search certificates, employees, or certificate numbers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border rounded-md bg-white"
              >
                <option value="all">All Status</option>
                <option value="valid">Valid</option>
                <option value="expiring">Expiring</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCertifications.map((cert) => {
                  const StatusIcon = statusIcons[cert.status as keyof typeof statusIcons];

                  return (
                    <Card key={cert.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <StatusIcon className="h-5 w-5 text-gray-600" />
                              <h3 className="text-lg font-semibold text-gray-900">
                                {cert.licenseName}
                              </h3>
                              <Badge className={statusColors[cert.status as keyof typeof statusColors]}>
                                {cert.status.charAt(0).toUpperCase() + cert.status.slice(1)}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>{cert.employeeName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  Expires: {cert.expiryDate ? format(new Date(cert.expiryDate), 'MMM dd, yyyy') : 'N/A'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <span>#{cert.certificateNumber || 'N/A'}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>Category: {cert.category}</span>
                              {cert.issueDate && (
                                <span>• Issued: {format(new Date(cert.issueDate), 'MMM dd, yyyy')}</span>
                              )}
                            </div>
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
            )}

            {!isLoading && filteredCertifications.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No certificates found matching your criteria.</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Try adjusting your search terms or filters.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="expiry">
            <CertificateExpiryReport />
          </TabsContent>

          <TabsContent value="code95">
            <Code95Dashboard />
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Certificate Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="p-4">
                      <h3 className="font-semibold mb-2">Total Certificates</h3>
                      <p className="text-2xl font-bold text-blue-600">{certificates.length}</p>
                    </Card>
                    <Card className="p-4">
                      <h3 className="font-semibold mb-2">Valid Certificates</h3>
                      <p className="text-2xl font-bold text-green-600">
                        {certificates.filter(c => c.status === 'valid').length}
                      </p>
                    </Card>
                    <Card className="p-4">
                      <h3 className="font-semibold mb-2">Expired Certificates</h3>
                      <p className="text-2xl font-bold text-red-600">
                        {certificates.filter(c => c.status === 'expired').length}
                      </p>
                    </Card>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-4">Certificate Categories</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(
                        certificates.reduce((acc, cert) => {
                          acc[cert.category] = (acc[cert.category] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([category, count]) => (
                        <div key={category} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span className="font-medium">{category}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
