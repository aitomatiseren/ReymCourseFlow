# Architecture Documentation

## System Overview

The Cursus Nexus Training and Certification Management System is a comprehensive web application designed to manage employee training, certifications, compliance tracking, and professional development. Built with modern web technologies and enhanced with AI-powered assistance, it provides a scalable solution for organizations to track and manage their workforce's educational requirements and certifications.

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
- **React Context API** - Global state management (Auth, Chat, UI preferences)

### Backend & Services
- **Supabase 2.50.3** - Backend as a Service
  - PostgreSQL database with Row Level Security
  - Real-time subscriptions and live updates
  - Authentication and authorization
  - Automatic API generation
- **🆕 OpenAI API Integration** - AI-powered chat assistance and automation
- **🆕 OpenCage Geocoding** - Address validation and city/country lookup
- **🆕 REST Countries API** - Country data with fallback support

### UI Libraries
- **Radix UI** - Unstyled, accessible component primitives
- **Lucide React 0.462.0** - Modern icon library
- **Recharts 2.12.7** - Data visualization and analytics
- **date-fns 3.6.0** - Date manipulation and formatting
- **Sonner 1.5.0** - Toast notifications
- **Embla Carousel 8.3.0** - Touch-friendly carousels

### Development Tools
- **ESLint 9.9.0** - Code linting with TypeScript support
- **PostCSS 8.4.47** - CSS processing and optimization
- **React Router DOM 6.26.2** - Client-side routing
- **Lovable Platform** - Deployment and CI/CD integration

## Component Architecture

### Enhanced Directory Structure
```
src/
├── components/          # Feature-based component organization
│   ├── auth/           # Authentication components
│   ├── admin/          # Administrative functionality
│   ├── certificates/   # Certificate tracking and compliance
│   │   ├── CertificateExpiryDashboard.tsx
│   │   └── Code95Dashboard.tsx
│   ├── chat/           # 🆕 AI-powered assistance system
│   │   ├── Chat.tsx
│   │   ├── ChatBubble.tsx
│   │   ├── ChatPanel.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── ChatSettings.tsx
│   │   └── ChatDebug.tsx
│   ├── courses/        # Course definitions and management
│   │   ├── AddCourseDialog.tsx
│   │   ├── EditCourseDialog.tsx
│   │   └── CourseActions.tsx
│   ├── dashboard/      # Dashboard widgets and analytics
│   │   ├── RecentActivity.tsx
│   │   ├── StatsCard.tsx
│   │   └── UpcomingCourses.tsx
│   ├── employee/       # Employee-specific features
│   │   ├── EmployeeStatusBadge.tsx
│   │   ├── EmployeeStatusManager.tsx
│   │   └── EmployeeSelfService.tsx
│   ├── layout/         # App layout and navigation
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── AppSidebar.tsx
│   │   ├── Header.tsx
│   │   └── SearchDialog.tsx
│   ├── notifications/  # Communication system
│   │   └── NotificationSystem.tsx
│   ├── providers/      # 🆕 Training provider management
│   │   ├── AddProviderDialog.tsx
│   │   └── ProviderProfile.tsx
│   ├── reports/        # 🆕 Enhanced reporting and analytics
│   │   ├── ReportsScreen.tsx
│   │   ├── ComplianceReport.tsx
│   │   ├── CertificateExpiryReport.tsx
│   │   └── TrainingCostReport.tsx
│   ├── training/       # Training scheduling and management
│   │   ├── forms/      # Modular form sections
│   │   │   ├── BasicTrainingInfoSection.tsx
│   │   │   ├── CourseSelectionSection.tsx
│   │   │   ├── SmartMultiSessionSection.tsx
│   │   │   └── ChecklistManagementSection.tsx
│   │   ├── TrainingScheduler.tsx
│   │   ├── TrainingDetailsView.tsx
│   │   ├── TrainingEditor.tsx
│   │   ├── TrainingCalendar.tsx
│   │   ├── TrainingViewToggle.tsx
│   │   └── [Training components]
│   ├── ui/             # shadcn/ui base components
│   └── users/          # User/employee management
│       ├── AddUserDialog.tsx
│       ├── UserProfileTabs.tsx
│       ├── CityCountryLookup.tsx
│       └── EnhancedPhoneInput.tsx
├── config/             # 🆕 Enhanced app configuration
│   └── ai.ts          # AI service configuration
├── constants/          # 🆕 Application constants
│   └── employeeStatus.ts
├── context/            # 🆕 Enhanced React contexts
│   ├── ChatContext.tsx
│   └── PermissionsContext.tsx
├── hooks/              # 🆕 Enhanced custom React hooks
│   ├── useAIChat.ts
│   └── useTrainingChecklist.ts
├── integrations/       # External service integrations
│   └── supabase/       # Database client and types
├── lib/                # Utility libraries
├── pages/              # 🆕 Enhanced route-level components
│   ├── Settings.tsx
│   ├── Providers.tsx
│   ├── CourseProviders.tsx
│   └── ProviderProfile.tsx
├── services/           # 🆕 Complete business logic and external APIs
│   └── ai/             # AI service integration
│       ├── ai-factory.ts
│       ├── ai-service.ts
│       ├── openai-service.ts
│       ├── database-service.ts
│       ├── enhanced-database-service.ts
│       ├── secure-database-service.ts
│       ├── ui-interaction-service.ts
│       ├── knowledge-base.ts
│       ├── tools-definitions.ts
│       ├── chat-storage-service.ts
│       └── debug-openai.ts
├── types/              # TypeScript type definitions
├── utils/              # 🆕 Enhanced utility functions
│   ├── certificateUtils.ts
│   └── code95Utils.ts
└── vite-env.d.ts
```

