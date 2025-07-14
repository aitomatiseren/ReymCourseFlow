import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  BookOpen, 
  Award, 
  Calendar, 
  User,
  AlertTriangle
} from 'lucide-react';
import { EmployeeDashboard } from '@/components/employee/EmployeeDashboard';
import { EmployeeTrainingBrowser } from '@/components/employee/EmployeeTrainingBrowser';
import { EmployeeCertificateManager } from '@/components/employee/EmployeeCertificateManager';
import { EmployeeTrainingCalendar } from '@/components/employee/EmployeeTrainingCalendar';
import { EmployeeSelfService } from '@/components/employee/EmployeeSelfService';
import { useEmployeeCertificateRenewals } from '@/hooks/useEmployeeSelfService';
import { usePermissions } from '@/context/PermissionsContext';

export default function EmployeePortal() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { userProfile, hasPermission } = usePermissions();
  const { data: renewals } = useEmployeeCertificateRenewals();

  // Check if user has employee permissions
  if (!hasPermission('view_own_profile')) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">
            You don't have permission to access the employee portal.
          </p>
        </div>
      </div>
    );
  }

  // Count urgent renewals for badge
  const urgentRenewals = renewals?.filter(r => r.renewal_status === 'renewal_due').length || 0;

  const employeeName = userProfile?.employee?.name || userProfile?.employee?.first_name 
    ? `${userProfile.employee.first_name} ${userProfile.employee.tussenvoegsel || ''} ${userProfile.employee.last_name}`.trim()
    : 'Employee';

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Employee Portal</h1>
        <p className="text-gray-600">
          Welcome, {employeeName}. Manage your training and certifications.
        </p>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-fit lg:grid-cols-5">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="training" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Browse Training</span>
          </TabsTrigger>
          <TabsTrigger value="certificates" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">Certificates</span>
            {urgentRenewals > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">
                {urgentRenewals}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Calendar</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <EmployeeDashboard />
        </TabsContent>

        <TabsContent value="training" className="mt-6">
          <EmployeeTrainingBrowser />
        </TabsContent>

        <TabsContent value="certificates" className="mt-6">
          <EmployeeCertificateManager />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <EmployeeTrainingCalendar />
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <EmployeeSelfService />
        </TabsContent>
      </Tabs>
    </div>
  );
}