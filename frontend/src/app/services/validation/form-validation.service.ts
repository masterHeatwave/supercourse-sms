import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MessageService } from 'primeng/api';

export interface ValidationConfig {
  fieldLabels: { [key: string]: string };
  customValidators?: { [key: string]: (value: any) => boolean };
}

@Injectable({
  providedIn: 'root'
})
export class FormValidationService {
  
  constructor(private messageService: MessageService) {}

  /**
   * Display validation errors for a form
   */
  showValidationErrors(form: FormGroup, config: ValidationConfig, additionalErrors?: string[]): void {
    // Clear any existing validation messages first
    this.messageService.clear();
    
    const invalidFields = this.getInvalidFields(form, config);
    
    // Add any additional errors (like contacts validation)
    if (additionalErrors && additionalErrors.length > 0) {
      additionalErrors.forEach((error) => {
        if (!invalidFields.includes(error)) {
          invalidFields.push(error);
        }
      });
    }

    if (invalidFields.length > 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Please complete required fields',
        detail: `Missing or invalid: ${invalidFields.join(', ')}`,
        life: 5000
      });
    }
  }

  /**
   * Get list of invalid field labels from a form
   */
  getInvalidFields(form: FormGroup, config: ValidationConfig): string[] {
    const invalidFields: string[] = [];

    const collectInvalid = (control: any, key?: string) => {
      if (!control) return;

      // If it's a leaf control and invalid, collect its label
      const isLeaf = !control.controls;
      if (isLeaf) {
        if (control.invalid && key) {
          const fieldLabel = this.getFieldLabel(key, config.fieldLabels);
          if (!invalidFields.includes(fieldLabel)) {
            invalidFields.push(fieldLabel);
          }
        }
        return;
      }

      // If it's a FormArray (controls is an array)
      if (Array.isArray(control.controls)) {
        control.controls.forEach((child: any) => collectInvalid(child));
        return;
      }

      // If it's a FormGroup (controls is an object)
      Object.keys(control.controls).forEach((childKey) => {
        const child = control.controls[childKey];
        if (child && child.controls) {
          collectInvalid(child, childKey);
        } else if (child && child.invalid) {
          const fieldLabel = this.getFieldLabel(childKey, config.fieldLabels);
          if (!invalidFields.includes(fieldLabel)) {
            invalidFields.push(fieldLabel);
          }
        } else if (child && !child.controls) {
          collectInvalid(child, childKey);
        }
      });
    };

    collectInvalid(form);
    return invalidFields;
  }

  /**
   * Get user-friendly field label
   */
  private getFieldLabel(fieldName: string, fieldLabels: { [key: string]: string }): string {
    return fieldLabels[fieldName] || this.formatFieldName(fieldName);
  }

  /**
   * Convert camelCase field names to readable labels
   */
  private formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Check if contacts have validation errors
   */
  validateContacts(contacts: any[]): string[] {
    const errors: string[] = [];
    
    if (!contacts || contacts.length === 0) {
      return errors; // No contacts is valid
    }

    // Filter out completely empty contacts
    const validContacts = contacts.filter(contact => 
      contact.name || contact.phone || contact.email
    );

    if (validContacts.length === 0) {
      return errors; // No valid contacts to validate
    }

    // Validate individual contact fields
    validContacts.forEach((contact, index) => {
      const missingFields: string[] = [];
      
      if (!contact.name) missingFields.push('Contact Name');
      if (!contact.phone) missingFields.push('Contact Phone');
      if (!contact.email) missingFields.push('Contact Email');
      if (!contact.relationship) missingFields.push('Contact Relationship');
      
      if (missingFields.length > 0) {
        errors.push(`Contact ${index + 1}: ${missingFields.join(', ')}`);
      }
    });

    // Validate primary contact logic
    if (validContacts.length > 1) {
      const primaryContacts = validContacts.filter(contact => contact.isPrimaryContact === true);
      
      if (primaryContacts.length === 0) {
        errors.push('Primary Contact: At least one contact must be marked as primary');
      } else if (primaryContacts.length > 1) {
        errors.push('Primary Contact: Only one contact can be marked as primary');
      }
    }

    return errors;
  }

  /**
   * Validate required fields for API data
   */
  validateRequiredApiFields(data: any, type: 'student' | 'staff'): string[] {
    let requiredFields: string[];
    
    if (type === 'student') {
      requiredFields = ['firstname', 'lastname', 'email', 'phone', 'customers'];
    } else {
      requiredFields = ['firstname', 'lastname', 'email', 'phone', 'customer'];
    }
    
    // Check for either branch or branches field
    const hasBranch = data['branch'] || (data['branches'] && data['branches'].length > 0);
    if (!hasBranch) {
      requiredFields.push('branches');
    }
    
    return requiredFields.filter(field => {
      const value = data[field];
      return !value || (Array.isArray(value) && value.length === 0);
    });
  }

  /**
   * Ensure customer ID is set in data
   */
  ensureCustomerId(data: any, customerId: string | null | undefined, type: 'student' | 'staff'): void {
    if (!customerId) return;
    
    if (type === 'student') {
      if (!data.customers) {
        data.customers = [customerId];
      }
    } else {
      if (!data.customer) {
        data.customer = customerId;
      }
    }
  }

  /**
   * Validate API data and show validation errors
   */
  validateApiData(data: any, type: 'student' | 'staff', customerId?: string | null): { isValid: boolean; errors: string[] } {
    // Ensure customer ID is set
    this.ensureCustomerId(data, customerId, type);

    // Validate required fields
    const missingFields = this.validateRequiredApiFields(data, type);

    if (missingFields.length > 0) {
      const message = `Missing required fields: ${missingFields.join(', ')}`;
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: message
      });
      return { isValid: false, errors: missingFields };
    }

    return { isValid: true, errors: [] };
  }

  /**
   * Prevent multiple form submissions
   */
  createSubmissionGuard(): {
    canSubmit: () => boolean;
    startSubmission: () => void;
    endSubmission: () => void;
  } {
    let isSubmitting = false;

    return {
      canSubmit: () => !isSubmitting,
      startSubmission: () => { isSubmitting = true; },
      endSubmission: () => { isSubmitting = false; }
    };
  }
}

