
export interface Employee {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  tussenvoegsel?: string;
  roepnaam?: string;
  email: string;
  privateEmail?: string;
  department: string;
  employeeNumber: string;
  licenses: string[];
  managerId?: string;
  // Personal Information
  dateOfBirth?: string;
  deathDate?: string;
  gender?: 'male' | 'female' | 'other';
  birthPlace?: string;
  birthCountry?: string;
  address?: string;
  postcode?: string;
  city?: string;
  country?: string;
  phone?: string;
  mobilePhone?: string;
  nationality?: string;
  personalId?: string; // BSN or similar
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed' | 'separated' | 'domestic_partnership' | 'civil_union' | 'engaged' | 'cohabiting' | 'unknown';
  marriageDate?: string;
  divorceDate?: string;
  website?: string;
  // Employment Information
  hireDate?: string;
  contractType?: 'permanent' | 'temporary' | 'freelance';
  workLocation?: string;
  jobTitle?: string;
  salary?: number;
  workingHours?: number;
  // KVM (Identity Verification)
  idProofType?: string;
  idProofNumber?: string;
  idProofExpiryDate?: string;
  // Driving Licenses
  drivingLicenseA?: boolean;
  drivingLicenseAStartDate?: string;
  drivingLicenseAExpiryDate?: string;
  drivingLicenseB?: boolean;
  drivingLicenseBStartDate?: string;
  drivingLicenseBExpiryDate?: string;
  drivingLicenseBE?: boolean;
  drivingLicenseBEStartDate?: string;
  drivingLicenseBEExpiryDate?: string;
  drivingLicenseC?: boolean;
  drivingLicenseCStartDate?: string;
  drivingLicenseCExpiryDate?: string;
  drivingLicenseCE?: boolean;
  drivingLicenseCEStartDate?: string;
  drivingLicenseCEExpiryDate?: string;
  drivingLicenseD?: boolean;
  drivingLicenseDStartDate?: string;
  drivingLicenseDExpiryDate?: string;
  drivingLicenseCode95?: boolean;
  drivingLicenseCode95StartDate?: string;
  drivingLicenseCode95ExpiryDate?: string;
  // Status and Communication
  status: 'active' | 'inactive' | 'on_leave' | 'sick' | 'terminated';
  employeeStatus?: 'available' | 'on_leave' | 'sick' | 'vacation' | 'unavailable';
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  notes?: string;
  lastActive?: string;
}

export interface Certificate {
  id: string;
  employeeId: string;
  employeeName: string;
  courseName: string;
  certificateNumber: string;
  issueDate: string;
  expiryDate: string;
  status: 'valid' | 'expiring' | 'expired';
  category: string;
  provider: string;
  code95Points?: number;
  replacementType?: string; // For HDO -> HDO-M replacement
}

export interface CostComponent {
  name: string;
  amount: number;
  description: string;
}

export interface Training {
  id: string;
  title: string;
  description: string;
  instructor: string;
  instructorId: string;
  date: string;
  time: string;
  location: string;
  maxParticipants: number;
  participants: TrainingParticipant[];
  materials: TrainingMaterial[];
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
  code95Points?: number;
  requiresApproval: boolean;
  organizerId: string;
  price?: number;
  cost_breakdown?: CostComponent[];
}

export interface TrainingParticipant {
  employeeId: string;
  employeeName: string;
  status: 'enrolled' | 'attended' | 'absent' | 'cancelled';
  registrationDate: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

export interface TrainingMaterial {
  id: string;
  name: string;
  type: 'equipment' | 'book' | 'document';
  required: boolean;
  available: boolean;
}

export interface Notification {
  id: string;
  recipient_id: string;
  type: 'certificate_expiry' | 'training_reminder' | 'training_enrollment' | 'training_cancellation' | 'location_change' | 'instructor_change' | 'approval_required' | 'system_announcement' | 'employee_onboarding' | 'employee_departure';
  title: string;
  message: string;
  read: boolean;
  read_at: string | null;
  priority: 'low' | 'medium' | 'high';
  related_entity_type: string | null;
  related_entity_id: string | null;
  action_url: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
  // Computed fields
  recipient?: Employee;
}

export interface Code95Progress {
  employeeId: string;
  totalPoints: number;
  requiredPoints: number;
  pointsEarned: Certificate[];
  expiryDate: string;
}
