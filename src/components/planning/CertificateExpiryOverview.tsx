import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  AlertTriangle, 
  Search, 
  Download, 
  Users,
  Calendar,
  Building2,
  UserPlus
} from "lucide-react";
import { CertificateExpiryAnalysis } from "@/hooks/usePreliminaryPlanning";

interface CertificateExpiryOverviewProps {
  expiryData: CertificateExpiryAnalysis[];
  isLoading: boolean;
  getExpiryStatusBadge: (status: string, daysUntilExpiry?: number) => JSX.Element;
}

export function CertificateExpiryOverview({ 
  expiryData, 
  isLoading, 
  getExpiryStatusBadge 
}: CertificateExpiryOverviewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<'name' | 'expiry' | 'department'>('expiry');

  const filteredData = expiryData
    .filter(item => {
      const searchLower = searchTerm.toLowerCase();
      return (
        item.first_name.toLowerCase().includes(searchLower) ||
        item.last_name.toLowerCase().includes(searchLower) ||
        item.email.toLowerCase().includes(searchLower) ||
        item.license_name.toLowerCase().includes(searchLower) ||
        (item.department && item.department.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`);
        case 'expiry': {
          const aDays = a.days_until_expiry ?? 999;
          const bDays = b.days_until_expiry ?? 999;
          return aDays - bDays;
        }
        case 'department':
          return (a.department || '').localeCompare(b.department || '');
        default:
          return 0;
      }
    });

  const handleExport = () => {
    // Create CSV content
    const headers = ['Employee Name', 'Email', 'Department', 'Certificate', 'Status', 'Expiry Date', 'Days Until Expiry'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(item => [
        `"${item.first_name} ${item.last_name}"`,
        item.email,
        item.department || '',
        `"${item.license_name}"`,
        item.employee_status,
        item.expiry_date || 'N/A',
        item.days_until_expiry?.toString() || 'N/A'
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificate-expiry-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const groupByStatus = expiryData.reduce((acc, item) => {
    if (!acc[item.employee_status]) acc[item.employee_status] = [];
    acc[item.employee_status].push(item);
    return acc;
  }, {} as Record<string, CertificateExpiryAnalysis[]>);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading certificate expiry analysis...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(groupByStatus).map(([status, items]) => {
          const getStatusConfig = (status: string) => {
            switch (status) {
              case 'expired':
                return { color: 'text-red-600', bgColor: 'bg-red-50', icon: AlertTriangle };
              case 'renewal_due':
                return { color: 'text-orange-600', bgColor: 'bg-orange-50', icon: Calendar };
              case 'renewal_approaching':
                return { color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: Calendar };
              case 'new':
                return { color: 'text-blue-600', bgColor: 'bg-blue-50', icon: UserPlus };
              default:
                return { color: 'text-gray-600', bgColor: 'bg-gray-50', icon: Users };
            }
          };

          const config = getStatusConfig(status);
          const Icon = config.icon;

          return (
            <Card key={status} className={config.bgColor}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 capitalize">
                      {status.replace('_', ' ')}
                    </p>
                    <p className={`text-2xl font-bold ${config.color}`}>
                      {items.length}
                    </p>
                  </div>
                  <Icon className={`h-8 w-8 ${config.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Certificate Expiry Analysis
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search employees, certificates, or departments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'expiry' | 'department')}
                className="rounded border border-gray-300 px-3 py-1 text-sm"
              >
                <option value="expiry">Days Until Expiry</option>
                <option value="name">Employee Name</option>
                <option value="department">Department</option>
              </select>
            </div>
          </div>

          {filteredData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No employees found matching the current filters</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Certificate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Days Until Expiry</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item, index) => (
                    <TableRow key={`${item.employee_id}-${item.license_id || 'no-license'}-${index}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {item.first_name} {item.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{item.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          {item.department || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.license_name}</div>
                          <div className="text-sm text-gray-500">{item.license_category}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getExpiryStatusBadge(item.employee_status, item.days_until_expiry)}
                      </TableCell>
                      <TableCell>
                        {item.expiry_date ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {new Date(item.expiry_date).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-gray-500">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.days_until_expiry !== undefined ? (
                          <span className={`font-medium ${
                            item.days_until_expiry <= 30 ? 'text-red-600' :
                            item.days_until_expiry <= 90 ? 'text-orange-600' :
                            'text-gray-600'
                          }`}>
                            {item.days_until_expiry > 0 ? `${item.days_until_expiry} days` : 'Overdue'}
                          </span>
                        ) : (
                          <span className="text-gray-500">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            Add to Group
                          </Button>
                          {item.employee_status === 'new' && (
                            <Button variant="outline" size="sm">
                              Schedule Training
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {filteredData.length > 0 && (
            <div className="mt-4 text-sm text-gray-500 text-center">
              Showing {filteredData.length} of {expiryData.length} employees
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}