// Predefined field label configurations
export const STUDENT_FIELD_LABELS: { [key: string]: string } = {
  firstname: 'First Name',
  lastname: 'Last Name',
  email: 'Email',
  phone: 'Phone',
  optionalPhone: 'Optional Phone',
  mobile: 'Mobile',
  dateOfBirth: 'Date of Birth',
  address: 'Address',
  city: 'City',
  country: 'Country',
  zipcode: 'Zip Code',
  branch: 'Branch',
  healthConditions: 'Health Conditions',
  allergies: 'Allergies',
  medications: 'Medications',
  generalNotes: 'General Notes'
};

export const STAFF_FIELD_LABELS: { [key: string]: string } = {
  firstname: 'First Name',
  lastname: 'Last Name',
  email: 'Email',
  phone: 'Phone',
  mobile: 'Mobile',
  address: 'Address',
  city: 'City',
  country: 'Country',
  zipcode: 'Zip Code',
  branch: 'Branch',
  role: 'Role',
  startDate: 'Start Date',
  socialMediaHandles: 'Social Media',
  notes: 'Notes'
};

export const SESSION_FIELD_LABELS: { [key: string]: string } = {
  title: 'Session Title',
  description: 'Description',
  class: 'Class',
  teachers: 'Teachers',
  students: 'Students',
  startDate: 'Start Date',
  endDate: 'End Date',
  duration: 'Duration',
  // Fields used in class sessions form
  day: 'Day',
  startTime: 'Start Time',
  dateRange: 'Start/End Date',
  frequencyValue: 'Frequency',
  mode: 'Mode',
  classroom: 'Classroom'
}; 

// Label mapping for class creation/edit forms
export const CLASS_FIELD_LABELS: { [key: string]: string } = {
  academicYear: 'Academic Year',
  academicPeriod: 'Academic Period',
  name: 'Name',
  branch: 'Branch',
  subject: 'Subject',
  level: 'Level'
};