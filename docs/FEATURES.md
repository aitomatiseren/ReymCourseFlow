# Feature Documentation

## Employee Management

### Employee Records (`/src/components/users/`)
- **List View**: `UserList.tsx`, `UserListTable.tsx`
- **Profile View**: `UserProfile.tsx` (route: `/participants/:id`)
- **Profile Display**: `UserProfileHeader.tsx`, `UserProfileTabs.tsx`
- **CRUD Operations**: 
  - Add: `AddUserDialog.tsx` - Enhanced with Dutch name components
  - Edit: `EditEmployeeDialog.tsx`
- **Special Features**:
  - Dutch license management: `DutchLicenseManager.tsx`
  - Address validation: `AddressLookup.tsx`
  - **City/Country Lookup**: `CityCountryLookup.tsx` - Smart address input with geocoding
  - Phone validation: `PhoneInput.tsx`, `EnhancedPhoneInput.tsx`
  - Nationality selection: `NationalitySelect.tsx`

### Employee Status Management (`/src/components/employee/`)
- **Status Badge**: `EmployeeStatusBadge.tsx` - Visual status indicators
- **Status Manager**: `EmployeeStatusManager.tsx` - Enhanced with real-time status tracking
- **Self-Service**: `EmployeeSelfService.tsx` - Complete employee portal with Code 95 progress
- **🆕 Enhanced Features**:
  - Real-time status history tracking
  - Automatic status transitions
  - Comprehensive status validation
  - Audit trail for all status changes

### Dutch-Specific Features
- **Name Components**: Enhanced support for `tussenvoegsel`, `roepnaam`, first/last name separation
- **BSN Management**: Dutch social security number tracking
- **Comprehensive Driving Licenses**: Categories A, B, BE, C, CE, D, Code 95
- **Identity Verification (KVM)**: ID document management
- **🆕 Auto-generated Full Names**: Intelligent name generation from Dutch components

## Course Management

### Course Administration (`/src/components/courses/`)
- **Course List**: `/courses` route with enhanced grid/list views
- **Course CRUD**:
  - Add: `AddCourseDialog.tsx` - Enhanced with cost components and advanced features
  - Edit: `EditCourseDialog.tsx`
  - Actions: `CourseActions.tsx`
- **🆕 Enhanced Features**:
  - Cost component breakdown
  - Advanced checklist management
  - Multi-session course support
  - Code 95 integration
  - Pricing configuration with components

## Training Provider Management

### 🆕 Provider System (`/src/components/providers/`)
- **Provider Directory**: `/providers` route - Complete provider management
- **Provider CRUD**:
  - Add: `AddProviderDialog.tsx` - Comprehensive provider registration
  - Profile: `ProviderProfile.tsx` - Detailed provider information
- **Features**:
  - Multiple location support
  - Contact management
  - Certification tracking
  - Course offering management
  - Address validation and geocoding
  - Website and contact validation

## Training Scheduling

### Training Scheduler (`/src/components/training/`)
- **Main Interface**: `TrainingScheduler.tsx` (route: `/scheduling`)
- **Header**: `TrainingSchedulerHeader.tsx` - Enhanced controls and actions
- **Views**:
  - Calendar: `TrainingCalendar.tsx`
  - Grid: `TrainingGridView.tsx`
  - List: `TrainingListView.tsx`
  - Timeline: `TrainingTimeline.tsx`
- **🆕 View Toggle**: `TrainingViewToggle.tsx` - Seamless view switching

### Training Management
- **Create Training**: `CreateTrainingDialog.tsx` - Enhanced with smart scheduling
- **Edit Training**: `EditTrainingDialog.tsx` - Comprehensive editing interface
- **Training Editor**: `TrainingEditor.tsx` - Advanced editing with participant management
- **Details View**: `TrainingDetailsView.tsx` - Complete training information display
- **🆕 Enhanced Features**:
  - Real-time participant status tracking
  - Integrated checklist management
  - Advanced participant filtering
  - Code 95 progress tracking
  - Automated attendance management

### Session Management
- **Session Manager**: `SessionManager.tsx` - Enhanced multi-session configuration
- **Session Tabs**: `SessionTabs.tsx` - Improved navigation between sessions
- **Session Types**:
  - Single session
  - Weekly recurring
  - Custom schedule
  - Smart multi-session planning

### Training Forms (`/src/components/training/forms/`)
Enhanced modular form sections:
- `BasicTrainingInfoSection.tsx` - Title, description
- `CourseSelectionSection.tsx` - Enhanced course selection
- `DateTimeSection.tsx` - Smart schedule configuration
- `InstructorLocationSection.tsx` - Instructor and venue management
- `SmartMultiSessionSection.tsx` - Intelligent multi-session scheduling
- `ChecklistManagementSection.tsx` - Dynamic checklist configuration
- `TrainingSettingsSection.tsx` - Advanced training settings
- `EditSingleSessionSection.tsx` - Enhanced single session editing
- `EditMultiSessionSection.tsx` - Advanced multi-session editing

