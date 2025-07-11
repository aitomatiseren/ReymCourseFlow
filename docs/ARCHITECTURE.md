# Architecture Documentation

## System Overview

The Cursus Nexus Training and Certification Management System is a comprehensive web application designed to manage employee training, certifications, compliance tracking, and professional development. Built with modern web technologies, it provides a scalable solution for organizations to track and manage their workforce's educational requirements and certifications.

## Tech Stack

### Frontend
- **React 18.3.1** - Component-based UI framework
- **TypeScript 5.5.3** - Type-safe development
- **Vite 5.4.1** - Lightning-fast build tool with HMR
- **Tailwind CSS 3.4.11** - Utility-first CSS framework
- **shadcn/ui** - High-quality, accessible component library built on Radix UI

### State Management & Data Fetching
- **TanStack React Query 5.56.2** - Server state management with intelligent caching
- **React Hook Form 7.53.0** - Performant form handling
- **Zod 3.23.8** - Schema validation and type inference
- **React Context API** - Global state management (Auth, UI preferences)

### Backend & Services
- **Supabase 2.50.3** - Backend as a Service
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication
  - Row Level Security (RLS)
- **OpenAI API Integration** - AI-powered chat assistance

### UI Libraries
- **Radix UI** - Unstyled, accessible component primitives
- **Lucide React 0.462.0** - Modern icon library
- **Recharts 2.12.7** - Data visualization
- **date-fns 3.6.0** - Date manipulation
- **Sonner 1.5.0** - Toast notifications
- **Embla Carousel 8.3.0** - Touch-friendly carousels

### Development Tools
- **ESLint 9.9.0** - Code linting
- **PostCSS 8.4.47** - CSS processing
- **React Router DOM 6.26.2** - Client-side routing
- **Lovable Platform** - Deployment and CI/CD

## Component Architecture

### Directory Structure
```
src/
├── components/          # Feature-based component organization
│   ├── certificates/    # Certificate tracking and compliance
│   │   ├── CertificateExpiryDashboard.tsx
│   │   └── Code95Dashboard.tsx
│   ├── chat/           # AI-powered assistance
│   │   └── [AI chat components]
│   ├── courses/        # Course definitions and management
│   ├── dashboard/      # Dashboard widgets and analytics
│   ├── employee/       # Employee-specific features
│   ├── layout/         # App layout and navigation
│   ├── notifications/  # Communication system
│   ├── reports/        # Reporting and analytics
│   ├── training/       # Training scheduling and management
│   │   ├── forms/      # Modular form sections
│   │   └── [Training components]
│   ├── ui/             # shadcn/ui base components
│   └── users/          # User/employee management
├── config/             # App configuration
├── constants/          # Application constants
├── context/            # React contexts (Auth, etc.)
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
│   └── supabase/       # Database client and types
├── lib/                # Utility libraries
├── pages/              # Route-level components
├── services/           # Business logic and external APIs
│   └── ai/             # AI service integration
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

### Page Components (`/src/pages/`)
- `Dashboard.tsx` - Analytics and overview dashboard
- `Courses.tsx` - Course catalog management
- `Participants.tsx` - Employee listing and search
- `UserProfile.tsx` - Detailed employee profiles
- `Certifications.tsx` - Certificate tracking
- `CertificateExpiry.tsx` - Expiry monitoring
- `TrainingScheduler.tsx` - Training calendar and scheduling
- `EmployeeDashboard.tsx` - Employee self-service portal
- `Notifications.tsx` - Communication center

### Feature Components

#### Training Management (`/components/training/`)
Core components for scheduling and managing training sessions:
- `TrainingScheduler.tsx` - Main scheduling interface
- `TrainingEditor.tsx` - Create/edit training sessions
- `TrainingDetailsView.tsx` - Detailed training information
- `TrainingDetailsPanel.tsx` - Training summary panel
- `TrainingCalendar.tsx` - Calendar visualization
- `TrainingTimeline.tsx` - Timeline view
- `SessionManager.tsx` - Multi-session handling
- `TrainingGridView.tsx` / `TrainingListView.tsx` - Display modes

Form sections (`/forms/`):
- `BasicTrainingInfoSection.tsx`
- `CourseSelectionSection.tsx`
- `DateTimeSection.tsx`
- `InstructorLocationSection.tsx`
- `MultiSessionSection.tsx`
- `SmartMultiSessionSection.tsx`
- `ChecklistManagementSection.tsx`

#### User & Employee Management (`/components/users/`, `/components/employee/`)
- `UserList.tsx` / `UserListTable.tsx` - Employee directory
- `AddUserDialog.tsx` / `EditEmployeeDialog.tsx` - User CRUD operations
- `UserProfileHeader.tsx` / `UserProfileTabs.tsx` - Profile display
- `EmployeeStatusManager.tsx` - Employment status tracking
- `EmployeeStatusBadge.tsx` - Visual status indicators
- `EmployeeSelfService.tsx` - Employee portal features
- `DutchLicenseManager.tsx` - Dutch driving license management
- `CityCountryLookup.tsx` - Address validation
- `EnhancedPhoneInput.tsx` - International phone input

#### Certificate & Compliance (`/components/certificates/`)
- `CertificateExpiryDashboard.tsx` - Expiry tracking dashboard
- `Code95Dashboard.tsx` - Code 95 compliance tracking

#### Reporting & Analytics (`/components/reports/`)
- `ReportsScreen.tsx` - Report navigation hub
- `ComplianceReport.tsx` - Regulatory compliance tracking
- `CertificateExpiryReport.tsx` - Certificate expiry analysis
- `TrainingCostReport.tsx` - Cost analysis and budgeting

## Data Flow Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   UI Layer  │────▶│ Custom Hooks │────▶│  Supabase   │
│ (Components)│◀────│ (React Query)│◀────│  (Backend)  │
└─────────────┘     └──────────────┘     └─────────────┘
       │                    │                     │
       ▼                    ▼                     ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ Local State │     │Cache Manager │     │ PostgreSQL  │
│  (Context)  │     │(React Query) │     │  Database   │
└─────────────┘     └──────────────┘     └─────────────┘
```

