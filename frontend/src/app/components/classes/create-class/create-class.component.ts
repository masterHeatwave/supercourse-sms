import { Component, inject, Input, OnInit, Output, EventEmitter, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ClassFormFields } from './class-form.fields';
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { FormlyPrimeNGModule } from '@ngx-formly/primeng';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputSwitchModule } from 'primeng/inputswitch';
import { FileUploadModule } from 'primeng/fileupload';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DocumentListComponent } from '../../document-list/document-list.component';
import { CommonModule } from '@angular/common';
import { PrimayColorSelectComponent } from '@components/inputs/primay-color-select/primay-color-select.component';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { SpinnerComponent } from '@components/spinner/spinner.component';
import { OutlineButtonComponent } from '@components/buttons/outline-button/outline-button.component';
import { SessionFormComponent } from '../../shared/session-form/session-form.component';
import { SessionManagementService, SessionFormData } from '@services/session-management.service';
import { TaxisService } from '@gen-api/taxis/taxis.service';
import { SessionsService } from '@gen-api/sessions/sessions.service';
import { ClassroomsService } from '@gen-api/classrooms/classrooms.service';
import { AcademicPeriodsService } from '@gen-api/academic-periods/academic-periods.service';
import { UsersService } from '@gen-api/users/users.service';
import { InventoryService } from '@gen-api/inventory/inventory.service';
import { PostTaxisBody, PutTaxisIdBody } from '@gen-api/schemas';
import { catchError, of, switchMap, take } from 'rxjs';
import { Store } from '@ngrx/store';
import { AppState } from '@store/app.state';
import { FormValidationService, CLASS_FIELD_LABELS, SESSION_FIELD_LABELS } from '../../../services/validation/form-validation.service';


@Component({
  selector: 'app-create-class',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormlyModule,
    FormlyPrimeNGModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    DropdownModule,
    CalendarModule,
    InputSwitchModule,
    FileUploadModule,
    InputTextareaModule,
    DocumentListComponent,
    PrimayColorSelectComponent,
    SpinnerComponent,
    OutlineButtonComponent,
    SessionFormComponent
  ],
  templateUrl: './create-class.component.html',
  styleUrl: './create-class.component.scss'
})
export class CreateClassComponent implements OnInit, AfterViewInit {
  @Input() isEditMode = false;
  @Input() classData: any = null;
  @Input() submitButtonLabel = 'Save';

  @Output() classCreated = new EventEmitter<any>();
  @Output() classUpdated = new EventEmitter<any>();
  @Output() formSubmitError = new EventEmitter<any>();
  @Output() cancelForm = new EventEmitter<void>();

  @ViewChild('sessionsContainer', { static: false }) sessionsContainer!: ElementRef;
  @ViewChild(SessionFormComponent, { static: false }) sessionsComponent!: SessionFormComponent;

  formFieldsService = inject(ClassFormFields);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private taxisService = inject(TaxisService);
  private sessionsService = inject(SessionsService);
  private classroomsService = inject(ClassroomsService);
  private academicPeriodsService = inject(AcademicPeriodsService);
  private usersService = inject(UsersService);
  private inventoryService = inject(InventoryService);
  private store = inject(Store<AppState>);
  private validationService = inject(FormValidationService);
  private sessionManagementService = inject(SessionManagementService);

  form = new FormGroup({});
  model: any = { sessions: [] };

  classInfoFields: FormlyFieldConfig[];
  // Removed debug properties - no longer needed
  isLoading = false;
  classId: string | null = null;

  // Complete fake data for edit mode
  fakeClassData = {
    sessions: [
      {
        day: 'monday',
        startTime: '10:00',
        duration: 1,
        dateRange: [new Date(), new Date(new Date().setMonth(new Date().getMonth() + 3))] as [Date, Date],
        frequencyValue: 1,
        mode: 'in_person'
      },
      {
        day: 'wednesday',
        startTime: '10:00',
        duration: 1,
        dateRange: [new Date(), new Date(new Date().setMonth(new Date().getMonth() + 3))] as [Date, Date],
        frequencyValue: 1,
        mode: 'in_person'
      }
    ] as SessionFormData[]
  };

  // Empty model template for create mode
  emptyClassModel = {
    sessions: []
  };

  constructor() {
    this.form = new FormGroup({});
    this.classInfoFields = [];
  }

