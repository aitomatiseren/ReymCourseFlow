# Database Schema Documentation

## Overview
PostgreSQL database hosted on Supabase with Row Level Security (RLS) policies. The schema is designed to support comprehensive employee management, training scheduling, certification tracking, and compliance reporting for organizations with a focus on Dutch business requirements.

## Core Tables

### employees
Primary table for employee records with comprehensive personal and professional information.

**Identity Fields:**
- `id` (uuid) - Primary key
- `employee_number` (text) - Unique employee ID
- `created_at` (timestamptz) - Record creation timestamp
- `updated_at` (timestamptz) - Last update timestamp

**Name Fields (Dutch Support):**
- `name` (text) - Full name (legacy/display)
- `first_name` (text) - First name component
- `last_name` (text) - Last name component  
- `tussenvoegsel` (text) - Dutch name prefix (e.g., "van", "de", "van der")
- `roepnaam` (text) - Dutch "calling name" (nickname/preferred name)

**Contact Information:**
- `email` (text) - Work email (unique)
- `private_email` (text) - Personal email address
- `phone` (text) - Work phone
- `mobile_phone` (text) - Mobile number
- `website` (text) - Personal website

**Personal Information:**
- `date_of_birth` (date)
- `birth_place` (text)
- `birth_country` (text)
- `gender` (text) - Constraint: 'male', 'female', 'other'
- `nationality` (text)
- `personal_id` (text) - BSN/Personal identification number
- `marital_status` (text) - Options: 'single', 'married', 'divorced', 'widowed', 'separated', 'domestic_partnership', 'civil_union', 'engaged', 'cohabiting', 'unknown'
- `marriage_date` (date)
- `divorce_date` (date)
- `death_date` (date)

**Address Information:**
- `address` (text) - Street address
- `postcode` (text) - Postal code
- `city` (text)
- `country` (text)

**Employment Information:**
- `status` (text) - active/inactive/on_leave/terminated
- `employee_status` (text) - available/on_leave/sick/vacation/unavailable
- `department` (text)
- `manager_id` (uuid) - References employees.id
- `hire_date` (date)
- `contract_type` (text)
- `work_location` (text)
- `job_title` (text)
- `employment_status` (text)
- `salary` (numeric)
- `working_hours` (numeric)

**Identity Verification (KVM):**
- `id_proof_type` (text) - Type of ID document
- `id_proof_number` (text) - ID document number
- `id_proof_expiry_date` (date) - ID expiry date

**Driving License Information:**
- `driving_license_number` (text) - Main license number
- `driving_license_issue_date` (date)
- `driving_license_expiry_date` (date)

**License Categories (for each: A, B, BE, C, CE, D, Code95):**
- `driving_license_[category]` (boolean) - Whether employee has this license
- `driving_license_[category]_start_date` (date) - When license was obtained
- `driving_license_[category]_expiry_date` (date) - When license expires

**Emergency & Additional Info:**
- `emergency_contact` (jsonb) - Emergency contact details
- `medical_conditions` (text)

**Relationships:**
- Has many `employee_licenses`
- Has many `training_participants`
- Self-referencing for manager hierarchy

### courses
Course definitions and templates for training programs.

**Key Fields:**
- `id` (uuid) - Primary key
- `title` (text) - Course name
- `description` (text) - Course description
- `category` (text) - Course category/type
- `duration_hours` (numeric) - Total duration in hours
- `sessions_required` (integer) - Number of sessions needed
- `max_participants` (integer) - Maximum class size
- `price` (numeric) - Course price
- `code95_points` (integer) - Points for Code 95 certification
- `has_checklist` (boolean) - Whether course has checklist
- `checklist_items` (jsonb) - Array of checklist items
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Checklist Item Structure:**
```json
{
  "id": "uuid",
  "text": "string",
  "required": boolean,
  "category": "string"
}
```

**Relationships:**
- Has many `course_sessions`
- Has many `trainings`

### course_sessions
Individual sessions within a multi-session course.

