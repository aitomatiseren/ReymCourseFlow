import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Calendar,
  FileText,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  useEmployeeExemptionStatus,
  getExemptionStatusColor,
  getExemptionTypeColor,
  isExemptionExpiringSoon
} from '@/hooks/useCertificateExemptions';

interface EmployeeExemptionStatusProps {
  employeeId: string;
  licenseId: string;
  licenseName: string;
  onRequestExemption?: () => void;
}

export const EmployeeExemptionStatus: React.FC<EmployeeExemptionStatusProps> = ({
  employeeId,
  licenseId,
  licenseName,
  onRequestExemption
}) => {
  const { data: exemptionStatus, isLoading } = useEmployeeExemptionStatus(employeeId, licenseId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-sm text-muted-foreground">Checking exemption status...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!exemptionStatus?.hasActiveExemption) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Certificate Exemption
          </CardTitle>
          <CardDescription>
            No active exemption for {licenseName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                This employee is required to have the {licenseName} certificate.
              </AlertDescription>
            </Alert>
            
            {onRequestExemption && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onRequestExemption}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Manager: Request Exemption
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const exemption = exemptionStatus.exemption;
  if (!exemption) return null;

  const isExpiring = isExemptionExpiringSoon(exemption);
  const isExpired = exemption.expiry_date && new Date(exemption.expiry_date) < new Date();

  return (
    <Card className={`${isExpiring || isExpired ? 'border-yellow-500' : 'border-green-500'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-600" />
            Active Exemption
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getExemptionStatusColor(exemption.approval_status)}>
              {exemption.approval_status}
            </Badge>
            <Badge className={getExemptionTypeColor(exemption.exemption_type)}>
              {exemption.exemption_type}
            </Badge>
          </div>
        </div>
        <CardDescription>
          Exemption for {licenseName}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Alerts */}
        {isExpired && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This exemption has expired. The employee may need to obtain the certificate 
              or request a new exemption.
            </AlertDescription>
          </Alert>
        )}
        
        {isExpiring && !isExpired && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              This exemption is expiring soon. Consider renewal or certificate acquisition.
            </AlertDescription>
          </Alert>
        )}

        {exemption.approval_status === 'approved' && !isExpired && !isExpiring && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Employee is exempt from {licenseName} certificate requirement.
            </AlertDescription>
          </Alert>
        )}

        {/* Exemption Details */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Effective Date</p>
              <p className="text-sm">{format(new Date(exemption.effective_date), 'MMM d, yyyy')}</p>
            </div>
            {exemption.expiry_date && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Expiry Date</p>
                <p className="text-sm">{format(new Date(exemption.expiry_date), 'MMM d, yyyy')}</p>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Reason</p>
            <p className="text-sm bg-muted p-2 rounded text-muted-foreground">
              {exemption.reason}
            </p>
          </div>

          {exemption.justification && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Justification</p>
              <p className="text-sm bg-muted p-2 rounded text-muted-foreground">
                {exemption.justification}
              </p>
            </div>
          )}

          {exemption.approval_date && (
            <div className="text-xs text-muted-foreground pt-2 border-t">
              <div className="flex justify-between">
                <span>Approved:</span>
                <span>{format(new Date(exemption.approval_date), 'MMM d, yyyy')}</span>
              </div>
              {exemption.approved_by_name && (
                <div className="flex justify-between">
                  <span>Approved by:</span>
                  <span>{exemption.approved_by_name}</span>
                </div>
              )}
            </div>
          )}

          {exemption.dont_repeat_flag && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                This exemption is set to permanently exclude this certificate requirement 
                for this employee.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {(isExpiring || isExpired) && onRequestExemption && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onRequestExemption}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Manager: Request New Exemption
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};