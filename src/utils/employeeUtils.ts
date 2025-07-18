import { supabase } from "@/integrations/supabase/client";

/**
 * Generates a unique employee number in the format EMP-YYYY-NNNN
 * where YYYY is the current year and NNNN is a sequential number
 */
export async function generateEmployeeNumber(): Promise<string> {
  try {
    const currentYear = new Date().getFullYear();
    const prefix = `EMP-${currentYear}-`;
    
    // Get the highest employee number for the current year
    const { data: employees, error } = await supabase
      .from('employees')
      .select('employee_number')
      .like('employee_number', `${prefix}%`)
      .order('employee_number', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching employee numbers:', error);
      throw error;
    }

    let nextNumber = 1;
    
    if (employees && employees.length > 0) {
      const lastEmployeeNumber = employees[0].employee_number;
      if (lastEmployeeNumber) {
        // Extract the number part from the last employee number
        const numberPart = lastEmployeeNumber.split('-')[2];
        if (numberPart) {
          nextNumber = parseInt(numberPart, 10) + 1;
        }
      }
    }

    // Format the number with leading zeros (4 digits)
    const formattedNumber = nextNumber.toString().padStart(4, '0');
    
    return `${prefix}${formattedNumber}`;
  } catch (error) {
    console.error('Error generating employee number:', error);
    // Fallback to timestamp-based number if database query fails
    const timestamp = Date.now().toString().slice(-4);
    return `EMP-${new Date().getFullYear()}-${timestamp}`;
  }
}

/**
 * Checks if an employee number already exists in the database
 */
export async function isEmployeeNumberExists(employeeNumber: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('id')
      .eq('employee_number', employeeNumber)
      .limit(1);

    if (error) {
      console.error('Error checking employee number:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking employee number:', error);
    return false;
  }
}

/**
 * Validates employee number format
 */
export function validateEmployeeNumber(employeeNumber: string): boolean {
  // Check format: EMP-YYYY-NNNN
  const regex = /^EMP-\d{4}-\d{4}$/;
  return regex.test(employeeNumber);
}

/**
 * Generates a unique employee number with retry logic
 */
export async function generateUniqueEmployeeNumber(maxRetries: number = 5): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const employeeNumber = await generateEmployeeNumber();
    const exists = await isEmployeeNumberExists(employeeNumber);
    
    if (!exists) {
      return employeeNumber;
    }
    
    // If it exists, wait a bit and try again
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // If all retries failed, add a random suffix
  const baseNumber = await generateEmployeeNumber();
  const randomSuffix = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `${baseNumber}-${randomSuffix}`;
}