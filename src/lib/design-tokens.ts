// Design Token System for Consistent UI
// Centralized design tokens to ensure consistency across components

export const DesignTokens = {
  // Status Colors - using semantic naming for better maintainability
  status: {
    active: {
      background: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
      ring: 'ring-green-600/20',
      css: 'bg-green-50 text-green-700 border-green-200',
    },
    inactive: {
      background: 'bg-gray-50',
      text: 'text-gray-700',
      border: 'border-gray-200',
      ring: 'ring-gray-600/20',
      css: 'bg-gray-50 text-gray-700 border-gray-200',
    },
    onLeave: {
      background: 'bg-yellow-50',
      text: 'text-yellow-700',
      border: 'border-yellow-200',
      ring: 'ring-yellow-600/20',
      css: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    },
    sickShort: {
      background: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      ring: 'ring-orange-600/20',
      css: 'bg-orange-50 text-orange-700 border-orange-200',
    },
    sickLong: {
      background: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      ring: 'ring-red-600/20',
      css: 'bg-red-50 text-red-700 border-red-200',
    },
    vacation: {
      background: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      ring: 'ring-blue-600/20',
      css: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    unavailable: {
      background: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      ring: 'ring-purple-600/20',
      css: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    terminated: {
      background: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      ring: 'ring-red-600/20',
      css: 'bg-red-50 text-red-700 border-red-200',
    },
  },

  // Training Status Colors
  training: {
    scheduled: {
      background: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      css: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    inProgress: {
      background: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      css: 'bg-orange-50 text-orange-700 border-orange-200',
    },
    completed: {
      background: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
      css: 'bg-green-50 text-green-700 border-green-200',
    },
    cancelled: {
      background: 'bg-gray-50',
      text: 'text-gray-700',
      border: 'border-gray-200',
      css: 'bg-gray-50 text-gray-700 border-gray-200',
    },
  },

  // Certificate Status Colors
  certificate: {
    valid: {
      background: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
      css: 'bg-green-50 text-green-700 border-green-200',
    },
    expiringSoon: {
      background: 'bg-yellow-50',
      text: 'text-yellow-700',
      border: 'border-yellow-200',
      css: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    },
    expired: {
      background: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      css: 'bg-red-50 text-red-700 border-red-200',
    },
    suspended: {
      background: 'bg-gray-50',
      text: 'text-gray-700',
      border: 'border-gray-200',
      css: 'bg-gray-50 text-gray-700 border-gray-200',
    },
  },

  // Spacing System
  spacing: {
    xs: '0.125rem', // 2px
    sm: '0.25rem',  // 4px
    md: '0.5rem',   // 8px
    lg: '1rem',     // 16px
    xl: '1.5rem',   // 24px
    '2xl': '2rem',  // 32px
    '3xl': '3rem',  // 48px
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },

  // Typography Scale
  typography: {
    xs: {
      fontSize: '0.75rem',
      lineHeight: '1rem',
    },
    sm: {
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
    },
    base: {
      fontSize: '1rem',
      lineHeight: '1.5rem',
    },
    lg: {
      fontSize: '1.125rem',
      lineHeight: '1.75rem',
    },
    xl: {
      fontSize: '1.25rem',
      lineHeight: '1.75rem',
    },
    '2xl': {
      fontSize: '1.5rem',
      lineHeight: '2rem',
    },
  },

  // Font Weights
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // Shadow System
  shadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },

  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

// Helper functions for easier access
export const getStatusColors = (category: keyof typeof DesignTokens.status) => {
  return DesignTokens.status[category];
};

export const getTrainingColors = (status: keyof typeof DesignTokens.training) => {
  return DesignTokens.training[status];
};

export const getCertificateColors = (status: keyof typeof DesignTokens.certificate) => {
  return DesignTokens.certificate[status];
};

// Common component variants
export const BadgeVariants = {
  default: 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  status: (type: keyof typeof DesignTokens.status) => {
    const colors = DesignTokens.status[type];
    return `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors.css}`;
  },
  training: (status: keyof typeof DesignTokens.training) => {
    const colors = DesignTokens.training[status];
    return `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors.css}`;
  },
  certificate: (status: keyof typeof DesignTokens.certificate) => {
    const colors = DesignTokens.certificate[status];
    return `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors.css}`;
  },
};

// Component sizing variants
export const ComponentSizes = {
  xs: {
    padding: 'px-2 py-1',
    text: 'text-xs',
    height: 'h-6',
  },
  sm: {
    padding: 'px-2.5 py-1.5',
    text: 'text-xs',
    height: 'h-8',
  },
  md: {
    padding: 'px-3 py-2',
    text: 'text-sm',
    height: 'h-10',
  },
  lg: {
    padding: 'px-4 py-2',
    text: 'text-base',
    height: 'h-12',
  },
  xl: {
    padding: 'px-6 py-3',
    text: 'text-lg',
    height: 'h-14',
  },
};