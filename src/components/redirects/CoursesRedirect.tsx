import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function CoursesRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Preserve any query parameters when redirecting
    const searchParams = location.search;
    navigate(`/training-setup?tab=courses${searchParams ? '&' + searchParams.slice(1) : ''}`, { replace: true });
  }, []); // Empty dependency array to prevent re-navigation

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}