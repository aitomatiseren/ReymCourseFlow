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
import { Users, UserPlus, Search, Building2 } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { useTrainingParticipants } from "@/hooks/useTrainingParticipants";
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
  onEmployeesAdded: () => void;
}

export function AddEmployeesToTrainingDialog({
  open,
  onOpenChange,
  trainingId,
  trainingTitle,
  onEmployeesAdded,
}: AddEmployeesToTrainingDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  
  const { data: employees = [] } = useEmployees();
  const { data: currentParticipants = [] } = useTrainingParticipants(trainingId);
  const { toast } = useToast();

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

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
      setSelectedEmployees(new Set());
      setSearchTerm("");
    }
  }, [open, form]);

  return (
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
                          filteredEmployees.map((employee) => (
                            <div
                              key={employee.id}
                              className={`flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                                selectedEmployees.has(employee.id) ? 'bg-blue-50 border-blue-200' : ''
                              }`}
                              onClick={() => toggleEmployeeSelection(employee.id)}
                            >
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={selectedEmployees.has(employee.id)}
                                  onChange={() => toggleEmployeeSelection(employee.id)}
                                />
                                <div>
                                  <div className="font-medium">
                                    {employee.first_name} {employee.last_name}
                                  </div>
                                  <div className="text-sm text-gray-500 flex items-center gap-2">
                                    <Building2 className="h-3 w-3" />
                                    {employee.department || 'Unknown'}
                                    {employee.email && (
                                      <span className="ml-2">• {employee.email}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-sm text-gray-500">
                                {employee.job_title || 'Unknown Position'}
                              </div>
                            </div>
                          ))
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
  );
}