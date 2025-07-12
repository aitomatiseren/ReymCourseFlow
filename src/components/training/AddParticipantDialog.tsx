
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useEmployees } from "@/hooks/useEmployees";
import { useTrainingParticipants } from "@/hooks/useTrainingParticipants";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, AlertCircle } from "lucide-react";
import { 
  needsCode95Training, 
  getCode95Status, 
  getCode95StatusEmoji, 
  getCode95StatusDescription,
  getCode95StatusColor,
  calculateCode95Progress 
} from "@/utils/code95Utils";
import { useCertificates } from "@/hooks/useCertificates";
import { EmployeeStatusBadge } from "@/components/employee/EmployeeStatusBadge";
import { EmployeeStatus } from "@/constants/employeeStatus";

interface AddParticipantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trainingId: string;
}


export function AddParticipantDialog({ open, onOpenChange, trainingId }: AddParticipantDialogProps) {
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: employees = [] } = useEmployees();
  const { participants, addParticipant } = useTrainingParticipants(trainingId);
  const { data: certificates = [] } = useCertificates();
  const { toast } = useToast();

  // Fetch training details to check if it offers Code 95 points
  const { data: training } = useQuery({
    queryKey: ['training', trainingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trainings')
        .select(`
          *,
          courses (
            code95_points
          )
        `)
        .eq('id', trainingId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!trainingId
  });

  // Fetch current status for all employees
  const { data: employeeStatuses = {} } = useQuery({
    queryKey: ['employee-statuses'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('employee_status_history')
        .select('employee_id, status')
        .is('end_date', null)
        .lte('start_date', now)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      
      // Create a map of employee_id -> current status
      const statusMap: Record<string, string> = {};
      data.forEach(record => {
        if (!statusMap[record.employee_id]) {
          statusMap[record.employee_id] = record.status;
        }
      });
      
      return statusMap;
    }
  });

  // Handle Escape key to close dialog
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, onOpenChange]);

  // Filter out employees who are already participants
  const participantEmployeeIds = participants.map(p => p.employees?.id).filter(Boolean);
  const availableEmployees = employees.filter(emp => !participantEmployeeIds.includes(emp.id));

  // Check if this training offers Code 95 points
  const offersCode95 = training?.courses?.code95_points && training.courses.code95_points > 0;

  // Filter employees based on search term
  const searchFilteredEmployees = availableEmployees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.workLocation?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Smart sorting: For Code 95 trainings, prioritize employees who need Code 95
  const filteredEmployees = searchFilteredEmployees.sort((a, b) => {
    if (offersCode95) {
      const aNeedsCode95 = needsCode95Training(a, certificates.filter(cert => cert.employeeId === a.id));
      const bNeedsCode95 = needsCode95Training(b, certificates.filter(cert => cert.employeeId === b.id));
      
      // Sort those needing Code 95 to the top
      if (aNeedsCode95 && !bNeedsCode95) return -1;
      if (!aNeedsCode95 && bNeedsCode95) return 1;
      
      // Secondary sort by Code 95 status urgency
      const aStatus = getCode95Status(a, certificates.filter(cert => cert.employeeId === a.id));
      const bStatus = getCode95Status(b, certificates.filter(cert => cert.employeeId === b.id));
      
      const statusPriority = { 'expired': 0, 'expiring': 1, 'compliant': 2, 'not_required': 3 };
      const aPriority = statusPriority[aStatus] ?? 4;
      const bPriority = statusPriority[bStatus] ?? 4;
      
      if (aPriority !== bPriority) return aPriority - bPriority;
    }
    
    // Default sort by name
    return a.name.localeCompare(b.name);
  });

  // Count employees who need Code 95 for this training
  const employeesNeedingCode95 = offersCode95 ? 
    filteredEmployees.filter(emp => needsCode95Training(emp, certificates.filter(cert => cert.employeeId === emp.id))).length : 0;

  const handleEmployeeToggle = (employeeId: string, checked: boolean) => {
    if (checked) {
      setSelectedEmployeeIds(prev => [...prev, employeeId]);
    } else {
      setSelectedEmployeeIds(prev => prev.filter(id => id !== employeeId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmployeeIds(filteredEmployees.map(emp => emp.id));
    } else {
      setSelectedEmployeeIds([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedEmployeeIds.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one employee",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Adding participants:', { trainingId, selectedEmployeeIds });
      
      let successCount = 0;
      const errors: string[] = [];
      
      // Add each selected participant
      for (const employeeId of selectedEmployeeIds) {
        try {
          console.log('Adding participant:', { trainingId, employeeId });
          const result = await addParticipant.mutateAsync({
            trainingId,
            employeeId
          });
          console.log('Added participant result:', result);
          successCount++;
        } catch (error: any) {
          console.error(`Error adding employee ${employeeId}:`, error);
          const employee = employees.find(e => e.id === employeeId);
          const errorMessage = error.message || 'Unknown error';
          
          // Check for specific error types
          if (errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint')) {
            errors.push(`${employee?.name || 'Employee'} is already enrolled in this training`);
          } else {
            errors.push(`Failed to add ${employee?.name || 'employee'}: ${errorMessage}`);
          }
        }
      }
      
      // Show appropriate messages
      if (successCount > 0) {
        toast({
          title: "Success",
          description: `${successCount} participant(s) added successfully`
        });
      }
      
      if (errors.length > 0) {
        toast({
          title: "Some participants could not be added",
          description: errors.join('\n'),
          variant: "destructive"
        });
      }
      
      // Only close if at least some were successful
      if (successCount > 0) {
        onOpenChange(false);
        setSelectedEmployeeIds([]);
        setSearchTerm("");
      }
    } catch (error: any) {
      console.error('Unexpected error adding participants:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add participants",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Participants</DialogTitle>
          <DialogDescription>
            Select employees to add to this training session.
            {offersCode95 && (
              <>
                <br />
                <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                  <AlertCircle className="h-3 w-3" />
                  This training offers Code 95 points ({training?.courses?.code95_points} points)
                  {employeesNeedingCode95 > 0 && ` • ${employeesNeedingCode95} employees need Code 95 training`}
                </span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name, department, job title, or work location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Employee Table */}
          <div className="flex-1 overflow-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedEmployeeIds.length === filteredEmployees.length && filteredEmployees.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Status</TableHead>
                  {offersCode95 && <TableHead>Code 95</TableHead>}
                  <TableHead>Date of Birth</TableHead>
                  <TableHead>Office Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={offersCode95 ? 8 : 7} className="text-center py-8 text-gray-500">
                      {searchTerm ? "No employees found matching your search" : "No available employees"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((employee) => {
                    const currentStatus = employeeStatuses[employee.id] || employee.status;
                    const employeeCertificates = certificates.filter(cert => cert.employeeId === employee.id);
                    const code95Status = getCode95Status(employee, employeeCertificates);
                    const code95Progress = calculateCode95Progress(employee, employeeCertificates);
                    
                    return (
                      <TableRow key={employee.id} className={offersCode95 && needsCode95Training(employee, employeeCertificates) ? "bg-blue-50" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={selectedEmployeeIds.includes(employee.id)}
                            onCheckedChange={(checked) => handleEmployeeToggle(employee.id, !!checked)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div>
                            <div className="flex items-center gap-2">
                              {employee.name}
                              {offersCode95 && needsCode95Training(employee, employeeCertificates) && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded" title="Needs Code 95 training">
                                  CODE 95
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">#{employee.employeeNumber}</div>
                          </div>
                        </TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell>{employee.jobTitle || "N/A"}</TableCell>
                        <TableCell>
                          <EmployeeStatusBadge status={currentStatus as EmployeeStatus} />
                        </TableCell>
                        {offersCode95 && (
                          <TableCell>
                            <div className="text-xs">
                              <div className={`font-medium px-2 py-1 rounded text-center ${getCode95StatusColor(code95Status)}`}>
                                {getCode95StatusDescription(code95Status, code95Progress.daysUntilExpiry)}
                              </div>
                              {code95Status !== 'not_required' && (
                                <div className="text-gray-500 text-center mt-1">
                                  {code95Progress.pointsEarned}/{code95Progress.pointsRequired} pts
                                </div>
                              )}
                            </div>
                          </TableCell>
                        )}
                        <TableCell>{formatDate(employee.dateOfBirth)}</TableCell>
                        <TableCell>{employee.workLocation || "N/A"}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {selectedEmployeeIds.length > 0 && (
            <div className="text-sm text-gray-600">
              {selectedEmployeeIds.length} employee(s) selected
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={addParticipant.isPending || selectedEmployeeIds.length === 0}
          >
            {addParticipant.isPending ? "Adding..." : `Add ${selectedEmployeeIds.length} Participant${selectedEmployeeIds.length !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
