import { Injectable, inject } from '@angular/core';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { CustomersService } from '../../../../gen-api/customers/customers.service';
import { RolesService } from '../../../../gen-api/roles/roles.service';
import { map, take } from 'rxjs/operators';
import { environment } from '@environments/environment.development';
import { faker } from '@faker-js/faker';
import { LoggingService } from '../../../../services/logging/logging.service';
import { Role } from '../../../../gen-api/schemas/role';
import { Store } from '@ngrx/store';
import { AppState } from '@store/app.state';
import { COUNTRIES } from '../../../../utils/countries.util';

interface RolesResponse {
  success: boolean;
  status: number;
  data: {
    results: Role[];
    page: number;
    limit: number;
    totalPages: number;
    totalResults: number;
  };
}

/**
 * Service for managing personal information fields in the staff form
 */
@Injectable({
  providedIn: 'root'
})
export class PersonalInfoFieldsService {
  private customersService = inject(CustomersService);
  private rolesService = inject(RolesService);
  private loggingService = inject(LoggingService);
  private store = inject(Store<AppState>);

  // Store field references to update them later
  personalInfoFields: FormlyFieldConfig[] = [];
  isEditMode = false;
  staffData: any = null;

  // Track loading state of async data
  private roleOptionsLoaded = false;
  private currentBranchName = '';

  constructor() {
    this.personalInfoFields = this.buildPersonalInfoFields();
    this.initializeBranchField();
    this.fetchRolesForRoleSelect();
  }

  /**
   * Set edit mode and optionally provide staff data for role field
   */
  setEditMode(isEditMode: boolean, staffData?: any): void {
    console.log('PersonalInfoFieldsService.setEditMode called:', isEditMode, staffData);
    this.isEditMode = isEditMode;
    this.staffData = staffData;

    // Update avatar field with existing avatar if in edit mode
    if (isEditMode && staffData?.avatar) {
      this.updateAvatarField(staffData.avatar);
    }

    // Set user_type value if in edit mode (user_type options are static so always available)
    if (isEditMode && staffData && staffData.user_type) {
      const userTypeField = this.findFieldByKey('user_type');
      if (userTypeField && userTypeField.formControl) {
        console.log('Setting user_type immediately in setEditMode:', staffData.user_type);
        userTypeField.formControl.setValue(staffData.user_type);
      }
    }

    // Set startDate value if in edit mode - check both registration_date and startDate
    if (isEditMode && staffData) {
      const startDateField = this.findFieldByKey('startDate');
      if (startDateField && startDateField.formControl) {
        // Prefer registration_date, fallback to startDate, then createdAt
        let dateValue: Date | null = null;
        if (staffData.registration_date) {
          dateValue = new Date(staffData.registration_date);
        } else if (staffData.startDate) {
          dateValue = new Date(staffData.startDate);
        } else if (staffData.createdAt) {
          dateValue = new Date(staffData.createdAt);
        }
        
        if (dateValue && !isNaN(dateValue.getTime())) {
          startDateField.formControl.setValue(dateValue);
        }
      }
    }

    // Ensure branch field is populated immediately
    this.updateBranchFieldImmediate();

    // Try to set role value if options are already loaded
    this.trySetEditModeValues();
  }

  /**
   * Try to set role value if in edit mode and options are loaded
   */
  private trySetEditModeValues(): void {
    if (!this.isEditMode || !this.staffData) {
      return;
    }

    // Set role value if options are loaded and staff has roles
    if (this.roleOptionsLoaded && this.staffData.roles && this.staffData.roles.length > 0) {
      this.setRoleValue();
    }
  }

  /**
   * Set role value from staff data
   */
  private setRoleValue(): void {
    const roleField = this.findFieldByKey('role');
    if (roleField && roleField.props && roleField.props['selectOptions']?.length > 0) {
      const roles = roleField.props['selectOptions'];
      const staffRoleId = this.staffData.roles[0].id || this.staffData.roles[0]; // Handle both object and ID
      const matchingRole = roles.find((r: any) => r.value === staffRoleId);
      if (matchingRole && roleField.formControl) {

        roleField.formControl.setValue(matchingRole.value);
      }
    }
  }

  /**
   * Get personal information fields
   */
  getPersonalInfoFields(): FormlyFieldConfig[] {
    return this.personalInfoFields;
  }