### 🆕 Enhanced Page Components (`/src/pages/`)
- `Dashboard.tsx` - Enhanced analytics and overview dashboard
- `Courses.tsx` - Course catalog management with provider integration
- `Participants.tsx` - Employee listing and advanced search
- `UserProfile.tsx` - Detailed employee profiles with tabs
- `Certifications.tsx` - Certificate tracking with Code 95 dashboard
- `CertificateExpiry.tsx` - Advanced expiry monitoring
- `TrainingScheduler.tsx` - Training calendar and scheduling
- `EmployeeDashboard.tsx` - Employee self-service portal
- `Notifications.tsx` - Communication center
- **🆕 Settings.tsx** - Application settings and configuration
- **🆕 Providers.tsx** - Training provider management
- **🆕 CourseProviders.tsx** - Course provider relationships
- **🆕 ProviderProfile.tsx** - Detailed provider profiles

### 🆕 AI Chat System (`/components/chat/`)
Complete AI-powered assistance system:
- `Chat.tsx` - Main chat interface component
- `ChatBubble.tsx` - Floating chat interface for contextual help
- `ChatPanel.tsx` - Full-screen chat interface
- `ChatMessage.tsx` - Enhanced message display with actions
- `ChatSettings.tsx` - Configuration and preferences
- `ChatDebug.tsx` - Development and debugging tools

### 🆕 Training Provider Management (`/components/providers/`)
- `AddProviderDialog.tsx` - Comprehensive provider registration
- `ProviderProfile.tsx` - Detailed provider information display
- Provider contact management
- Multiple location support
- Certification tracking

### 🆕 Enhanced Training Management (`/components/training/`)
Advanced training scheduling and management:
- `TrainingDetailsView.tsx` - Complete training information display
- `TrainingViewToggle.tsx` - Seamless view switching
- `TrainingEditor.tsx` - Advanced editing with participant management
- Enhanced form sections with smart scheduling
- Real-time participant status tracking

### 🆕 Certificate & Compliance System (`/components/certificates/`)
- `CertificateExpiryDashboard.tsx` - Advanced expiry tracking
- `Code95Dashboard.tsx` - Complete EU driver compliance system
- Real-time compliance statistics
- Automated training scheduling
- Visual progress indicators

