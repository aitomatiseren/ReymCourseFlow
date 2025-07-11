
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CertificateExpiryReport } from "./CertificateExpiryReport";
import { TrainingCostReport } from "./TrainingCostReport";
import { ComplianceReport } from "./ComplianceReport";
import { FileText, AlertTriangle, DollarSign, CheckCircle, Loader2 } from "lucide-react";
import { useCertificates } from "@/hooks/useCertificates";
import { useTrainings } from "@/hooks/useTrainings";

export function ReportsScreen() {
  const { data: certificates = [], isLoading: certificatesLoading } = useCertificates();
  const { data: trainings = [], isLoading: trainingsLoading } = useTrainings();

  // Calculate statistics from real data
  const expiringSoon = certificates.filter(cert => {
    if (!cert.expiryDate) return false;
    const daysLeft = Math.ceil((new Date(cert.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 && daysLeft <= 30;
  }).length;

  const expired = certificates.filter(cert => cert.status === 'expired').length;

  const totalTrainingCost = trainings.reduce((sum, training) => {
    const basePrice = training.price || 0;
    const participantCost = basePrice * training.participantCount;
    return sum + participantCost;
  }, 0);

  const complianceRate = certificates.length > 0 
    ? ((certificates.filter(cert => cert.status === 'valid').length / certificates.length) * 100)
    : 0;

  const isLoading = certificatesLoading || trainingsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive training and compliance reporting</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold text-orange-600">{expiringSoon}</div>
                <p className="text-xs text-muted-foreground">Next 30 days</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Expired</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600">{expired}</div>
                <p className="text-xs text-muted-foreground">Requires immediate action</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training Costs</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">€{totalTrainingCost.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total enrolled</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">{complianceRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Valid certificates</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue="expiry" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="expiry" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Certificate Expiry
          </TabsTrigger>
          <TabsTrigger value="costs" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Training Costs
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Compliance
          </TabsTrigger>
          <TabsTrigger value="utilization" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Utilization
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expiry">
          <CertificateExpiryReport />
        </TabsContent>

        <TabsContent value="costs">
          <TrainingCostReport />
        </TabsContent>

        <TabsContent value="compliance">
          <ComplianceReport />
        </TabsContent>

        <TabsContent value="utilization">
          <Card>
            <CardHeader>
              <CardTitle>Course Utilization Report</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
