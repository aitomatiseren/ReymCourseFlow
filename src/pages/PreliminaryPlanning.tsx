import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  Calendar, 
  Users, 
  Clock, 
  AlertTriangle, 
  Plus, 
  FileText, 
  CheckCircle,
  Eye,
  Edit,
  Trash2,
  Filter,
  Brain
} from "lucide-react";
import { usePreliminaryPlans, useCertificateExpiryAnalysis } from "@/hooks/usePreliminaryPlanning";
import { useLicenses } from "@/hooks/useCertificates";
import { PreliminaryPlanDialog } from "@/components/planning/PreliminaryPlanDialog";
import { CertificateExpiryOverview } from "@/components/planning/CertificateExpiryOverview";
import { EmployeeGroupingView } from "@/components/planning/EmployeeGroupingView";
import { PlanningCalendarView } from "@/components/planning/PlanningCalendarView";
import { ConvertPlanDialog } from "@/components/planning/ConvertPlanDialog";
import { PlanningAnalytics } from "@/components/planning/PlanningAnalytics";
import { PlanViewDialog } from "@/components/planning/PlanViewDialog";
import { useIntelligentScheduler } from "@/hooks/useIntelligentScheduler";
import { IntelligentSchedulingRecommendations } from "@/components/training/IntelligentSchedulingRecommendations";

