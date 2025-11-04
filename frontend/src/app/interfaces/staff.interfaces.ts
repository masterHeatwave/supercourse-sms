/**
 * Interface for staff data as represented in the form
 */
export interface IStaffFormData {
  // Personal info
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  phone: string;
  mobile?: string;

  // Address info
  address?: string;
  city?: string;
  region?: string;
  zipcode?: string;
  country?: string;

  // Role info
  branches?: string[];
  status?: boolean;
  startDate?: string | Date;
  role?: string;
  roleTitle?: string;

  // Media
  avatar?: File | string;
  documents?: IDocument[];

  // Social media
  facebook_link?: string;
  twitter_link?: string;
  linkedin_link?: string;

  // Notes
  notes?: string;
}

/**
 * Interface for staff data formatted for API requests
 */
export interface IStaffApiData {
  // Personal info (note API naming differences)
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  phone: string;
  mobile?: string;

  // Address info (note API naming differences)
  address?: string;
  city?: string;
  region?: string;
  zipcode?: string;
  country?: string;

  // Role info
  customer: string;
  status?: boolean;
  startDate?: string;
  role?: string;
  position?: string;

  // Media
  avatar?: string;
  documents?: string[];

  // Social media links
  facebook_link?: string;
  twitter_link?: string;
  linkedin_link?: string;

  // Notes
  notes?: string;

  // Index signature for dynamic properties
  [key: string]: any;
}

/**
 * Document interface for uploaded files
 */
export interface IDocument {
  id?: string;
  name: string;
  url?: string;
  size?: number;
  type?: string;
  path?: string;
  uploadDate?: string;
}

/**
 * Staff form section types
 */
export enum StaffFormSectionType {
  PERSONAL_INFO = 'personalInfo',
  SOCIAL_MEDIA = 'socialMedia',
  DOCUMENTS = 'documents'
}
