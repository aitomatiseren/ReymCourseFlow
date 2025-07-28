import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Search, 
  Filter, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  EyeOff,
  Download,
  RefreshCw
} from 'lucide-react';
import { ExemptionCriteria, useEmployeePreview, EmployeePreview as EmployeePreviewType } from '@/hooks/useMassExemptions';

interface EmployeePreviewProps {
  criteria: ExemptionCriteria;
  className?: string;
  onEmployeeCountChange?: (count: number) => void;
}

export const EmployeePreview: React.FC<EmployeePreviewProps> = ({
  criteria,
  className,
  onEmployeeCountChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  
  const { data: employees, isLoading, error, refetch } = useEmployeePreview(criteria);

  // Filter employees based on search and department filter
  const filteredEmployees = React.useMemo(() => {
    if (!employees) return [];
    
    return employees.filter(emp => {
      const matchesSearch = !searchTerm || 
        emp.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.contract_type?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = !selectedDepartment || emp.department === selectedDepartment;
      
      return matchesSearch && matchesDepartment;
    });
  }, [employees, searchTerm, selectedDepartment]);

  // Get unique departments from filtered results
  const departments = React.useMemo(() => {
    if (!employees) return [];
    return [...new Set(employees.map(emp => emp.department))].sort();
  }, [employees]);

  // Group employees by department for summary
  const departmentSummary = React.useMemo(() => {
    if (!filteredEmployees) return {};
    
    return filteredEmployees.reduce((acc, emp) => {
      acc[emp.department] = (acc[emp.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [filteredEmployees]);

  // Notify parent component of employee count changes
  React.useEffect(() => {
    if (onEmployeeCountChange && employees) {
      onEmployeeCountChange(employees.length);
    }
  }, [employees?.length, onEmployeeCountChange]);

  const exportToCSV = () => {
    if (!filteredEmployees?.length) return;
    
    const headers = ['Employee Name', 'Department', 'Job Title', 'Contract Type', 'Hub Location', 'Hire Date', 'Service Years'];
    const csvContent = [
      headers.join(','),
      ...filteredEmployees.map(emp => 
        [
          emp.employee_name, 
          emp.department || '', 
          emp.job_title || '',
          emp.contract_type || '', 
          emp.city || '',
          emp.hire_date || '',
          emp.service_years?.toString() || ''
        ].map(field => `"${field}"`).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mass_exemption_employees_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const hasActiveFilters = Object.keys(criteria).some(key => {
    const value = criteria[key as keyof ExemptionCriteria];
    return value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true);
  });

  if (!hasActiveFilters) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Filter className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No Criteria Selected</p>
            <p className="text-sm">Choose criteria above to preview affected employees</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">Loading employees...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load employees. {error.message}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
                className="ml-2"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <CardTitle>Affected Employees</CardTitle>
          <Badge variant={employees?.length ? "default" : "secondary"}>
            {employees?.length || 0} employee{(employees?.length || 0) !== 1 ? 's' : ''}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            {showDetails ? 'Hide' : 'Show'} Details
          </Button>
          {filteredEmployees?.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!employees?.length ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No employees match the current criteria. Consider adjusting your filters.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Department Summary */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {Object.entries(departmentSummary).map(([dept, count]) => (
                <Badge key={dept} variant="outline" className="justify-between p-2">
                  <span className="text-xs truncate">{dept}</span>
                  <span className="text-xs font-bold ml-1">{count}</span>
                </Badge>
              ))}
            </div>

            {showDetails && (
              <>
                {/* Search and Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by name, department, job title, location, etc..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {/* Employee Table */}
                <div className="border rounded-md">
                  <ScrollArea className="h-80">
                    {filteredEmployees.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p>No employees match your search</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[180px]">Name</TableHead>
                            <TableHead className="w-[120px]">Department</TableHead>
                            <TableHead className="w-[140px]">Job Title</TableHead>
                            <TableHead className="w-[100px]">Contract</TableHead>
                            <TableHead className="w-[120px]">Hub Location</TableHead>
                            <TableHead className="w-[90px]">Hire Date</TableHead>
                            <TableHead className="w-[80px]">Years</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredEmployees.map((employee) => (
                            <TableRow key={employee.employee_id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-700">
                                    {employee.employee_name.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="truncate">{employee.employee_name}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {employee.department || '-'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-gray-600 truncate">
                                {employee.job_title || '-'}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="text-xs">
                                  {employee.contract_type || '-'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {employee.city || '-'}
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : '-'}
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {employee.service_years ? `${employee.service_years}y` : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </ScrollArea>
                </div>

                {/* Summary Stats */}
                <div className="text-xs text-gray-500 flex justify-between items-center pt-2 border-t">
                  <span>
                    Showing {filteredEmployees.length} of {employees.length} employees
                  </span>
                  {searchTerm || selectedDepartment ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedDepartment('');
                      }}
                      className="text-xs h-6 px-2"
                    >
                      Clear Filters
                    </Button>
                  ) : null}
                </div>
              </>
            )}

            {/* Warning for large numbers */}
            {employees.length > 50 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Large Operation Warning:</strong> This will affect {employees.length} employees. 
                  Please review the criteria carefully before proceeding.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};