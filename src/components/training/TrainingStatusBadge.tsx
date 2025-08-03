import { Badge } from "@/components/ui/badge";
import { Calendar, Play, CheckCircle, XCircle } from "lucide-react";

type TrainingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

interface TrainingStatusBadgeProps {
  status: TrainingStatus;
  className?: string;
}

export function TrainingStatusBadge({ status, className }: TrainingStatusBadgeProps) {
  const getStatusIcon = (status: TrainingStatus) => {
    switch (status) {
      case 'scheduled':
        return Calendar;
      case 'in_progress':
        return Play;
      case 'completed':
        return CheckCircle;
      case 'cancelled':
        return XCircle;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: TrainingStatus) => {
    switch (status) {
      case 'scheduled':
        return 'Scheduled';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  // Map training status to badge variant
  const getStatusVariant = (status: TrainingStatus) => {
    switch (status) {
      case 'scheduled':
        return 'scheduled';
      case 'in_progress':
        return 'inProgress';
      case 'completed':
        return 'completed';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'default';
    }
  };

  const IconComponent = getStatusIcon(status);
  const statusLabel = getStatusLabel(status);
  const variant = getStatusVariant(status);

  return (
    <Badge variant={variant as 'scheduled' | 'inProgress' | 'completed' | 'cancelled' | 'default'} className={className}>
      {IconComponent && <IconComponent className="h-3 w-3 mr-1" />}
      {statusLabel}
    </Badge>
  );
}