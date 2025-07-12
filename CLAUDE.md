# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (port 5173)
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

This is a **Training and Certification Management System** built with React, TypeScript, and Supabase, enhanced with AI-powered assistance and comprehensive provider management.

### Tech Stack
- **Frontend**: React 18 with TypeScript, Vite as build tool
- **UI Components**: shadcn/ui components with Tailwind CSS
- **State Management**: React Query (TanStack Query) with enhanced context management
- **Routing**: React Router v6
- **Backend**: Supabase (PostgreSQL database with real-time subscriptions)
- **AI Integration**: OpenAI API with contextual assistance
- **Forms**: React Hook Form with Zod validation
- **External APIs**: OpenCage Geocoding, REST Countries API

### Key Architecture Patterns

1. **Enhanced Component Organization**:
   - `/components/ui/` - Reusable shadcn/ui components
   - `/components/[feature]/` - Feature-specific components (training, users, certificates, providers, chat, etc.)
   - `/pages/` - Route-level components with new pages (Settings, Providers, etc.)
   - `/hooks/` - Custom React hooks for data fetching and business logic
   - `/services/ai/` - Complete AI service integration layer

2. **Database Structure** (Supabase):
   - `employees` - Employee records with Dutch-specific fields and status history
   - `courses` - Training course definitions with provider integration
   - `course_sessions` - Individual sessions within courses
   - `trainings` - Scheduled training instances with enhanced participant management
   - `training_participants` - Employee enrollments with real-time status tracking
   - `employee_licenses` - Employee certifications and licenses with Code 95 integration
   - `employee_status_history` - Complete employee status tracking with audit trails
   - `training_providers` - Training provider management system
   - Full schema defined in `/src/integrations/supabase/types.ts`

3. **Core Features**:
   - **Employee Management**: Enhanced employee tracking with Dutch name components and real-time status management
   - **Course Management**: Course definitions with provider integration and cost component breakdown
   - **Training Scheduling**: Advanced training scheduler with multiple view modes and AI assistance
   - **Certificate Tracking**: Comprehensive certificate management with Code 95 compliance dashboard
   - **Provider Management**: Complete training provider directory and relationship management
   - **AI Chat Assistant**: Contextual AI assistance with database integration and UI automation
   - **Enhanced Reporting**: Real-time analytics with interactive dashboards and export capabilities

4. **🆕 AI Integration Pattern**:
   - AI services in `/src/services/ai/` with factory pattern
   - Context-aware AI assistance throughout the application
   - Direct database operations with security and audit trails
   - Real-time conversation management with persistence
   - UI automation capabilities for enhanced user experience

5. **🆕 Enhanced Form Handling Pattern**:
   - Complex forms use React Hook Form with Zod schemas
   - Form sections are modularized in `/components/training/forms/`
   - Smart multi-session scheduling with AI recommendations
   - Real-time validation with user feedback
   - Custom hooks like `useTrainingForm` and `useTrainingChecklist` manage form state

6. **🆕 Advanced Data Fetching Pattern**:
   - React Query for server state management with enhanced caching
   - Custom hooks in `/hooks/` encapsulate Supabase queries
   - Real-time subscriptions for live updates
   - AI-enhanced data operations with contextual intelligence
   - Optimistic updates for immediate UI feedback

### Important Development Notes

- The project uses path aliases: `@/` maps to `/src/`
- ESLint is configured but `@typescript-eslint/no-unused-vars` is disabled
- **Development server runs on port 5173** (changed from 8080)
- Uses Lovable platform for deployment (project ID: 77e93892-a682-4834-9c6f-af34d316c993)
- **🆕 AI Integration**: OpenAI API integration with contextual assistance
- **🆕 Enhanced Security**: Row Level Security with AI permission inheritance
- **🆕 Real-time Features**: Live status updates and collaborative editing

## Documentation Reference

When working on specific areas of the codebase, refer to these documentation files:

- **`/docs/ARCHITECTURE.md`** - Enhanced system design, AI integration, component structure, data flow patterns
- **`/docs/CONVENTIONS.md`** - Coding standards, naming conventions, React/TypeScript patterns
- **`/docs/DATABASE.md`** - Complete database schema, table relationships, field descriptions
- **`/docs/FEATURES.md`** - Comprehensive feature documentation with component locations and functionality
- **`/docs/API.md`** - Supabase query patterns, React Query integration, real-time subscriptions

### Quick Reference for Common Tasks

#### Working on Employee Features
- Check `/docs/FEATURES.md` → "Employee Management" section
- Components: `/src/components/users/` and `/src/components/employee/`
- Hooks: `/src/hooks/useEmployees.ts`
- Database: See `employees` table and `employee_status_history` in `/docs/DATABASE.md`
- **🆕 AI Integration**: Employee data operations with AI assistance

#### Working on Training/Scheduling
- Check `/docs/FEATURES.md` → "Training Scheduling" section
- Components: `/src/components/training/`
- Forms: `/src/components/training/forms/`
- Hooks: `/src/hooks/useTrainings.ts`, `/src/hooks/useTrainingForm.ts`, `/src/hooks/useTrainingChecklist.ts`
- Database: See `trainings`, `training_participants` tables in `/docs/DATABASE.md`
- **🆕 AI Features**: Smart scheduling suggestions and participant management

