import { Injectable } from '@angular/core';
import { IStaffFormData, IStaffApiData } from '../../interfaces/staff.interfaces';
import { LoggingService } from '../logging/logging.service';

@Injectable({
  providedIn: 'root'
})
export class StaffFormDataService {
  constructor(private loggingService: LoggingService) {}

  /**
   * Process FormData or plain object from staff form into API-ready object
   */
  processFormData(formData: FormData | any): IStaffApiData {
    const staffData: Partial<IStaffApiData> = {};

    try {
      if (formData instanceof FormData) {
        // Convert FormData to a plain object for direct API use
        const formEntries: [string, FormDataEntryValue][] = [];
        formData.forEach((value, key) => {
          formEntries.push([key, value]);
        });

        // Process each entry in the FormData
        for (const [key, value] of formEntries) {
          this.processFormDataEntry(key, value, staffData);
        }
      } else {
        // Handle plain object
        for (const [key, value] of Object.entries(formData)) {
          this.processFormDataEntry(key, value, staffData);
        }
      }

      // Generate username from firstname and lastname
      if (staffData.firstname && staffData.lastname) {
        staffData.username = `${staffData.firstname}.${staffData.lastname}`;
      }

      //this.loggingService.debug('Processed staff form data', staffData);
      return staffData as IStaffApiData;
    } catch (error) {
      this.loggingService.error('Error processing form data:', error);
      throw error;
    }
  }

  /**
   * Process a single FormData entry or plain object value
   */
  private processFormDataEntry(key: string, value: FormDataEntryValue | any, staffData: Partial<IStaffApiData>): void {
    // Handle array-like values from FormData
    if (key.endsWith('[]')) {
      const cleanKey = key.slice(0, -2);
      if (!staffData[cleanKey]) {
        staffData[cleanKey] = [];
      }
      staffData[cleanKey].push(value);
    } else {
      // Handle different value types
      this.processValueByType(key, value, staffData);
    }
  }

