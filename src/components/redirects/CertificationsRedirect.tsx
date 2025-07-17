import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export function CertificationsRedirect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const tab = searchParams.get('tab');
    
    // Handle specific tab redirects
    switch (tab) {
      case 'expiry':
        navigate('/certificate-expiry');
        break;
      case 'code95':
        navigate('/certificate-definitions');
        break;
      case 'hierarchy':
        navigate('/certificate-definitions');
        break;
      case 'exemptions':
        navigate('/certificate-definitions');
        break;
      case 'reports':
        navigate('/reports');
        break;
      case 'all':
      default:
        // Default redirect to certificate definitions for certificate management
        navigate('/certificate-definitions');
        break;
    }
  }, [navigate, searchParams]);

  return null;
}