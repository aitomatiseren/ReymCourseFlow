# Coding Conventions

## TypeScript Conventions

### Type Definitions
- Use interfaces for object shapes: `interface User { ... }`
- Use type aliases for unions/intersections: `type Status = 'active' | 'inactive'`
- Prefer explicit types over `any`
- Define types in `/src/types/index.ts` or feature-specific type files
- Use Zod schemas for runtime validation and derive types from them
- Leverage Supabase generated types from `/src/integrations/supabase/types.ts`

### Naming Conventions
- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Hooks**: camelCase with 'use' prefix (e.g., `useEmployees.ts`)
- **Utils**: camelCase (e.g., `certificateUtils.ts`, `code95Utils.ts`)
- **Services**: camelCase (e.g., `chatService.ts`, `openAIService.ts`)
- **Types/Interfaces**: PascalCase (e.g., `Employee`, `TrainingSession`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_PARTICIPANTS`, `DEFAULT_TIMEOUT`)
- **Enums**: PascalCase with PascalCase values (e.g., `EmployeeStatus.Active`)

## React Patterns

### Component Structure
```tsx
// 1. Imports (grouped by type)
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useEmployees } from '@/hooks/useEmployees';
import { cn } from '@/lib/utils';
import type { Employee } from '@/types';

// 2. Types/Interfaces
interface ComponentProps {
  employee: Employee;
  onUpdate?: (employee: Employee) => void;
  className?: string;
}

// 3. Component
export function ComponentName({ employee, onUpdate, className }: ComponentProps) {
  // 4. Hooks (custom hooks first, then React hooks)
  const { updateEmployee } = useEmployees();
  const [isEditing, setIsEditing] = useState(false);
  
  // 5. Effects
  useEffect(() => {
    // effect logic
  }, [dependency]);
  
  // 6. Event handlers
  const handleSubmit = async () => {
    // handler logic
  };
  
  // 7. Render
  return (
    <div className={cn("default-classes", className)}>
      {/* JSX */}
    </div>
  );
}
```

### Custom Hooks
- Place in `/src/hooks/`
- One hook per file
- Return object with named properties for clarity
- Handle loading and error states
- Use React Query for data fetching
```tsx
export function useEmployees() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees,
  });
  
  const updateEmployee = useMutation({
    mutationFn: updateEmployeeFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
  
  return { 
    employees: data ?? [], 
    isLoading, 
    error, 
    updateEmployee 
  };
}
```

### Context Patterns
- Place contexts in `/src/context/`
- Export both context and provider
- Create custom hooks for consuming context
```tsx
// AuthContext.tsx
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // provider logic
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

## File Organization

### Import Order
1. React/Node modules
2. Third-party libraries
3. UI components (`@/components/ui/`)
4. Feature components (`@/components/[feature]/`)
5. Hooks (`@/hooks/`)
6. Services (`@/services/`)
7. Utils (`@/lib/`, `@/utils/`)
8. Types (`@/types/`)
9. Constants (`@/constants/`)

### Component Files
- One component per file
- Export as named export (not default)
- Keep related sub-components in same file if small
- Split into separate files if >100 lines
- Co-locate component-specific types and utils

### Directory Structure
```
components/
├── feature/
│   ├── FeatureComponent.tsx      # Main component
│   ├── FeatureSubComponent.tsx   # Related component
│   ├── types.ts                  # Feature-specific types
│   └── utils.ts                  # Feature-specific utils
```

## Supabase Patterns

### Query Patterns
```tsx
// Use custom hooks for data fetching
const { data, error, isLoading } = useQuery({
  queryKey: ['employees', filters],
  queryFn: async () => {
    const query = supabase
      .from('employees')
      .select(`
        *,
        employee_licenses (*)
      `)
      .order('created_at', { ascending: false });
    
    if (filters.status) {
      query.eq('employment_status', filters.status);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
});
```

### Mutations
```tsx
// Use React Query mutations with optimistic updates
const mutation = useMutation({
  mutationFn: async (employee: EmployeeInsert) => {
    const { data, error } = await supabase
      .from('employees')
      .insert(employee)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  onMutate: async (newEmployee) => {
    // Optimistic update
    await queryClient.cancelQueries({ queryKey: ['employees'] });
    const previousEmployees = queryClient.getQueryData(['employees']);
    queryClient.setQueryData(['employees'], old => [...old, newEmployee]);
    return { previousEmployees };
  },
  onError: (err, newEmployee, context) => {
    queryClient.setQueryData(['employees'], context.previousEmployees);
    toast.error('Failed to add employee');
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['employees'] });
    toast.success('Employee added successfully');
  }
});
```

### Real-time Subscriptions
```tsx
useEffect(() => {
  const channel = supabase
    .channel('employees-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'employees' },
      (payload) => {
        queryClient.invalidateQueries({ queryKey: ['employees'] });
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

## Form Handling

### React Hook Form Pattern
```tsx
// Define schema with Zod
const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'instructor', 'employee']),
});

type FormData = z.infer<typeof formSchema>;

// Use in component
const form = useForm<FormData>({
  resolver: zodResolver(formSchema),
  defaultValues: {
    name: '',
    email: '',
    role: 'employee',
  }
});

