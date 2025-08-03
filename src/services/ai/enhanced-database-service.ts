import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { logger } from '@/utils/logger';

export interface FieldMapping {
  fieldName: string;
  humanName: string;
  description: string;
  dataType: string;
  businessContext: string;
  searchable: boolean;
  sortable: boolean;
}

export interface TableSchema {
  tableName: string;
  humanName: string;
  description: string;
  fields: FieldMapping[];
  relationships: Array<{
    field: string;
    referencesTable: string;
    referencesField: string;
    description: string;
  }>;
}

export class EnhancedDatabaseService {
  private static instance: EnhancedDatabaseService;
  private fieldMappings: Map<string, TableSchema> = new Map();

  public static getInstance(): EnhancedDatabaseService {
    if (!EnhancedDatabaseService.instance) {
      EnhancedDatabaseService.instance = new EnhancedDatabaseService();
    }
    return EnhancedDatabaseService.instance;
  }

  constructor() {
    this.initializeFieldMappings();
  }

  private initializeFieldMappings() {
    // Employee field mappings based on actual schema
    this.fieldMappings.set('employees', {
      tableName: 'employees',
      humanName: 'Employees',
      description: 'Employee records with personal and employment information',
      fields: [
        { fieldName: 'id', humanName: 'Employee ID', description: 'Unique identifier for the employee', dataType: 'string', businessContext: 'Primary key', searchable: false, sortable: false },
        { fieldName: 'name', humanName: 'Full Name', description: 'Employee\'s full name', dataType: 'string', businessContext: 'Primary identifier for humans', searchable: true, sortable: true },
        { fieldName: 'email', humanName: 'Email Address', description: 'Employee\'s email address', dataType: 'string', businessContext: 'Contact and login information', searchable: true, sortable: true },
        { fieldName: 'employee_number', humanName: 'Employee Number', description: 'Unique employee identification number', dataType: 'string', businessContext: 'Official employee identifier', searchable: true, sortable: true },
        { fieldName: 'hire_date', humanName: 'Hire Date', description: 'Date when the employee was hired', dataType: 'date', businessContext: 'Determines seniority and tenure', searchable: false, sortable: true },
        { fieldName: 'department', humanName: 'Department', description: 'Department or division where employee works', dataType: 'string', businessContext: 'Organizational structure', searchable: true, sortable: true },
        { fieldName: 'job_title', humanName: 'Job Title', description: 'Employee\'s position or role', dataType: 'string', businessContext: 'Role and responsibilities', searchable: true, sortable: true },
        { fieldName: 'status', humanName: 'Employment Status', description: 'Current employment status (active, inactive, terminated)', dataType: 'string', businessContext: 'Current employment state', searchable: true, sortable: true },
        { fieldName: 'salary', humanName: 'Salary', description: 'Employee\'s current salary', dataType: 'number', businessContext: 'Compensation information - sensitive data', searchable: false, sortable: true },
        { fieldName: 'manager_id', humanName: 'Manager', description: 'ID of the employee\'s direct supervisor', dataType: 'string', businessContext: 'Reporting hierarchy', searchable: false, sortable: false },
        { fieldName: 'date_of_birth', humanName: 'Date of Birth', description: 'Employee\'s birth date', dataType: 'date', businessContext: 'Personal information - sensitive data', searchable: false, sortable: true },
        { fieldName: 'nationality', humanName: 'Nationality', description: 'Employee\'s nationality', dataType: 'string', businessContext: 'Legal and compliance information', searchable: true, sortable: true },
        { fieldName: 'address', humanName: 'Address', description: 'Employee\'s home address', dataType: 'string', businessContext: 'Personal contact information', searchable: true, sortable: false },
        { fieldName: 'city', humanName: 'City', description: 'City of residence', dataType: 'string', businessContext: 'Location information', searchable: true, sortable: true },
        { fieldName: 'country', humanName: 'Country', description: 'Country of residence', dataType: 'string', businessContext: 'Location information', searchable: true, sortable: true },
        { fieldName: 'phone', humanName: 'Phone Number', description: 'Primary phone number', dataType: 'string', businessContext: 'Contact information', searchable: true, sortable: false },
        { fieldName: 'mobile_phone', humanName: 'Mobile Phone', description: 'Mobile phone number', dataType: 'string', businessContext: 'Contact information', searchable: true, sortable: false },
        { fieldName: 'work_location', humanName: 'Work Location', description: 'Primary work location or office', dataType: 'string', businessContext: 'Work arrangement information', searchable: true, sortable: true },
        { fieldName: 'working_hours', humanName: 'Working Hours', description: 'Number of working hours per week', dataType: 'number', businessContext: 'Work schedule information', searchable: false, sortable: true },
        { fieldName: 'contract_type', humanName: 'Contract Type', description: 'Type of employment contract (full-time, part-time, contract)', dataType: 'string', businessContext: 'Employment terms', searchable: true, sortable: true },
        { fieldName: 'marital_status', humanName: 'Marital Status', description: 'Employee\'s marital status', dataType: 'string', businessContext: 'Personal information for benefits', searchable: true, sortable: true },
        { fieldName: 'emergency_contact_name', humanName: 'Emergency Contact Name', description: 'Name of emergency contact person', dataType: 'string', businessContext: 'Emergency contact information', searchable: true, sortable: false },
        { fieldName: 'emergency_contact_phone', humanName: 'Emergency Contact Phone', description: 'Phone number of emergency contact', dataType: 'string', businessContext: 'Emergency contact information', searchable: true, sortable: false },
        { fieldName: 'emergency_contact_relationship', humanName: 'Emergency Contact Relationship', description: 'Relationship to emergency contact', dataType: 'string', businessContext: 'Emergency contact information', searchable: true, sortable: true }
      ],
      relationships: [
        { field: 'manager_id', referencesTable: 'employees', referencesField: 'id', description: 'Employee\'s direct supervisor' }
      ]
    });

    // Course field mappings
    this.fieldMappings.set('courses', {
      tableName: 'courses',
      humanName: 'Courses',
      description: 'Training course definitions and specifications',
      fields: [
        { fieldName: 'id', humanName: 'Course ID', description: 'Unique course identifier', dataType: 'string', businessContext: 'Primary key', searchable: false, sortable: false },
        { fieldName: 'title', humanName: 'Course Title', description: 'Name of the training course', dataType: 'string', businessContext: 'Course identification', searchable: true, sortable: true },
        { fieldName: 'description', humanName: 'Description', description: 'Detailed course description', dataType: 'string', businessContext: 'Course content overview', searchable: true, sortable: false },
        { fieldName: 'duration_hours', humanName: 'Duration (Hours)', description: 'Course duration in hours', dataType: 'number', businessContext: 'Time planning and scheduling', searchable: false, sortable: true },
        { fieldName: 'max_participants', humanName: 'Maximum Participants', description: 'Maximum number of participants allowed', dataType: 'number', businessContext: 'Capacity planning', searchable: false, sortable: true },
        { fieldName: 'code95_points', humanName: 'Code 95 Points', description: 'Professional driver qualification points awarded', dataType: 'number', businessContext: 'Professional certification credits', searchable: false, sortable: true },
        { fieldName: 'price', humanName: 'Price', description: 'Course price or cost', dataType: 'number', businessContext: 'Financial information', searchable: false, sortable: true },
        { fieldName: 'category', humanName: 'Category', description: 'Course category or type', dataType: 'string', businessContext: 'Course classification', searchable: true, sortable: true },
        { fieldName: 'has_checklist', humanName: 'Has Checklist', description: 'Whether course includes a completion checklist', dataType: 'boolean', businessContext: 'Course structure feature', searchable: false, sortable: true },
        { fieldName: 'sessions_required', humanName: 'Sessions Required', description: 'Number of sessions required to complete course', dataType: 'number', businessContext: 'Course structure', searchable: false, sortable: true }
      ],
      relationships: []
    });

    // Training field mappings
    this.fieldMappings.set('trainings', {
      tableName: 'trainings',
      humanName: 'Training Sessions',
      description: 'Scheduled training instances with participants',
      fields: [
        { fieldName: 'id', humanName: 'Training ID', description: 'Unique training session identifier', dataType: 'string', businessContext: 'Primary key', searchable: false, sortable: false },
        { fieldName: 'title', humanName: 'Training Title', description: 'Name of the training session', dataType: 'string', businessContext: 'Training identification', searchable: true, sortable: true },
        { fieldName: 'course_id', humanName: 'Course', description: 'Associated course ID', dataType: 'string', businessContext: 'Links training to course definition', searchable: false, sortable: false },
        { fieldName: 'date', humanName: 'Training Date', description: 'Date when training is scheduled', dataType: 'date', businessContext: 'Scheduling information', searchable: false, sortable: true },
        { fieldName: 'time', humanName: 'Start Time', description: 'Training start time', dataType: 'string', businessContext: 'Scheduling information', searchable: false, sortable: true },
        { fieldName: 'instructor', humanName: 'Instructor', description: 'Training instructor name', dataType: 'string', businessContext: 'Personnel assignment', searchable: true, sortable: true },
        { fieldName: 'location', humanName: 'Location', description: 'Training venue or location', dataType: 'string', businessContext: 'Logistics information', searchable: true, sortable: true },
        { fieldName: 'max_participants', humanName: 'Maximum Participants', description: 'Maximum participants for this session', dataType: 'number', businessContext: 'Capacity management', searchable: false, sortable: true },
        { fieldName: 'status', humanName: 'Status', description: 'Training status (scheduled, in-progress, completed, cancelled)', dataType: 'string', businessContext: 'Training lifecycle state', searchable: true, sortable: true },
        { fieldName: 'price', humanName: 'Price', description: 'Training session price', dataType: 'number', businessContext: 'Financial information', searchable: false, sortable: true },
        { fieldName: 'requires_approval', humanName: 'Requires Approval', description: 'Whether participant enrollment requires approval', dataType: 'boolean', businessContext: 'Enrollment workflow', searchable: false, sortable: true }
      ],
      relationships: [
        { field: 'course_id', referencesTable: 'courses', referencesField: 'id', description: 'Associated course definition' }
      ]
    });
  }