### Data Flow Patterns

1. **Component Rendering**
   - Pages compose feature components
   - Components use custom hooks for data fetching
   - UI updates trigger through React Query mutations

2. **Data Fetching**
   - Custom hooks encapsulate Supabase queries
   - React Query manages caching and synchronization
   - Real-time subscriptions update cache automatically

3. **Form Handling**
   - React Hook Form manages form state
   - Zod schemas validate input
   - Mutations update server state
   - Optimistic updates improve UX

4. **State Management Layers**
   - **Server State**: React Query (TanStack Query)
   - **Form State**: React Hook Form
   - **UI State**: React local state and Context API
   - **Route State**: React Router v6
   - **Auth State**: Supabase Auth + React Context

## Service Architecture

### Core Services

1. **AI Chat Service** (`/src/services/ai/`)
   - OpenAI API integration
   - Context-aware responses
   - Training assistance

2. **Supabase Integration** (`/src/integrations/supabase/`)
   - Database client configuration
   - Type generation from database schema
   - Real-time subscription management

3. **Utility Services** (`/src/utils/`)
   - `certificateUtils.ts` - Certificate validation
   - `code95Utils.ts` - Code 95 calculations
   - General utilities in `/lib/utils.ts`

### Configuration Management

1. **Environment Variables** (`.env`)
   - Supabase credentials
   - OpenAI API keys
   - Feature flags

2. **Constants** (`/src/constants/`)
   - Application-wide constants
   - Enum definitions
   - Configuration values

3. **TypeScript Config**
   - Path aliases (`@/` → `./src/`)
   - Target ES2020
   - Strict mode disabled for flexibility

## Key Architectural Patterns

### 1. Modular Form Architecture
Complex forms are decomposed into section components for better maintainability and reusability. Each section handles its own validation and state while contributing to the parent form.

### 2. Custom Hooks Pattern
Business logic is encapsulated in custom hooks (`/src/hooks/`), promoting code reuse and separation of concerns:
- `useEmployees.ts` - Employee data management
- `useTrainings.ts` - Training operations
- `useCertificates.ts` - Certificate tracking
- `useAIChat.ts` - AI chat functionality
- `useTrainingChecklist.ts` - Checklist management

### 3. Type Safety
- Full TypeScript coverage with generated Supabase types
- Zod schemas for runtime validation
- Type inference from schemas to components

### 4. Real-time Features
- Supabase real-time subscriptions for live updates
- Optimistic updates for immediate UI feedback
- Automatic cache invalidation

### 5. Component Composition
- shadcn/ui provides base components
- Feature components compose base components
- Consistent styling through Tailwind CSS

### 6. Performance Optimizations
- React Query for intelligent caching
- Code splitting via dynamic imports
- Vite's fast HMR for development
- Optimistic updates reduce perceived latency

## Security Architecture

1. **Authentication**
   - Supabase Auth for user management
   - JWT-based session handling
   - Role-based access control

2. **Authorization**
   - Row Level Security (RLS) in PostgreSQL
   - Frontend route guards
   - API-level permissions

3. **Data Protection**
   - HTTPS enforcement
   - Secure credential storage
   - Input validation and sanitization

## Deployment Architecture

- **Development**: Local Vite dev server (port 8080)
- **Production**: Lovable platform deployment
- **Database**: Supabase hosted PostgreSQL
- **CDN**: Static assets served via Lovable CDN
- **CI/CD**: Automated via Lovable platform

## Future Considerations

1. **Scalability**
   - Consider implementing Redis for caching
   - Evaluate need for microservices
   - Plan for horizontal scaling

2. **Performance**
   - Implement virtual scrolling for large lists
   - Consider server-side rendering for SEO
   - Optimize bundle size with lazy loading

3. **Features**
   - Offline capability with service workers
   - Mobile app development
   - Advanced analytics and ML integration