  /**
   * Update avatar field with existing avatar path
   */
  updateAvatarField(avatarPath: string): void {
    const avatarField = this.findFieldByKey('avatar');
    if (avatarField && avatarField.props) {
      avatarField.props['defaultValue'] = avatarPath;
      avatarField.props['value'] = avatarPath;
      
      // Also set the form control value if it exists
      if (avatarField.formControl) {
        avatarField.formControl.setValue(avatarPath);
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
    console.log('Updating branch field, found field:', branchField);
    console.log('Current branch name:', this.currentBranchName);
    
    if (branchField && branchField.formControl) {
      branchField.formControl.setValue(this.currentBranchName);
      console.log('Branch field updated with value:', this.currentBranchName);
    } else if (branchField) {
      // If no form control yet, set default value
      branchField.defaultValue = this.currentBranchName;
      console.log('Set branch field default value:', this.currentBranchName);
    } else {
      console.error('Branch field not found!');
    }
  }

  /**
   * Fetch roles and update role select options
   */
  fetchRolesForRoleSelect(): void {
    this.rolesService
      .getRoles<RolesResponse>()
      .pipe(
        map((response) => {
          if (response?.data?.results && Array.isArray(response.data.results)) {
            return response.data.results
              .filter((role) => {
                const roleName = role.title?.toLowerCase();
                return roleName === 'manager' || roleName === 'teacher';
              })
              .map((role) => ({
                label: role.title,
                value: role.id
              }));
          }
          return [];
        })
      )
      .subscribe({
        next: (roles) => {
          const roleField = this.findFieldByKey('role');
          if (roleField && roleField.props) {
            roleField.props['selectOptions'] = roles;
            roleField.props['valueProp'] = 'value';
            roleField.props['labelProp'] = 'label';

            // Mark that role options are now loaded
            this.roleOptionsLoaded = true;

            // If we're in edit mode and have staff data with roles, set it after options are loaded
            if (this.isEditMode && this.staffData && this.staffData.roles && this.staffData.roles.length > 0) {
              this.setRoleValue();
            } else if (!this.isEditMode && roles.length > 0 && roleField.formControl) {
              // Only set default value in create mode
              roleField.formControl.setValue(roles[0].value);
            }
          } else {
            this.loggingService.error('Could not find role field to update options.');
          }
        },
        error: (error) => {
          this.loggingService.error('Error fetching roles:', error);
        }
      });
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
      startDate: isDev ? faker.date.past() : new Date(),
      role: '',
      roleTitle: isDev ? faker.person.jobTitle() : '',
      user_type: 'staff',
      firstname: isDev ? faker.person.firstName() : '',
      lastname: isDev ? faker.person.lastName() : '',
      address: isDev ? faker.location.streetAddress() : '',
      city: isDev ? faker.location.city() : '',
      region: isDev ? faker.location.state() : '',
      zipcode: isDev ? faker.location.zipCode() : '',
      country: isDev ? faker.location.country() : '',
      email: isDev ? faker.internet.email() : '',
      phone: isDev ? faker.phone.number() : '',
      mobile: isDev ? faker.phone.number() : ''
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
                  isRounded: true
                }
              },
              {
                className: 'col-12 md:col-9 lg:col-10 ',
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
                  
                  // Branch Section
                  {
                    template: '<h3 class="text-primary font-bold text-2xl mb-2">Branch</h3>'
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
                        key: 'startDate',
                        type: 'primary-calendar',
                        className: 'self-center',
                        props: {
                          label: 'Registration Date:',
                          labelPosition: 'left',
                          labelBold: true,
                          required: false,
                          placeholder: '21/12/2024',
                          dateFormat: 'dd/mm/yy',
                          showIcon: true,
                          showClear: true
                        },
                        defaultValue: defaultValues.startDate
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

                  // Role Section
                  {
                    template: '<h3 class="text-primary font-bold text-2xl mb-2">Selected role:</h3>'
                  },
                  {
                    fieldGroupClassName: 'grid',
                    fieldGroup: [
                      {
                        key: 'role',
                        type: 'primary-select',
                        className: 'col-12 md:col-3',
                        props: {
                          required: true,
                          placeholder: 'Select Role',
                          selectOptions: [],
                          valueProp: 'value',
                          labelProp: 'label',
                          isSearch: true
                        },
                        defaultValue: defaultValues.role
                      },
                      {
                        key: 'roleTitle',
                        type: 'primary-input',
                        className: 'col-12 md:col-3',
                        props: {
                          required: false,
                          placeholder: 'Role Title'
                        },
                        defaultValue: defaultValues.roleTitle
                      },
                      {
                        key: 'user_type',
                        type: 'primary-select',
                        className: 'col-12 md:col-3',
                        hide: true,
                        props: {
                          required: true,
                          placeholder: 'User Type',
                          selectOptions: [
                            { label: 'Admin', value: 'admin' },
                            { label: 'Manager', value: 'manager' },
                            { label: 'Teacher', value: 'teacher' },
                            { label: 'Student', value: 'student' },
                            { label: 'Representative', value: 'representative' },
                            { label: 'Contact', value: 'contact' },
                            { label: 'Staff', value: 'staff' }
                          ],
                          valueProp: 'value',
                          labelProp: 'label',
                          isSearch: true
                        },
                        defaultValue: defaultValues.user_type
                      }
                    ]
                  },

                  // Personal Information Section
                  {
                    template: '<h3 class="text-primary font-bold text-2xl mb-2">Personal Information:</h3>'
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
                        key: 'mobile',
                        type: 'primary-input',
                        className: 'col-12 md:col-6',
                        props: {
                          required: false,
                          placeholder: 'Mobile'
                        },
                        defaultValue: defaultValues.mobile
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
