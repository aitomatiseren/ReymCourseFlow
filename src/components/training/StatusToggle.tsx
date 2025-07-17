
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Training } from "@/hooks/useTrainings";
import { Shield, ShieldCheck } from "lucide-react";

interface StatusToggleProps {
  status: Training['status'];
  onStatusChange: (status: Training['status']) => void;
  disabled?: boolean;
  requiresApproval?: boolean;
}

export function StatusToggle({ status, onStatusChange, disabled = false, requiresApproval = false }: StatusToggleProps) {
  const getStatusColor = (status: Training['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const statusOptions: { value: Training['status']; label: string }[] = [
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'confirmed', label: 'Confirmed' }, 
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'completed', label: 'Completed' }
  ];

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Training Status</label>
      <div className="flex items-center space-x-2">
        <Badge variant="outline" className={getStatusColor(status)}>
          {status}
        </Badge>
        
        {requiresApproval && (
          <Badge variant="outline" className="bg-orange-100 text-orange-800 flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Requires Approval
          </Badge>
        )}
        
        {!disabled && (
          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
