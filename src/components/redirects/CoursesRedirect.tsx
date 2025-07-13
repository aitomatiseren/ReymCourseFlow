import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function CoursesRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/training-setup?tab=courses', { replace: true });
  }, [navigate]);

  return null;
}