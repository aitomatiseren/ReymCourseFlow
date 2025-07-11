import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Employee = Database['public']['Tables']['employees']['Row'];
type EmployeeUpdate = Database['public']['Tables']['employees']['Update'];
type Training = Database['public']['Tables']['trainings']['Row'];
type TrainingInsert = Database['public']['Tables']['trainings']['Insert'];
type TrainingUpdate = Database['public']['Tables']['trainings']['Update'];

export interface OperationResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}

export interface UserPermissions {
  canEditEmployees: boolean;
  canCreateTrainings: boolean;
  canEditTrainings: boolean;
  canManageCertificates: boolean;
  isAdmin: boolean;
}

export class SecureDatabaseService {
  private static instance: SecureDatabaseService;
  
  public static getInstance(): SecureDatabaseService {
    if (!SecureDatabaseService.instance) {
      SecureDatabaseService.instance = new SecureDatabaseService();
    }
    return SecureDatabaseService.instance;
  }

  /**
   * Get current user session and validate authentication
   */
  private async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new Error('User not authenticated');
    }
    return user;
  }

  /**
   * Check user permissions for specific operations
   * This would integrate with your role-based access control system
   */
  private async getUserPermissions(): Promise<UserPermissions> {
    try {
      const user = await this.getCurrentUser();
      
      // For now, assuming all authenticated users have basic permissions
      // This should be replaced with actual role checking from your system
      return {
        canEditEmployees: true,
        canCreateTrainings: true,
        canEditTrainings: true,
        canManageCertificates: true,
        isAdmin: false // This should come from user roles
      };
    } catch (error) {
      return {
        canEditEmployees: false,
        canCreateTrainings: false,
        canEditTrainings: false,
        canManageCertificates: false,
        isAdmin: false
      };
    }
  }

  /**
   * Log AI operations for audit trail
   */
  private async logAIOperation(operation: string, table: string, recordId: string, changes: Record<string, unknown>) {
    try {
      const user = await this.getCurrentUser();
      
      // Insert audit log - you might want to create an audit_logs table
      console.log('🔍 AI Operation:', {
        userId: user.id,
        userEmail: user.email,
        operation,
        table,
        recordId,
        changes,
        timestamp: new Date().toISOString(),
        source: 'AI_ASSISTANT'
      });
      
      // TODO: Insert into actual audit_logs table when created
    } catch (error) {
      console.error('Failed to log AI operation:', error);
    }
  }

  /**
   * Validate and sanitize input data
   */
  private validateEmployeeData(data: Partial<EmployeeUpdate>): OperationResult {
    const allowedFields = [
      'first_name', 'last_name', 'tussenvoegsel', 'roepnaam', 'email', 
      'phone', 'mobile_phone', 'date_of_birth', 'address', 'city', 
      'country', 'nationality', 'job_title', 'department', 'notes'
    ];

    const invalidFields = Object.keys(data).filter(field => !allowedFields.includes(field));
    if (invalidFields.length > 0) {
      return {
        success: false,
        message: `Invalid fields: ${invalidFields.join(', ')}`,
        error: 'INVALID_FIELDS'
      };
    }

    // Email validation
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return {
        success: false,
        message: 'Invalid email format',
        error: 'INVALID_EMAIL'
      };
    }

    // Date validation
    if (data.date_of_birth && isNaN(Date.parse(data.date_of_birth))) {
      return {
        success: false,
        message: 'Invalid date format for date_of_birth',
        error: 'INVALID_DATE'
      };
    }

    return { success: true, message: 'Valid data' };
  }

  /**
   * Find employee ID by name, email, or employee number
   */
  async findEmployeeId(searchTerm: string): Promise<{ id: string; name: string } | null> {
    try {
      const { data: employees, error } = await supabase
        .from('employees')
        .select('id, name, email, employee_number, first_name, last_name, roepnaam')
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,employee_number.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,roepnaam.ilike.%${searchTerm}%`);

      if (error || !employees || employees.length === 0) {
        return null;
      }

      // Return the first match (you might want to handle multiple matches differently)
      const employee = employees[0];
      return {
        id: employee.id,
        name: employee.name
      };
    } catch (error) {
      console.error('Error finding employee:', error);
      return null;
    }
  }

  /**
   * Update employee data with permission checking
   */
  async updateEmployee(employeeId: string, updates: Partial<EmployeeUpdate>): Promise<OperationResult> {
    try {
      // Check authentication and permissions
      const user = await this.getCurrentUser();
      const permissions = await this.getUserPermissions();
      
      if (!permissions.canEditEmployees) {
        return {
          success: false,
          message: 'You do not have permission to edit employee data',
          error: 'INSUFFICIENT_PERMISSIONS'
        };
      }

      // Validate input data
      const validation = this.validateEmployeeData(updates);
      if (!validation.success) {
        return validation;
      }

      // Get current employee data for comparison
      const { data: currentEmployee, error: fetchError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .single();

      if (fetchError || !currentEmployee) {
        return {
          success: false,
          message: 'Employee not found',
          error: 'EMPLOYEE_NOT_FOUND'
        };
      }

      // Perform the update using user's session (RLS policies apply)
      const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', employeeId)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          message: `Failed to update employee: ${error.message}`,
          error: 'UPDATE_FAILED'
        };
      }

      // Log the operation
      await this.logAIOperation('UPDATE_EMPLOYEE', 'employees', employeeId, updates);

      return {
        success: true,
        message: `Successfully updated employee ${currentEmployee.name}`,
        data
      };

    } catch (error) {
      return {
        success: false,
        message: `Error updating employee: ${error}`,
        error: 'SYSTEM_ERROR'
      };
    }
  }

  /**
   * Create a new training with permission checking
   */
  async createTraining(trainingData: TrainingInsert): Promise<OperationResult> {
    try {
      const user = await this.getCurrentUser();
      const permissions = await this.getUserPermissions();
      
      if (!permissions.canCreateTrainings) {
        return {
          success: false,
          message: 'You do not have permission to create trainings',
          error: 'INSUFFICIENT_PERMISSIONS'
        };
      }

      // Validate required fields
      if (!trainingData.course_id || !trainingData.start_date) {
        return {
          success: false,
          message: 'Course ID and start date are required',
          error: 'MISSING_REQUIRED_FIELDS'
        };
      }

      // Create the training
      const { data, error } = await supabase
        .from('trainings')
        .insert(trainingData)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          message: `Failed to create training: ${error.message}`,
          error: 'CREATE_FAILED'
        };
      }

      // Log the operation
      await this.logAIOperation('CREATE_TRAINING', 'trainings', data.id, trainingData);

      return {
        success: true,
        message: 'Successfully created training',
        data
      };

    } catch (error) {
      return {
        success: false,
        message: `Error creating training: ${error}`,
        error: 'SYSTEM_ERROR'
      };
    }
  }

  /**
   * Update training data with permission checking
   */
  async updateTraining(trainingId: string, updates: Partial<TrainingUpdate>): Promise<OperationResult> {
    try {
      const user = await this.getCurrentUser();
      const permissions = await this.getUserPermissions();
      
      if (!permissions.canEditTrainings) {
        return {
          success: false,
          message: 'You do not have permission to edit trainings',
          error: 'INSUFFICIENT_PERMISSIONS'
        };
      }

      // Get current training for validation
      const { data: currentTraining, error: fetchError } = await supabase
        .from('trainings')
        .select('*')
        .eq('id', trainingId)
        .single();

      if (fetchError || !currentTraining) {
        return {
          success: false,
          message: 'Training not found',
          error: 'TRAINING_NOT_FOUND'
        };
      }

      // Perform the update
      const { data, error } = await supabase
        .from('trainings')
        .update(updates)
        .eq('id', trainingId)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          message: `Failed to update training: ${error.message}`,
          error: 'UPDATE_FAILED'
        };
      }

      // Log the operation
      await this.logAIOperation('UPDATE_TRAINING', 'trainings', trainingId, updates);

      return {
        success: true,
        message: 'Successfully updated training',
        data
      };

    } catch (error) {
      return {
        success: false,
        message: `Error updating training: ${error}`,
        error: 'SYSTEM_ERROR'
      };
    }
  }

  /**
   * Add participant to training with validation
   */
  async addTrainingParticipant(trainingId: string, employeeId: string): Promise<OperationResult> {
    try {
      const user = await this.getCurrentUser();
      const permissions = await this.getUserPermissions();
      
      if (!permissions.canEditTrainings) {
        return {
          success: false,
          message: 'You do not have permission to manage training participants',
          error: 'INSUFFICIENT_PERMISSIONS'
        };
      }

      // Check if participant already exists
      const { data: existing } = await supabase
        .from('training_participants')
        .select('id')
        .eq('training_id', trainingId)
        .eq('employee_id', employeeId)
        .single();

      if (existing) {
        return {
          success: false,
          message: 'Employee is already registered for this training',
          error: 'ALREADY_REGISTERED'
        };
      }

      // Add participant
      const { data, error } = await supabase
        .from('training_participants')
        .insert({
          training_id: trainingId,
          employee_id: employeeId,
          status: 'registered'
        })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          message: `Failed to add participant: ${error.message}`,
          error: 'ADD_PARTICIPANT_FAILED'
        };
      }

      // Log the operation
      await this.logAIOperation('ADD_PARTICIPANT', 'training_participants', data.id, {
        training_id: trainingId,
        employee_id: employeeId
      });

      return {
        success: true,
        message: 'Successfully added participant to training',
        data
      };

    } catch (error) {
      return {
        success: false,
        message: `Error adding participant: ${error}`,
        error: 'SYSTEM_ERROR'
      };
    }
  }

  /**
   * Update employee license/certificate with permission checking
   */
  async updateEmployeeLicense(employeeId: string, licenseData: {
    license_type: string;
    issue_date?: string;
    expiry_date?: string;
    issuing_authority?: string;
    status?: string;
  }): Promise<OperationResult> {
    try {
      const user = await this.getCurrentUser();
      const permissions = await this.getUserPermissions();
      
      if (!permissions.canManageCertificates) {
        return {
          success: false,
          message: 'You do not have permission to manage certificates',
          error: 'INSUFFICIENT_PERMISSIONS'
        };
      }

      // Check if license already exists
      const { data: existing } = await supabase
        .from('employee_licenses')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('license_type', licenseData.license_type)
        .single();

      let result;
      if (existing) {
        // Update existing license
        result = await supabase
          .from('employee_licenses')
          .update(licenseData)
          .eq('id', existing.id)
          .select()
          .single();
      } else {
        // Create new license
        result = await supabase
          .from('employee_licenses')
          .insert({
            employee_id: employeeId,
            ...licenseData
          })
          .select()
          .single();
      }

      if (result.error) {
        return {
          success: false,
          message: `Failed to update license: ${result.error.message}`,
          error: 'LICENSE_UPDATE_FAILED'
        };
      }

      // Log the operation
      await this.logAIOperation(
        existing ? 'UPDATE_LICENSE' : 'CREATE_LICENSE',
        'employee_licenses',
        result.data.id,
        licenseData
      );

      return {
        success: true,
        message: `Successfully ${existing ? 'updated' : 'created'} license`,
        data: result.data
      };

    } catch (error) {
      return {
        success: false,
        message: `Error managing license: ${error}`,
        error: 'SYSTEM_ERROR'
      };
    }
  }
}