### Participant Management
- **Add Participants**: `AddParticipantDialog.tsx` - Enhanced with status filtering
- **Participant List**: `/participants` route
- **🆕 Enhanced Features**:
  - Real-time status indicators
  - Code 95 eligibility checking
  - Bulk participant actions
  - Status-based filtering
  - Enrollment validation

## Certificate Management

### Certificate Tracking (`/src/components/certificates/`)
- **Expiry Dashboard**: `CertificateExpiryDashboard.tsx`
- **🆕 Code 95 Dashboard**: `Code95Dashboard.tsx` - Comprehensive EU driver compliance
  - Real-time compliance statistics
  - Employee status filtering (expired, expiring, compliant)
  - Training points tracking and validation
  - Automated training scheduling
  - Visual progress indicators and charts
  - Compliance forecasting
- **Certificate Expiry Page**: `/certificate-expiry` route
- **Certificate List**: `/certifications` route
- **🆕 Enhanced Features**:
  - Advanced expiry prediction
  - Automated renewal workflows
  - Compliance reporting
  - Code 95 point calculations

## AI Chat Assistant

### 🆕 Complete AI Chat System (`/src/components/chat/`)
Advanced AI-powered assistance integrated throughout the application:
- **Chat Interface**: `Chat.tsx` - Main chat component
- **Chat Bubble**: `ChatBubble.tsx` - Floating chat interface
- **Chat Panel**: `ChatPanel.tsx` - Full-screen chat interface
- **Chat Messages**: `ChatMessage.tsx` - Enhanced message display
- **Chat Settings**: `ChatSettings.tsx` - Configuration and preferences
- **Chat Debug**: `ChatDebug.tsx` - Development and debugging tools

### 🆕 Advanced AI Features
- **Contextual Intelligence**: Understands current page and user workflow
- **UI Automation**: Can navigate, interact, and perform actions
- **Database Integration**: Direct database operations with security
- **Knowledge Base**: Comprehensive platform knowledge
- **Conversation Management**: Persistent sessions with context
- **Smart Suggestions**: Intelligent recommendations
- **Multi-modal Support**: Text, actions, and data visualization

## Application Settings & Configuration

### 🆕 Settings Management (`/src/pages/`)
- **Settings Page**: `Settings.tsx` - Comprehensive application configuration
- **Features**:
  - User preferences
  - System configuration
  - Integration settings
  - Security preferences
  - Feature toggles

## Reporting System

### 🆕 Enhanced Reports (`/src/components/reports/`)
- **Report Hub**: `ReportsScreen.tsx` (route: `/reports`) - Complete reporting dashboard
- **Available Reports**:
  - **Compliance Report**: `ComplianceReport.tsx`
    - Training completion rates
    - Regulatory compliance tracking
    - Department-level compliance
    - Audit trail reporting
  - **Certificate Expiry**: `CertificateExpiryReport.tsx`
    - Upcoming expirations with forecasting
    - Expired certificates tracking
    - Renewal workflow management
    - Compliance risk assessment
  - **Training Cost**: `TrainingCostReport.tsx`
    - Cost breakdown by department
    - Budget tracking and forecasting
    - ROI analysis and metrics
    - Cost optimization recommendations
  - **🆕 Utilization Report**: Course and resource utilization analytics

### 🆕 Real-time Analytics
- **Live Statistics**: Real-time calculation from database
- **Interactive Dashboards**: Dynamic data visualization
- **Export Capabilities**: PDF and Excel report generation
- **Automated Insights**: AI-powered analysis and recommendations

## Notification System

### Notifications (`/src/components/notifications/`)
- **Notification Center**: `NotificationSystem.tsx`
- **Features**:
  - Real-time alerts
  - Priority levels (low/medium/high)
  - Read/unread status
  - Related entity links
  - Action URLs

## Dashboard Features

### 🆕 Enhanced Dashboard Components (`/src/components/dashboard/`)
- **Stats Cards**: `StatsCard.tsx` - Real-time KPI display
- **Recent Activity**: `RecentActivity.tsx` - Enhanced activity feed with real data
- **Upcoming Courses**: `UpcomingCourses.tsx` - Intelligent schedule preview
- **🆕 Features**:
  - Real-time data integration
  - Interactive widgets
  - Customizable layouts
  - Drill-down capabilities

### Employee Dashboard
- **Employee Portal**: `/employee-dashboard` route
- **🆕 Enhanced Self-Service**:
  - Personal training calendar
  - Certificate status tracking
  - Code 95 progress monitoring
  - Training history and achievements

## Common UI Patterns

### Layout (`/src/components/layout/`)
- **App Layout**: `Layout.tsx` - Enhanced main app wrapper
- **Sidebar Navigation**: `Sidebar.tsx`, `AppSidebar.tsx` - Improved navigation
- **Header**: `Header.tsx` - Enhanced top navigation
- **Search**: `SearchDialog.tsx` - Advanced global search functionality

