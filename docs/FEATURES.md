# Feature Documentation

## Employee Management

### Employee Records (`/src/components/users/`)
- **List View**: `UserList.tsx`, `UserListTable.tsx`
- **Profile View**: `UserProfile.tsx` (route: `/participants/:id`)
- **Profile Display**: `UserProfileHeader.tsx`, `UserProfileTabs.tsx`
- **CRUD Operations**: 
  - Add: `AddUserDialog.tsx`
  - Edit: `EditEmployeeDialog.tsx`
- **Special Features**:
  - Dutch license management: `DutchLicenseManager.tsx`
  - Address validation: `AddressLookup.tsx`
  - **City/Country Lookup**: `CityCountryLookup.tsx` - Smart address input with geocoding
  - Phone validation: `PhoneInput.tsx`, `EnhancedPhoneInput.tsx`
  - Nationality selection: `NationalitySelect.tsx`

### Employee Status Management (`/src/components/employee/`)
- **Status Badge**: `EmployeeStatusBadge.tsx` - Visual status indicators
- **Status Manager**: `EmployeeStatusManager.tsx` - Update employee availability
- **Self-Service**: `EmployeeSelfService.tsx` - Employee portal features

### Dutch-Specific Features
- **Name Components**: Support for `tussenvoegsel`, `roepnaam`, first/last name separation
- **BSN Management**: Dutch social security number tracking
- **Comprehensive Driving Licenses**: Categories A, B, BE, C, CE, D, Code 95
- **Identity Verification (KVM)**: ID document management

## Course Management

### Course Administration (`/src/components/courses/`)
- **Course List**: `/courses` route
- **Course CRUD**:
  - Add: `AddCourseDialog.tsx`
  - Edit: `EditCourseDialog.tsx`
  - Actions: `CourseActions.tsx`
- **Features**:
  - Multi-session support
  - Checklist management
  - Code 95 points tracking
  - Pricing configuration

## Training Scheduling

### Training Scheduler (`/src/components/training/`)
- **Main Interface**: `TrainingScheduler.tsx` (route: `/scheduling`)
- **Header**: `TrainingSchedulerHeader.tsx` - Controls and actions
- **Views**:
  - Calendar: `TrainingCalendar.tsx`
  - Grid: `TrainingGridView.tsx`
  - List: `TrainingListView.tsx`
  - Timeline: `TrainingTimeline.tsx`

### Training Management
- **Create Training**: `CreateTrainingDialog.tsx`
- **Edit Training**: `EditTrainingDialog.tsx`
- **Training Editor**: `TrainingEditor.tsx` - Advanced editing interface
- **Details Panel**: `TrainingDetailsPanel.tsx` - View training information
- **🆕 Training Details View**: `TrainingDetailsView.tsx` - Comprehensive training detail page
  - Multi-session display
  - Integrated checklist management
  - Participant tracking with status badges
  - Quick actions sidebar
  - Code 95 points display
  - Attendance tracking for completed trainings

### Session Management
- **Session Manager**: `SessionManager.tsx` - Multi-session configuration
- **Session Tabs**: `SessionTabs.tsx` - Navigate between sessions
- **Session Types**:
  - Single session
  - Weekly recurring
  - Custom schedule

### Training Forms (`/src/components/training/forms/`)
Modular form sections for training creation/editing:
- `BasicTrainingInfoSection.tsx` - Title, description
- `CourseInfoSection.tsx` - Course information display
- `CourseSelectionSection.tsx` - Course selection
- `CourseChecklistSection.tsx` - Course checklist display
- `DateTimeSection.tsx` - Schedule configuration
- `InstructorLocationSection.tsx` - Instructor and venue
- `MultiSessionSection.tsx` - Multi-session setup
- `SmartMultiSessionSection.tsx` - Intelligent scheduling
- `ChecklistManagementSection.tsx` - Checklist configuration
- `TrainingSettingsSection.tsx` - Training-specific settings
- `EditSingleSessionSection.tsx` - Single session editing
- `EditMultiSessionSection.tsx` - Multi-session editing

### Participant Management
- **Add Participants**: `AddParticipantDialog.tsx`
- **Participant List**: `/participants` route
- **Enrollment Status**: Track enrolled/attended/absent/cancelled

## Certificate Management

### Certificate Tracking (`/src/components/certificates/`)
- **Expiry Dashboard**: `CertificateExpiryDashboard.tsx`
- **🆕 Code 95 Dashboard**: `Code95Dashboard.tsx` - Specialized Code 95 compliance tracking
  - Compliance statistics and progress
  - Employee status filtering (expired, expiring, compliant)
  - Training points tracking
  - Schedule training actions
  - Visual indicators and progress bars
- **Certificate Expiry Page**: `/certificate-expiry` route
- **Certificate List**: `/certifications` route
- **Features**:
  - Expiry alerts (30/60/90 days)
  - Status tracking (valid/expiring/expired)
  - Renewal reminders
  - **Code 95 Compliance**: EU professional driver certification tracking

## AI Chat Assistant

### 🆕 Chat System (`/src/components/chat/`)
AI-powered assistance integrated throughout the application:
- **Chat Bubble**: `ChatBubble.tsx` - Floating chat interface
- **Chat Panel**: `ChatPanel.tsx` - Full chat interface
- **Chat Messages**: `ChatMessage.tsx` - Message display
- **Chat Settings**: `ChatSettings.tsx` - Configuration options
- **Chat Debug**: `ChatDebug.tsx` - Development tools

