import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, XCircle, Pause } from "lucide-react";

type CertificateStatus = 'valid' | 'expiring_soon' | 'expired' | 'suspended';

interface CertificateStatusBadgeProps {
  status: CertificateStatus;
  className?: string;
}

export function CertificateStatusBadge({ status, className }: CertificateStatusBadgeProps) {
  const getStatusIcon = (status: CertificateStatus) => {
    switch (status) {
      case 'valid':
        return CheckCircle;
      case 'expiring_soon':
        return AlertTriangle;
      case 'expired':
        return XCircle;
      case 'suspended':
        return Pause;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: CertificateStatus) => {
    switch (status) {
      case 'valid':
        return 'Valid';
      case 'expiring_soon':
        return 'Expiring Soon';
      case 'expired':
        return 'Expired';
      case 'suspended':
        return 'Suspended';
      default:
        return status;
    }
  };

  // Map certificate status to badge variant
  const getStatusVariant = (status: CertificateStatus) => {
    switch (status) {
      case 'valid':
        return 'valid';
      case 'expiring_soon':
        return 'expiringSoon';
      case 'expired':
        return 'expired';
      case 'suspended':
        return 'suspended';
      default:
        return 'default';
    }
  };

  const IconComponent = getStatusIcon(status);
  const statusLabel = getStatusLabel(status);
  const variant = getStatusVariant(status);

  return (
    <Badge variant={variant as 'valid' | 'expiringSoon' | 'expired' | 'suspended' | 'default'} className={className}>
      {IconComponent && <IconComponent className="h-3 w-3 mr-1" />}
      {statusLabel}
    </Badge>
  );
}