export default function PreliminaryPlanning() {
  const { t } = useTranslation(['common', 'planning']);
  const navigate = useNavigate();
  const [selectedLicenseId, setSelectedLicenseId] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('plans');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPlanForConversion, setSelectedPlanForConversion] = useState<typeof preliminaryPlans[0] | null>(null);
  const [isConversionDialogOpen, setIsConversionDialogOpen] = useState(false);
  const [selectedPlanForView, setSelectedPlanForView] = useState<typeof preliminaryPlans[0] | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState<typeof preliminaryPlans[0] | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: preliminaryPlans = [], isLoading: plansLoading } = usePreliminaryPlans();
  const { data: licenses = [] } = useLicenses();
  
  // Intelligent scheduler integration
  const {
    isAnalyzing,
    recommendations,
    getSchedulingRecommendations,
    clearRecommendations
  } = useIntelligentScheduler();
  
  const expiryFilters = {
    license_id: selectedLicenseId && selectedLicenseId !== 'all' ? selectedLicenseId : undefined,
    department: selectedDepartment || undefined,
    employee_status: selectedStatus && selectedStatus !== 'all' ? selectedStatus : undefined,
    days_until_expiry_max: selectedStatus === 'renewal_due' ? 180 : undefined
  };
  
  const { data: expiryAnalysis = [], isLoading: expiryLoading } = useCertificateExpiryAnalysis(expiryFilters);

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: { variant: "outline" as const, icon: FileText, color: "text-gray-600" },
      review: { variant: "secondary" as const, icon: Eye, color: "text-blue-600" },
      approved: { variant: "secondary" as const, icon: CheckCircle, color: "text-green-600" },
      finalized: { variant: "default" as const, icon: CheckCircle, color: "text-green-800" },
      archived: { variant: "outline" as const, icon: Trash2, color: "text-gray-400" }
    };

    const config = variants[status as keyof typeof variants] || variants.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={`flex items-center gap-1 ${config.color}`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getExpiryStatusBadge = (status: string, daysUntilExpiry?: number) => {
    switch (status) {
      case 'expired':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Expired
        </Badge>;
      case 'renewal_due':
        return <Badge variant="secondary" className="flex items-center gap-1 bg-red-100 text-red-800">
          <Clock className="h-3 w-3" />
          Due ({daysUntilExpiry} days)
        </Badge>;
      case 'renewal_approaching':
        return <Badge variant="secondary" className="flex items-center gap-1 bg-orange-100 text-orange-800">
          <Clock className="h-3 w-3" />
          Approaching ({daysUntilExpiry} days)
        </Badge>;
      case 'new':
        return <Badge variant="secondary" className="flex items-center gap-1 bg-blue-100 text-blue-800">
          <Users className="h-3 w-3" />
          New Employee
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const urgentExpiryCount = expiryAnalysis.filter(item => 
    item.employee_status === 'expired' || 
    (item.employee_status === 'renewal_due' && (item.days_until_expiry || 0) <= 30)
  ).length;

  const newEmployeesCount = expiryAnalysis.filter(item => item.employee_status === 'new').length;
  const renewalDueCount = expiryAnalysis.filter(item => item.employee_status === 'renewal_due').length;

  // Handle intelligent scheduling for certificate expiry
  const handleGetExpiryRecommendations = async () => {
    if (!selectedLicenseId || selectedLicenseId === 'all') {
      return;
    }

    const urgentEmployees = expiryAnalysis
      .filter(item => item.employee_status === 'expired' || item.employee_status === 'renewal_due')
      .map(item => item.employee_id);

    if (urgentEmployees.length === 0) {
      return;
    }

    const constraints = {
      courseId: selectedLicenseId, // Use license ID as course filter
      requiredEmployeeIds: urgentEmployees,
      urgencyLevel: 'high' as const,
      teamCoverageRequired: true,
      maxParticipants: 20
    };

    await getSchedulingRecommendations(constraints);
  };

  const handleApplyExpiryRecommendation = (recommendation: any) => {
    // Navigate to training creation with pre-filled data
    navigate('/training/create', {
      state: {
        courseId: selectedLicenseId,
        providerId: recommendation.provider.id,
        suggestedDates: recommendation.suggestedDates,
        participants: recommendation.availableEmployees
      }
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/scheduling')}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{t('planning:preliminaryPlanning.title')}</h1>
              <p className="text-muted-foreground mt-1">
                {t('planning:preliminaryPlanning.description')}
              </p>
            </div>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t('planning:preliminaryPlanning.createPlan')}
          </Button>
        </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('planning:certificateExpiry.stats.urgentRenewals')}</p>
                <p className="text-2xl font-bold text-red-600">{urgentExpiryCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('planning:certificateExpiry.stats.newEmployees')}</p>
                <p className="text-2xl font-bold text-blue-600">{newEmployeesCount}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('planning:certificateExpiry.stats.renewalsDue')}</p>
                <p className="text-2xl font-bold text-orange-600">{renewalDueCount}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('planning:certificateExpiry.stats.activePlans')}</p>
                <p className="text-2xl font-bold text-green-600">
                  {preliminaryPlans.filter(p => ['draft', 'review', 'approved'].includes(p.status)).length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="plans">{t('planning:preliminaryPlanning.title')}</TabsTrigger>
          <TabsTrigger value="expiry">{t('planning:certificateExpiry.title')}</TabsTrigger>
          <TabsTrigger value="grouping">{t('planning:employeeGrouping.title')}</TabsTrigger>
          <TabsTrigger value="calendar">{t('planning:planningCalendar.title')}</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="intelligent" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Scheduling
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Preliminary Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              {plansLoading ? (
                <div className="text-center py-8">Loading plans...</div>
              ) : preliminaryPlans.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No preliminary plans created yet</p>
                  <p className="text-sm">Create your first plan to start organizing certificate renewals</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {preliminaryPlans.map((plan) => (
                    <div key={plan.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{plan.name}</h3>
                          {getStatusBadge(plan.status)}
                          <span className="text-sm text-gray-500">v{plan.version}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Period: {plan.planning_period_start} to {plan.planning_period_end}</span>
                          <span>Created: {new Date(plan.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedPlanForView(plan);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {(plan.status === 'draft' || plan.status === 'review') && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedPlanForEdit(plan);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        )}
                        {plan.status === 'approved' && (
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => {
                              setSelectedPlanForConversion(plan);
                              setIsConversionDialogOpen(true);
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Convert
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiry" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Certificate Expiry Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Certificate Type</label>
                  <Select value={selectedLicenseId} onValueChange={setSelectedLicenseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All certificates" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All certificates</SelectItem>
                      {licenses.map((license) => (
                        <SelectItem key={license.id} value={license.id}>
                          {license.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Department</label>
                  <Input
                    placeholder="Filter by department"
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="new">New Employees</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="renewal_due">Renewal Due</SelectItem>
                      <SelectItem value="renewal_approaching">Renewal Approaching</SelectItem>
                      <SelectItem value="valid">Valid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <CertificateExpiryOverview
            expiryData={expiryAnalysis}
            isLoading={expiryLoading}
            getExpiryStatusBadge={getExpiryStatusBadge}
          />
        </TabsContent>

        <TabsContent value="grouping" className="space-y-6">
          <EmployeeGroupingView
            selectedLicenseId={selectedLicenseId}
            expiryData={expiryAnalysis}
            licenses={licenses}
            onLicenseChange={setSelectedLicenseId}
          />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <PlanningCalendarView preliminaryPlans={preliminaryPlans} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <PlanningAnalytics />
        </TabsContent>

        <TabsContent value="intelligent" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                AI-Powered Scheduling Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Certificate Selection for Scheduling */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Certificate-Based Scheduling</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Certificate Type</label>
                      <Select value={selectedLicenseId} onValueChange={setSelectedLicenseId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select certificate type" />
                        </SelectTrigger>
                        <SelectContent>
                          {licenses.map((license) => (
                            <SelectItem key={license.id} value={license.id}>
                              {license.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={handleGetExpiryRecommendations}
                        disabled={!selectedLicenseId || selectedLicenseId === 'all' || isAnalyzing}
                        className="flex items-center gap-2"
                      >
                        <Brain className="h-4 w-4" />
                        {isAnalyzing ? 'Analyzing...' : 'Get Recommendations'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Urgency Summary */}
                {selectedLicenseId && selectedLicenseId !== 'all' && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Urgency Analysis</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{expiryAnalysis.filter(e => e.employee_status === 'expired').length}</div>
                        <div className="text-gray-600">Expired</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{expiryAnalysis.filter(e => e.employee_status === 'renewal_due').length}</div>
                        <div className="text-gray-600">Due Soon</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{expiryAnalysis.filter(e => e.employee_status === 'renewal_approaching').length}</div>
                        <div className="text-gray-600">Approaching</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{expiryAnalysis.filter(e => e.employee_status === 'new').length}</div>
                        <div className="text-gray-600">New Employees</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Intelligent Scheduling Recommendations */}
                <IntelligentSchedulingRecommendations
                  recommendations={recommendations}
                  isAnalyzing={isAnalyzing}
                  onApplyRecommendation={handleApplyExpiryRecommendation}
                  onRefreshRecommendations={handleGetExpiryRecommendations}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

        <PreliminaryPlanDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />

        <PreliminaryPlanDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          existingPlan={selectedPlanForEdit}
        />

        <PlanViewDialog
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          plan={selectedPlanForView}
          onConvert={(plan) => {
            setSelectedPlanForConversion(plan);
            setIsConversionDialogOpen(true);
            setIsViewDialogOpen(false);
          }}
        />

        <ConvertPlanDialog
          open={isConversionDialogOpen}
          onOpenChange={setIsConversionDialogOpen}
          plan={selectedPlanForConversion}
          trainingCount={0} // Will be calculated in the dialog
          participantCount={0} // Will be calculated in the dialog
        />
      </div>
    </Layout>
  );
}