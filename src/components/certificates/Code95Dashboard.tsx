import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEmployees } from "@/hooks/useEmployees";
import { useCertificates } from "@/hooks/useCertificates";
import { Employee, Certificate } from "@/types";
import { 
  calculateCode95Progress, 
  getCode95Status, 
  getCode95StatusEmoji, 
  getCode95StatusDescription,
  getCode95StatusColor,
  needsCode95Training,
  requiresCode95
} from "@/utils/code95Utils";
import { AlertTriangle, CheckCircle, Clock, Users, Search, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { Code95RegistryVerification } from "./Code95RegistryVerification";

export function Code95Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: employees = [] } = useEmployees();
  const { data: certificates = [] } = useCertificates();

  // Filter employees who require Code 95
  const code95Employees = employees.filter(emp => requiresCode95(emp));

  // Calculate Code 95 statistics
  const stats = code95Employees.reduce((acc, employee) => {
    const employeeCertificates = certificates.filter(cert => cert.employeeId === employee.id);
    const status = getCode95Status(employee, employeeCertificates);
    const needsTraining = needsCode95Training(employee, employeeCertificates);
    
    acc.total++;
    acc[status]++;
    if (needsTraining) acc.needsTraining++;
    
    return acc;
  }, {
    total: 0,
    compliant: 0,
    expiring: 0,
    expired: 0,
    not_required: 0,
    needsTraining: 0
  });

  // Filter employees based on search term
  const filteredEmployees = code95Employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort employees by Code 95 urgency
  const sortedEmployees = filteredEmployees.sort((a, b) => {
    const aCertificates = certificates.filter(cert => cert.employeeId === a.id);
    const bCertificates = certificates.filter(cert => cert.employeeId === b.id);
    
    const aStatus = getCode95Status(a, aCertificates);
    const bStatus = getCode95Status(b, bCertificates);
    
    const statusPriority = { 'expired': 0, 'expiring': 1, 'compliant': 2, 'not_required': 3 };
    const aPriority = statusPriority[aStatus] ?? 4;
    const bPriority = statusPriority[bStatus] ?? 4;
    
    if (aPriority !== bPriority) return aPriority - bPriority;
    
    // Secondary sort by days until expiry
    const aProgress = calculateCode95Progress(a, aCertificates);
    const bProgress = calculateCode95Progress(b, bCertificates);
    
    if (aProgress.daysUntilExpiry !== null && bProgress.daysUntilExpiry !== null) {
      return aProgress.daysUntilExpiry - bProgress.daysUntilExpiry;
    }
    
    return a.name.localeCompare(b.name);
  });

  const complianceRate = stats.total > 0 ? Math.round((stats.compliant / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Code 95</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Employees requiring Code 95
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliant</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.compliant}</div>
            <p className="text-xs text-muted-foreground">
              Up to date with training
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.expiring}</div>
            <p className="text-xs text-muted-foreground">
              Expiring within 90 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate action
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceRate}%</div>
            <p className="text-xs text-muted-foreground">
              Overall compliance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Code 95 Compliance Overview</CardTitle>
          <CardDescription>
            Visual breakdown of Code 95 compliance across all employees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={complianceRate} className="w-full" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>0%</span>
              <span className="font-medium">{complianceRate}% Compliant</span>
              <span>100%</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Compliant ({stats.compliant || 0})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm">Expiring ({stats.expiring || 0})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm">Expired ({stats.expired || 0})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Need Training ({stats.needsTraining || 0})</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Details */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Code 95 Employee Details</CardTitle>
              <CardDescription>
                Detailed view of each employee's Code 95 status and progress
              </CardDescription>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All ({filteredEmployees.length || 0})</TabsTrigger>
              <TabsTrigger value="expired">Expired ({stats.expired || 0})</TabsTrigger>
              <TabsTrigger value="expiring">Expiring ({stats.expiring || 0})</TabsTrigger>
              <TabsTrigger value="compliant">Compliant ({stats.compliant || 0})</TabsTrigger>
              <TabsTrigger value="registry">Registry</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-6">
              <EmployeeTable employees={sortedEmployees} certificates={certificates} />
            </TabsContent>
            
            <TabsContent value="expired" className="mt-6">
              <EmployeeTable 
                employees={sortedEmployees.filter(emp => {
                  const empCerts = certificates.filter(cert => cert.employeeId === emp.id);
                  return getCode95Status(emp, empCerts) === 'expired';
                })} 
                certificates={certificates} 
              />
            </TabsContent>
            
            <TabsContent value="expiring" className="mt-6">
              <EmployeeTable 
                employees={sortedEmployees.filter(emp => {
                  const empCerts = certificates.filter(cert => cert.employeeId === emp.id);
                  return getCode95Status(emp, empCerts) === 'expiring';
                })} 
                certificates={certificates} 
              />
            </TabsContent>
            
            <TabsContent value="compliant" className="mt-6">
              <EmployeeTable 
                employees={sortedEmployees.filter(emp => {
                  const empCerts = certificates.filter(cert => cert.employeeId === emp.id);
                  return getCode95Status(emp, empCerts) === 'compliant';
                })} 
                certificates={certificates} 
              />
            </TabsContent>
            
            <TabsContent value="registry" className="mt-6">
              <Code95RegistryVerification />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

interface EmployeeTableProps {
  employees: Employee[];
  certificates: Certificate[];
}

function EmployeeTable({ employees, certificates }: EmployeeTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Code 95 Status</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                No employees found
              </TableCell>
            </TableRow>
          ) : (
            employees.map((employee) => {
              const employeeCertificates = certificates.filter(cert => cert.employeeId === employee.id);
              const code95Status = getCode95Status(employee, employeeCertificates);
              const code95Progress = calculateCode95Progress(employee, employeeCertificates);
              const needsTraining = needsCode95Training(employee, employeeCertificates);
              
              return (
                <TableRow key={employee.id} className={needsTraining ? "bg-yellow-50" : ""}>
                  <TableCell>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {employee.name}
                        {needsTraining && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-1 rounded">
                            NEEDS TRAINING
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">#{employee.employeeNumber}</div>
                    </div>
                  </TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getCode95StatusEmoji(code95Status)}</span>
                      <div>
                        <Badge className={getCode95StatusColor(code95Status)}>
                          {getCode95StatusDescription(code95Status, code95Progress.daysUntilExpiry)}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {code95Status !== 'not_required' && (
                      <div className="space-y-2">
                        <div className="text-sm">
                          {code95Progress.pointsEarned}/{code95Progress.pointsRequired} points
                        </div>
                        <Progress 
                          value={(code95Progress.pointsEarned / code95Progress.pointsRequired) * 100} 
                          className="w-full h-2"
                        />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {code95Progress.expiryDate ? (
                      <div className="text-sm">
                        {format(new Date(code95Progress.expiryDate), 'MMM dd, yyyy')}
                        {code95Progress.daysUntilExpiry !== null && (
                          <div className="text-xs text-gray-500">
                            {code95Progress.daysUntilExpiry > 0 
                              ? `${code95Progress.daysUntilExpiry} days left`
                              : `${Math.abs(code95Progress.daysUntilExpiry)} days overdue`
                            }
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {needsTraining && (
                        <Button size="sm" variant="outline">
                          Schedule Training
                        </Button>
                      )}
                      <Button size="sm" variant="ghost">
                        View Profile
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}