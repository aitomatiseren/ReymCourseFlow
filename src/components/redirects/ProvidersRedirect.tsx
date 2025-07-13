import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function ProvidersRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/training-setup?tab=providers', { replace: true });
  }, [navigate]);

  return null;
}