**Key Fields:**
- `id` (uuid) - Primary key
- `course_id` (uuid) - References courses.id
- `session_number` (integer) - Order within course (1, 2, 3...)
- `title` (text) - Session title
- `description` (text) - Session description
- `duration_hours` (numeric) - Session duration
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Relationships:**
- Belongs to `courses`

### trainings
Scheduled training instances of courses.

**Key Fields:**
- `id` (uuid) - Primary key
- `course_id` (uuid) - References courses.id
- `title` (text) - Can override course title
- `description` (text) - Training-specific description
- `start_date` (timestamptz) - Training start date/time
- `end_date` (timestamptz) - Training end date/time
- `instructor_id` (uuid) - References employees.id
- `location` (text) - Training location
- `status` (text) - scheduled/in_progress/completed/cancelled
- `max_participants` (integer) - Maximum attendees
- `price` (numeric) - Training price (can override course price)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Multi-session Configuration:**
- `multi_session` (boolean) - Whether training has multiple sessions
- `session_type` (text) - single/weekly/custom
- `sessions` (jsonb) - Array of session dates/times
- `recurring_days` (text[]) - Days of week for weekly recurring
- `recurring_time` (time) - Time for recurring sessions
- `recurring_until` (date) - End date for recurring sessions

**Session Object Structure:**
```json
{
  "date": "YYYY-MM-DD",
  "startTime": "HH:MM",
  "endTime": "HH:MM",
  "location": "string",
  "instructorId": "uuid"
}
```

**Relationships:**
- Belongs to `courses`
- Has many `training_participants`
- Has many `training_sessions`
- Belongs to `employees` (instructor)

### training_participants
Employee enrollments and attendance in trainings.

**Key Fields:**
- `id` (uuid) - Primary key
- `training_id` (uuid) - References trainings.id
- `employee_id` (uuid) - References employees.id
- `status` (text) - enrolled/attended/absent/cancelled
- `enrollment_date` (timestamptz) - When enrolled
- `attendance_date` (timestamptz) - When attended
- `completion_date` (timestamptz) - When completed
- `certificate_issued` (boolean) - Whether certificate was issued
- `certificate_number` (text) - Certificate ID if issued
- `notes` (text) - Additional notes
- `created_at` (timestamptz) - Record creation
- `updated_at` (timestamptz) - Last update (auto-updated via trigger)

**Indexes:**
- `training_id` - For fast training lookups
- `employee_id` - For fast employee training history

**Relationships:**
- Belongs to `trainings`
- Belongs to `employees`

### training_sessions
Individual sessions for multi-session trainings.

**Key Fields:**
- `id` (uuid) - Primary key
- `training_id` (uuid) - References trainings.id
- `session_number` (integer) - Session order (1, 2, 3...)
- `start_time` (timestamptz) - Session start
- `end_time` (timestamptz) - Session end
- `location` (text) - Session location (can differ from training)
- `instructor_id` (uuid) - References employees.id
- `status` (text) - scheduled/completed/cancelled
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Relationships:**
- Belongs to `trainings`
- Belongs to `employees` (instructor)

### employee_licenses
Employee certifications, licenses, and qualifications.

**Key Fields:**
- `id` (uuid) - Primary key
- `employee_id` (uuid) - References employees.id
- `license_type` (text) - Type of license/certification
- `license_number` (text) - License ID/number
- `issue_date` (date) - When issued
- `expiry_date` (date) - When expires
- `issuing_authority` (text) - Who issued the license
- `status` (text) - active/expired/suspended
- `renewal_required` (boolean) - Needs renewal
- `renewal_period_days` (integer) - Days before expiry to renew
- `notes` (text) - Additional information
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Common License Types:**
- 'Driver License A/B/BE/C/CE/D'
- 'Code 95'
- 'ADR Certificate'
- 'Forklift License'
- 'First Aid Certificate'
- 'Safety Certificate'

**Relationships:**
- Belongs to `employees`

### notifications
System notifications and alerts for users.

