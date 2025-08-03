import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import { EmployeeStatusBadge } from './EmployeeStatusBadge';

describe('EmployeeStatusBadge', () => {
  it('renders active status correctly', () => {
    render(<EmployeeStatusBadge status="active" />);
    
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByRole('generic')).toHaveClass('bg-green-50', 'text-green-700');
  });

  it('renders inactive status correctly', () => {
    render(<EmployeeStatusBadge status="inactive" />);
    
    expect(screen.getByText('Inactive')).toBeInTheDocument();
    expect(screen.getByRole('generic')).toHaveClass('bg-gray-50', 'text-gray-700');
  });

  it('renders on leave status correctly', () => {
    render(<EmployeeStatusBadge status="on_leave" />);
    
    expect(screen.getByText('On Leave')).toBeInTheDocument();
    expect(screen.getByRole('generic')).toHaveClass('bg-yellow-50', 'text-yellow-700');
  });

  it('renders sick short status correctly', () => {
    render(<EmployeeStatusBadge status="sick_short" />);
    
    expect(screen.getByText('Short-term Sick Leave')).toBeInTheDocument();
    expect(screen.getByRole('generic')).toHaveClass('bg-orange-50', 'text-orange-700');
  });

  it('renders sick long status correctly', () => {
    render(<EmployeeStatusBadge status="sick_long" />);
    
    expect(screen.getByText('Long-term Sick Leave')).toBeInTheDocument();
    expect(screen.getByRole('generic')).toHaveClass('bg-red-50', 'text-red-700');
  });

  it('renders vacation status correctly', () => {
    render(<EmployeeStatusBadge status="vacation" />);
    
    expect(screen.getByText('Vacation')).toBeInTheDocument();
    expect(screen.getByRole('generic')).toHaveClass('bg-blue-50', 'text-blue-700');
  });

  it('renders unavailable status correctly', () => {
    render(<EmployeeStatusBadge status="unavailable" />);
    
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
    expect(screen.getByRole('generic')).toHaveClass('bg-purple-50', 'text-purple-700');
  });

  it('renders terminated status correctly', () => {
    render(<EmployeeStatusBadge status="terminated" />);
    
    expect(screen.getByText('Terminated')).toBeInTheDocument();
    expect(screen.getByRole('generic')).toHaveClass('bg-red-50', 'text-red-700');
  });

  it('displays appropriate icons for each status', () => {
    const { rerender } = render(<EmployeeStatusBadge status="active" />);
    expect(document.querySelector('.lucide-check-circle')).toBeInTheDocument();

    rerender(<EmployeeStatusBadge status="on_leave" />);
    expect(document.querySelector('.lucide-calendar')).toBeInTheDocument();

    rerender(<EmployeeStatusBadge status="sick_short" />);
    expect(document.querySelector('.lucide-heart')).toBeInTheDocument();

    rerender(<EmployeeStatusBadge status="vacation" />);
    expect(document.querySelector('.lucide-plane')).toBeInTheDocument();

    rerender(<EmployeeStatusBadge status="unavailable" />);
    expect(document.querySelector('.lucide-home')).toBeInTheDocument();

    rerender(<EmployeeStatusBadge status="terminated" />);
    expect(document.querySelector('.lucide-x-circle')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<EmployeeStatusBadge status="active" className="custom-class" />);
    
    expect(screen.getByRole('generic')).toHaveClass('custom-class');
  });
});