export type UserRole = 'worker' | 'employer' | 'admin';
export type AvailabilityStatus = 'Available' | 'Busy' | 'Away';
export type EmployerStatus = 'Mr' | 'Mrs' | 'Miss' | 'Family' | 'Company';

export interface SiteSettings {
  siteName: string;
  siteLogo: string;
  updatedAt: any;
}

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  firstName: string;
  surname: string;
  phone?: string;
  whatsapp?: string;
  location: string;
  photoURL?: string;
  age?: number;
  employerStatus?: EmployerStatus;
  isPremium?: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface WorkerProfile {
  userId: string;
  category: string;
  age: number;
  gender: 'male' | 'female';
  yearsExperience: number;
  languages: string[];
  skills: string[];
  availability: AvailabilityStatus;
  bio: string;
  isVerified: boolean;
  hasPoliceClearance: boolean;
  policeClearanceUrl?: string;
  workPhotos: string[];
  rating: number;
  reviewCount: number;
}

export interface Review {
  id: string;
  fromId: string;
  toWorkerId: string;
  rating: number;
  comment: string;
  createdAt: any;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  policeClearanceUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: any;
  reviewedBy?: string;
}

export const WORKER_CATEGORIES = [
  'Maid',
  'Gardener',
  'House Helper',
  'Nanny',
  'Cook',
  'Elderly Caregiver',
  'Security Guard',
  'Driver',
  'Babysitter',
  'Laundry Assistant',
  'Farm Worker',
  'Other'
];