### AI Features
- **Contextual Help**: Understands current page and user intent
- **UI Automation**: Can navigate, click buttons, fill forms
- **Knowledge Base**: Comprehensive platform knowledge
- **Action Execution**: Performs tasks within the application
- **Conversation History**: Persistent chat sessions with cleanup

## Reporting System

### Reports (`/src/components/reports/`)
- **Report Hub**: `ReportsScreen.tsx` (route: `/reports`)
- **Available Reports**:
  - **Compliance Report**: `ComplianceReport.tsx`
    - Training completion rates
    - Mandatory training tracking
    - Department compliance
  - **Certificate Expiry**: `CertificateExpiryReport.tsx`
    - Upcoming expirations
    - Expired certificates
    - Renewal tracking
  - **Training Cost**: `TrainingCostReport.tsx`
    - Cost per department
    - Budget tracking
    - ROI analysis

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

### Dashboard Components (`/src/components/dashboard/`)
- **Stats Cards**: `StatsCard.tsx` - KPI display
- **Recent Activity**: `RecentActivity.tsx` - Activity feed
- **Upcoming Courses**: `UpcomingCourses.tsx` - Schedule preview

### Employee Dashboard
- **Employee Portal**: `/employee-dashboard` route
- **Self-Service Features**: View personal training, certificates, status

## Common UI Patterns

### Layout (`/src/components/layout/`)
- **App Layout**: `Layout.tsx` - Main app wrapper
- **Sidebar Navigation**: `Sidebar.tsx`, `AppSidebar.tsx`
- **Header**: `Header.tsx` - Top navigation
- **Search**: `SearchDialog.tsx` - Global search functionality

### Shared Features
- **View Toggle**: Grid/List view switching (`ViewToggle.tsx`)
- **Status Toggle**: `StatusToggle.tsx` - Status updates
- **Editable Checklist**: `EditableChecklist.tsx` - Dynamic checklists

## Data Management

### Custom Hooks (`/src/hooks/`)
- `useEmployees.ts` - Employee data operations
- `useCourses.ts` - Course management
- `useTrainings.ts` - Training queries
- `useTrainingParticipants.ts` - Participant management
- `useCertificates.ts` - Certificate tracking
- `useTrainingForm.ts` - Form state management
- `useCreateTraining.ts` - Training creation
- `useUpdateTraining.ts` - Training updates
- `useViewMode.ts` - View preferences
- **🆕 useAIChat.ts** - AI chat functionality and conversation management
- **🆕 useTrainingChecklist.ts** - Training checklist management with persistence

### Services (`/src/services/`)
- **🆕 AI Services** (`/src/services/ai/`):
  - `ai-factory.ts` - Service factory pattern
  - `openai-service.ts` - OpenAI API integration
  - `database-service.ts` - Database query capabilities
  - `ui-interaction-service.ts` - UI automation
  - `knowledge-base.ts` - Platform knowledge
  - `tools-definitions.ts` - AI tool definitions
  - `chat-storage-service.ts` - Message storage

### Utilities (`/src/utils/`)
- `certificateUtils.ts` - Certificate helper functions
- **🆕 code95Utils.ts** - Code 95 compliance calculations:
  - Determine Code 95 requirements
  - Calculate training points and progress
  - Check compliance status
  - Generate training suggestions
  - UI helpers (colors, emojis, status descriptions)
- Date formatting and validation
- Status calculations

## Context Providers (`/src/context/`)
- **🆕 ChatContext** - AI chat state management
- **AuthContext** - Authentication state
- **UI Preferences** - View modes, themes

## Configuration (`/src/config/`)
- Environment configuration
- Feature flags
- API endpoints
- Service settings

## Constants (`/src/constants/`)
- Application constants
- Enum definitions
- Status mappings
- Default values

## Route Structure

### Main Routes
- `/` - Dashboard (Index page)
- `/participants` - Employee list
- `/participants/:id` - Employee profile
- `/courses` - Course management
- `/scheduling` - Training scheduler
- `/certifications` - Certificate list
- `/certificate-expiry` - Certificate expiry dashboard
- `/reports` - Reporting hub
- `/notifications` - Notification center
- `/employee-dashboard` - Employee self-service portal

### Feature-Specific Pages
- **Dashboard**: Overview with KPIs and recent activity
- **Participants**: Employee directory with search and filtering
- **Training Scheduler**: Calendar-based training management
- **Certifications**: Certificate tracking and compliance monitoring
- **Reports**: Analytics and compliance reporting
- **Employee Dashboard**: Self-service portal for employees

## Integration Features

### External APIs
- **🆕 OpenCage Geocoding** - City/country lookup for addresses
- **🆕 REST Countries API** - Country data fallback
- **🆕 OpenAI API** - AI chat functionality
- **Supabase** - Database and authentication

### Real-time Features
- Live training updates
- Real-time notifications
- Collaborative editing
- Automatic cache invalidation

## Compliance & Regulatory Features

### Dutch Business Requirements
- **Code 95 Certification**: EU professional driver compliance
- **Dutch Naming Conventions**: Tussenvoegsel support
- **BSN Management**: Dutch social security numbers
- **Driving License Categories**: Complete A-D coverage

### Training Compliance
- Mandatory training tracking
- Completion deadlines
- Renewal requirements
- Department compliance reporting

## Accessibility Features
- Keyboard navigation
- Screen reader support
- ARIA labels
- Focus management
- Color contrast compliance
- Semantic HTML structure