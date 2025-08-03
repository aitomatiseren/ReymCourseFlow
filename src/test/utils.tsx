import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Helper functions for testing
export const createMockEmployee = (overrides = {}) => ({
  id: '1',
  name: 'John Doe',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  employee_number: 'EMP001',
  department: 'Engineering',
  job_title: 'Software Developer',
  status: 'active',
  hire_date: '2023-01-01',
  ...overrides,
});

export const createMockCourse = (overrides = {}) => ({
  id: '1',
  title: 'Safety Training',
  description: 'Basic safety training course',
  duration_hours: 8,
  max_participants: 20,
  is_active: true,
  ...overrides,
});

export const createMockTraining = (overrides = {}) => ({
  id: '1',
  course_id: '1',
  title: 'Safety Training Session',
  start_date: '2024-02-01T09:00:00Z',
  end_date: '2024-02-01T17:00:00Z',
  instructor_id: '1',
  location: 'Training Room A',
  status: 'scheduled',
  max_participants: 20,
  ...overrides,
});

export const createMockCertificate = (overrides = {}) => ({
  id: '1',
  employee_id: '1',
  license_type: 'Driver License',
  license_number: 'DL123456',
  issue_date: '2023-01-01',
  expiry_date: '2025-01-01',
  status: 'active',
  ...overrides,
});

// Mock user event setup
export const createMockUser = () => ({
  id: '1',
  email: 'test@example.com',
  user_metadata: {
    name: 'Test User',
  },
});

// Utility to wait for async operations
export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 0));