  // Get all available fields for a table with their mappings
  getTableSchema(tableName: string): TableSchema | null {
    return this.fieldMappings.get(tableName) || null;
  }

  // Get field description for better AI understanding
  getFieldDescription(tableName: string, fieldName: string): string {
    const schema = this.fieldMappings.get(tableName);
    if (!schema) return fieldName;
    
    const field = schema.fields.find(f => f.fieldName === fieldName);
    return field ? `${field.humanName}: ${field.description}` : fieldName;
  }

  // Enhanced search across all searchable fields
  async smartSearch(query: string, tables: string[] = ['employees', 'courses', 'trainings'], limit = 10) {
    logger.debug(`Smart search for "${query}" across tables`, { tables });
    
    const results: { [tableName: string]: unknown[] } = {};
    
    for (const tableName of tables) {
      const schema = this.fieldMappings.get(tableName);
      if (!schema) continue;
      
      const searchableFields = schema.fields
        .filter(f => f.searchable)
        .map(f => f.fieldName);
      
      if (searchableFields.length === 0) continue;
      
      try {
        const searchConditions = searchableFields
          .map(field => `${field}.ilike.%${query}%`)
          .join(',');
        
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .or(searchConditions)
          .limit(limit);
        
        if (error) {
          logger.error(`Error searching ${tableName}`, { error, tableName });
          continue;
        }
        
        results[tableName] = data || [];
        logger.info(`Found ${data?.length || 0} results in ${tableName}`, { tableName, resultCount: data?.length || 0 });
      } catch (err) {
        logger.error(`Search crashed for ${tableName}`, { error: err, tableName });
      }
    }
    
    return results;
  }