### 🆕 Enhanced Shared Features
- **View Toggle**: Advanced grid/list view switching
- **Status Toggle**: `StatusToggle.tsx` - Real-time status updates
- **Editable Checklist**: `EditableChecklist.tsx` - Dynamic checklist management
- **Smart Filters**: Advanced filtering and sorting capabilities

## Data Management

### Custom Hooks (`/src/hooks/`)
- `useEmployees.ts` - Enhanced employee data operations
- `useCourses.ts` - Course management with provider integration
- `useTrainings.ts` - Advanced training queries
- `useTrainingParticipants.ts` - Enhanced participant management
- `useCertificates.ts` - Certificate tracking with Code 95 integration
- `useTrainingForm.ts` - Advanced form state management
- `useCreateTraining.ts` - Enhanced training creation
- `useUpdateTraining.ts` - Training updates with validation
- `useViewMode.ts` - View preferences and persistence
- **🆕 useAIChat.ts** - Complete AI chat functionality and conversation management
- **🆕 useTrainingChecklist.ts** - Training checklist management with persistence

### Services (`/src/services/`)
- **🆕 Complete AI Services** (`/src/services/ai/`):
  - `ai-factory.ts` - Service factory pattern
  - `ai-service.ts` - Main AI service orchestrator
  - `openai-service.ts` - OpenAI API integration
  - `database-service.ts` - Secure database operations
  - `enhanced-database-service.ts` - Advanced database queries
  - `secure-database-service.ts` - Security-focused operations
  - `ui-interaction-service.ts` - UI automation capabilities
  - `knowledge-base.ts` - Comprehensive platform knowledge
  - `tools-definitions.ts` - AI tool definitions and schemas
  - `chat-storage-service.ts` - Conversation persistence
  - `debug-openai.ts` - Development and debugging tools

### Utilities (`/src/utils/`)
- `certificateUtils.ts` - Certificate helper functions
- **🆕 code95Utils.ts** - Complete Code 95 compliance system:
  - Comprehensive compliance calculations
  - Training point tracking and validation
  - Status determination and forecasting
  - Visual indicators and UI helpers
  - Automated training suggestions
  - Regulatory compliance checking
- **🆕 Enhanced Utilities**:
  - Advanced date formatting and validation
  - Status calculation with history
  - Data transformation utilities

## Context Providers (`/src/context/`)
- **🆕 ChatContext** - Complete AI chat state management
- **AuthContext** - Authentication state
- **UI Preferences** - View modes, themes, and user preferences
- **🆕 PermissionsContext** - Role-based access control

## Configuration (`/src/config/`)
- **🆕 ai.ts** - AI service configuration
- Environment configuration
- Feature flags and toggles
- API endpoints and integration settings
- Service settings and parameters

## Constants (`/src/constants/`)
- **🆕 employeeStatus.ts** - Employee status definitions
- Application constants
- Enum definitions
- Status mappings
- Default values and configurations

## Route Structure

### Main Routes
- `/` - Enhanced Dashboard with real-time analytics
- `/participants` - Employee management with advanced filtering
- `/participants/:id` - Enhanced employee profile with tabs
- `/courses` - Course management with provider integration
- `/scheduling` - Advanced training scheduler
- `/certifications` - Certificate management with Code 95 dashboard
- `/certificate-expiry` - Certificate expiry tracking
- `/reports` - Complete reporting hub
- `/notifications` - Notification center
- `/employee-dashboard` - Enhanced employee self-service portal
- **🆕 `/providers`** - Training provider management
- **🆕 `/settings`** - Application settings and configuration

### 🆕 Enhanced Feature Pages
- **Provider Management**: Complete provider directory and profiles
- **Advanced Settings**: System-wide configuration management
- **Enhanced Reports**: Interactive reporting with real-time data
- **AI Chat Integration**: Available on all pages with contextual assistance

## Integration Features

### External APIs
- **🆕 OpenAI API** - Complete AI chat and automation
- **🆕 OpenCage Geocoding** - Address validation and city/country lookup
- **🆕 REST Countries API** - Country data with fallback support
- **Supabase** - Enhanced database operations and real-time features

### 🆕 Advanced Real-time Features
- Live training updates with participant tracking
- Real-time notification delivery
- Collaborative editing capabilities
- Automatic cache invalidation
- Status synchronization across users

## Compliance & Regulatory Features

### 🆕 Enhanced Dutch Business Requirements
- **Advanced Code 95 Certification**: Complete EU professional driver compliance
- **Enhanced Dutch Naming**: Full tussenvoegsel and roepnaam support
- **BSN Management**: Dutch social security number with validation
- **Complete Driving License System**: All categories with expiry tracking
- **Provider Compliance**: Training provider certification tracking

### 🆕 Advanced Training Compliance
- Automated mandatory training tracking
- Intelligent completion deadline management
- Renewal requirement automation
- Department-level compliance reporting
- Regulatory audit trail maintenance

## Accessibility Features
- Enhanced keyboard navigation
- Improved screen reader support
- Comprehensive ARIA labels
- Advanced focus management
- Color contrast compliance
- Semantic HTML structure
- **🆕 AI-Powered Accessibility**: Chat assistance for navigation and interaction