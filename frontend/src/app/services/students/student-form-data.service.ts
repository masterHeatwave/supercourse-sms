import { Injectable } from '@angular/core';
import { LoggingService } from '../logging/logging.service';
import { PostUsersStudentsBody } from '@gen-api/schemas/postUsersStudentsBody';
import { PostUsersStudentsBodyContactsItem } from '@gen-api/schemas/postUsersStudentsBodyContactsItem';

export interface IStudentFormData {
  // Personal info
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  optionalPhone?: string;
  mobile?: string;
  dateOfBirth?: string;
  date?: string | Date; // Registration date
  
  // Address info
  address?: string;
  city?: string;
  country?: string;
  zipcode?: string;
  
  // Additional info
  branch?: string;
  branches?: string[]; // Will be populated from dropdown
  default_branch?: string; // Will be populated from auth
  status?: boolean;
  documents?: any[];
  avatar?: File | string;

  // Contact info
  contacts?: any[];

  // Health info
  hasAllergies?: boolean;
  healthDetails?: string;
  generalNotes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StudentFormDataService {
  constructor(private loggingService: LoggingService) {}

  processFormData(formData: IStudentFormData): IStudentFormData {
    this.loggingService.debug('Processing student form data');
    
    const processedData = {
      ...formData,
      dateOfBirth: formData.dateOfBirth ? this.formatDateToLocalString(formData.dateOfBirth) : undefined
    };

    // Handle branch field mapping - this will be handled at component level
    // The branch field contains the branch name, but backend expects branches as array of IDs

    return processedData;
  }

  private formatDateToLocalString(dateValue: string | Date): string {
    const date = new Date(dateValue);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  applyFieldMappings(data: IStudentFormData): PostUsersStudentsBody {
    this.loggingService.debug('Applying field mappings');
    
    // Handle multiple contacts
    const contacts: PostUsersStudentsBodyContactsItem[] = [];
    if (data.contacts && Array.isArray(data.contacts)) {
      data.contacts.forEach(contact => {
        if (contact.name && contact.phone && contact.email && contact.relationship) {
          contacts.push({
            name: contact.name,
            phone: contact.phone,
            email: contact.email,
            relationship: contact.relationship,
            isPrimaryContact: contact.isPrimaryContact || false
          });
        }
      });
    }

    // Handle registration date - map date field to registration_date
    let registration_date: string | undefined;
    if (data.date) {
      try {
        const dateValue = new Date(data.date.toString());
        if (!isNaN(dateValue.getTime())) {
          // Format date as YYYY-MM-DDTHH:mm:ss.sssZ to avoid timezone issues
          // Get the date components in local timezone to preserve the selected date
          const year = dateValue.getFullYear();
          const month = String(dateValue.getMonth() + 1).padStart(2, '0');
          const day = String(dateValue.getDate()).padStart(2, '0');
          // Create ISO datetime string with UTC midnight to preserve the date
          registration_date = `${year}-${month}-${day}T00:00:00.000Z`;
        }
      } catch (e) {
        this.loggingService.warn(`Could not parse date ('${data.date}') as a valid date.`, e);
        if (typeof data.date === 'string') {
          registration_date = data.date;
        }
      }
    }

    const mappedData: any = {
      id: crypto.randomUUID(),
      username: data.email, // Using email as username
      code: crypto.randomUUID().slice(0, 8), // Generate a random code
      firstname: data.firstname,
      lastname: data.lastname,
      email: data.email,
      phone: data.phone || '',
      mobile: data.optionalPhone || '',
      city: data.city,
      country: data.country,
      address: data.address,
      zipcode: data.zipcode,
      birthday: data.dateOfBirth,
      is_active: true,
      user_type: 'student',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      avatar: data.avatar instanceof File ? data.avatar.name : data.avatar,
      documents: data.documents || [],
      contacts: contacts,
      default_branch: data.default_branch || '',
      branches: data.branches || [],
      // Include health information fields
      hasAllergies: data.hasAllergies !== undefined ? data.hasAllergies : false,
      healthDetails: data.healthDetails || '',
      generalNotes: data.generalNotes || ''
    };

    // Add registration_date if available
    if (registration_date) {
      mappedData.registration_date = registration_date;
    }

    return mappedData;
  }


} 