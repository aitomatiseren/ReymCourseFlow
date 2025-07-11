# API & Integration Patterns

## Supabase Client Configuration

### Client Setup (`/src/integrations/supabase/client.ts`)
```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

### Type Generation
Generated types are automatically synced from the database schema:
```typescript
// Auto-generated from Supabase
export type Employee = Database['public']['Tables']['employees']['Row']
export type EmployeeInsert = Database['public']['Tables']['employees']['Insert']
export type EmployeeUpdate = Database['public']['Tables']['employees']['Update']
```

## Common Supabase Query Patterns

### Fetching Data

#### Basic Query
```typescript
const { data, error } = await supabase
  .from('employees')
  .select('*')
  .order('name');
```

#### With Relations
```typescript
const { data, error } = await supabase
  .from('trainings')
  .select(`
    *,
    course:courses(*),
    instructor:employees!instructor_id(*),
    training_participants(
      *,
      employee:employees(*)
    )
  `)
  .eq('id', trainingId);
```

#### Complex Relations with Dutch Name Support
```typescript
const { data, error } = await supabase
  .from('employees')
  .select(`
    id,
    name,
    first_name,
    last_name,
    tussenvoegsel,
    roepnaam,
    email,
    employee_number,
    status,
    employee_licenses(*),
    training_participants(
      *,
      training:trainings(
        *,
        course:courses(*)
      )
    )
  `)
  .eq('id', employeeId);
```

#### With Filters
```typescript
const { data, error } = await supabase
  .from('employee_licenses')
  .select('*')
  .eq('employee_id', employeeId)
  .gte('expiry_date', new Date().toISOString())
  .order('expiry_date');
```

#### Code 95 Compliance Query
```typescript
const { data, error } = await supabase
  .from('employees')
  .select(`
    id,
    name,
    first_name,
    last_name,
    tussenvoegsel,
    driving_license_code95,
    driving_license_code95_expiry_date,
    employee_licenses!inner(
      license_type,
      expiry_date,
      status
    )
  `)
  .eq('employee_licenses.license_type', 'Code 95')
  .eq('status', 'active');
```

### Mutations

#### Insert with Dutch Name Fields
```typescript
const { data, error } = await supabase
  .from('employees')
  .insert({
    name: 'Jan van der Berg',
    first_name: 'Jan',
    last_name: 'Berg',
    tussenvoegsel: 'van der',
    roepnaam: 'Jantje',
    email: 'jan@example.com',
    status: 'active'
  })
  .select()
  .single();
```

#### Update with Audit Trail
```typescript
const { data, error } = await supabase
  .from('trainings')
  .update({ 
    status: 'completed',
    updated_at: new Date().toISOString()
  })
  .eq('id', trainingId)
  .select()
  .single();
```

#### Batch Insert Training Participants
```typescript
const { data, error } = await supabase
  .from('training_participants')
  .insert(
    selectedEmployees.map(employeeId => ({
      training_id: trainingId,
      employee_id: employeeId,
      status: 'enrolled',
      enrollment_date: new Date().toISOString()
    }))
  )
  .select();
```

#### Upsert Course Checklist
```typescript
const { data, error } = await supabase
  .from('courses')
  .upsert({
    id: courseId,
    checklist_items: checklistItems,
    has_checklist: checklistItems.length > 0,
    updated_at: new Date().toISOString()
  })
  .select()
  .single();
