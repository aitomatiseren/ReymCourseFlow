import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function CoursesRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Preserve any query parameters when redirecting
    const searchParams = location.search;
    navigate(`/training-setup?tab=courses${searchParams ? '&' + searchParams.slice(1) : ''}`, { replace: true });
  }, [navigate, location]);

  return null;
}