// Handle submission
const onSubmit = async (data: FormData) => {
  try {
    await mutation.mutateAsync(data);
    form.reset();
  } catch (error) {
    // Error handled by mutation
  }
};
```

### Form Components
- Use shadcn/ui Form components
- Validate with Zod schemas
- Show field-level errors
- Handle loading states
- Disable form during submission
```tsx
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input {...field} type="email" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <Button type="submit" disabled={form.formState.isSubmitting}>
      {form.formState.isSubmitting ? 'Saving...' : 'Save'}
    </Button>
  </form>
</Form>
```

## UI Components

### shadcn/ui Usage
- Import from `@/components/ui/`
- Don't modify ui components directly
- Extend with className prop
- Use CVA for variants
- Follow accessibility best practices

### Styling
- Use Tailwind CSS classes
- No inline styles except for dynamic values
- Use `cn()` utility for conditional classes
- Follow shadcn/ui patterns for consistency
- Organize complex styles with Tailwind's component classes
```tsx
// Good
<div className={cn(
  "rounded-lg border bg-card p-4",
  isActive && "border-primary",
  className
)}>

// Avoid
<div style={{ padding: '16px', borderRadius: '8px' }}>
```

## Service Layer

### API Services
- Place in `/src/services/`
- Encapsulate external API calls
- Handle authentication and headers
- Return typed responses
```tsx
// services/ai/openAIService.ts
export async function generateCompletion(prompt: string): Promise<string> {
  const response = await fetch('/api/openai/completion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate completion');
  }
  
  const data = await response.json();
  return data.completion;
}
```

## Constants and Configuration

### Constants Organization
```tsx
// constants/training.ts
export const TRAINING_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const MAX_PARTICIPANTS = 20;
export const SESSION_DURATION_MINUTES = 90;
```

### Environment Variables
- Define in `.env` file
- Access via `import.meta.env`
- Prefix with `VITE_` for client-side variables
- Never commit `.env` files
- Document in `.env.example`
```tsx
// config/env.ts
export const config = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY,
} as const;
```

## Error Handling

### API Errors
- Always handle Supabase errors
- Show user-friendly messages with toast
- Log errors to console in development
- Use error boundaries for critical errors
```tsx
try {
  const { data, error } = await supabase.from('employees').select();
  if (error) throw error;
  return data;
} catch (error) {
  console.error('Failed to fetch employees:', error);
  toast.error('Unable to load employees. Please try again.');
  throw error; // Re-throw for React Query to handle
}
```

### Form Validation
- Client-side validation with Zod
- Show inline error messages
- Prevent submission on validation errors
- Handle server validation errors gracefully
- Use form-level error messages for general errors

### Error Boundaries
```tsx
// components/ErrorBoundary.tsx
export function ErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundaryComponent
      fallback={<ErrorFallback />}
      onError={(error) => console.error('Error boundary:', error)}
    >
      {children}
    </ErrorBoundaryComponent>
  );
}
```

## Performance

### Code Splitting
- Lazy load routes
- Split large components
- Use React.memo for expensive components
- Optimize re-renders with proper dependencies
```tsx
const TrainingScheduler = lazy(() => import('./pages/TrainingScheduler'));
```

### Data Fetching
- Use React Query for caching
- Implement proper loading states
- Prefetch data when possible
- Use optimistic updates for better UX
- Implement pagination for large datasets
- Use `select` to limit fields from Supabase

### Optimization Patterns
```tsx
// Memoize expensive calculations
const expiredCertificates = useMemo(
  () => certificates.filter(cert => isExpired(cert.expiryDate)),
  [certificates]
);

// Debounce search inputs
const debouncedSearch = useDeferredValue(searchTerm);

// Virtualize long lists
import { useVirtualizer } from '@tanstack/react-virtual';
```

## Testing Conventions

### Unit Tests
- Place test files next to components
- Use `.test.tsx` extension
- Test user interactions, not implementation
- Mock external dependencies

### Integration Tests
- Test complete user flows
- Use React Testing Library
- Avoid testing implementation details
- Focus on accessibility

## Accessibility

### ARIA Labels
- Add descriptive labels to interactive elements
- Use semantic HTML elements
- Ensure keyboard navigation works
- Test with screen readers

### Focus Management
- Manage focus for modals and dialogs
- Implement skip links
- Use proper heading hierarchy
- Ensure sufficient color contrast

## Documentation

### Component Documentation
```tsx
/**
 * EmployeeCard displays summary information for an employee
 * @param employee - The employee data to display
 * @param onEdit - Callback when edit button is clicked
 * @param className - Additional CSS classes
 */
export function EmployeeCard({ employee, onEdit, className }: EmployeeCardProps) {
  // component implementation
}
```

### Hook Documentation
```tsx
/**
 * useEmployees - Hook for managing employee data
 * @returns {Object} Object containing:
 *   - employees: Array of employee records
 *   - isLoading: Loading state
 *   - error: Error object if any
 *   - updateEmployee: Mutation function for updates
 */
export function useEmployees() {
  // hook implementation
}
```