# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (port 8080)
npm run dev

# Build for production
npm run build

# Build for development
npm run build:dev

# Run linter
npm run lint

# Preview production build
npm run preview
```

## High-Level Architecture

This is a **Training and Certification Management System** built with React, TypeScript, and Supabase.

### Tech Stack
- **Frontend**: React 18 with TypeScript, Vite as build tool
- **UI Components**: shadcn/ui components with Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router v6
- **Backend**: Supabase (PostgreSQL database with real-time subscriptions)
- **Forms**: React Hook Form with Zod validation

### Key Architecture Patterns

1. **Component Organization**:
   - `/components/ui/` - Reusable shadcn/ui components
   - `/components/[feature]/` - Feature-specific components (training, users, certificates, etc.)
   - `/pages/` - Route-level components
   - `/hooks/` - Custom React hooks for data fetching and business logic

2. **Database Structure** (Supabase):
   - `employees` - Employee records with personal/employment details
   - `courses` - Training course definitions
   - `course_sessions` - Individual sessions within courses
   - `trainings` - Scheduled training instances
   - `training_participants` - Employee enrollments in trainings
   - `employee_licenses` - Employee certifications and licenses
   - Full schema defined in `/src/integrations/supabase/types.ts`

3. **Core Features**:
   - **Employee Management**: Track employees, their status, licenses, and certifications
   - **Course Management**: Define courses with multi-session support and checklists
   - **Training Scheduling**: Schedule trainings with participants, instructors, and locations
   - **Certificate Tracking**: Monitor certificate expiry and compliance
   - **Reporting**: Compliance, cost analysis, and certificate expiry reports

4. **Form Handling Pattern**:
   - Complex forms use React Hook Form with Zod schemas
   - Form sections are modularized in `/components/training/forms/`
   - Custom hooks like `useTrainingForm` manage form state

5. **Data Fetching Pattern**:
   - React Query for server state management
   - Custom hooks in `/hooks/` encapsulate Supabase queries
   - Real-time subscriptions for live updates

### Important Development Notes

- The project uses path aliases: `@/` maps to `/src/`
- ESLint is configured but `@typescript-eslint/no-unused-vars` is disabled
- Development server runs on port 8080 with IPv6 support
- Uses Lovable platform for deployment (project ID: 77e93892-a682-4834-9c6f-af34d316c993)

## Documentation Reference

When working on specific areas of the codebase, refer to these documentation files:

- **`/docs/ARCHITECTURE.md`** - System design, component structure, data flow patterns
- **`/docs/CONVENTIONS.md`** - Coding standards, naming conventions, React/TypeScript patterns
- **`/docs/DATABASE.md`** - Complete database schema, table relationships, field descriptions
- **`/docs/FEATURES.md`** - Feature documentation with component locations and functionality
- **`/docs/API.md`** - Supabase query patterns, React Query integration, real-time subscriptions

### Quick Reference for Common Tasks

#### Working on Employee Features
- Check `/docs/FEATURES.md` → "Employee Management" section
- Components: `/src/components/users/` and `/src/components/employee/`
- Hooks: `/src/hooks/useEmployees.ts`
- Database: See `employees` table in `/docs/DATABASE.md`

#### Working on Training/Scheduling
- Check `/docs/FEATURES.md` → "Training Scheduling" section
- Components: `/src/components/training/`
- Forms: `/src/components/training/forms/`
- Hooks: `/src/hooks/useTrainings.ts`, `/src/hooks/useTrainingForm.ts`
- Database: See `trainings`, `training_participants` tables in `/docs/DATABASE.md`

#### Working on Certificates
- Check `/docs/FEATURES.md` → "Certificate Management" section
- Components: `/src/components/certificates/`
- Hooks: `/src/hooks/useCertificates.ts`
- Database: See `employee_licenses` table in `/docs/DATABASE.md`

#### Adding New Features
1. Review `/docs/CONVENTIONS.md` for coding standards
2. Check `/docs/ARCHITECTURE.md` for component patterns
3. Reference `/docs/API.md` for data fetching patterns
4. Update relevant documentation after implementation