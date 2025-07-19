
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, AlertTriangle, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  EMPLOYEE_STATUS_OPTIONS,
  EmployeeStatus,
  getStatusColor,
  getStatusLabel,
  isValidTransition,
  requiresEndDate
} from "@/constants/employeeStatus";
import { IntegrationService } from "@/services/integrationService";

interface EmployeeStatusManagerProps {
  employeeId: string;
  currentStatus: EmployeeStatus;
}

export function EmployeeStatusManager({ employeeId, currentStatus }: EmployeeStatusManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<any>(null);
  const [newStatus, setNewStatus] = useState({
    status: "" as EmployeeStatus | "",
    startDate: new Date().toISOString().split('T')[0], // Default to today
    endDate: "",
    reason: "",
    notes: ""
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch real status history from database
  const { data: statusHistory = [], isLoading } = useQuery({
    queryKey: ['employee-status-history', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_status_history')
        .select('*')
        .eq('employee_id', employeeId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!employeeId
  });

  // Get current status from history
  const currentStatusFromHistory = statusHistory.find(status => status.end_date === null)?.status || currentStatus;

  // Mutation to add new status
  const addStatusMutation = useMutation({
    mutationFn: async (statusData: {
      status: EmployeeStatus;
      startDate: string;
      endDate?: string;
      reason?: string;
      notes?: string;
    }) => {
      const today = new Date().toISOString().split('T')[0];
      const isImmediateStatus = statusData.startDate <= today;

      // Automatically close any ongoing status when the new status starts
      const currentStatusRecord = statusHistory.find(status => status.end_date === null);
      if (currentStatusRecord) {
        // If the new status starts today, end the current status today
        // If the new status starts in the future, end the current status the day before
        const newStartDate = new Date(statusData.startDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        newStartDate.setHours(0, 0, 0, 0);
        
        let endDate;
        if (newStartDate.getTime() === today.getTime()) {
          // New status starts today, end current status today
          endDate = statusData.startDate;
        } else {
          // New status starts in the future, end current status the day before
          const calculatedEndDate = new Date(statusData.startDate);
          calculatedEndDate.setDate(calculatedEndDate.getDate() - 1);
          endDate = calculatedEndDate.toISOString().split('T')[0];
        }

        await supabase
          .from('employee_status_history')
          .update({ end_date: endDate })
          .eq('id', currentStatusRecord.id);
      }

      // Insert the new status history record
      const { data, error } = await supabase
        .from('employee_status_history')
        .insert({
          employee_id: employeeId,
          status: statusData.status,
          start_date: statusData.startDate,
          end_date: statusData.endDate || null,
          reason: statusData.reason || null,
          notes: statusData.notes || null,
          changed_by_name: 'Current User' // Replace with actual user when auth is implemented
        });

      if (error) throw error;

      // Update the employee's current status if this change is immediate
      if (isImmediateStatus) {
        const { error: updateError } = await supabase
          .from('employees')
          .update({
            status: statusData.status,
            status_start_date: statusData.startDate,
            status_end_date: statusData.endDate || null,
            status_reason: statusData.reason || null
          })
          .eq('id', employeeId);

        if (updateError) throw updateError;

        // Trigger notification for training impact if status change is immediate
        try {
          const previousStatus = currentStatusRecord?.status as EmployeeStatus || 'active';
          await IntegrationService.handleEmployeeStatusChange(
            employeeId,
            statusData.status,
            previousStatus,
            statusData.startDate
          );
        } catch (notificationError) {
          console.error('Error sending status change notifications:', notificationError);
          // Don't throw - status was successfully updated, notification failure shouldn't block UI
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-status-history', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employee-current-status', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
      toast({
        title: "Success",
        description: "Status entry added successfully"
      });
      setIsAddDialogOpen(false);
      setNewStatus({
        status: "",
        startDate: new Date().toISOString().split('T')[0],
        endDate: "",
        reason: "",
        notes: ""
      });
      setValidationErrors([]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add status entry",
        variant: "destructive"
      });
      console.error('Error adding status:', error);
    }
  });

  // Mutation to edit existing status
  const editStatusMutation = useMutation({
    mutationFn: async (statusData: {
      id: string;
      status: EmployeeStatus;
      startDate: string;
      endDate?: string;
      reason?: string;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from('employee_status_history')
        .update({
          status: statusData.status,
          start_date: statusData.startDate,
          end_date: statusData.endDate || null,
          reason: statusData.reason || null,
          notes: statusData.notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', statusData.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-status-history', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employee-current-status', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
      toast({
        title: "Success",
        description: "Status updated successfully"
      });
      setIsEditDialogOpen(false);
      setEditingStatus(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
      console.error('Error updating status:', error);
    }
  });

  // Mutation to delete status
  const deleteStatusMutation = useMutation({
    mutationFn: async (statusId: string) => {
      const { error } = await supabase
        .from('employee_status_history')
        .delete()
        .eq('id', statusId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-status-history', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employee-current-status', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
      toast({
        title: "Success",
        description: "Status deleted successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete status",
        variant: "destructive"
      });
      console.error('Error deleting status:', error);
    }
  });

  const validateStatusChange = (): string[] => {
    const errors: string[] = [];

    // Basic validation
    if (!newStatus.status || !newStatus.startDate) {
      errors.push("Status and start date are required");
      return errors;
    }

    // Status transition validation
    if (!isValidTransition(currentStatusFromHistory as EmployeeStatus, newStatus.status as EmployeeStatus)) {
      errors.push(`Cannot transition from ${getStatusLabel(currentStatusFromHistory as EmployeeStatus)} to ${getStatusLabel(newStatus.status as EmployeeStatus)}`);
    }

    // Check if end date is required
    if (requiresEndDate(newStatus.status as EmployeeStatus) && !newStatus.endDate) {
      errors.push(`${getStatusLabel(newStatus.status as EmployeeStatus)} status requires an end date`);
    }

    // Date validation
    if (newStatus.endDate && newStatus.startDate > newStatus.endDate) {
      errors.push("Start date cannot be after end date");
    }

    // Check for overlapping periods
    const overlappingStatus = statusHistory.find(status => {
      if (status.status === newStatus.status) return false; // Allow same status extension

      const existingStart = new Date(status.start_date);
      const existingEnd = status.end_date ? new Date(status.end_date) : new Date('2099-12-31');
      const newStart = new Date(newStatus.startDate);
      const newEnd = newStatus.endDate ? new Date(newStatus.endDate) : new Date('2099-12-31');

      // Check for overlap
      return (newStart <= existingEnd && newEnd >= existingStart);
    });

    if (overlappingStatus) {
      errors.push(`This period overlaps with existing ${getStatusLabel(overlappingStatus.status as EmployeeStatus)} status`);
    }

    // Allow past dates for corrections, but warn about them
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(newStatus.startDate);
    if (startDate < today) {
      // Just a warning, not an error - allows for retroactive status updates
      console.warn("Status change is being applied retroactively");
    }

    return errors;
  };

  const handleAddStatus = () => {
    const errors = validateStatusChange();
    setValidationErrors(errors);

    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors[0],
        variant: "destructive"
      });
      return;
    }

    if (newStatus.status === "") {
      toast({
        title: "Validation Error",
        description: "Please select a status",
        variant: "destructive"
      });
      return;
    }

    addStatusMutation.mutate({
      status: newStatus.status as EmployeeStatus,
      startDate: newStatus.startDate,
      endDate: newStatus.endDate || undefined,
      reason: newStatus.reason,
      notes: newStatus.notes
    });
  };

  const handleEditStatus = (statusEntry: any) => {
    setEditingStatus(statusEntry);
    setNewStatus({
      status: statusEntry.status,
      startDate: statusEntry.start_date,
      endDate: statusEntry.end_date || "",
      reason: statusEntry.reason || "",
      notes: statusEntry.notes || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateStatus = () => {
    if (!editingStatus) return;

    const errors = validateStatusChange();
    setValidationErrors(errors);

    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors[0],
        variant: "destructive"
      });
      return;
    }

    editStatusMutation.mutate({
      id: editingStatus.id,
      status: newStatus.status as EmployeeStatus,
      startDate: newStatus.startDate,
      endDate: newStatus.endDate || undefined,
      reason: newStatus.reason,
      notes: newStatus.notes
    });
  };

  const handleDeleteStatus = (statusId: string) => {
    if (window.confirm("Are you sure you want to delete this status entry? This action cannot be undone.")) {
      deleteStatusMutation.mutate(statusId);
    }
  };

  const canEditOrDelete = (statusEntry: any) => {
    // Can edit/delete if it's not the current active status or if it's a future status
    const isCurrentActive = statusEntry.end_date === null && new Date(statusEntry.start_date) <= new Date();
    return !isCurrentActive || new Date(statusEntry.start_date) > new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Sort status history: future dated > current (ongoing) > past in descending order
  const sortedStatusHistory = [...statusHistory].sort((a, b) => {
    const now = new Date();
    const aStartDate = new Date(a.start_date);
    const bStartDate = new Date(b.start_date);

    const aIsFuture = aStartDate > now;
    const bIsFuture = bStartDate > now;
    const aIsOngoing = a.end_date === null;
    const bIsOngoing = b.end_date === null;

    // Future dated statuses come first
    if (aIsFuture && !bIsFuture) return -1;
    if (!aIsFuture && bIsFuture) return 1;

    // Among non-future statuses, ongoing (current) comes before past
    if (!aIsFuture && !bIsFuture) {
      if (aIsOngoing && !bIsOngoing) return -1;
      if (!aIsOngoing && bIsOngoing) return 1;
    }

    // Within the same category, sort by start_date in descending order
    return bStartDate.getTime() - aStartDate.getTime();
  });

  // Filter out status options that match the current status and check valid transitions
  const availableStatusOptions = EMPLOYEE_STATUS_OPTIONS.filter(option =>
    option.value !== currentStatusFromHistory &&
    isValidTransition(currentStatusFromHistory as EmployeeStatus, option.value)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Status History
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) {
              setValidationErrors([]);
              setNewStatus({
                status: "",
                startDate: new Date().toISOString().split('T')[0],
                endDate: "",
                reason: "",
                notes: ""
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Status
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Status Entry</DialogTitle>
                <DialogDescription>
                  Add a new status entry for this employee with effective date and optional notes.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {validationErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                      <span className="text-sm font-medium text-red-800">Validation Errors:</span>
                    </div>
                    <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={newStatus.status}
                    onValueChange={(value) => {
                      setNewStatus({ ...newStatus, status: value as EmployeeStatus });
                      setValidationErrors([]);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <span>{option.label}</span>
                            {option.description && (
                              <span className="text-xs text-gray-500">{option.description}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {newStatus.status && requiresEndDate(newStatus.status as EmployeeStatus) && (
                    <p className="text-xs text-blue-600 mt-1">This status requires an end date</p>
                  )}
                  {newStatus.status && (newStatus.status === 'sick_short' || newStatus.status === 'sick_long') && (
                    <p className="text-xs text-gray-500 mt-1">End date is optional for sick leave</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={newStatus.startDate}
                      onChange={(e) => {
                        setNewStatus({ ...newStatus, startDate: e.target.value });
                        setValidationErrors([]);
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">
                      End Date {newStatus.status && requiresEndDate(newStatus.status as EmployeeStatus) && '*'}
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={newStatus.endDate}
                      min={newStatus.startDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => {
                        setNewStatus({ ...newStatus, endDate: e.target.value });
                        setValidationErrors([]);
                      }}
                      disabled={!newStatus.startDate}
                    />
                    {!newStatus.endDate && newStatus.status && !requiresEndDate(newStatus.status as EmployeeStatus) && (
                      <p className="text-xs text-gray-500 mt-1">Leave empty for ongoing status</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Input
                    id="reason"
                    placeholder="Enter reason for status change"
                    value={newStatus.reason}
                    onChange={(e) => setNewStatus({ ...newStatus, reason: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes..."
                    value={newStatus.notes}
                    onChange={(e) => setNewStatus({ ...newStatus, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsAddDialogOpen(false);
                    setValidationErrors([]);
                    setNewStatus({
                      status: "",
                      startDate: new Date().toISOString().split('T')[0],
                      endDate: "",
                      reason: "",
                      notes: ""
                    });
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddStatus} disabled={addStatusMutation.isPending}>
                    {addStatusMutation.isPending ? "Adding..." : "Add Status"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Status Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) {
              setValidationErrors([]);
              setEditingStatus(null);
              setNewStatus({
                status: "",
                startDate: new Date().toISOString().split('T')[0],
                endDate: "",
                reason: "",
                notes: ""
              });
            }
          }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Status Entry</DialogTitle>
                <DialogDescription>
                  Update the details of this status entry for the employee.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {validationErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                      <span className="text-sm font-medium text-red-800">Validation Errors:</span>
                    </div>
                    <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <Label htmlFor="editStatus">Status *</Label>
                  <Select
                    value={newStatus.status}
                    onValueChange={(value) => {
                      setNewStatus({ ...newStatus, status: value as EmployeeStatus });
                      setValidationErrors([]);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYEE_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <span>{option.label}</span>
                            {option.description && (
                              <span className="text-xs text-gray-500">{option.description}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {newStatus.status && requiresEndDate(newStatus.status as EmployeeStatus) && (
                    <p className="text-xs text-blue-600 mt-1">This status requires an end date</p>
                  )}
                  {newStatus.status && (newStatus.status === 'sick_short' || newStatus.status === 'sick_long') && (
                    <p className="text-xs text-gray-500 mt-1">End date is optional for sick leave</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editStartDate">Start Date *</Label>
                    <Input
                      id="editStartDate"
                      type="date"
                      value={newStatus.startDate}
                      onChange={(e) => {
                        setNewStatus({ ...newStatus, startDate: e.target.value });
                        setValidationErrors([]);
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editEndDate">
                      End Date {newStatus.status && requiresEndDate(newStatus.status as EmployeeStatus) && '*'}
                    </Label>
                    <Input
                      id="editEndDate"
                      type="date"
                      value={newStatus.endDate}
                      min={newStatus.startDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => {
                        setNewStatus({ ...newStatus, endDate: e.target.value });
                        setValidationErrors([]);
                      }}
                      disabled={!newStatus.startDate}
                    />
                    {!newStatus.endDate && newStatus.status && !requiresEndDate(newStatus.status as EmployeeStatus) && (
                      <p className="text-xs text-gray-500 mt-1">Leave empty for ongoing status</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="editReason">Reason</Label>
                  <Input
                    id="editReason"
                    placeholder="Enter reason for status change"
                    value={newStatus.reason}
                    onChange={(e) => setNewStatus({ ...newStatus, reason: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="editNotes">Notes</Label>
                  <Textarea
                    id="editNotes"
                    placeholder="Additional notes..."
                    value={newStatus.notes}
                    onChange={(e) => setNewStatus({ ...newStatus, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsEditDialogOpen(false);
                    setValidationErrors([]);
                    setEditingStatus(null);
                    setNewStatus({
                      status: "",
                      startDate: new Date().toISOString().split('T')[0],
                      endDate: "",
                      reason: "",
                      notes: ""
                    });
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateStatus} disabled={editStatusMutation.isPending}>
                    {editStatusMutation.isPending ? "Updating..." : "Update Status"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-gray-500 text-center py-4">Loading status history...</p>
        ) : sortedStatusHistory.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No status history available</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Changed By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStatusHistory.map((entry) => {
                const now = new Date();
                const startDate = new Date(entry.start_date);
                const isFuture = startDate > now;
                const isOngoing = !entry.end_date;

                return (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(entry.status as EmployeeStatus)}>
                          {getStatusLabel(entry.status as EmployeeStatus)}
                        </Badge>
                        {isFuture && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600">Future</Badge>
                        )}
                        {isOngoing && !isFuture && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-600">Current</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(entry.start_date)}</TableCell>
                    <TableCell>{entry.end_date ? formatDate(entry.end_date) : "Ongoing"}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={entry.reason}>
                        {entry.reason || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={entry.notes}>
                        {entry.notes || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {entry.changed_by_name}
                    </TableCell>
                    <TableCell>
                      {canEditOrDelete(entry) && (
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditStatus(entry)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteStatus(entry.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
