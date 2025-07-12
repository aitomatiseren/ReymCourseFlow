
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
  ArrowDown,
  ChevronDown,
  X
} from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { EmployeeStatusBadge } from "@/components/employee/EmployeeStatusBadge";
import { EmployeeStatus } from "@/constants/employeeStatus";
import { requiresCode95 } from "@/utils/code95Utils";


type SortField = 'name' | 'department' | 'job_title' | 'email' | 'status' | 'workLocation';
type SortDirection = 'asc' | 'desc';

export function UserListTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedJobTitle, setSelectedJobTitle] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedWorkLocation, setSelectedWorkLocation] = useState("all");
  const [selectedCode95Filter, setSelectedCode95Filter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
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

  // Extract unique values for filter options
  const uniqueDepartments = [...new Set(employees.map(e => e.department).filter(Boolean))].sort();
  const uniqueJobTitles = [...new Set(employees.map(e => e.jobTitle).filter(Boolean))].sort();
  const uniqueWorkLocations = [...new Set(employees.map(e => e.workLocation).filter(Boolean))].sort();

  const sortedAndFilteredEmployees = employees
    .filter(employee => {
      const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = selectedDepartment === "all" || employee.department === selectedDepartment;
      const matchesJobTitle = selectedJobTitle === "all" || employee.jobTitle === selectedJobTitle;
      const matchesStatus = selectedStatus === "all" || employee.status === selectedStatus;
      const matchesWorkLocation = selectedWorkLocation === "all" || employee.workLocation === selectedWorkLocation;
      
      // Code 95 filtering
      let matchesCode95 = true;
      if (selectedCode95Filter !== "all") {
        const hasCode95 = requiresCode95(employee);
        
        switch (selectedCode95Filter) {
          case "required":
            matchesCode95 = hasCode95;
            break;
          case "not_required":
            matchesCode95 = !hasCode95;
            break;
        }
      }
      
      return matchesSearch && matchesDepartment && matchesJobTitle && matchesStatus && matchesWorkLocation && matchesCode95;
    })
    .sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      // Handle special cases for accessing nested properties
      if (sortField === 'workLocation') {
        aValue = a.workLocation;
        bValue = b.workLocation;
      } else {
        aValue = a[sortField];
        bValue = b[sortField];
      }
      
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
          <div className="space-y-4">
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
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
            </div>
            
            {showFilters && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Afdeling</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                  >
                    <option value="all">Alle afdelingen</option>
                    {uniqueDepartments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Functie</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={selectedJobTitle}
                    onChange={(e) => setSelectedJobTitle(e.target.value)}
                  >
                    <option value="all">Alle functies</option>
                    {uniqueJobTitles.map(title => (
                      <option key={title} value={title}>{title}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Status</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="all">Alle statussen</option>
                    <option value="active">Actief</option>
                    <option value="inactive">Inactief</option>
                    <option value="on_leave">Verlof</option>
                    <option value="terminated">Beëindigd</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Vestiging</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={selectedWorkLocation}
                    onChange={(e) => setSelectedWorkLocation(e.target.value)}
                  >
                    <option value="all">Alle vestigingen</option>
                    {uniqueWorkLocations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Code 95</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={selectedCode95Filter}
                    onChange={(e) => setSelectedCode95Filter(e.target.value)}
                  >
                    <option value="all">Alle</option>
                    <option value="required">Vereist</option>
                    <option value="not_required">Niet vereist</option>
                  </select>
                </div>
              </div>
            )}
            
            {/* Active filters display */}
            {(selectedDepartment !== "all" || selectedJobTitle !== "all" || selectedStatus !== "all" || 
              selectedWorkLocation !== "all" || selectedCode95Filter !== "all") && (
              <div className="flex flex-wrap gap-2">
                {selectedDepartment !== "all" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Afdeling: {selectedDepartment}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedDepartment("all")} />
                  </Badge>
                )}
                {selectedJobTitle !== "all" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Functie: {selectedJobTitle}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedJobTitle("all")} />
                  </Badge>
                )}
                {selectedStatus !== "all" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Status: {selectedStatus}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedStatus("all")} />
                  </Badge>
                )}
                {selectedWorkLocation !== "all" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Vestiging: {selectedWorkLocation}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedWorkLocation("all")} />
                  </Badge>
                )}
                {selectedCode95Filter !== "all" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Code 95: {selectedCode95Filter === "required" ? "Vereist" : "Niet vereist"}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCode95Filter("all")} />
                  </Badge>
                )}
              </div>
            )}
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
                <TableHead className="text-left font-medium">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('workLocation')}
                    className="flex items-center space-x-1 -ml-4"
                  >
                    <span>Vestiging</span>
                    {getSortIcon('workLocation')}
                  </Button>
                </TableHead>
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
                    <div className="text-sm">
                      {employee.workLocation || (
                        <span className="text-gray-400">Niet ingesteld</span>
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