  /**
   * Process a form value based on its type and field name
   */
  private processValueByType(key: string, value: FormDataEntryValue, staffData: Partial<IStaffApiData>): void {
    // Special handling for status/is_active field
    if (key === 'status' || key === 'is_active') {
      staffData['is_active'] = value.toString() === 'true';
      return;
    }

    // Special handling for branches array
    if (key === 'branches') {
      if (Array.isArray(value)) {
        staffData['branches'] = value;
      } else if (typeof value === 'string') {
        try {
          const parsedValue = JSON.parse(value);
          if (Array.isArray(parsedValue)) {
            staffData['branches'] = parsedValue;
          } else {
            staffData['branches'] = [value];
          }
        } catch (e) {
          staffData['branches'] = [value];
        }
      } else {
        this.loggingService.warn("'branches' field received in unexpected format", value);
        staffData['branches'] = [];
      }
      return;
    }

    // Special handling for documents array
    if (key === 'documents') {
      if (typeof value === 'string') {
        try {
          const parsedValue = JSON.parse(value);
          if (Array.isArray(parsedValue)) {
            staffData.documents = parsedValue;
          } else {
            this.loggingService.warn("Parsed 'documents' field was not an array as expected", parsedValue);
          }
        } catch (e) {
          this.loggingService.error("Error parsing 'documents' field", e, value);
        }
      } else if (Array.isArray(value)) {
        staffData.documents = value;
      } else {
        this.loggingService.warn("'documents' field received in unexpected format", value);
      }
    }
    // Handle notes field
    else if (key === 'notes') {
      if (typeof value === 'string') {
        staffData.notes = value;
      } else {
        this.loggingService.warn("'notes' field received in unexpected format", value);
      }
    }
    // Handle JSON strings
    else if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
      try {
        staffData[key] = JSON.parse(value);
      } catch {
        staffData[key] = value;
      }
    }
    // Handle date formatting - map startDate to registration_date for API
    else if (key === 'startDate' && value) {
      try {
        const dateValue = new Date(value.toString());
        if (isNaN(dateValue.getTime())) {
          throw new Error('Invalid date');
        }
        
        // Format date as YYYY-MM-DDTHH:mm:ss.sssZ to avoid timezone issues
        // Get the date components in local timezone to preserve the selected date
        const year = dateValue.getFullYear();
        const month = String(dateValue.getMonth() + 1).padStart(2, '0');
        const day = String(dateValue.getDate()).padStart(2, '0');
        // Create ISO datetime string with UTC midnight to preserve the date
        // This ensures the date part (YYYY-MM-DD) is preserved regardless of timezone
        const dateString = `${year}-${month}-${day}T00:00:00.000Z`;
        
        // Map startDate to registration_date for the API
        staffData['registration_date'] = dateString;
        // Also keep startDate for backward compatibility if needed
        staffData[key] = dateString;
      } catch (e) {
        // If value is a File, value.toString() is '[object File]'. new Date() on that is Invalid Date.
        this.loggingService.warn(`Could not parse startDate ('${value}') as a valid date. Assigning as is.`, e);
        if (typeof value === 'string') {
          staffData['registration_date'] = value;
          staffData[key] = value; // Only assign if it's a string already
        }
        // else, if it was a File, do not assign it to startDate which expects string
      }
    }
    // Handle all other values (neither 'documents' nor 'startDate')
    else {
      if (typeof value === 'string') {
        staffData[key] = value; // Assign if the FormData value is a string.
      } else if (value instanceof File) {
        // FormData value is a File.
        if (key === 'avatar') {
          // IStaffApiData.avatar is now string | undefined.
          // Assigning file.name as a placeholder. Actual upload needs to happen in the component.
          this.loggingService.warn(`Received File for 'avatar'. Using filename as placeholder. Implement actual upload in component.`);
          staffData.avatar = value.name;
        } else {
          // A File was provided for a key other than 'avatar'.
          // Most other IStaffApiData fields expect string, number, boolean, or string[].
          // Assigning a File object or its name here is likely incorrect for those types.
          this.loggingService.warn(`Received a File object for key '${key}' (not 'avatar'). Ignoring this File entry for this key.`);
          // Do not assign: staffData[key] = value; or staffData[key] = value.name;
        }
      } else {
        // This case should not be reached if FormDataEntryValue is only string | File.
        this.loggingService.warn(`Received unexpected value type for key '${key}':`, value);
      }
    }
  }

  /**
   * Apply field name mappings from form field names to API field names
   */
  applyFieldMappings(staffData: Partial<IStaffApiData>): IStaffApiData {
    const fieldMappings: Record<string, string> = {
      firstName: 'firstname',
      lastName: 'lastname',
      status: 'is_active'
    };

    const mappedData: Partial<IStaffApiData> = { ...staffData };

    // Apply mappings
    for (const [formField, apiField] of Object.entries(fieldMappings)) {
      if (staffData[formField] !== undefined) {
        mappedData[apiField] = staffData[formField];
        delete mappedData[formField];
      }
    }

    // Handle role field separately to convert it to a roles array
    if (staffData.role) {
      mappedData['roles'] = [staffData.role];
      delete mappedData.role;
    }

    // Handle branches field - this will be handled at component level
    // The branch field contains the branch name, but backend expects branches as array of IDs
    if (staffData['branches']) {
      mappedData['branches'] = staffData['branches'];
    }

    // Handle customer field - keep as is since API expects customer string
    if (staffData.customer) {
      mappedData['customer'] = staffData.customer;
    }

    // Ensure address-related fields are preserved
    const addressFields = ['address', 'city', 'region', 'zipcode', 'country'];
    addressFields.forEach(field => {
      if (staffData[field] !== undefined) {
        mappedData[field] = staffData[field];
      }
    });

    // Clean up: if registration_date is present, remove startDate to avoid confusion
    // (registration_date is the canonical field, startDate is just the form field name)
    if (mappedData.registration_date) {
      delete mappedData.startDate;
    }

    return mappedData as IStaffApiData;
  }


}
