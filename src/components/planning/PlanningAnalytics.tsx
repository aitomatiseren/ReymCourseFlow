import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Users, Calendar, AlertTriangle, Clock } from "lucide-react";
import { usePreliminaryPlans, useCertificateExpiryAnalysis } from "@/hooks/usePreliminaryPlanning";

export function PlanningAnalytics() {
  const { t } = useTranslation(['planning']);
  const { data: preliminaryPlans = [] } = usePreliminaryPlans();
  const { data: expiryAnalysis = [] } = useCertificateExpiryAnalysis({});

  // Calculate analytics
  const totalPlans = preliminaryPlans.length;
  const activePlans = preliminaryPlans.filter(p => ['draft', 'review', 'approved'].includes(p.status)).length;
  const finalizedPlans = preliminaryPlans.filter(p => p.status === 'finalized').length;
  const planCompletionRate = totalPlans > 0 ? (finalizedPlans / totalPlans) * 100 : 0;

  const urgentRenewals = expiryAnalysis.filter(item => 
    item.employee_status === 'expired' || 
    (item.employee_status === 'renewal_due' && (item.days_until_expiry || 0) <= 30)
  ).length;

  const newEmployees = expiryAnalysis.filter(item => item.employee_status === 'new').length;
  const renewalsDue = expiryAnalysis.filter(item => item.employee_status === 'renewal_due').length;

  // Group analysis by department
  const departmentAnalysis = expiryAnalysis.reduce((acc, item) => {
    const dept = item.department || 'Unknown';
    if (!acc[dept]) {
      acc[dept] = { total: 0, urgent: 0, new: 0 };
    }
    acc[dept].total++;
    if (item.employee_status === 'expired' || (item.employee_status === 'renewal_due' && (item.days_until_expiry || 0) <= 30)) {
      acc[dept].urgent++;
    }
    if (item.employee_status === 'new') {
      acc[dept].new++;
    }
    return acc;
  }, {} as Record<string, { total: number; urgent: number; new: number }>);

  const departmentEntries = Object.entries(departmentAnalysis)
    .sort((a, b) => (b[1].urgent + b[1].new) - (a[1].urgent + a[1].new))
    .slice(0, 5); // Top 5 departments

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Planning Analytics</h3>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Total Plans
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{totalPlans}</div>
            <p className="text-sm text-green-600">{activePlans} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{planCompletionRate.toFixed(1)}%</div>
            <Progress value={planCompletionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Urgent Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-red-600">{urgentRenewals}</div>
            <p className="text-sm text-gray-500">Renewals needed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              New Employees
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-blue-600">{newEmployees}</div>
            <p className="text-sm text-gray-500">Need training</p>
          </CardContent>
        </Card>
      </div>

      {/* Department Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Department Training Needs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {departmentEntries.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No department data available</p>
            ) : (
              departmentEntries.map(([department, stats]) => (
                <div key={department} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{department}</div>
                    <div className="text-sm text-gray-500">
                      {stats.total} total employees
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {stats.urgent > 0 && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {stats.urgent} urgent
                      </Badge>
                    )}
                    {stats.new > 0 && (
                      <Badge variant="secondary" className="flex items-center gap-1 bg-blue-100 text-blue-800">
                        <Users className="h-3 w-3" />
                        {stats.new} new
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plan Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Plan Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {['draft', 'review', 'approved', 'finalized', 'archived'].map((status) => {
              const count = preliminaryPlans.filter(p => p.status === status).length;
              const percentage = totalPlans > 0 ? (count / totalPlans) * 100 : 0;
              
              const statusConfig = {
                draft: { color: 'text-gray-600', bg: 'bg-gray-100' },
                review: { color: 'text-blue-600', bg: 'bg-blue-100' },
                approved: { color: 'text-green-600', bg: 'bg-green-100' },
                finalized: { color: 'text-purple-600', bg: 'bg-purple-100' },
                archived: { color: 'text-gray-400', bg: 'bg-gray-50' }
              }[status] || { color: 'text-gray-600', bg: 'bg-gray-100' };

              return (
                <div key={status} className={`p-3 rounded-lg ${statusConfig.bg}`}>
                  <div className={`text-2xl font-bold ${statusConfig.color}`}>{count}</div>
                  <div className="text-sm font-medium capitalize">{status}</div>
                  <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <div className="font-medium">Immediate Action Required</div>
                <div className="text-sm text-gray-600">
                  {urgentRenewals} employees need urgent certificate renewal within 30 days
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <div className="font-medium">New Employee Onboarding</div>
                <div className="text-sm text-gray-600">
                  {newEmployees} new employees require initial certification training
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <div className="font-medium">Planning Efficiency</div>
                <div className="text-sm text-gray-600">
                  {planCompletionRate.toFixed(1)}% of preliminary plans have been successfully converted to definitive trainings
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}