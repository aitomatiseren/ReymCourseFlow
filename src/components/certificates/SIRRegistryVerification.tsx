import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Database,
  Shield,
  Users,
  Activity,
  Search,
  ExternalLink
} from 'lucide-react';
import { useSIRRegistry } from '@/hooks/useSIRRegistry';
import { useEmployees } from '@/hooks/useEmployees';
import { Employee } from '@/types';
import { format } from 'date-fns';

export function SIRRegistryVerification() {
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const { data: employees = [] } = useEmployees();
  const {
    bulkVerifyEmployees,
    isBulkVerifying,
    refreshEmployeeStatus,
    isRefreshing,
    stats,
    isLoadingStats
  } = useSIRRegistry();

  const handleBulkVerification = async () => {
    const employeesToVerify = selectedEmployees.length > 0 ? selectedEmployees : employees;
    await bulkVerifyEmployees(employeesToVerify);
  };

  const handleRefreshAll = async () => {
    for (const employee of employees) {
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
      case 'not_found':
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <Search className="h-3 w-3 mr-1" />
            Not Found
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
            SIR Registry Integration
          </CardTitle>
          <CardDescription>
            Real-time verification with the SIR safety certificate registry (sir-safe.nl)
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
                <Search className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Not Found</span>
              </div>
              <div className="text-2xl font-bold text-gray-600">
                {isLoadingStats ? '...' : stats?.notFound || 0}
              </div>
            </div>
          </div>

          {stats?.lastSyncTime && (
            <div className="text-sm text-gray-600 mb-4">
              Last sync: {format(new Date(stats.lastSyncTime), 'PPP p')}
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
              Verify All SIR Certificates ({employees.length})
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

            <Button
              variant="outline"
              onClick={() => window.open('https://sir-safe.nl', '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Visit SIR Registry
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Verification Progress */}
      {isBulkVerifying && (
        <Card>
          <CardHeader>
            <CardTitle>SIR Registry Verification in Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Verifying SIR certificates...</span>
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
          <strong>SIR Registry Integration:</strong> This system connects to the SIR registry 
          (sir-safe.nl) to verify industrial cleaning safety certificates. The registry contains 
          information about safety qualifications required for industrial cleaning operations. 
          Data is cached for 24 hours to optimize performance.
        </AlertDescription>
      </Alert>

      {/* Registry Features */}
      <Card>
        <CardHeader>
          <CardTitle>SIR Registry Features</CardTitle>
          <CardDescription>
            Features available with SIR safety certificate registry integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Safety Certificate Verification
              </h4>
              <p className="text-sm text-gray-600">
                Verify industrial cleaning safety certificates from the SIR registry
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-blue-600" />
                Automated Sync
              </h4>
              <p className="text-sm text-gray-600">
                Automatic synchronization with SIR registry updates
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                Expiry Alerts
              </h4>
              <p className="text-sm text-gray-600">
                Notifications for expired or expiring safety certificates
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

      {/* Certificate Types */}
      <Card>
        <CardHeader>
          <CardTitle>Industrial Safety Certificate Types</CardTitle>
          <CardDescription>
            Types of safety certificates verified through the SIR registry
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium">Industrial Cleaning Safety</div>
                <div className="text-sm text-gray-600">
                  Basic safety certification for industrial cleaning operations
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Shield className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium">Hazardous Materials Handling</div>
                <div className="text-sm text-gray-600">
                  Advanced certification for handling hazardous cleaning materials
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Shield className="h-5 w-5 text-purple-600" />
              <div>
                <div className="font-medium">High-Risk Environment Access</div>
                <div className="text-sm text-gray-600">
                  Specialized certification for high-risk industrial environments
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}