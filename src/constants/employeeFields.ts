// Employee Department and Work Location Constants

// Common departments for Dutch transport/logistics companies
export const DEPARTMENT_OPTIONS = [
  'Administration',
  'Customer Service',
  'Finance',
  'Human Resources',
  'IT',
  'Logistics',
  'Maintenance',
  'Management',
  'Operations',
  'Planning',
  'Quality Control',
  'Safety & Compliance',
  'Sales',
  'Transport',
  'Warehouse'
];

// Common work locations for Dutch transport companies
export const WORK_LOCATION_OPTIONS = [
  'Almere',
  'Almelo',
  'Amersfoort',
  'Amsterdam',
  'Apeldoorn',
  'Arnhem',
  'Assen',
  'Breda',
  'Dordrecht',
  'Eindhoven',
  'Emmen',
  'Enschede',
  'Groningen',
  'Haarlem',
  'Haarlemmermeer',
  'Head Office',
  'Helmond',
  'Hilversum',
  'Home Office',
  'Leeuwarden',
  'Leiden',
  'Lelystad',
  'Maastricht',
  'Nijmegen',
  'On-site Client',
  'Remote Work',
  'Rotterdam',
  'The Hague',
  'Tilburg',
  'Utrecht',
  'Various Locations',
  'Venlo',
  'Zaanstad',
  'Zoetermeer',
  'Zwolle'
];

// Helper function to get combined options (existing + predefined)
export const getCombinedDepartmentOptions = (existingDepartments: string[] = []) => {
  const combined = [...new Set([...DEPARTMENT_OPTIONS, ...existingDepartments])];
  return combined.sort();
};

export const getCombinedWorkLocationOptions = (existingLocations: string[] = []) => {
  const combined = [...new Set([...WORK_LOCATION_OPTIONS, ...existingLocations])];
  return combined.sort();
};