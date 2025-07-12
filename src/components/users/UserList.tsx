
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Eye,
  User,
  Building2,
  Loader2
} from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { EmployeeStatus, ALL_STATUSES, getStatusLabel } from "@/constants/employeeStatus";
import { EmployeeStatusBadge } from "@/components/employee/EmployeeStatusBadge";
import type { Employee } from "@/types";

export function UserList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const navigate = useNavigate();
  
  const { data: employees = [], isLoading, error } = useEmployees();

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (employee.firstName && employee.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (employee.lastName && employee.lastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (employee.roepnaam && employee.roepnaam.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (employee.tussenvoegsel && employee.tussenvoegsel.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDepartment = selectedDepartment === "all" || employee.department === selectedDepartment;
    const matchesStatus = selectedStatus === "all" || employee.status === selectedStatus;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const getInitials = (employee: Employee) => {
    if (employee.roepnaam && employee.lastName) {
      return (employee.roepnaam[0] + employee.lastName[0]).toUpperCase();
    }
    return employee.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
  };

  const getDisplayName = (employee: Employee) => {
    if (employee.roepnaam && employee.lastName) {
      const parts = [employee.roepnaam];
      if (employee.tussenvoegsel) {
        parts.push(employee.tussenvoegsel);
      }
      parts.push(employee.lastName);
      return parts.join(' ');
    }
    return employee.name;
  };

  const getNickname = (employee: Employee) => {
    return employee.roepnaam || employee.firstName || employee.name.split(' ')[0];
  };

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
              {ALL_STATUSES.map(status => (
                <option key={status} value={status}>
                  {getStatusLabel(status)}
                </option>
              ))}
            </select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => (
          <Card key={employee.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {getInitials(employee)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-900">{getDisplayName(employee)}</h3>
                    {employee.roepnaam && employee.roepnaam !== employee.firstName && (
                      <p className="text-xs text-blue-600">Roepnaam: {getNickname(employee)}</p>
                    )}
                    <p className="text-sm text-gray-500">#{employee.employeeNumber}</p>
                  </div>
                </div>
                <EmployeeStatusBadge status={employee.status as EmployeeStatus} />
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Building2 className="h-4 w-4 mr-2" />
                  {employee.jobTitle} • {employee.department}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {employee.email}
                </div>
                {employee.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {employee.phone}
                  </div>
                )}
                {employee.city && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {employee.city}, {employee.country}
                  </div>
                )}
                {employee.hireDate && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    Hired: {new Date(employee.hireDate).toLocaleDateString()}
                  </div>
                )}
              </div>

              {employee.licenses.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">LICENSES</p>
                  <div className="flex flex-wrap gap-1">
                    {employee.licenses.map((license, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {license}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  className="flex-1 bg-slate-800 text-white hover:bg-slate-900"
                  onClick={() => handleViewProfile(employee.id)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEmployees.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No employees found matching your criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