#### Working on Certificates
- Check `/docs/FEATURES.md` → "Certificate Management" section
- Components: `/src/components/certificates/`
- Hooks: `/src/hooks/useCertificates.ts`
- Database: See `employee_licenses` table in `/docs/DATABASE.md`
- **🆕 Code 95 Integration**: Complete EU driver compliance system

#### Working on Provider Management
- Check `/docs/FEATURES.md` → "Training Provider Management" section
- Components: `/src/components/providers/`
- Pages: `/src/pages/Providers.tsx`, `/src/pages/ProviderProfile.tsx`
- Database: See `training_providers` table in `/docs/DATABASE.md`
- **🆕 Features**: Provider directory, contact management, certification tracking

#### Working on AI Chat System
- Check `/docs/FEATURES.md` → "AI Chat Assistant" section
- Components: `/src/components/chat/`
- Services: `/src/services/ai/`
- Hooks: `/src/hooks/useAIChat.ts`
- Context: `/src/context/ChatContext.tsx`
- **🆕 Capabilities**: Contextual intelligence, database integration, UI automation

#### Working on Reports
- Check `/docs/FEATURES.md` → "Reporting System" section
- Components: `/src/components/reports/`
- Pages: `/src/pages/ReportsScreen.tsx`
- **🆕 Features**: Real-time analytics, interactive dashboards, export capabilities

#### Working on Settings & Configuration
- Check `/docs/FEATURES.md` → "Application Settings & Configuration" section
- Pages: `/src/pages/Settings.tsx`
- Config: `/src/config/ai.ts`
- Constants: `/src/constants/employeeStatus.ts`
- **🆕 Features**: System-wide configuration, user preferences, feature toggles

#### Adding New Features
1. Review `/docs/CONVENTIONS.md` for coding standards
2. Check `/docs/ARCHITECTURE.md` for component patterns and AI integration
3. Reference `/docs/API.md` for data fetching patterns
4. Consider AI integration opportunities for enhanced user experience
5. Update relevant documentation after implementation

## 🆕 AI Integration Guidelines

When working with AI features:

### AI Service Usage
- Use `/src/services/ai/ai-factory.ts` for service instantiation
- Implement contextual intelligence with platform awareness
- Ensure proper error handling and fallback strategies
- Maintain conversation context and history

### Security Considerations
- All AI operations inherit user permissions
- Implement proper input validation and sanitization
- Maintain audit trails for all AI interactions
- Use secure database operations with Row Level Security

### Performance Optimization
- Cache AI responses for common queries
- Implement streaming for long-running operations
- Use background processing for intensive AI tasks
- Monitor AI service performance and usage

## 🆕 Enhanced Development Patterns

### Real-time Features
- Use Supabase real-time subscriptions for live updates
- Implement optimistic updates for immediate feedback
- Handle conflict resolution for concurrent edits
- Maintain synchronization across multiple users

### Status Management
- Use `employee_status_history` for complete audit trails
- Implement automatic status transitions
- Provide real-time status indicators
- Handle overlapping status periods

### Multi-session Training
- Use smart scheduling algorithms for session planning
- Implement session dependency management
- Handle complex recurring patterns
- Provide AI-powered scheduling suggestions

### Code 95 Compliance
- Use `/src/utils/code95Utils.ts` for compliance calculations
- Implement automated compliance checking
- Provide training point tracking and validation
- Generate compliance reports and forecasts

## 🆕 Component Enhancement Guidelines

### Form Components
- Use modular form sections for complex forms
- Implement real-time validation with user feedback
- Provide AI-powered form assistance
- Handle multi-step form workflows

### List/Grid Components
- Implement advanced filtering and sorting
- Use virtual scrolling for large datasets
- Provide multiple view modes (list, grid, calendar)
- Include AI-powered search and recommendations

### Dashboard Components
- Use real-time data for live statistics
- Implement interactive charts and visualizations
- Provide drill-down capabilities
- Include AI-generated insights and recommendations

## 🆕 Testing & Quality Assurance

### Testing Strategy
- Unit tests for utility functions and hooks
- Integration tests for complex workflows
- End-to-end tests for critical user journeys
- AI service testing with mock responses

### Code Quality
- Use TypeScript for type safety
- Implement comprehensive error handling
- Follow accessibility guidelines
- Maintain consistent code formatting

### Performance Monitoring
- Track AI service response times
- Monitor database query performance
- Implement user experience metrics
- Use performance budgets for bundle sizes

## 🆕 Deployment & Maintenance

### Environment Configuration
- Configure AI service API keys securely
- Set up proper environment variables
- Implement feature flags for gradual rollouts
- Monitor service health and availability

### Maintenance Tasks
- Regular AI model updates and testing
- Database performance optimization
- Security audit and compliance checks
- User feedback collection and analysis

This enhanced system provides a comprehensive platform for training and certification management with AI-powered assistance, real-time collaboration, and advanced compliance tracking.