  // Interpret natural language queries and suggest appropriate database queries
  interpretQuery(userQuery: string): { 
    suggestedAction: string;
    tablesToSearch: string[];
    possibleFields: string[];
    queryType: 'search' | 'filter' | 'sort' | 'aggregate' | 'relationship';
    explanation: string;
  } {
    const lowerQuery = userQuery.toLowerCase();
    
    // Detect query about newest/oldest employees
    if (lowerQuery.includes('newest') || lowerQuery.includes('latest') || lowerQuery.includes('recent')) {
      if (lowerQuery.includes('hire') || lowerQuery.includes('employee') || lowerQuery.includes('join')) {
        return {
          suggestedAction: 'getNewestHires',
          tablesToSearch: ['employees'],
          possibleFields: ['hire_date', 'name', 'employee_number', 'department'],
          queryType: 'sort',
          explanation: 'Query asks for newest hires, should sort employees by hire_date descending'
        };
      }
    }
    
    // Detect salary-related queries
    if (lowerQuery.includes('salary') || lowerQuery.includes('pay') || lowerQuery.includes('compensation')) {
      return {
        suggestedAction: 'searchEmployeesBySalary',
        tablesToSearch: ['employees'],
        possibleFields: ['salary', 'name', 'department', 'job_title'],
        queryType: 'filter',
        explanation: 'Query about salary information - sensitive data handling required'
      };
    }
    
    // Detect manager/hierarchy queries
    if (lowerQuery.includes('manager') || lowerQuery.includes('reports to') || lowerQuery.includes('supervisor')) {
      return {
        suggestedAction: 'getManagerHierarchy',
        tablesToSearch: ['employees'],
        possibleFields: ['manager_id', 'name', 'job_title', 'department'],
        queryType: 'relationship',
        explanation: 'Query about organizational hierarchy - need to join employees table to itself'
      };
    }
    
    // Detect training/course queries
    if (lowerQuery.includes('training') || lowerQuery.includes('course') || lowerQuery.includes('schedule')) {
      return {
        suggestedAction: 'searchTrainingsAndCourses',
        tablesToSearch: ['trainings', 'courses'],
        possibleFields: ['title', 'date', 'instructor', 'location', 'status'],
        queryType: 'search',
        explanation: 'Query about training or courses - search across training and course tables'
      };
    }
    
    // Default to general search
    return {
      suggestedAction: 'generalSearch',
      tablesToSearch: ['employees', 'courses', 'trainings'],
      possibleFields: ['name', 'title', 'department', 'email'],
      queryType: 'search',
      explanation: 'General query - search across main tables for relevant information'
    };
  }

