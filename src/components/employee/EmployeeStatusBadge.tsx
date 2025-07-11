
import { Badge } from "@/components/ui/badge";
import { Calendar, Heart, Plane, Home, CheckCircle, XCircle } from "lucide-react";
import { EmployeeStatus, getStatusColor, getStatusLabel } from "@/constants/employeeStatus";

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

  const IconComponent = getStatusIcon(status);
  const statusColor = getStatusColor(status);
  const statusLabel = getStatusLabel(status);

  return (
    <Badge className={`${statusColor} hover:${statusColor} ${className}`}>
      {IconComponent && <IconComponent className="h-3 w-3 mr-1" />}
      {statusLabel}
    </Badge>
  );
}
