
import { useState, useEffect } from 'react';

type ViewMode = 'grid' | 'list';

export function useViewMode(key: string, defaultValue: ViewMode = 'grid') {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const stored = localStorage.getItem(`viewMode-${key}`);
    return (stored as ViewMode) || defaultValue;
  });

  useEffect(() => {
    localStorage.setItem(`viewMode-${key}`, viewMode);
  }, [key, viewMode]);

  return [viewMode, setViewMode] as const;
}
