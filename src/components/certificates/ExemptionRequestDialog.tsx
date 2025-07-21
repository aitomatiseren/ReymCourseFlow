import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, AlertCircle, FileText, User, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useEmployees } from '@/hooks/useEmployees';
import { useLicenses } from '@/hooks/useCertificates';
import { useExemptionManagement, validateExemptionRequest, ExemptionRequest } from '@/hooks/useCertificateExemptions';
import { toast } from '@/hooks/use-toast';

interface ExemptionRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefilledEmployeeId?: string;
  prefilledLicenseId?: string;
}

export const ExemptionRequestDialog: React.FC<ExemptionRequestDialogProps> = ({
  open,
  onOpenChange,
  prefilledEmployeeId,
  prefilledLicenseId
}) => {
  const { data: employees } = useEmployees();
  const { data: licenses } = useLicenses();
  const { createExemptionRequest } = useExemptionManagement();

  const [formData, setFormData] = useState<ExemptionRequest & { requestedByName: string }>({
    employeeId: prefilledEmployeeId || '',
    licenseId: prefilledLicenseId || '',
    exemptionType: 'temporary',
    reason: '',
    justification: '',
    effectiveDate: format(new Date(), 'yyyy-MM-dd'),
    expiryDate: '',
    dontRepeatFlag: false,
    requestedByName: ''
  });

  const [showEffectiveCalendar, setShowEffectiveCalendar] = useState(false);
  const [showExpiryCalendar, setShowExpiryCalendar] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const selectedEmployee = employees?.find(emp => emp.id === formData.employeeId);
  const selectedLicense = licenses?.find(lic => lic.id === formData.licenseId);

  const handleSubmit = async () => {
    const validationErrors = validateExemptionRequest(formData);
    
    if (!formData.requestedByName.trim()) {
      validationErrors.push('Manager/Supervisor name is required');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      // Set dontRepeatFlag based on exemption type
      const submitData = {
        ...formData,
        dontRepeatFlag: formData.exemptionType === 'permanent'
      };
      
      await createExemptionRequest.mutateAsync(submitData);
      
      toast({
        title: "Exemption Request Submitted",
        description: "The exemption request has been submitted for HR/management approval."
      });

      // Reset form
      setFormData({
        employeeId: prefilledEmployeeId || '',
        licenseId: prefilledLicenseId || '',
        exemptionType: 'temporary',
        reason: '',
        justification: '',
        effectiveDate: format(new Date(), 'yyyy-MM-dd'),
        expiryDate: '',
        dontRepeatFlag: false,
        requestedByName: ''
      });
      setErrors([]);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit exemption request. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDateSelect = (date: Date | undefined, field: 'effectiveDate' | 'expiryDate') => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        [field]: format(date, 'yyyy-MM-dd')
      }));
    }
    if (field === 'effectiveDate') {
      setShowEffectiveCalendar(false);
    } else {
      setShowExpiryCalendar(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Request Employee Certificate Exemption
          </DialogTitle>
          <DialogDescription>
            As a manager/supervisor, request an exemption for an employee from a certificate requirement.
            This will require approval from HR or senior management.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Error Display */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Employee and Certificate Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Employee *</Label>
              <Select 
                value={formData.employeeId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, employeeId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee..." />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{employee.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="license">Certificate *</Label>
              <Select 
                value={formData.licenseId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, licenseId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select certificate..." />
                </SelectTrigger>
                <SelectContent>
                  {licenses?.map(license => (
                    <SelectItem key={license.id} value={license.id}>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>{license.name}</span>
                        {license.category && (
                          <Badge variant="outline" className="text-xs">
                            {license.category}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selected Employee/License Info */}
          {(selectedEmployee || selectedLicense) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Selection Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {selectedEmployee && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Employee:</span>
                    <span>{selectedEmployee.name} - {selectedEmployee.department}</span>
                  </div>
                )}
                {selectedLicense && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Certificate:</span>
                    <span>{selectedLicense.name}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Exemption Type and Dates */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="exemptionType">Exemption Type *</Label>
              <Select 
                value={formData.exemptionType} 
                onValueChange={(value: 'permanent' | 'temporary' | 'conditional') => 
                  setFormData(prev => ({ ...prev, exemptionType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="temporary">Temporary</SelectItem>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="conditional">Conditional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Effective Date *</Label>
              <Popover open={showEffectiveCalendar} onOpenChange={setShowEffectiveCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.effectiveDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.effectiveDate ? 
                      format(new Date(formData.effectiveDate), "MMM d, yyyy") : 
                      "Pick date"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.effectiveDate ? new Date(formData.effectiveDate) : undefined}
                    onSelect={(date) => handleDateSelect(date, 'effectiveDate')}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {formData.exemptionType === 'temporary' && (
              <div className="space-y-2">
                <Label>Expiry Date *</Label>
                <Popover open={showExpiryCalendar} onOpenChange={setShowExpiryCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.expiryDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.expiryDate ? 
                        format(new Date(formData.expiryDate), "MMM d, yyyy") : 
                        "Pick date"
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.expiryDate ? new Date(formData.expiryDate) : undefined}
                      onSelect={(date) => handleDateSelect(date, 'expiryDate')}
                      disabled={(date) => {
                        if (!formData.effectiveDate) return false;
                        try {
                          return date <= new Date(formData.effectiveDate);
                        } catch {
                          return false;
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {/* Reason and Justification */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Exemption *</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Explain why this exemption is needed..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="justification">Additional Justification</Label>
              <Textarea
                id="justification"
                value={formData.justification || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, justification: e.target.value }))}
                placeholder="Provide any additional context or supporting information..."
                rows={3}
              />
            </div>
          </div>

          {/* Requested By and Options */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="requestedByName">Manager/Supervisor Name *</Label>
              <Input
                id="requestedByName"
                value={formData.requestedByName}
                onChange={(e) => setFormData(prev => ({ ...prev, requestedByName: e.target.value }))}
                placeholder="Enter your full name as the requesting manager..."
              />
            </div>

          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createExemptionRequest.isPending}
          >
            {createExemptionRequest.isPending ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};