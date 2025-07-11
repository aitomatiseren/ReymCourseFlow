// Modern OpenAI Tools format for function calling
export const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'update_employee_by_name',
      description: 'ALWAYS USE THIS to update any employee data when you have their name. This is the PRIMARY function for ALL employee modifications like changing roepnaam, email, phone, etc.',
      parameters: {
        type: 'object',
        properties: {
          searchTerm: {
            type: 'string',
            description: 'Employee name, email, or employee number to search for'
          },
          updates: {
            type: 'object',
            description: 'The fields to update with their new values',
            properties: {
              first_name: { type: 'string' },
              last_name: { type: 'string' },
              tussenvoegsel: { type: 'string' },
              roepnaam: { type: 'string' },
              email: { type: 'string' },
              phone: { type: 'string' },
              mobile_phone: { type: 'string' },
              date_of_birth: { type: 'string' },
              address: { type: 'string' },
              city: { type: 'string' },
              country: { type: 'string' },
              nationality: { type: 'string' },
              job_title: { type: 'string' },
              department: { type: 'string' },
              notes: { type: 'string' }
            }
          }
        },
        required: ['searchTerm', 'updates']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'navigate_to_page',
      description: 'Navigate the user to a specific page in the application',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The route path to navigate to (e.g., /scheduling, /participants)'
          },
          reason: {
            type: 'string', 
            description: 'Brief explanation of why navigating to this page'
          }
        },
        required: ['path', 'reason']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_employees',
      description: 'Search for employees with specific criteria',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search term for employee name, email, department, etc.'
          },
          filters: {
            type: 'object',
            description: 'Additional filters like department, status, hire date range',
            properties: {
              department: { type: 'string' },
              status: { type: 'string' },
              hireDateAfter: { type: 'string' },
              hireDateBefore: { type: 'string' }
            }
          }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'navigate_to_employee',
      description: 'Navigate to an employee profile using the search functionality - more reliable than direct URL navigation',
      parameters: {
        type: 'object',
        properties: {
          searchTerm: {
            type: 'string',
            description: 'Employee name, email, or employee number to search for and navigate to'
          }
        },
        required: ['searchTerm']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_training_secure',
      description: 'Create a new training with permission checking',
      parameters: {
        type: 'object',
        properties: {
          course_id: {
            type: 'string',
            description: 'The ID of the course for this training'
          },
          start_date: {
            type: 'string',
            description: 'Start date and time for the training (ISO format)'
          },
          end_date: {
            type: 'string',
            description: 'End date and time for the training (ISO format)'
          },
          instructor: {
            type: 'string',
            description: 'Name of the instructor'
          },
          location: {
            type: 'string',
            description: 'Training location'
          },
          max_participants: {
            type: 'number',
            description: 'Maximum number of participants'
          },
          notes: {
            type: 'string',
            description: 'Additional notes for the training'
          }
        },
        required: ['course_id', 'start_date']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_training_participant',
      description: 'Add an employee to a training with validation',
      parameters: {
        type: 'object',
        properties: {
          trainingId: {
            type: 'string',
            description: 'The ID of the training'
          },
          employeeId: {
            type: 'string',
            description: 'The ID of the employee to add'
          }
        },
        required: ['trainingId', 'employeeId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_employee_certificate',
      description: 'Update or create employee certificate/license with permission checking',
      parameters: {
        type: 'object',
        properties: {
          employeeId: {
            type: 'string',
            description: 'The ID of the employee'
          },
          certificateData: {
            type: 'object',
            description: 'Certificate information',
            properties: {
              license_type: { type: 'string' },
              issue_date: { type: 'string' },
              expiry_date: { type: 'string' },
              issuing_authority: { type: 'string' },
              status: { type: 'string' }
            },
            required: ['license_type']
          }
        },
        required: ['employeeId', 'certificateData']
      }
    }
  }
];