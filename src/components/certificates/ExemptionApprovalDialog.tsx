import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  User, 
  FileText, 
  Calendar,
  Clock,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { useExemptionManagement, ExemptionWithDetails, getExemptionTypeColor, getExemptionStatusColor } from '@/hooks/useCertificateExemptions';
import { toast } from '@/hooks/use-toast';

interface ExemptionApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exemption: ExemptionWithDetails | null;
}

export const ExemptionApprovalDialog: React.FC<ExemptionApprovalDialogProps> = ({
  open,
  onOpenChange,
  exemption
}) => {
  const { approveExemption, rejectExemption } = useExemptionManagement();
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);

  if (!exemption) return null;

  const handleApprove = async () => {
    try {
      await approveExemption.mutateAsync({
        exemptionId: exemption.id,
        approvalNotes,
        approvedByName: 'Current User' // This should come from auth context
      });

      toast({
        title: "Exemption Approved",
        description: `Exemption for ${exemption.employee?.name} has been approved.`
      });

      setApprovalNotes('');
      setAction(null);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve exemption. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejecting this exemption.",
        variant: "destructive"
      });
      return;
    }

    try {
      await rejectExemption.mutateAsync({
        exemptionId: exemption.id,
        rejectionReason,
        approvedByName: 'Current User' // This should come from auth context
      });

      toast({
        title: "Exemption Rejected",
        description: `Exemption for ${exemption.employee?.name} has been rejected.`
      });

      setRejectionReason('');
      setAction(null);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject exemption. Please try again.",
        variant: "destructive"
      });
    }
  };

  const isExpiringSoon = exemption.expiry_date && 
    new Date(exemption.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {action === 'approve' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : action === 'reject' ? (
              <XCircle className="h-5 w-5 text-red-600" />
            ) : (
              <MessageSquare className="h-5 w-5" />
            )}
            {action === 'approve' ? 'Approve Exemption' : 
             action === 'reject' ? 'Reject Exemption' : 
             'Review Certificate Exemption'}
          </DialogTitle>
          <DialogDescription>
            {action === 'approve' ? 'Confirm approval of this exemption request.' :
             action === 'reject' ? 'Provide a reason for rejecting this exemption request.' :
             'Review the exemption request details and make a decision.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Exemption Status and Type */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={getExemptionStatusColor(exemption.approval_status)}>
                {exemption.approval_status.charAt(0).toUpperCase() + exemption.approval_status.slice(1)}
              </Badge>
              <Badge className={getExemptionTypeColor(exemption.exemption_type)}>
                {exemption.exemption_type.charAt(0).toUpperCase() + exemption.exemption_type.slice(1)}
              </Badge>
              {isExpiringSoon && (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                  <Clock className="mr-1 h-3 w-3" />
                  Expiring Soon
                </Badge>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              ID: {exemption.id.slice(0, 8)}...
            </span>
          </div>

          {/* Employee and Certificate Info */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Employee
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="font-medium">{exemption.employee?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {exemption.employee?.employee_number}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="text-sm">{exemption.employee?.department}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Certificate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="font-medium">{exemption.license?.name}</p>
                  {exemption.license?.category && (
                    <p className="text-sm text-muted-foreground">
                      {exemption.license.category}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Exemption Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Exemption Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Effective Date</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(exemption.effective_date), 'MMM d, yyyy')}
                  </p>
                </div>
                {exemption.expiry_date && (
                  <div>
                    <p className="text-sm font-medium">Expiry Date</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(exemption.expiry_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Reason</p>
                <p className="text-sm bg-muted p-3 rounded-md">
                  {exemption.reason}
                </p>
              </div>

              {exemption.justification && (
                <div>
                  <p className="text-sm font-medium mb-2">Additional Justification</p>
                  <p className="text-sm bg-muted p-3 rounded-md">
                    {exemption.justification}
                  </p>
                </div>
              )}

              {exemption.dont_repeat_flag && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This exemption is marked to permanently hide this certificate requirement 
                    for this employee.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Request Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Request Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Requested By</p>
                  <p className="text-sm text-muted-foreground">
                    {exemption.requested_by_name || exemption.requested_by?.name || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Request Date</p>
                  <p className="text-sm text-muted-foreground">
                    {exemption.created_at && format(new Date(exemption.created_at), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Section */}
          {exemption.approval_status === 'pending' && !action && (
            <div className="flex gap-2 justify-center">
              <Button 
                variant="outline" 
                onClick={() => setAction('reject')}
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </Button>
              <Button 
                onClick={() => setAction('approve')}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Approve
              </Button>
            </div>
          )}

          {/* Approval Notes */}
          {action === 'approve' && (
            <div className="space-y-2">
              <Label htmlFor="approvalNotes">Approval Notes (Optional)</Label>
              <Textarea
                id="approvalNotes"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Add any notes about this approval..."
                rows={3}
              />
            </div>
          )}

          {/* Rejection Reason */}
          {action === 'reject' && (
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason *</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this exemption is being rejected..."
                rows={3}
              />
            </div>
          )}

          {/* Previous Approval History */}
          {exemption.approval_date && (
            <>
              <Separator />
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Approval History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Decision</p>
                      <Badge className={getExemptionStatusColor(exemption.approval_status)}>
                        {exemption.approval_status.charAt(0).toUpperCase() + exemption.approval_status.slice(1)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Decision Date</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(exemption.approval_date), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                  {exemption.approved_by_name && (
                    <div>
                      <p className="text-sm font-medium">Approved By</p>
                      <p className="text-sm text-muted-foreground">
                        {exemption.approved_by_name}
                      </p>
                    </div>
                  )}
                  {exemption.approval_notes && (
                    <div>
                      <p className="text-sm font-medium">Notes</p>
                      <p className="text-sm bg-muted p-3 rounded-md">
                        {exemption.approval_notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => {
            setAction(null);
            setApprovalNotes('');
            setRejectionReason('');
            onOpenChange(false);
          }}>
            {action ? 'Cancel' : 'Close'}
          </Button>
          
          {action === 'approve' && (
            <Button 
              onClick={handleApprove}
              disabled={approveExemption.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {approveExemption.isPending ? 'Approving...' : 'Confirm Approval'}
            </Button>
          )}
          
          {action === 'reject' && (
            <Button 
              onClick={handleReject}
              disabled={rejectExemption.isPending}
              variant="destructive"
            >
              {rejectExemption.isPending ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};