```

## React Query Integration

### Query Hook Pattern
```typescript
export function useEmployees(filters?: EmployeeFilters) {
  return useQuery({
    queryKey: ['employees', filters],
    queryFn: async () => {
      let query = supabase
        .from('employees')
        .select(`
          *,
          employee_licenses(*)
        `)
        .order('name');
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.department) {
        query = query.eq('department', filters.department);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
```

### Mutation Hook with Optimistic Updates
```typescript
export function useCreateEmployee() {
  const queryClient = useQueryClient();
  
  return useMutation({
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
      
      queryClient.setQueryData(['employees'], (old: Employee[] = []) => [
        ...old,
        { ...newEmployee, id: 'temp-id' }
      ]);
      
      return { previousEmployees };
    },
    onError: (err, newEmployee, context) => {
      // Rollback on error
      queryClient.setQueryData(['employees'], context?.previousEmployees);
      toast.error('Failed to create employee');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee created successfully');
    },
  });
}
```

### Complex Mutation with Multiple Tables
```typescript
export function useCreateTrainingWithParticipants() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ training, participantIds }: CreateTrainingWithParticipantsParams) => {
      // Use transaction-like approach
      const { data: trainingData, error: trainingError } = await supabase
        .from('trainings')
        .insert(training)
        .select()
        .single();
      
      if (trainingError) throw trainingError;
      
      if (participantIds.length > 0) {
        const { error: participantsError } = await supabase
          .from('training_participants')
          .insert(
            participantIds.map(employeeId => ({
              training_id: trainingData.id,
              employee_id: employeeId,
              status: 'enrolled'
            }))
          );
        
        if (participantsError) throw participantsError;
      }
      
      return trainingData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      queryClient.invalidateQueries({ queryKey: ['training-participants'] });
    }
  });
}
```

## External API Integration

### 🆕 OpenAI API Integration (`/src/services/ai/`)

#### Service Configuration
```typescript
// services/ai/openai-service.ts
export class OpenAIService {
  private client: OpenAI;
  
  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  }
  
  async generateCompletion(prompt: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.7,
    });
    
    return response.choices[0]?.message?.content || '';
  }
}
```

#### Usage in Hooks
```typescript
export function useAIChat() {
  const mutation = useMutation({
    mutationFn: async (message: string) => {
      const aiService = AIFactory.create();
      return await aiService.generateResponse(message);
    },
    onError: (error) => {
      console.error('AI chat error:', error);
      toast.error('Failed to get AI response');
    }
  });
  
  return {
    sendMessage: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error
  };
}
```

### 🆕 Geocoding API Integration

#### City/Country Lookup
```typescript
// utils/geocoding.ts
export async function lookupCityCountry(query: string) {
  try {
    // Primary: OpenCage API
    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${API_KEY}&limit=5`
    );
    
    if (!response.ok) throw new Error('Geocoding failed');
    
    const data = await response.json();
    return data.results.map(formatLocationResult);
  } catch (error) {
    // Fallback: REST Countries API
    return await fallbackCountryLookup(query);
  }
}
```

#### Usage in Components
```typescript
export function CityCountryLookup({ onSelect }: CityCountryLookupProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  
  const debouncedQuery = useDeferredValue(query);
  
  const { data, isLoading } = useQuery({
    queryKey: ['geocoding', debouncedQuery],
    queryFn: () => lookupCityCountry(debouncedQuery),
    enabled: debouncedQuery.length > 2,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
  
  // Component implementation
}
```

## Real-time Subscriptions

### Basic Subscription
```typescript
useEffect(() => {
  const channel = supabase
    .channel('trainings-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'trainings'
      },
      (payload) => {
        queryClient.invalidateQueries({ queryKey: ['trainings'] });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [queryClient]);
```

### Filtered Subscription for User-Specific Data
```typescript
const channel = supabase
  .channel('employee-trainings')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'training_participants',
      filter: `employee_id=eq.${employeeId}`
    },
    (payload) => {
      // Update specific employee's training data
      queryClient.invalidateQueries({ 
        queryKey: ['employee-trainings', employeeId] 
      });
    }
  )
  .subscribe();
```

### Real-time Chat Messages
```typescript
export function useChatSubscription(conversationId: string) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          // Add new message optimistically
          queryClient.setQueryData(
            ['chat-messages', conversationId],
            (old: ChatMessage[] = []) => [...old, payload.new as ChatMessage]
          );
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [conversationId, queryClient]);
}
```

## Error Handling

### Standard Error Pattern
```typescript
try {
  const { data, error } = await supabase
    .from('employees')
    .select('*');
  
  if (error) throw error;
  return data;
} catch (error) {
  console.error('Database error:', error);
  toast.error('Failed to fetch employees');
  throw error; // Re-throw for React Query to handle
}
```

### Detailed Error Handling
```typescript
if (error) {
  switch (error.code) {
    case '23505': // Unique constraint violation
      toast.error('This email is already registered');
      break;
    case '23503': // Foreign key constraint violation
      toast.error('Invalid reference to related record');
      break;
    case '42P01': // Table does not exist
      toast.error('System error: Invalid table reference');
      break;
    case 'PGRST116': // No rows returned
      toast.error('Record not found');
      break;
    default:
      toast.error(error.message || 'An unexpected database error occurred');
  }
  throw error;
}
```

### Network Error Handling
```typescript
export function handleNetworkError(error: unknown) {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    toast.error('Network error: Please check your connection');
    return;
  }
  
  if (error instanceof Error) {
    if (error.message.includes('rate limit')) {
      toast.error('Too many requests. Please wait a moment.');
      return;
    }
    
    if (error.message.includes('timeout')) {
      toast.error('Request timed out. Please try again.');
      return;
    }
  }
  
  toast.error('An unexpected error occurred');
}
```

## Common Patterns

### Pagination with Cursor
```typescript
export function useEmployeesPaginated(pageSize = 10) {
  const [cursor, setCursor] = useState<string | null>(null);
  
  return useInfiniteQuery({
    queryKey: ['employees-paginated'],
    queryFn: async ({ pageParam = null }) => {
      let query = supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(pageSize);
      
      if (pageParam) {
        query = query.lt('created_at', pageParam);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      return {
        data,
        nextCursor: data.length === pageSize ? data[data.length - 1].created_at : null
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
```

### Search with Debouncing
```typescript
export function useEmployeeSearch(searchTerm: string) {
  const debouncedSearchTerm = useDeferredValue(searchTerm);
  
  return useQuery({
    queryKey: ['employees-search', debouncedSearchTerm],
    queryFn: async () => {
      if (!debouncedSearchTerm) return [];
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .or([
          `name.ilike.%${debouncedSearchTerm}%`,
          `email.ilike.%${debouncedSearchTerm}%`,
          `employee_number.ilike.%${debouncedSearchTerm}%`,
          `first_name.ilike.%${debouncedSearchTerm}%`,
          `last_name.ilike.%${debouncedSearchTerm}%`
        ].join(','))
        .order('name')
        .limit(20);
      
      if (error) throw error;
      return data;
    },
    enabled: debouncedSearchTerm.length > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
```

### Complex Aggregation Queries
```typescript
export function useTrainingStatistics() {
  return useQuery({
    queryKey: ['training-statistics'],
    queryFn: async () => {
      // Get training counts by status
      const { data: statusCounts, error: statusError } = await supabase
        .from('trainings')
        .select('status')
        .not('status', 'eq', 'cancelled');
      
      if (statusError) throw statusError;
      
      // Get completion rates by department
      const { data: completionData, error: completionError } = await supabase
        .rpc('get_training_completion_by_department');
      
      if (completionError) throw completionError;
      
      return {
        statusCounts: groupBy(statusCounts, 'status'),
        completionRates: completionData
      };
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
```

## Performance Optimization

### 1. Select Only Needed Fields
```typescript
// Good - specific fields
.select('id, name, email, status')

// Avoid - unnecessary data transfer
.select('*')
```

### 2. Use Proper Indexing
```typescript
// Ensure filters use indexed columns
.eq('status', 'active')      // status should be indexed
.gte('created_at', startDate) // created_at should be indexed
```

### 3. Limit Nested Queries
```typescript
// Good - single level
.select(`
  *,
  course:courses(id, title, category)
`)

// Avoid - deep nesting impacts performance
.select(`
  *,
  course:courses(
    *,
    sessions:course_sessions(*)
  )
`)
```

### 4. Smart Count Usage
```typescript
// Only when pagination controls are needed
.select('*', { count: 'exact' })

// Prefer estimated for large datasets
.select('*', { count: 'estimated' })

// Skip count when not needed
.select('*')
```

### 5. Cache Strategy
```typescript
// Frequent data - longer cache
staleTime: 1000 * 60 * 10, // 10 minutes

// User-specific data - shorter cache
staleTime: 1000 * 60 * 2,  // 2 minutes

// Real-time data - minimal cache
staleTime: 1000 * 30,      // 30 seconds
```

## Environment Configuration

### Required Environment Variables
```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# OpenAI (for AI chat)
VITE_OPENAI_API_KEY=sk-your-openai-key

# Geocoding (for address lookup)
VITE_OPENCAGE_API_KEY=your-opencage-key
```

### Configuration Validation
```typescript
// config/env.ts
const requiredEnvVars = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
} as const;

// Validate required variables
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

export const config = {
  supabase: {
    url: requiredEnvVars.VITE_SUPABASE_URL,
    anonKey: requiredEnvVars.VITE_SUPABASE_ANON_KEY,
  },
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  },
  geocoding: {
    apiKey: import.meta.env.VITE_OPENCAGE_API_KEY,
  },
} as const;
```

## Testing API Integration

### Mock Supabase for Tests
```typescript
// tests/mocks/supabase.ts
export const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
  })),
};
```

### Test React Query Hooks
```typescript
// tests/hooks/useEmployees.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEmployees } from '../hooks/useEmployees';

test('should fetch employees successfully', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  
  const { result } = renderHook(() => useEmployees(), { wrapper });
  
  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });
  
  expect(result.current.data).toEqual(mockEmployees);
});
```