import { Injectable } from '@angular/core';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { environment } from '@environments/environment';
import { faker } from '@faker-js/faker';

/**
 * Service for providing role-related form fields
 */
@Injectable({
  providedIn: 'root'
})
export class RoleFieldsService {
  private isDev = environment.development;
  
  /**
   * Get all role and status-related fields
   */
  getFields(): FormlyFieldConfig[] {
    return [
      {
        fieldGroupClassName: '',
        fieldGroup: [
          {
            template: '<h3 class="text-primary font-bold text-2xl mb-2">Selected role:</h3>'
          },
          {
            fieldGroupClassName: 'grid',
            fieldGroup: [
              // Start Date
              {
                key: 'startDate',
                type: 'primary-input',
                className: 'col-12 md:col-4',
                props: {
                  required: true,
                  type: 'text',
                  placeholder: '21/12/2024'
                },
                defaultValue: this.getDefaultValue('startDate')
              },
              
              // Role Selection
              {
                key: 'role',
                type: 'primary-select',
                className: 'col-12 md:col-4',
                props: {
                  selectOptions: [
                    { label: 'Manager', value: 'MANAGER' },
                    { label: 'Administrator', value: 'ADMINISTRATOR' },
                    { label: 'Teacher', value: 'TEACHER' }
                  ]
                },
                defaultValue: this.getDefaultValue('role')
              },
              
              // Role Title
              {
                key: 'roleTitle',
                type: 'primary-input',
                className: 'col-12 md:col-4',
                props: {
                  required: true,
                  placeholder: 'Role Title'
                },
                defaultValue: this.getDefaultValue('roleTitle')
              }
            ]
          }
        ]
      }
    ];
  }
  
  /**
   * Enable or disable development default values
   */
  setDevelopmentDefaults(useDefaults: boolean): void {
    this.isDev = useDefaults;
  }
  
  /**
   * Get default value for a field, using faker for development
   */
  private getDefaultValue(field: string): any {
    if (!this.isDev) {
      return '';
    }
    
    switch (field) {
      case 'startDate':
        return faker.date.past().toISOString().split('T')[0];
      case 'role':
        return faker.helpers.arrayElement(['MANAGER', 'STAFF', 'ADMIN', 'DRIVER']);
      case 'roleTitle':
        return faker.person.jobTitle();
      default:
        return '';
    }
  }
}