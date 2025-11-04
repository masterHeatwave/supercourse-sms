/**
 * Interface for student data as represented in the form
 */
export interface IStudentFormData {
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
    branch?: string;
    branches?: string[]; // Array of branch IDs for multi-select
    status?: boolean;
    startDate?: string;
    role?: string;
    roleTitle?: string;
    createdAt?: string | Date;
    dateOfBirth?: string | Date;
    date?: string | Date;
  
    // Media
    avatar?: File | string;
    documents?: IDocument[];
  
    // Contact info
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    relationship?: string;
    isPrimaryContact?: boolean;
  
    // Social media
    facebook?: string;
    twitter?: string;
    linkedin?: string;
  
      contacts?: IContact[];
  siblingAttending?: string[];
  }
  
  /**
   * Interface for student data formatted for API requests
   */
  export interface IStudentApiData {
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
  
  export interface IContact {
    name: string;
    phone: string;
    email: string;
    relationship: string;
    isPrimaryContact: boolean;
    _id?: string;
    id?: string;
  }
  
  