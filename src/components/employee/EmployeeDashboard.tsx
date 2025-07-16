import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  BookOpen, 
  Award, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  User,
  FileText,
  CheckCircle
} from 'lucide-react';
import { useEmployeeDashboardStats, useEmployeeCertificateRenewals } from '@/hooks/useEmployeeSelfService';
import { usePermissions } from '@/context/PermissionsContext';
import { formatDistanceToNow } from 'date-fns';
import { EmployeeAvailabilityCard } from './EmployeeAvailabilityCard';

export const EmployeeDashboard: React.FC = () => {
  const { userProfile } = usePermissions();
  const { data: stats, isLoading: statsLoading } = useEmployeeDashboardStats();
  const { data: renewals, isLoading: renewalsLoading } = useEmployeeCertificateRenewals();

  const urgentRenewals = renewals?.filter(r => r.renewal_status === 'renewal_due') || [];
  const approachingRenewals = renewals?.filter(r => r.renewal_status === 'renewal_approaching') || [];

  if (statsLoading || renewalsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 bg-gray-200 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const employeeName = userProfile?.employee?.name || userProfile?.employee?.first_name 
    ? `${userProfile.employee.first_name} ${userProfile.employee.tussenvoegsel || ''} ${userProfile.employee.last_name}`.trim()
    : 'Employee';

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {employeeName}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's your training and certification overview
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <User className="h-4 w-4" />
          <span>Employee Dashboard</span>
        </div>
      </div>

      {/* Urgent Renewals Alert */}
      {urgentRenewals.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Action Required:</strong> You have {urgentRenewals.length} certificate{urgentRenewals.length === 1 ? '' : 's'} 
            that need{urgentRenewals.length === 1 ? 's' : ''} renewal soon. 
            <Button variant="link" className="p-0 h-auto ml-2 text-red-600">
              View renewal options →
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Training Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training Progress</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {stats?.training.completed || 0}/{stats?.training.total || 0}
              </div>
              <Progress value={stats?.training.completionRate || 0} className="h-2" />
              <p className="text-xs text-gray-600">
                {stats?.training.completionRate || 0}% completion rate
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Active Trainings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trainings</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.training.inProgress || 0}
            </div>
            <p className="text-xs text-gray-600">
              Currently in progress
            </p>
            {stats?.upcoming.trainings && stats.upcoming.trainings > 0 && (
              <p className="text-xs text-blue-600 mt-1">
                +{stats.upcoming.trainings} upcoming
              </p>
            )}
          </CardContent>
        </Card>

        {/* Certificates */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates</CardTitle>
            <Award className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.certificates.valid || 0}
            </div>
            <p className="text-xs text-gray-600">
              Valid certificates
            </p>
            {stats?.certificates.expiring && stats.certificates.expiring > 0 && (
              <p className="text-xs text-amber-600 mt-1">
                {stats.certificates.expiring} expiring soon
              </p>
            )}
          </CardContent>
        </Card>

        {/* Overall Score */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.certificates.total && stats.certificates.valid 
                ? Math.round((stats.certificates.valid / stats.certificates.total) * 100)
                : 100}%
            </div>
            <p className="text-xs text-gray-600">
              Certificate compliance
            </p>
            <div className="flex items-center mt-1">
              <CheckCircle className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-xs text-green-600">Up to date</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions, Renewals, and Availability */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common tasks and actions you can perform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <BookOpen className="h-4 w-4 mr-2" />
              Browse Available Trainings
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Award className="h-4 w-4 mr-2" />
              View My Certificates
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <FileText className="h-4 w-4 mr-2" />
              Upload Certificate Document
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <User className="h-4 w-4 mr-2" />
              Update Contact Information
            </Button>
          </CardContent>
        </Card>

        {/* Certificate Renewals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Certificate Renewals
            </CardTitle>
            <CardDescription>
              Upcoming renewal requirements and deadlines
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!renewals || renewals.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No certificates requiring renewal</p>
              </div>
            ) : (
              <div className="space-y-3">
                {renewals.slice(0, 4).map((renewal, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{renewal.certificate_name}</p>
                      <p className="text-xs text-gray-600">
                        Expires {formatDistanceToNow(new Date(renewal.current_expiry_date), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        renewal.renewal_status === 'renewal_due' ? 'destructive' :
                        renewal.renewal_status === 'renewal_approaching' ? 'default' :
                        'secondary'
                      }
                      className="text-xs"
                    >
                      {renewal.renewal_status === 'renewal_due' ? 'Due' :
                       renewal.renewal_status === 'renewal_approaching' ? 'Soon' :
                       'Current'}
                    </Badge>
                  </div>
                ))}
                {renewals.length > 4 && (
                  <Button variant="link" className="w-full text-sm">
                    View all {renewals.length} renewal requirements →
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Employee Availability */}
        <EmployeeAvailabilityCard 
          employeeId={userProfile?.employee?.id || ''} 
          showManageButton={true}
          maxItems={3}
        />
      </div>

      {/* Recent Activity Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Your latest training and certification activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats?.training.completed && stats.training.completed > 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-600">Activity timeline will be shown here</p>
                <p className="text-sm text-gray-500 mt-1">
                  Recent completions, enrollments, and certificate updates
                </p>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm mt-1">Start by enrolling in a training course</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};