import { Injectable, inject } from '@angular/core';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { CustomersService } from '../../../../gen-api/customers/customers.service';
import { map, take } from 'rxjs/operators';
import { environment } from '@environments/environment.development';
import { faker } from '@faker-js/faker';
import { LoggingService } from '../../../../services/logging/logging.service';
import { Store } from '@ngrx/store';
import { AppState } from '@store/app.state';
import { COUNTRIES } from '../../../../utils/countries.util';

/**
 * Service for managing personal information fields in the student form
 */
@Injectable({
  providedIn: 'root'
})
export class PersonalInfoFieldsService {
  private customersService = inject(CustomersService);
  private loggingService = inject(LoggingService);
  private store = inject(Store<AppState>);

  // Store field references to update them later
  personalInfoFields: FormlyFieldConfig[] = [];
  isEditMode = false;
  studentData: any = null;
  private currentBranchName = '';

  constructor() {
    this.personalInfoFields = this.buildPersonalInfoFields();
    this.initializeBranchField();
  }

  /**
   * Set edit mode and optionally provide student data
   */
  setEditMode(isEditMode: boolean, studentData?: any): void {
    this.isEditMode = isEditMode;
    this.studentData = studentData;

    // Ensure branch field is populated immediately
    this.updateBranchFieldImmediate();
  }

  getPersonalInfoFields(): FormlyFieldConfig[] {
    return this.personalInfoFields;
  }

  /**
   * Update avatar field with existing avatar path
   */
  updateAvatarField(avatarPath: string): void {
    const avatarField = this.findFieldByKey('avatar');
    if (avatarField && avatarField.props) {
      const fullAvatarUrl = `${environment.assetUrl}/${avatarPath}`;
      avatarField.props['defaultValue'] = fullAvatarUrl;
      
      // If the form control exists, also set its value
      if (avatarField.formControl) {
        avatarField.formControl.setValue(avatarPath);
      }
    } else {
      this.loggingService.error('Could not find avatar field to update');
    }
  }

  /**
   * Update date field with existing date for edit mode
   */
  updateDateField(dateValue: string | Date): void {
    const dateField = this.findFieldByKey('date');
    if (dateField && dateField.props) {
      const dateObj = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
      dateField.props['defaultValue'] = dateObj;
      
      // If the form control exists, also set its value
      if (dateField.formControl) {
        dateField.formControl.setValue(dateObj);
      }
    }
  }

  /**
   * Initialize branch field with current branch name
   */
  private initializeBranchField(): void {
    // Get current branch name synchronously and then update the field
    this.store.select(state => state.auth.currentCustomerId)
      .pipe(take(1))
      .subscribe(currentCustomerId => {
        if (currentCustomerId) {
          this.customersService.getCustomersId(currentCustomerId).subscribe({
            next: (response: any) => {
              if (response?.data) {
                this.currentBranchName = response.data.name || response.data.nickname || 'Current Branch';
                this.updateBranchField();
              }
            },
            error: (error) => {
              this.loggingService.error('Error fetching current branch:', error);
              this.currentBranchName = 'Current Branch';
              this.updateBranchField();
            }
          });
        } else {
          this.currentBranchName = 'No Branch Selected';
          this.updateBranchField();
        }
      });
  }

  /**
   * Update branch field immediately with current branch name
   */
  private updateBranchFieldImmediate(): void {
    this.store.select(state => state.auth.currentCustomerId)
      .pipe(take(1))
      .subscribe(currentCustomerId => {
        if (currentCustomerId) {
          this.customersService.getCustomersId(currentCustomerId).subscribe({
            next: (response: any) => {
              if (response?.data) {
                this.currentBranchName = response.data.name || response.data.nickname || 'Current Branch';
                this.updateBranchField();
              }
            },
            error: (error) => {
              this.loggingService.error('Error fetching current branch:', error);
              this.currentBranchName = 'Current Branch';
              this.updateBranchField();
            }
          });
        } else {
          this.currentBranchName = 'No Branch Selected';
          this.updateBranchField();
        }
      });
  }

