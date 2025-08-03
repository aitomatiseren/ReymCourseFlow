// Unified Form Patterns for Consistent Form Handling
import { FieldError, FieldErrors } from "react-hook-form";
import { DesignTokens } from "./design-tokens";

// Standard form field states
export const FormFieldStates = {
  default: {
    border: 'border-input',
    ring: 'focus:ring-ring',
    background: 'bg-background',
  },
  error: {
    border: 'border-red-500',
    ring: 'focus:ring-red-500',
    background: 'bg-red-50',
  },
  success: {
    border: 'border-green-500',
    ring: 'focus:ring-green-500',
    background: 'bg-green-50',
  },
  disabled: {
    border: 'border-gray-200',
    ring: 'focus:ring-gray-300',
    background: 'bg-gray-50',
  },
} as const;

// Standard form field sizes
export const FormFieldSizes = {
  sm: {
    height: 'h-8',
    padding: 'px-3 py-1.5',
    text: 'text-sm',
  },
  md: {
    height: 'h-10',
    padding: 'px-3 py-2',
    text: 'text-sm',
  },
  lg: {
    height: 'h-12',
    padding: 'px-4 py-3',
    text: 'text-base',
  },
} as const;

// Helper to get field state classes
export const getFieldStateClasses = (
  hasError: boolean,
  disabled?: boolean,
  success?: boolean
) => {
  if (disabled) return FormFieldStates.disabled;
  if (hasError) return FormFieldStates.error;
  if (success) return FormFieldStates.success;
  return FormFieldStates.default;
};

// Helper to format error messages consistently
export const formatErrorMessage = (error?: FieldError): string => {
  if (!error) return '';
  
  if (error.type === 'required') {
    return 'This field is required';
  }
  
  if (error.type === 'minLength') {
    return `Minimum length is ${error.message}`;
  }
  
  if (error.type === 'maxLength') {
    return `Maximum length is ${error.message}`;
  }
  
  if (error.type === 'pattern') {
    return 'Please enter a valid format';
  }
  
  if (error.type === 'min') {
    return `Minimum value is ${error.message}`;
  }
  
  if (error.type === 'max') {
    return `Maximum value is ${error.message}`;
  }
  
  if (error.type === 'validate') {
    return error.message || 'Invalid value';
  }
  
  return error.message || 'Invalid input';
};

// Helper to check if any field has errors
export const hasAnyErrors = (errors: FieldErrors): boolean => {
  return Object.keys(errors).length > 0;
};

// Helper to get nested error
export const getNestedError = (errors: FieldErrors, path: string): FieldError | undefined => {
  const keys = path.split('.');
  let current: any = errors;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  
  return current as FieldError;
};

// Standard form validation patterns
export const ValidationPatterns = {
  email: {
    pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    message: 'Please enter a valid email address',
  },
  phone: {
    pattern: /^[\+]?[0-9\-\(\)\s]+$/,
    message: 'Please enter a valid phone number',
  },
  dutchPhone: {
    pattern: /^(\+31|0)[0-9]{9}$/,
    message: 'Please enter a valid Dutch phone number',
  },
  dutchPostalCode: {
    pattern: /^[1-9][0-9]{3}\s?[A-Z]{2}$/i,
    message: 'Please enter a valid Dutch postal code (e.g., 1234 AB)',
  },
  bsn: {
    pattern: /^[0-9]{8,9}$/,
    message: 'Please enter a valid BSN (8-9 digits)',
  },
  employeeNumber: {
    pattern: /^[A-Z0-9]{3,10}$/i,
    message: 'Employee number should be 3-10 alphanumeric characters',
  },
  url: {
    pattern: /^https?:\/\/.+\..+/,
    message: 'Please enter a valid URL starting with http:// or https://',
  },
} as const;

// Standard form messages
export const FormMessages = {
  loading: 'Loading...',
  saving: 'Saving...',
  saved: 'Changes saved successfully',
  error: 'An error occurred. Please try again.',
  required: 'This field is required',
  networkError: 'Network error. Please check your connection.',
  validationError: 'Please correct the errors below.',
  confirmDelete: 'Are you sure you want to delete this item?',
  unsavedChanges: 'You have unsaved changes. Are you sure you want to leave?',
} as const;

// Standard button variants for forms
export const FormButtonVariants = {
  primary: {
    base: 'bg-primary text-primary-foreground hover:bg-primary/90',
    disabled: 'bg-gray-300 text-gray-500 cursor-not-allowed',
  },
  secondary: {
    base: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    disabled: 'bg-gray-100 text-gray-400 cursor-not-allowed',
  },
  destructive: {
    base: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    disabled: 'bg-red-200 text-red-400 cursor-not-allowed',
  },
  outline: {
    base: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    disabled: 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed',
  },
} as const;

// Helper to get button classes
export const getButtonClasses = (
  variant: keyof typeof FormButtonVariants,
  disabled: boolean = false,
  size: keyof typeof FormFieldSizes = 'md'
) => {
  const variantClasses = FormButtonVariants[variant];
  const sizeClasses = FormFieldSizes[size];
  
  return {
    base: disabled ? variantClasses.disabled : variantClasses.base,
    size: `${sizeClasses.height} ${sizeClasses.padding} ${sizeClasses.text}`,
  };
};

// Standard spacing for form elements
export const FormSpacing = {
  field: 'mb-4',
  fieldGroup: 'mb-6',
  section: 'mb-8',
  button: 'mt-6',
  buttonGroup: 'mt-8 space-x-3',
} as const;