### 🆕 Enhanced Reporting System (`/components/reports/`)
- `ReportsScreen.tsx` - Complete reporting dashboard
- `ComplianceReport.tsx` - Regulatory compliance tracking
- `CertificateExpiryReport.tsx` - Advanced expiry analysis
- `TrainingCostReport.tsx` - Cost analysis and optimization
- Real-time analytics and interactive dashboards

## 🆕 AI Services Architecture

### Service Layer Organization
```
services/ai/
├── ai-factory.ts           # Service factory pattern
├── ai-service.ts           # Main AI service orchestrator
├── openai-service.ts       # OpenAI API integration
├── database-service.ts     # Secure database operations
├── enhanced-database-service.ts  # Advanced database queries
├── secure-database-service.ts    # Security-focused operations
├── ui-interaction-service.ts     # UI automation capabilities
├── knowledge-base.ts       # Comprehensive platform knowledge
├── tools-definitions.ts    # AI tool definitions and schemas
├── chat-storage-service.ts # Conversation persistence
└── debug-openai.ts        # Development and debugging tools
```

### AI Service Capabilities
1. **Contextual Intelligence**: Understands current page and user workflow
2. **Database Integration**: Direct secure database operations
3. **UI Automation**: Can navigate and interact with application
4. **Knowledge Management**: Comprehensive platform knowledge base
5. **Conversation Persistence**: Maintains chat history and context
6. **Security**: Permission-based operations with audit trails

## Data Flow Architecture

### 1. Enhanced State Management
```typescript
// AI Chat Context
const ChatContext = createContext({
  messages: Message[],
  isLoading: boolean,
  sendMessage: (message: string) => void,
  clearHistory: () => void,
  settings: ChatSettings
});

// Employee Status Context
const EmployeeStatusContext = createContext({
  currentStatus: EmployeeStatus,
  statusHistory: StatusHistory[],
  updateStatus: (status: EmployeeStatus) => void
});
```

### 2. Enhanced Query Management
```typescript
// Training with participant status
const { data: trainings } = useQuery({
  queryKey: ['trainings', filters],
  queryFn: async () => {
    const { data } = await supabase
      .from('trainings')
      .select(`
        *,
        courses (*),
        training_participants (
          *,
          employees (*)
        )
      `)
      .eq('status', 'active');
    return data;
  }
});
```

### 3. 🆕 AI-Enhanced Data Operations
```typescript
// AI-powered employee updates
const updateEmployeeByName = async (searchTerm: string, updates: Partial<Employee>) => {
  const employee = await searchEmployees(searchTerm);
  return await updateEmployee(employee.id, updates);
};
```

## 🆕 Enhanced Security Architecture

### 1. Authentication & Authorization
- **Supabase Auth**: Enhanced user management with role-based access
- **JWT-based sessions**: Secure session handling
- **Row Level Security (RLS)**: Database-level permission enforcement
- **AI Service Security**: Permission-based AI operations

### 2. Data Protection
- **HTTPS enforcement**: All communications encrypted
- **Input validation**: Comprehensive data sanitization
- **Audit trails**: Complete operation logging
- **AI Security**: Secure AI operations with user permission inheritance

### 3. 🆕 AI Security Features
- **Permission Inheritance**: AI operations respect user permissions
- **Audit Logging**: All AI operations logged and tracked
- **Input Validation**: AI inputs validated and sanitized
- **Rate Limiting**: AI service usage monitoring and limits

## 🆕 Real-time Features Architecture

### 1. Live Data Synchronization
- **Supabase Real-time**: Live database updates
- **Optimistic Updates**: Immediate UI feedback
- **Conflict Resolution**: Automatic merge strategies
- **Status Synchronization**: Real-time employee status updates

### 2. 🆕 AI-Enhanced Real-time Features
- **Contextual Notifications**: AI-powered smart notifications
- **Live Chat**: Real-time AI assistance
- **Predictive Updates**: AI-driven data predictions
- **Automated Workflows**: AI-triggered background processes

