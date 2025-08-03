
import { Badge } from "@/components/ui/badge";
import { Calendar, Heart, Plane, Home, CheckCircle, XCircle } from "lucide-react";
import { EmployeeStatus, getStatusLabel } from "@/constants/employeeStatus";

interface EmployeeStatusBadgeProps {
  status: EmployeeStatus;
  className?: string;
}

export function EmployeeStatusBadge({ status, className }: EmployeeStatusBadgeProps) {
  const getStatusIcon = (status: EmployeeStatus) => {
    switch (status) {
      case 'active':
        return CheckCircle;
      case 'on_leave':
        return Calendar;
      case 'sick_short':
      case 'sick_long':
        return Heart;
      case 'vacation':
        return Plane;
      case 'unavailable':
        return Home;
      case 'inactive':
      case 'terminated':
        return XCircle;
      default:
        return null;
    }
  };

  // Map employee status to badge variant
  const getStatusVariant = (status: EmployeeStatus) => {
    switch (status) {
      case 'active':
        return 'active';
      case 'inactive':
        return 'inactive';
      case 'on_leave':
        return 'onLeave';
      case 'sick_short':
        return 'sickShort';
      case 'sick_long':
        return 'sickLong';
      case 'vacation':
        return 'vacation';
      case 'unavailable':
        return 'unavailable';
      case 'terminated':
        return 'terminated';
      default:
        return 'default';
    }
  };

  const IconComponent = getStatusIcon(status);
  const statusLabel = getStatusLabel(status);
  const variant = getStatusVariant(status);

  return (
    <Badge variant={variant as 'active' | 'inactive' | 'onLeave' | 'sickShort' | 'sickLong' | 'vacation' | 'unavailable' | 'terminated' | 'default'} className={className}>
      {IconComponent && <IconComponent className="h-3 w-3 mr-1" />}
      {statusLabel}
    </Badge>
  );
}