  // Search employees with complete field access
  async searchEmployees(query: string, filters: any = {}): Promise<Tables<'employees'>[]> {
    logger.debug(`Enhanced search for employees: "${query}" with filters`, { query, filters });
    
    try {
      let dbQuery = supabase
        .from('employees')
        .select('*'); // Get ALL fields
      
      if (query && query.trim()) {
        // Search across all searchable employee fields
        const searchConditions = [
          `name.ilike.%${query}%`,
          `email.ilike.%${query}%`,
          `employee_number.ilike.%${query}%`,
          `department.ilike.%${query}%`,
          `job_title.ilike.%${query}%`,
          `first_name.ilike.%${query}%`,
          `last_name.ilike.%${query}%`,
          `roepnaam.ilike.%${query}%`,
          `phone.ilike.%${query}%`,
          `mobile_phone.ilike.%${query}%`,
          `address.ilike.%${query}%`,
          `city.ilike.%${query}%`,
          `country.ilike.%${query}%`,
          `nationality.ilike.%${query}%`,
          `work_location.ilike.%${query}%`,
          `emergency_contact_name.ilike.%${query}%`
        ].join(',');
        
        dbQuery = dbQuery.or(searchConditions);
      }
      
      // Apply filters if provided
      if (filters.department) {
        dbQuery = dbQuery.eq('department', filters.department);
      }
      if (filters.status) {
        dbQuery = dbQuery.eq('status', filters.status);
      }
      if (filters.hireDateAfter) {
        dbQuery = dbQuery.gte('hire_date', filters.hireDateAfter);
      }
      if (filters.hireDateBefore) {
        dbQuery = dbQuery.lte('hire_date', filters.hireDateBefore);
      }
      
      const { data, error } = await dbQuery.limit(20);
      
      if (error) {
        logger.error('Error searching employees', { error });
        return [];
      }
      
      logger.info('Found employees with full field access', { count: data?.length || 0 });
      return data || [];
      
    } catch (err) {
      logger.error('Employee search crashed', { error: err });
      return [];
    }
  }

  // Format database results for AI consumption with field explanations
  formatResultsForAI(results: unknown[], tableName: string): string {
    if (!results || results.length === 0) {
      return `No results found in ${tableName}`;
    }
    
    const schema = this.fieldMappings.get(tableName);
    if (!schema) {
      return `Found ${results.length} records in ${tableName}`;
    }
    
    let output = `**${schema.humanName} (${results.length} records):**\n`;
    
    results.slice(0, 10).forEach((record: any, index) => {
      output += `${index + 1}. `;
      
      // Format key fields based on table type
      if (tableName === 'employees') {
        output += `${record.name || 'Unknown'} (${record.employee_number || 'No #'})`;
        if (record.hire_date) output += ` - Hired: ${record.hire_date}`;
        if (record.department) output += ` - Dept: ${record.department}`;
        if (record.job_title) output += ` - Title: ${record.job_title}`;
        if (record.status) output += ` - Status: ${record.status}`;
      } else if (tableName === 'courses') {
        output += `"${record.title || 'Unknown Course'}"`;
        if (record.duration_hours) output += ` (${record.duration_hours} hours)`;
        if (record.code95_points) output += ` - ${record.code95_points} Code 95 points`;
        if (record.category) output += ` - Category: ${record.category}`;
      } else if (tableName === 'trainings') {
        output += `"${record.title || 'Unknown Training'}"`;
        if (record.date) output += ` on ${record.date}`;
        if (record.time) output += ` at ${record.time}`;
        if (record.location) output += ` - Location: ${record.location}`;
        if (record.instructor) output += ` - Instructor: ${record.instructor}`;
        if (record.status) output += ` - Status: ${record.status}`;
      }
      
      output += '\n';
    });
    
    if (results.length > 10) {
      output += `... and ${results.length - 10} more records\n`;
    }
    
    return output;
  }
}