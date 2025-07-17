import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, UserPlus, Search, Building2, AlertTriangle } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { useTrainingParticipants } from "@/hooks/useTrainingParticipants";
import { usePrerequisiteCheck } from "@/hooks/useCertificateHierarchy";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const addEmployeesSchema = z.object({
  selectedEmployees: z.array(z.string()).min(1, "At least one employee must be selected"),
  notes: z.string().optional(),
});

type AddEmployeesFormData = z.infer<typeof addEmployeesSchema>;

interface AddEmployeesToTrainingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trainingId: string;
  trainingTitle: string;
  courseId?: string; // Add course ID to get certificate information
  onEmployeesAdded: () => void;
}

export function AddEmployeesToTrainingDialog({
  open,
  onOpenChange,
  trainingId,
  trainingTitle,
  courseId,
  onEmployeesAdded,
}: AddEmployeesToTrainingDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [showPrerequisiteWarning, setShowPrerequisiteWarning] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState<any>(null);
  
  const { data: employees = [] } = useEmployees();
  const { data: currentParticipants = [] } = useTrainingParticipants(trainingId);
  const { toast } = useToast();

  // Fetch course certificates if courseId is provided
  const [courseCertificates, setCourseCertificates] = useState<any[]>([]);
  const [employeePrerequisites, setEmployeePrerequisites] = useState<Map<string, { meetsAll: boolean; missing: string[] }>>(new Map());
  
  useEffect(() => {
    if (!courseId || !open) return;
    
    const fetchCourseCertificates = async () => {
      try {
        const { data, error } = await supabase
          .from('course_certificates')
          .select(`
            *,
            licenses (
              id,
              name,
              prerequisites:certificate_prerequisites!certificate_prerequisites_certificate_id_fkey (
                prerequisite:licenses!certificate_prerequisites_prerequisite_id_fkey (
                  id,
                  name
                )
              )
            )
          `)
          .eq('course_id', courseId)
          .eq('directly_grants', true);
        
        if (error) throw error;
        setCourseCertificates(data || []);
      } catch (error) {
        console.error('Error fetching course certificates:', error);
      }
    };
    
    fetchCourseCertificates();
  }, [courseId, open]);

  // Check prerequisites for all employees when certificates are loaded
  useEffect(() => {
    if (!courseCertificates.length || !employees.length) return;
    
    const checkEmployeePrerequisites = async () => {
      const prerequisiteMap = new Map<string, { meetsAll: boolean; missing: string[] }>();
      
      for (const employee of employees) {
        let meetsAll = true;
        const missing: string[] = [];
        
        // Get all prerequisites from all certificates this course grants
        const allPrerequisites = new Set<string>();
        courseCertificates.forEach(cert => {
          cert.licenses?.prerequisites?.forEach((prereq: any) => {
            allPrerequisites.add(prereq.prerequisite.id);
          });
        });
        
        if (allPrerequisites.size > 0) {
          // Check if employee has valid licenses for all prerequisites
          const { data: employeeLicenses, error } = await supabase
            .from('employee_licenses')
            .select('license_id, licenses(name)')
            .eq('employee_id', employee.id)
            .eq('status', 'valid');
          
          if (!error && employeeLicenses) {
            const employeeLicenseIds = new Set(employeeLicenses.map(el => el.license_id));
            
            for (const prereqId of allPrerequisites) {
              if (!employeeLicenseIds.has(prereqId)) {
                meetsAll = false;
                const cert = courseCertificates
                  .flatMap(c => c.licenses?.prerequisites || [])
                  .find((p: any) => p.prerequisite.id === prereqId);
                if (cert) {
                  missing.push(cert.prerequisite.name);
                }
              }
            }
          } else {
            meetsAll = false;
            // Add all prerequisites as missing if we can't fetch employee licenses
            courseCertificates.forEach(cert => {
              cert.licenses?.prerequisites?.forEach((prereq: any) => {
                missing.push(prereq.prerequisite.name);
              });
            });
          }
        }
        
        prerequisiteMap.set(employee.id, { meetsAll, missing });
      }
      
      setEmployeePrerequisites(prerequisiteMap);
    };
    
    checkEmployeePrerequisites();
  }, [courseCertificates, employees]);

  const form = useForm<AddEmployeesFormData>({
    resolver: zodResolver(addEmployeesSchema),
    defaultValues: {
      selectedEmployees: [],
      notes: "",
    },
  });

  // Filter out employees who are already enrolled in the training
  const enrolledEmployeeIds = new Set(
    currentParticipants.map(p => p.employee_id)
  );
  
  const availableEmployees = employees.filter(employee => 
    !enrolledEmployeeIds.has(employee.id) && 
    employee.status === 'active'
  );

  // Filter employees based on search term
  const filteredEmployees = availableEmployees.filter(employee =>
    `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleEmployeeSelection = (employeeId: string) => {
    const newSelected = new Set(selectedEmployees);
    if (newSelected.has(employeeId)) {
      newSelected.delete(employeeId);
    } else {
      newSelected.add(employeeId);
    }
    setSelectedEmployees(newSelected);
    form.setValue('selectedEmployees', Array.from(newSelected));
  };

  const handleSelectAll = () => {
    const allIds = filteredEmployees.map(emp => emp.id);
    setSelectedEmployees(new Set(allIds));
    form.setValue('selectedEmployees', allIds);
  };

  const handleClearAll = () => {
    setSelectedEmployees(new Set());
    form.setValue('selectedEmployees', []);
  };

  const handleSubmit = async (data: AddEmployeesFormData) => {
    // Check if any selected employees are missing prerequisites
    const employeesWithMissingPrerequisites = data.selectedEmployees.filter(employeeId => {
      const prerequisiteStatus = employeePrerequisites.get(employeeId);
      return prerequisiteStatus && !prerequisiteStatus.meetsAll;
    });

    if (employeesWithMissingPrerequisites.length > 0) {
      // Show warning dialog before proceeding
      setPendingSubmission(data);
      setShowPrerequisiteWarning(true);
      return;
    }

    // Proceed with normal submission
    await performSubmission(data);
  };

  const performSubmission = async (data: AddEmployeesFormData) => {
    setIsSubmitting(true);
    try {
      // Add employees as participants
      const participantInserts = data.selectedEmployees.map(employeeId => ({
        training_id: trainingId,
        employee_id: employeeId,
        status: 'enrolled',
        registration_date: new Date().toISOString(),
        notes: data.notes || `Added to training on ${new Date().toLocaleDateString()}`,
      }));

      const { error } = await supabase
        .from('training_participants')
        .insert(participantInserts);

      if (error) {
        throw error;
      }

      toast({
        title: "Employees Added",
        description: `Successfully added ${data.selectedEmployees.length} employees to ${trainingTitle}`,
      });

      onEmployeesAdded();
      onOpenChange(false);
      
      // Reset form
      form.reset();
      setSelectedEmployees(new Set());
      setSearchTerm("");
    } catch (error) {
      console.error("Error adding employees to training:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add employees to training",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrerequisiteWarningConfirm = async () => {
    setShowPrerequisiteWarning(false);
    if (pendingSubmission) {
      await performSubmission(pendingSubmission);
      setPendingSubmission(null);
    }
  };

  const handlePrerequisiteWarningCancel = () => {
    setShowPrerequisiteWarning(false);
    setPendingSubmission(null);
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
      setSelectedEmployees(new Set());
      setSearchTerm("");
      setShowPrerequisiteWarning(false);
      setPendingSubmission(null);
    }
  }, [open, form]);

  // Get employees with missing prerequisites among selected
  const selectedEmployeesWithMissingPrerequisites = Array.from(selectedEmployees).filter(employeeId => {
    const prerequisiteStatus = employeePrerequisites.get(employeeId);
    return prerequisiteStatus && !prerequisiteStatus.meetsAll;
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add Employees to Training
            </DialogTitle>
            <DialogDescription>
              Add employees to "{trainingTitle}". Select from available employees below.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Search and Actions */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search employees by name, email, or department..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={filteredEmployees.length === 0}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    disabled={selectedEmployees.size === 0}
                  >
                    Clear All
                  </Button>
                </div>

                {/* Selection Summary */}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {selectedEmployees.size} selected
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {filteredEmployees.length} available employees
                  </span>
                  {selectedEmployeesWithMissingPrerequisites.length > 0 && (
                    <Badge variant="outline" className="bg-orange-50 text-orange-800 border-orange-200 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {selectedEmployeesWithMissingPrerequisites.length} missing prerequisites
                    </Badge>
                  )}
                </div>
              </div>

              {/* Employee List */}
              <FormField
                control={form.control}
                name="selectedEmployees"
                render={() => (
                  <FormItem>
                    <FormLabel>Available Employees</FormLabel>
                    <FormControl>
                      <ScrollArea className="h-64 border rounded-lg p-2">
                        <div className="space-y-2">
                          {filteredEmployees.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              {searchTerm ? "No employees found matching your search" : "No available employees"}
                            </div>
                          ) : (
                            filteredEmployees.map((employee) => {
                              const prerequisiteStatus = employeePrerequisites.get(employee.id);
                              const meetsPrerequisites = prerequisiteStatus?.meetsAll ?? true;
                              const missingPrerequisites = prerequisiteStatus?.missing ?? [];
                              
                              return (
                                <div
                                  key={employee.id}
                                  className={`flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                                    selectedEmployees.has(employee.id) ? 'bg-blue-50 border-blue-200' : ''
                                  } ${!meetsPrerequisites ? 'border-orange-200 bg-orange-50' : ''}`}
                                  onClick={() => toggleEmployeeSelection(employee.id)}
                                >
                                  <div className="flex items-center gap-3">
                                    <Checkbox
                                      checked={selectedEmployees.has(employee.id)}
                                      onChange={() => toggleEmployeeSelection(employee.id)}
                                    />
                                    <div>
                                      <div className="font-medium flex items-center gap-2">
                                        {employee.first_name} {employee.last_name}
                                        {!meetsPrerequisites && (
                                          <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                                            Missing Prerequisites
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="text-sm text-gray-500 flex items-center gap-2">
                                        <Building2 className="h-3 w-3" />
                                        {employee.department || 'Unknown'}
                                        {employee.email && (
                                          <span className="ml-2">• {employee.email}</span>
                                        )}
                                      </div>
                                      {!meetsPrerequisites && missingPrerequisites.length > 0 && (
                                        <div className="text-xs text-orange-700 mt-1">
                                          Missing: {missingPrerequisites.join(', ')}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {employee.job_title || 'Unknown Position'}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </ScrollArea>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Add any notes about these enrollments..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || selectedEmployees.size === 0}
                >
                  {isSubmitting ? "Adding..." : `Add ${selectedEmployees.size} Employee${selectedEmployees.size !== 1 ? 's' : ''}`}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Prerequisite Warning Dialog */}
      <AlertDialog open={showPrerequisiteWarning} onOpenChange={setShowPrerequisiteWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Prerequisites Not Met
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Some selected employees are missing required prerequisites for this training:
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                {selectedEmployeesWithMissingPrerequisites.map(employeeId => {
                  const employee = employees.find(emp => emp.id === employeeId);
                  const prerequisiteStatus = employeePrerequisites.get(employeeId);
                  const missingPrerequisites = prerequisiteStatus?.missing ?? [];
                  
                  return (
                    <div key={employeeId} className="mb-2 last:mb-0">
                      <div className="font-medium text-orange-800">
                        {employee?.first_name} {employee?.last_name}
                      </div>
                      <div className="text-sm text-orange-700">
                        Missing: {missingPrerequisites.join(', ')}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-sm">
                These employees may not receive the full benefit of the training or might struggle with the content. 
                Do you want to enroll them anyway?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handlePrerequisiteWarningCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handlePrerequisiteWarningConfirm}>
              Enroll Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}