
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CertificateExpiryReport } from "./CertificateExpiryReport";
import { TrainingCostReport } from "./TrainingCostReport";
import { ComplianceReport } from "./ComplianceReport";
import { Code95Dashboard } from "@/components/certificates/Code95Dashboard";
import { ExemptionManagementDashboard } from "@/components/certificates/ExemptionManagementDashboard";
import { BulkCertificateProcessor } from "@/components/certificates/BulkCertificateProcessor";
import { FileText, AlertTriangle, DollarSign, CheckCircle, Loader2, Truck, Shield, Upload } from "lucide-react";
import { useCertificates } from "@/hooks/useCertificates";
import { useTrainings } from "@/hooks/useTrainings";

export function ReportsScreen() {
  const { t } = useTranslation(['reports']);
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'expiry';
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
          <h1 className="text-3xl font-bold text-gray-900">{t('reports:screen.title')}</h1>
          <p className="text-gray-600 mt-1">{t('reports:screen.subtitle')}</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('reports:screen.expiringSoon')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold text-orange-600">{expiringSoon}</div>
                <p className="text-xs text-muted-foreground">{t('reports:screen.next30Days')}</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('reports:screen.criticalExpired')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600">{expired}</div>
                <p className="text-xs text-muted-foreground">{t('reports:screen.requiresAction')}</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('reports:screen.trainingCosts')}</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">€{totalTrainingCost.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">{t('reports:screen.totalEnrolled')}</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('reports:screen.complianceRate')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">{complianceRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">{t('reports:screen.validCertificates')}</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue={activeTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="expiry" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {t('reports:screen.certificateExpiry')}
          </TabsTrigger>
          <TabsTrigger value="costs" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            {t('reports:screen.trainingCostsTab')}
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {t('reports:screen.compliance')}
          </TabsTrigger>
          <TabsTrigger value="code95" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Code 95
          </TabsTrigger>
          <TabsTrigger value="exemptions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Exemptions
          </TabsTrigger>
          <TabsTrigger value="processing" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Certificate Processing
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

        <TabsContent value="code95">
          <Code95Dashboard />
        </TabsContent>

        <TabsContent value="exemptions">
          <ExemptionManagementDashboard />
        </TabsContent>

        <TabsContent value="processing">
          <BulkCertificateProcessor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
