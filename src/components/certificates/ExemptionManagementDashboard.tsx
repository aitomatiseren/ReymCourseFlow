import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus,
  Search,
  Filter,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  FileText,
  Calendar,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  useCertificateExemptions,
  usePendingExemptions,
  useExemptionStatistics,
  useExemptionManagement,
  ExemptionWithDetails,
  getExemptionStatusColor,
  getExemptionTypeColor,
  isExemptionExpiringSoon
} from '@/hooks/useCertificateExemptions';
import { useEmployees } from '@/hooks/useEmployees';
import { useLicenses } from '@/hooks/useCertificates';
import { ExemptionRequestDialog } from './ExemptionRequestDialog';
import { ExemptionApprovalDialog } from './ExemptionApprovalDialog';
import { toast } from '@/hooks/use-toast';

export const ExemptionManagementDashboard: React.FC = () => {
  const [filters, setFilters] = useState({
    search: '',
    employeeId: '__all__',
    licenseId: '__all__',
    approvalStatus: '__all__',
    exemptionType: '__all__',
    isActive: undefined as boolean | undefined
  });
  
  const [selectedExemption, setSelectedExemption] = useState<ExemptionWithDetails | null>(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);

  // Data hooks - convert __all__ values to empty strings for the API
  const apiFilters = {
    ...filters,
    employeeId: filters.employeeId === '__all__' ? '' : filters.employeeId,
    licenseId: filters.licenseId === '__all__' ? '' : filters.licenseId,
    approvalStatus: filters.approvalStatus === '__all__' ? '' : filters.approvalStatus,
    exemptionType: filters.exemptionType === '__all__' ? '' : filters.exemptionType,
  };
  const { data: exemptions, isLoading } = useCertificateExemptions(apiFilters);
  const { data: pendingExemptions } = usePendingExemptions();
  const { data: statistics } = useExemptionStatistics();
  const { data: employees } = useEmployees();
  const { data: licenses } = useLicenses();
  const { revokeExemption } = useExemptionManagement();

  const handleViewExemption = (exemption: ExemptionWithDetails) => {
    setSelectedExemption(exemption);
    setShowApprovalDialog(true);
  };

  const handleRevokeExemption = async (exemption: ExemptionWithDetails) => {
    const reason = prompt('Please provide a reason for revoking this exemption:');
    if (!reason) return;

    try {
      await revokeExemption.mutateAsync({
        exemptionId: exemption.id,
        revocationReason: reason
      });

      toast({
        title: "Exemption Revoked",
        description: `Exemption for ${exemption.employee?.name} has been revoked.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke exemption. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filteredExemptions = exemptions?.filter(exemption => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        exemption.employee?.name.toLowerCase().includes(searchLower) ||
        exemption.license?.name.toLowerCase().includes(searchLower) ||
        exemption.reason.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }) || [];

  const ExemptionCard = ({ exemption }: { exemption: ExemptionWithDetails }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={getExemptionStatusColor(exemption.approval_status)}>
              {exemption.approval_status}
            </Badge>
            <Badge className={getExemptionTypeColor(exemption.exemption_type)}>
              {exemption.exemption_type}
            </Badge>
            {isExemptionExpiringSoon(exemption) && (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                <Clock className="mr-1 h-3 w-3" />
                Expiring Soon
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {exemption.created_at && format(new Date(exemption.created_at), 'MMM d, yyyy')}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{exemption.employee?.name}</span>
          <span className="text-sm text-muted-foreground">
            ({exemption.employee?.employee_number})
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{exemption.license?.name}</span>
          {exemption.license?.category && (
            <Badge variant="outline" className="text-xs">
              {exemption.license.category}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {format(new Date(exemption.effective_date), 'MMM d, yyyy')}
            {exemption.expiry_date && (
              <> - {format(new Date(exemption.expiry_date), 'MMM d, yyyy')}</>
            )}
          </span>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">
          {exemption.reason}
        </p>

        <div className="flex gap-2 pt-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => handleViewExemption(exemption)}
            className="flex items-center gap-1"
          >
            <Eye className="h-3 w-3" />
            View
          </Button>
          
          {exemption.approval_status === 'approved' && exemption.is_active && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleRevokeExemption(exemption)}
              className="text-red-600 hover:text-red-700"
            >
              <RefreshCw className="h-3 w-3" />
              Revoke
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Certificate Exemptions</h2>
          <p className="text-muted-foreground">
            Manage certificate exemption requests and approvals
          </p>
        </div>
        <Button onClick={() => setShowRequestDialog(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Request Employee Exemption
        </Button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{statistics.pending}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Exemptions</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.approved}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statistics.rejected}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{statistics.expiringSoon}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search exemptions..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Employee</label>
              <Select 
                value={filters.employeeId} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, employeeId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All employees</SelectItem>
                  {employees?.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Certificate</label>
              <Select 
                value={filters.licenseId} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, licenseId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All certificates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All certificates</SelectItem>
                  {licenses?.map(license => (
                    <SelectItem key={license.id} value={license.id}>
                      {license.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select 
                value={filters.approvalStatus} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, approvalStatus: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="revoked">Revoked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select 
                value={filters.exemptionType} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, exemptionType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All types</SelectItem>
                  <SelectItem value="temporary">Temporary</SelectItem>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="conditional">Conditional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Active Status</label>
              <Select 
                value={filters.isActive?.toString() || ''} 
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  isActive: value === '' ? undefined : value === 'true' 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All</SelectItem>
                  <SelectItem value="true">Active Only</SelectItem>
                  <SelectItem value="false">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exemptions List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Exemptions</TabsTrigger>
          <TabsTrigger value="pending">
            Pending Approval
            {pendingExemptions && pendingExemptions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingExemptions.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="text-muted-foreground">Loading exemptions...</div>
            </div>
          ) : filteredExemptions.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No exemptions found matching the current filters.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredExemptions.map(exemption => (
                <ExemptionCard key={exemption.id} exemption={exemption} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingExemptions && pendingExemptions.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                No exemptions pending approval.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingExemptions?.map(exemption => (
                <ExemptionCard key={exemption.id} exemption={exemption} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ExemptionRequestDialog
        open={showRequestDialog}
        onOpenChange={setShowRequestDialog}
      />

      <ExemptionApprovalDialog
        open={showApprovalDialog}
        onOpenChange={setShowApprovalDialog}
        exemption={selectedExemption}
      />
    </div>
  );
};