  /**
   * Update the branch field with current branch name
   */
  private updateBranchField(): void {
    const branchField = this.findFieldByKey('branch');
    
    if (branchField && branchField.formControl) {
      branchField.formControl.setValue(this.currentBranchName);
    } else if (branchField) {
      // If no form control yet, set default value
      branchField.defaultValue = this.currentBranchName;
    }
  }

  /**
   * Find field by key recursively
   */
  findFieldByKey(key: string): FormlyFieldConfig | undefined {
    const findRecursively = (fields: FormlyFieldConfig[]): FormlyFieldConfig | undefined => {
      for (const field of fields) {
        if (field.key === key) {
          return field;
        }
        if (field.fieldGroup) {
          const found = findRecursively(field.fieldGroup);
          if (found) return found;
        }
      }
      return undefined;
    };

    return findRecursively(this.personalInfoFields);
  }

  /**
   * Build personal info fields structure
   */
  private buildPersonalInfoFields(): FormlyFieldConfig[] {
    const isDev = environment.development;
    const defaultValues = {
      customer: '', // Will be populated from auth
      branch: '', // Will be populated from auth
      status: isDev ? faker.datatype.boolean() : false,
      startDate: isDev ? faker.date.past().toISOString().split('T')[0] : '',
      date: isDev ? faker.date.past() : new Date(),
      role: isDev ? faker.helpers.arrayElement(['MANAGER', 'STAFF', 'ADMIN', 'DRIVER']) : '',
      roleTitle: isDev ? faker.person.jobTitle() : '',
      firstname: isDev ? faker.person.firstName() : '',
      lastname: isDev ? faker.person.lastName() : '',
      username: isDev ? faker.internet.userName() : '',
      address: isDev ? faker.location.streetAddress() : '',
      city: isDev ? faker.location.city() : '',
      region: isDev ? faker.location.state() : '',
      zipcode: isDev ? '12345' : '',
      country: isDev ? faker.location.country() : '',
      email: isDev ? faker.internet.email() : '',
      phone: isDev ? faker.phone.number() : '',
      mobile: isDev ? faker.phone.number() : '',
      dateOfBirth: isDev ? faker.date.past({ years: 30 }) : null,
      optionalPhone: isDev ? faker.phone.number() : ''
    };

    return [
      {
        fieldGroupClassName: '',
        fieldGroup: [
          // Avatar and Branch Section
          {
            fieldGroupClassName: 'grid',
            fieldGroup: [
              {
                key: 'avatar',
                type: 'primary-upload',
                className: 'col-3 md:col-3 lg:col-2',
                props: {
                  label: 'Avatar',
                  required: false,
                  inputType: 'text',
                  labelClass: 'text-black-alpha-90',
                  isRounded: true,
                  showPreview: true,
                  previewUrl: null // This will be set dynamically in edit mode
                }
              },
              {
                className: 'col-12 md:col-9 lg:col-10',
                fieldGroup: [
                  // Hidden customer field (will be populated from auth)
                  {
                    key: 'customer',
                    type: 'primary-input',
                    hide: true,
                    props: {
                      required: true
                    },
                    defaultValue: defaultValues.customer
                  },
                  
                  // Hidden default_branch field (will be populated from auth)
                  {
                    key: 'default_branch',
                    type: 'primary-input',
                    hide: true,
                    props: {
                      required: false
                    },
                    defaultValue: ''
                  },
                  
                  // Branch Section
                  {
                    template: '<h3 class="text-primary font-bold text-2xl mb-2">Branch</h3>',
                  },
                  {
                    fieldGroupClassName: 'flex flex-row gap-3 align-items-start',
                    fieldGroup: [
                      {
                        key: 'branch',
                        type: 'primary-input',
                        className: 'flex-1',
                        props: {
                          required: true,
                          placeholder: 'Current Branch',
                          disabled: true,
                          description: 'Current branch from authentication'
                        },
                        defaultValue: ''
                      },
                      {
                        key: 'date',
                        type: 'primary-calendar',
                        className: 'self-center',
                        props: {
                          label: 'Registration Date:',
                          labelPosition: 'left',
                          labelBold: true,
                          required: false,
                          placeholder: '21/01/2025',
                          dateFormat: 'dd/mm/yy',
                          showIcon: true,
                          showClear: true
                        },
                        defaultValue: defaultValues.date
                      },
                      {
                        key: 'status',
                        type: 'primary-toggle',
                        className: 'flex-1 font-bold self-center mt-2',
                        props: {
                          label: 'Status:',
                          disabled: false,
                          defaultValue: defaultValues.status
                        },
                        defaultValue: defaultValues.status
                      }
                    ]
                  },
                                    
                  // Personal Information Section
                  {
                    template: '<h3 class="text-primary font-bold text-2xl mb-2">Personal Info</h3>',
                  },
                  {
                    fieldGroupClassName: 'grid',
                    fieldGroup: [
                      {
                        key: 'firstname',
                        type: 'primary-input',
                        className: 'col-12 md:col-6',
                        props: {
                          required: true,
                          placeholder: 'First Name'
                        },
                        defaultValue: defaultValues.firstname
                      },
                      {
                        key: 'lastname',
                        type: 'primary-input',
                        className: 'col-12 md:col-6',
                        props: {
                          required: true,
                          placeholder: 'Last Name'
                        },
                        defaultValue: defaultValues.lastname
                      },
                      {
                        key: 'dateOfBirth',
                        type: 'primary-calendar',
                        className: 'col-12 md:col-6',
                        props: {
                          required: false,
                          placeholder: 'Date of Birth',
                          dateFormat: 'dd/mm/yy',
                          showIcon: true,
                          showClear: true
                        },
                        defaultValue: undefined
                      }
                    ]
                  },

                  // Contact Information Section
                  {
                    template: '<h3 class="text-primary font-bold text-2xl mb-2">Contact Information:</h3>'
                  },
                  {
                    fieldGroupClassName: 'grid',
                    fieldGroup: [
                      {
                        key: 'email',
                        type: 'primary-input',
                        className: 'col-12 md:col-6',
                        props: {
                          required: true,
                          placeholder: 'Email',
                          type: 'email'
                        },
                        defaultValue: defaultValues.email
                      },
                      {
                        key: 'phone',
                        type: 'primary-input',
                        className: 'col-12 md:col-6',
                        props: {
                          required: true,
                          placeholder: 'Phone'
                        },
                        defaultValue: defaultValues.phone
                      },
                      {
                        key: 'optionalPhone',
                        type: 'primary-input',
                        className: 'col-12 md:col-6',
                        props: {
                          required: false,
                          placeholder: 'Mobile'
                        },
                        defaultValue: defaultValues.optionalPhone
                      }
                    ]
                  },

                  // Address Section
                  {
                    template: '<h3 class="text-primary font-bold text-2xl mb-2">Address:</h3>'
                  },
                  {
                    fieldGroupClassName: 'grid',
                    fieldGroup: [
                      {
                        key: 'address',
                        type: 'primary-input',
                        className: 'col-12',
                        props: {
                          required: false,
                          placeholder: 'Address'
                        },
                        defaultValue: defaultValues.address
                      }
                    ]
                  },
                  {
                    fieldGroupClassName: 'grid',
                    fieldGroup: [
                      {
                        key: 'city',
                        type: 'primary-input',
                        className: 'col-12 md:col-6 lg:col-3',
                        props: {
                          required: false,
                          placeholder: 'City/Town'
                        },
                        defaultValue: defaultValues.city
                      },
                      {
                        key: 'region',
                        type: 'primary-input',
                        className: 'col-12 md:col-6 lg:col-3',
                        props: {
                          required: false,
                          placeholder: 'Region'
                        },
                        defaultValue: defaultValues.region
                      },
                      {
                        key: 'zipcode',
                        type: 'primary-input',
                        className: 'col-12 md:col-6 lg:col-3',
                        props: {
                          required: false,
                          placeholder: 'Zip'
                        },
                        defaultValue: defaultValues.zipcode
                      },
                      {
                        key: 'country',
                        type: 'primary-select',
                        className: 'col-12 md:col-6 lg:col-3',
                        props: {
                          required: false,
                          placeholder: 'Country',
                          selectOptions: COUNTRIES,
                          valueProp: 'value',
                          labelProp: 'label',
                          isSearch: true
                        },
                        defaultValue: defaultValues.country
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ];
  }
}
