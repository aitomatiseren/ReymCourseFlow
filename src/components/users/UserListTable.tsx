
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, 
  Filter, 
  Eye,
  Edit,
  User,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { EmployeeStatusBadge } from "@/components/employee/EmployeeStatusBadge";
import { EmployeeStatus } from "@/constants/employeeStatus";


type SortField = 'name' | 'department' | 'job_title' | 'email' | 'status';
type SortDirection = 'asc' | 'desc';

export function UserListTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const navigate = useNavigate();
  
  const { data: employees = [], isLoading, error } = useEmployees();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const sortedAndFilteredEmployees = employees
    .filter(employee => {
      const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = selectedDepartment === "all" || employee.department === selectedDepartment;
      const matchesStatus = selectedStatus === "all" || employee.status === selectedStatus;
      
      return matchesSearch && matchesDepartment && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
      if (bValue == null) return sortDirection === 'asc' ? -1 : 1;
      
      // Convert to strings for comparison if needed
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const handleViewProfile = (employeeId: string) => {
    navigate(`/participants/${employeeId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading employees...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-red-500">Error loading employees: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, email, or employee number..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="all">All Departments</option>
              <option value="Operations">Operations</option>
              <option value="Safety">Safety</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Administration">Administration</option>
            </select>
            <select 
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
              <option value="terminated">Terminated</option>
            </select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Employee Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-left font-medium">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('name')}
                    className="flex items-center space-x-1 -ml-4"
                  >
                    <span>Employee</span>
                    {getSortIcon('name')}
                  </Button>
                </TableHead>
                <TableHead className="text-left font-medium">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('department')}
                    className="flex items-center space-x-1 -ml-4"
                  >
                    <span>Department</span>
                    {getSortIcon('department')}
                  </Button>
                </TableHead>
                <TableHead className="text-left font-medium">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('job_title')}
                    className="flex items-center space-x-1 -ml-4"
                  >
                    <span>Job Title</span>
                    {getSortIcon('job_title')}
                  </Button>
                </TableHead>
                <TableHead className="text-left font-medium">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('email')}
                    className="flex items-center space-x-1 -ml-4"
                  >
                    <span>Contact</span>
                    {getSortIcon('email')}
                  </Button>
                </TableHead>
                <TableHead className="text-left font-medium">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('status')}
                    className="flex items-center space-x-1 -ml-4"
                  >
                    <span>Status</span>
                    {getSortIcon('status')}
                  </Button>
                </TableHead>
                <TableHead className="text-left font-medium">Licenses</TableHead>
                <TableHead className="text-right font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFilteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{employee.name}</div>
                      <div className="text-sm text-gray-500">#{employee.employeeNumber}</div>
                    </div>
                  </TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{employee.jobTitle || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{employee.email}</div>
                      {employee.phone && (
                        <div className="text-gray-500">{employee.phone}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <EmployeeStatusBadge status={employee.status as EmployeeStatus} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {employee.licenses.length > 0 ? (
                        employee.licenses.slice(0, 2).map((license, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {license}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">None</span>
                      )}
                      {employee.licenses.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{employee.licenses.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        size="sm"
                        onClick={() => handleViewProfile(employee.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {sortedAndFilteredEmployees.length === 0 && !isLoading && (
            <div className="p-12 text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No employees found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