  ngOnInit(): void {
    // Ensure fields are populated after dynamic data (academic years/periods) is fetched from API
    this.formFieldsService.getClassInfoFieldsWithData().then((fields) => {
      this.classInfoFields = fields;
      this.cdr.detectChanges();
    });

    // Set up periodic refresh to catch field updates
    this.setupFieldRefresh();

    // Check if we're in edit mode from the route
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.classId = params['id'];
        this.isEditMode = true;
        this.submitButtonLabel = 'Update';
        this.loadClassData(params['id']);
      } else {
        // For create mode, initialize with proper empty model
        this.model = JSON.parse(JSON.stringify(this.emptyClassModel));
      }
    });

    // If classData is already provided via @Input, use it
    if (this.isEditMode && this.classData) {
      this.model = JSON.parse(JSON.stringify(this.classData));
    }

    // Ensure branch field is populated immediately after form initialization
    setTimeout(() => {
      this.formFieldsService.fetchCurrentBranchName();
    }, 0);

    this.cdr.detectChanges();
  }

  ngAfterViewInit(): void {
    // Sessions component will be rendered in the parent component
  }

  onSessionsChange(sessions: SessionFormData[]): void {
    this.model.sessions = sessions;
  }

  onSessionValidationChange(isValid: boolean): void {
    // Handle session validation change if needed
    console.log('Sessions validation status:', isValid);
  }

  private setupFieldRefresh(): void {
    // Check for field updates every 2 seconds for the first 30 seconds
    let refreshCount = 0;
    const maxRefreshes = 15; // 15 * 2 seconds = 30 seconds
    
    const refreshInterval = setInterval(() => {
      const currentFields = this.formFieldsService.getClassInfoFields();
      if (currentFields !== this.classInfoFields) {
        this.classInfoFields = currentFields;
        this.cdr.detectChanges();
        console.log('Fields refreshed with updated data');
      }

      // Also try to refresh branch data if needed
      if (refreshCount === 0 || refreshCount === 5) {
        this.formFieldsService.refreshBranchData();
      }

      refreshCount++;
      if (refreshCount >= maxRefreshes) {
        clearInterval(refreshInterval);
      }
    }, 2000);
  }


  loadClassData(classId: string): void {
    this.isLoading = true;

    this.taxisService.getTaxisId(classId).subscribe({
      next: (response: any) => {
        this.transformApiDataToModel(response.data);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading class data:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load class data'
        });
        this.isLoading = false;
      }
    });
  }

  private transformApiDataToModel(apiData: any): void {
  
    // Transform API data back to form model structure
    this.model = {
      // Basic class info
      name: apiData.name || '',
      classColor: apiData.color || '#ff0000',
      classId: '', // This field doesn't exist in API data
      subject: apiData.subject || '',
      level: apiData.level || '',
      notes: '', // This field doesn't exist in API data - could be added later

      // Academic info (use IDs for form fields)
      academicYear: apiData.academic_year?._id || apiData.academic_year?.id || '',
      academicPeriod: apiData.academic_period?._id || apiData.academic_period?.id || '',

      // Branch info
      branch: apiData.branch?._id || apiData.branch?.id || apiData.branch || '',

      // Users - extract IDs for form (use _id from API response)
      teachers: apiData.teachers ? apiData.teachers.map((teacher: any) => teacher._id) : [],
      students: apiData.students ? apiData.students.map((student: any) => student._id) : [],
      materials: apiData.scap_products || [],

      // Sessions - transform session data to form format
      sessions: this.transformSessionsForForm(apiData.sessions || [])
    };

    console.log('Transformed model for form:', this.model);
    console.log('Academic Year ID:', this.model.academicYear);
    console.log('Academic Period ID:', this.model.academicPeriod);
    console.log('Teachers IDs:', this.model.teachers);
    console.log('Students IDs:', this.model.students);
    this.classData = this.model;

    // Load sessions into the component after a brief delay to ensure component is ready
    setTimeout(() => {
      if (this.sessionsComponent && this.model.sessions?.length > 0) {
        console.log('Loading sessions into component:', this.model.sessions);
        this.sessionsComponent.loadSessionsData(this.model.sessions);
      }
    }, 100);
  }

  private transformSessionsForForm(sessions: any[]): SessionFormData[] {
    console.log('Transforming sessions for form:', sessions);

    return sessions.map((session, index) => {
      console.log(`Processing session ${index + 1}:`, session);
      const transformedSession = this.sessionManagementService.transformFromApiFormat(session as any);
      console.log(`Transformed session ${index + 1}:`, transformedSession);
      return transformedSession;
    });
  }

  loadFakeClassData(): void {
    // Deprecated - keeping for backward compatibility but should not be used
    console.warn('loadFakeClassData is deprecated, use loadClassData instead');
  }

  async onSubmit() {
    // Validate main class form
    const isClassFormValid = this.form.valid;

    // Validate sessions using the new component
    let areSessionsValid = true;
    if (this.sessionsComponent) {
      areSessionsValid = await this.sessionsComponent.validateBeforeSubmit();
      // Update model with current session data
      this.model.sessions = this.sessionsComponent.getSessionsData();
    }

    if (!isClassFormValid || !areSessionsValid) {
      // Mark all controls as touched to reveal field-level errors
      this.markFormGroupTouched(this.form);

      // Build a combined invalid field list and show one toast
      const classInvalid = this.validationService.getInvalidFields(this.form, { fieldLabels: CLASS_FIELD_LABELS });
      const sessionInvalid = !areSessionsValid ? ['Sessions'] : [];

      const allInvalid = Array.from(new Set([...(classInvalid || []), ...sessionInvalid]));
      if (allInvalid.length > 0) {
        this.messageService.clear();
        this.messageService.add({
          severity: 'error',
          summary: 'Please complete required fields and fix session errors',
          detail: `Issues found in: ${allInvalid.join(', ')}`,
          life: 5000
        });
      }
      return;
    }

    this.isLoading = true;

    try {
      if (this.isEditMode) {
        await this.updateClass();
      } else {
        await this.createClass();
      }
    } catch (error) {
      console.error('Error submitting class:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save class. Please try again.'
      });
      this.formSubmitError.emit(error);
    } finally {
      this.isLoading = false;
    }
  }

  private async createClass(): Promise<void> {
    // Transform frontend data to backend format
    const taxiData = this.transformToTaxiData(this.model);

    // Create the taxi (class) first
    this.taxisService
      .postTaxis(taxiData)
      .pipe(
        switchMap((taxiResponse: any) => {
          const createdTaxi = taxiResponse.data;

          // Create sessions if there are sessions
          if (this.model.sessions && this.model.sessions.length > 0) {
            return this.sessionManagementService.createBulkSessions(this.model.sessions, createdTaxi.id).pipe(
              switchMap((result) => {
                if (!result.success && result.errors.length > 0) {
                  console.warn('Some sessions failed to create:', result.errors);
                  // Show warning but don't fail the whole operation
                  this.messageService.add({
                    severity: 'warn',
                    summary: 'Partial Success',
                    detail: `Class created but ${result.errors.length} session(s) failed to create.`,
                    life: 5000
                  });
                }
                return of(createdTaxi);
              }),
              catchError((error) => {
                console.error('Failed to create sessions:', error);
                // Don't fail the whole operation if sessions fail - the class is already created
                return of(createdTaxi);
              })
            );
          } else {
            return of(createdTaxi);
          }
        }),
        catchError((error: any) => {
          console.error('Failed to create taxi:', error);
          throw error;
        })
      )
      .subscribe({
        next: (result: any) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Class created successfully'
          });
          this.classCreated.emit(result);
          // Redirect to classes list
          this.router.navigate(['/dashboard/classes']);
        },
        error: (error: any) => {
          throw error;
        }
      });
  }

  private async updateClass(): Promise<void> {
    if (!this.classId) {
      throw new Error('Class ID is required for update');
    }

    // Transform frontend data to backend format for update
    const updateData = this.transformToUpdateTaxiData(this.model);

    // Update the taxi (class) first
    this.taxisService
      .putTaxisId(this.classId, updateData)
      .pipe(
        switchMap((taxiResponse: any) => {
          const updatedTaxi = taxiResponse.data;

          // Update sessions using the SessionManagementService
          return this.sessionManagementService.updateBulkSessions(this.model.sessions || [], this.classId!).pipe(
            switchMap((result) => {
              if (!result.success && result.errors.length > 0) {
                console.warn('Some sessions failed to update:', result.errors);
                // Show warning but don't fail the whole operation
                this.messageService.add({
                  severity: 'warn',
                  summary: 'Partial Success',
                  detail: `Class updated but ${result.errors.length} session(s) failed to update.`,
                  life: 5000
                });
              }
              return of(updatedTaxi);
            }),
            catchError((error) => {
              console.error('Failed to update sessions:', error);
              // Don't fail the whole operation if sessions fail - the class is already updated
              return of(updatedTaxi);
            })
          );
        }),
        catchError((error: any) => {
          console.error('Failed to update taxi:', error);
          throw error;
        })
      )
      .subscribe({
        next: (result: any) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Class updated successfully'
          });
          this.classUpdated.emit(result);
          // Redirect to classes list
          this.router.navigate(['/dashboard/classes']);
        },
        error: (error: any) => {
          throw error;
        }
      });
  }



  private transformToTaxiData(formData: any): PostTaxisBody {
    // Combine teachers and students into users array
    const allUsers = [...(formData.teachers || []), ...(formData.students || [])];

    // Always use branch ID, not branch name from form field
    const branchId = this.getCurrentBranchId();

    // Get active academic year ID from form fields service
    const activeAcademicYearId = this.formFieldsService.getActiveAcademicYearId();

    return {
      name: formData.name,
      color: formData.classColor || '#ff0000',
      branch: branchId,
      subject: formData.subject,
      level: formData.level,
      academic_year: activeAcademicYearId || '',
      academic_period: formData.academicPeriod || '',
      users: allUsers,
      scap_products: formData.materials || []
    };
  }

  private transformToUpdateTaxiData(formData: any): PutTaxisIdBody {
    const baseData = this.transformToTaxiData(formData);
    return {
      ...baseData,
      id: this.classId!
    };
  }

  private getCurrentBranchId(): string {
    // Get current customer ID from auth state
    let branchId = '';
    this.store
      .select((state: AppState) => state.auth.currentCustomerId)
      .pipe(take(1))
      .subscribe((customerId) => {
        branchId = customerId || '';
      });

    // Fallback if no branch selected
    if (!branchId) {
      console.warn('No branch selected, using fallback');
      return '674ef35b831f5b2a65bc3f46'; // Fallback branch ID
    }

    return branchId;
  }



  cancel(): void {
    this.cancelForm.emit();
    this.router.navigate(['/dashboard/classes']);
  }

  // Helper method to mark all form controls as touched
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }
}