## Component Communication Patterns

### 1. 🆕 Enhanced Props Pattern
```typescript
interface TrainingDetailsProps {
  training: Training;
  participants: EnhancedParticipant[];
  onStatusUpdate: (id: string, status: ParticipantStatus) => void;
  onAIAssist: (context: string) => void;
}
```

### 2. 🆕 Context-based Communication
```typescript
// Enhanced Chat Context
const { sendMessage, aiCapabilities } = useAIChat();

// Training Context with AI
const { 
  training, 
  updateTraining, 
  aiSuggestions 
} = useTrainingWithAI(trainingId);
```

### 3. 🆕 Event-driven Architecture
```typescript
// AI-enhanced event system
const handleEmployeeUpdate = async (updates: EmployeeUpdate) => {
  await updateEmployee(updates);
  await triggerAIAnalysis(updates);
  await notifyRelevantUsers(updates);
};
```

## 🆕 Performance Architecture

### 1. Enhanced Caching Strategy
- **React Query**: Intelligent server state caching
- **AI Response Caching**: Cached AI responses for common queries
- **Static Asset Caching**: CDN-based asset delivery
- **Database Query Optimization**: Indexed queries with performance monitoring

### 2. 🆕 Code Splitting & Lazy Loading
```typescript
// Enhanced lazy loading with AI
const AIChat = lazy(() => import('@/components/chat/Chat'));
const ReportsScreen = lazy(() => import('@/pages/ReportsScreen'));
const Code95Dashboard = lazy(() => import('@/components/certificates/Code95Dashboard'));
```

### 3. 🆕 Performance Monitoring
- **Real-time Performance Metrics**: Application performance tracking
- **AI Response Time Monitoring**: AI service performance analysis
- **Database Query Performance**: Query optimization and monitoring
- **User Experience Metrics**: Enhanced UX tracking

## 🆕 Integration Architecture

### 1. External API Integration
```typescript
// Enhanced API service layer
class IntegrationService {
  async validateAddress(address: string): Promise<AddressValidation> {
    return await this.geocodingService.validate(address);
  }
  
  async getAIResponse(query: string, context: PlatformContext): Promise<AIResponse> {
    return await this.openAIService.chat(query, context);
  }
}
```

### 2. 🆕 AI Service Integration
- **OpenAI GPT Integration**: Advanced language model capabilities
- **Contextual AI**: Platform-aware AI assistance
- **Tool Integration**: AI access to platform functions
- **Knowledge Base**: AI-powered information retrieval

## Deployment Architecture

### 🆕 Enhanced Deployment Strategy
- **Development**: Local Vite dev server (port 5173) with AI integration
- **Production**: Lovable platform deployment with CDN
- **Database**: Supabase hosted PostgreSQL with real-time features
- **AI Services**: OpenAI API integration with fallback strategies
- **Monitoring**: Enhanced error tracking and performance monitoring

## 🆕 Future Architecture Considerations

### 1. Scalability Enhancements
- **Microservices**: Consider breaking AI services into microservices
- **Edge Computing**: AI processing at edge locations
- **Horizontal Scaling**: Auto-scaling based on usage patterns
- **Database Sharding**: Horizontal database scaling strategies

### 2. 🆕 AI Evolution
- **Model Upgrades**: Support for newer AI models
- **Custom Training**: Fine-tuned models for specific use cases
- **Multimodal AI**: Support for images, documents, and voice
- **Autonomous Operations**: AI-driven automated workflows

### 3. 🆕 Enhanced Security
- **Zero-Trust Architecture**: Enhanced security model
- **AI Security**: Advanced AI operation security
- **Compliance**: Enhanced regulatory compliance features
- **Privacy**: Advanced data privacy and protection

### 4. 🆕 Performance Optimization
- **Service Workers**: Enhanced offline capabilities
- **PWA Features**: Progressive Web App functionality
- **Edge Caching**: Advanced caching strategies
- **Real-time Optimization**: Enhanced real-time performance