**Key Fields:**
- `id` (uuid) - Primary key
- `recipient_id` (uuid) - References employees.id
- `type` (text) - Notification type
- `title` (text) - Notification title
- `message` (text) - Notification content
- `read` (boolean) - Whether read by recipient
- `read_at` (timestamptz) - When read
- `priority` (text) - low/medium/high
- `related_entity_type` (text) - Type of related entity
- `related_entity_id` (uuid) - ID of related entity
- `action_url` (text) - Link to relevant page
- `created_at` (timestamptz)

**Notification Types:**
- 'training_reminder'
- 'certificate_expiry'
- 'training_enrollment'
- 'training_cancellation'
- 'system_announcement'

**Relationships:**
- Belongs to `employees` (recipient)

## Database Functions

### update_updated_at_column()
Trigger function to automatically update `updated_at` timestamps.
```sql
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';
```

Applied to tables via triggers:
```sql
CREATE TRIGGER update_training_participants_updated_at 
BEFORE UPDATE ON training_participants 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Common Patterns

### Status Fields
Consistent status enums across tables:
- **Training status**: scheduled/in_progress/completed/cancelled
- **Employee status**: active/inactive/on_leave/terminated  
- **Employee availability**: available/on_leave/sick/vacation/unavailable
- **Participant status**: enrolled/attended/absent/cancelled
- **License status**: active/expired/suspended
- **Session status**: scheduled/completed/cancelled

### Audit Fields
Standard fields for data tracking:
- `created_at` (timestamptz) - Auto-set on insert
- `updated_at` (timestamptz) - Auto-updated via triggers

### JSON/JSONB Fields
Complex data stored as JSONB for flexibility:
- `checklist_items` in courses - Dynamic checklist configuration
- `sessions` in trainings - Multi-session scheduling data
- `emergency_contact` in employees - Structured contact info

### Dutch-Specific Fields
Special support for Dutch naming and identification:
- Name components with `tussenvoegsel` support
- BSN (personal_id) for Dutch social security numbers
- `roepnaam` for preferred names
- Comprehensive marital status options

## Indexes

### Performance Indexes
Key indexes for query optimization:
- **employees**: 
  - `email` (unique)
  - `employee_number` (unique)
  - `manager_id`
- **trainings**: 
  - `start_date`
  - `status`
  - `course_id`
  - `instructor_id`
- **training_participants**: 
  - `training_id`
  - `employee_id`
  - Composite: `(training_id, employee_id)`
- **employee_licenses**: 
  - `employee_id`
  - `expiry_date`
  - `license_type`

## Row Level Security (RLS)

RLS policies ensure data isolation and security:

### Employee Policies
- Employees can view their own records
- Managers can view their direct reports
- HR/Admin roles have full access
- Public data (name, department) visible to all authenticated users

### Training Policies  
- Instructors can manage their assigned trainings
- Participants can view trainings they're enrolled in
- Admins have full training management access

### License Policies
- Employees can view their own licenses
- Managers can view team licenses for compliance
- HR can manage all licenses

## Data Integrity

### Constraints
- Foreign key constraints with appropriate CASCADE/RESTRICT rules
- Check constraints on enums (gender, status fields)
- Unique constraints on business keys (email, employee_number)
- Not null constraints on required fields

### Triggers
- Auto-update `updated_at` timestamps
- Validate business rules before insert/update
- Cascade status updates (e.g., employee termination)

## Migration History

### Recent Significant Changes
1. **Dutch Name Support** (2025-01-11)
   - Added name component fields
   - Automated parsing of existing names
   - Support for Dutch naming conventions

2. **Comprehensive Employee Fields**
   - Added personal information fields
   - Identity verification (KVM) support  
   - Detailed driving license tracking
   - Extended marital status options

3. **Training Participants Enhancement**
   - Added audit timestamps
   - Performance indexes
   - Automatic timestamp updates

## Best Practices

### Querying
1. Always include relevant JOINs for related data
2. Use indexes for filtering and sorting
3. Limit result sets with pagination
4. Select only needed columns

### Data Modifications
1. Use transactions for multi-table updates
2. Validate data before database constraints
3. Handle constraint violations gracefully
4. Log significant data changes

### Performance
1. Monitor slow queries
2. Use EXPLAIN ANALYZE for optimization
3. Consider materialized views for reports
4. Implement appropriate caching strategies