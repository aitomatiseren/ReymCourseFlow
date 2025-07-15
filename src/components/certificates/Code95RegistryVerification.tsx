import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Database,
  Shield,
  Users,
  Activity
} from 'lucide-react';
import { useCode95Registry } from '@/hooks/useCode95Registry';
import { useEmployees } from '@/hooks/useEmployees';
import { Employee } from '@/types';
import { requiresCode95 } from '@/utils/code95Utils';
import { format } from 'date-fns';

export function Code95RegistryVerification() {
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const { data: employees = [] } = useEmployees();
  const {
    bulkVerifyEmployees,
    isBulkVerifying,
    refreshEmployeeStatus,
    isRefreshing,
    stats,
    isLoadingStats
  } = useCode95Registry();

  // Filter employees who require Code 95
  const code95Employees = employees.filter(emp => requiresCode95(emp));

  const handleBulkVerification = async () => {
    const employeesToVerify = selectedEmployees.length > 0 ? selectedEmployees : code95Employees;
    await bulkVerifyEmployees(employeesToVerify);
  };

  const handleRefreshAll = async () => {
    for (const employee of code95Employees) {
      await refreshEmployeeStatus(employee.id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Valid
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
      case 'suspended':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Suspended
          </Badge>
        );
      case 'revoked':
        return (
          <Badge className="bg-red-100 text-red-800">
            <Shield className="h-3 w-3 mr-1" />
            Revoked
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            Unknown
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Registry Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Code 95 Registry Integration
          </CardTitle>
          <CardDescription>
            Real-time verification with the official Dutch Code 95 registry (KIWA/CBR)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Total Cached</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {isLoadingStats ? '...' : stats?.totalCached || 0}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Valid</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {isLoadingStats ? '...' : stats?.validCertificates || 0}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Expired</span>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {isLoadingStats ? '...' : stats?.expiredCertificates || 0}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">Suspended</span>
              </div>
              <div className="text-2xl font-bold text-yellow-600">
                {isLoadingStats ? '...' : stats?.suspendedCertificates || 0}
              </div>
            </div>
          </div>

          {stats?.lastSyncTime && (
            <div className="text-sm text-gray-600 mb-4">
              Last sync: {format(new Date(stats.lastSyncTime), 'PPpp')}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleBulkVerification}
              disabled={isBulkVerifying}
              className="flex items-center gap-2"
            >
              {isBulkVerifying ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Activity className="h-4 w-4" />
              )}
              Verify All Code 95 ({code95Employees.length})
            </Button>

            <Button
              variant="outline"
              onClick={handleRefreshAll}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              {isRefreshing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh Cache
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Verification Progress */}
      {isBulkVerifying && (
        <Card>
          <CardHeader>
            <CardTitle>Registry Verification in Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Verifying Code 95 certificates...</span>
                <span>Processing employees</span>
              </div>
              <Progress value={undefined} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Alert */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Registry Integration:</strong> This system connects to the official Dutch Code 95 registry 
          to verify certificate validity in real-time. Data is cached for 24 hours to optimize performance 
          while ensuring accuracy. Manual refresh is available for immediate updates.
        </AlertDescription>
      </Alert>

      {/* Registry Features */}
      <Card>
        <CardHeader>
          <CardTitle>Registry Features</CardTitle>
          <CardDescription>
            Advanced features available with Code 95 registry integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Real-time Verification
              </h4>
              <p className="text-sm text-gray-600">
                Verify certificate status directly from the CBR registry
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-blue-600" />
                Automated Sync
              </h4>
              <p className="text-sm text-gray-600">
                Automatic daily synchronization with registry updates
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                Status Alerts
              </h4>
              <p className="text-sm text-gray-600">
                Immediate notifications for expired or suspended certificates
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Database className="h-4 w-4 text-purple-600" />
                Data Caching
              </h4>
              <p className="text-sm text-gray-600">
                Smart caching system for optimal performance and reliability
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}