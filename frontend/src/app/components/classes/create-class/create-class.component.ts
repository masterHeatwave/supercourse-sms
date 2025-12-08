import { Component, inject, Input, OnInit, Output, EventEmitter, ViewChild, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { OutlineButtonComponent } from '@components/buttons/outline-button/outline-button.component';
import { SessionFormComponent } from '../../shared/session-form/session-form.component';
import { SessionManagementService, SessionFormData } from '@services/session-management.service';
import { TaxisService } from '@gen-api/taxis/taxis.service';
import { PostTaxisBody, PutTaxisIdBody } from '@gen-api/schemas';
import { catchError, of, switchMap, take, Subject, takeUntil } from 'rxjs';
import { Store } from '@ngrx/store';
import { AppState } from '@store/app.state';
import { FormValidationService, CLASS_FIELD_LABELS } from '../../../services/validation/form-validation.service';


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
    OutlineButtonComponent,
    SessionFormComponent
  ],
  templateUrl: './create-class.component.html',
  styleUrl: './create-class.component.scss'
})
export class CreateClassComponent implements OnInit, OnDestroy {
  @Input() isEditMode = false;
  @Input() classData: any = null;
  @Input() submitButtonLabel = 'Save';

  @Output() classCreated = new EventEmitter<any>();
  @Output() classUpdated = new EventEmitter<any>();
  @Output() formSubmitError = new EventEmitter<any>();
  @Output() cancelForm = new EventEmitter<void>();

  @ViewChild(SessionFormComponent, { static: false }) sessionsComponent!: SessionFormComponent;

  private readonly destroy$ = new Subject<void>();
  
  formFieldsService = inject(ClassFormFields);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private taxisService = inject(TaxisService);
  private store = inject(Store<AppState>);
  private validationService = inject(FormValidationService);
  private sessionManagementService = inject(SessionManagementService);
  private cdr = inject(ChangeDetectorRef);

  form = new FormGroup({});
  model: any = { sessions: [] };
  classInfoFields: FormlyFieldConfig[] = [];
  isLoading = false;
  isLoadingFormData = true; // Flag to show loader until form data is ready
  classId: string | null = null;
  private isLoadingSessionsData = false; // Flag to prevent overwriting during load

  constructor() {
    this.form = new FormGroup({});
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setupRouteSubscription();
    this.setupFormValueChanges();
  }

  private async initializeForm(): Promise<void> {
    try {
      this.isLoadingFormData = true;
      this.classInfoFields = await this.formFieldsService.getClassInfoFieldsWithData();
      this.isLoadingFormData = false;
    } catch (error) {
      console.error('Error initializing form fields:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load form data'
      });
      this.isLoadingFormData = false;
    }
  }

  private setupRouteSubscription(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        if (params['id']) {
          this.classId = params['id'];
          this.isEditMode = true;
          this.submitButtonLabel = 'Update';
          this.loadClassData(params['id']);
        } else {
          this.initializeCreateMode();
        }
      });
  }

  private initializeCreateMode(): void {
    this.model = { sessions: [] };
    
    // If classData is provided via @Input, use it
    if (this.classData) {
      this.model = { ...this.classData };
    }
  }

  private setupFormValueChanges(): void {
    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((values: any) => {
        // Update model with form values to keep data in sync
        if (values.teachers !== undefined) {
          this.model.teachers = values.teachers;
        }
        if (values.students !== undefined) {
          this.model.students = values.students;
        }
        if (values.academicPeriod !== undefined) {
          this.model.academicPeriod = values.academicPeriod;
        }
      });
  }

  onSessionsChange(sessions: SessionFormData[]): void {
    // Don't overwrite sessions if we're in the middle of loading them
    if (!this.isLoadingSessionsData) {
      this.model.sessions = sessions;
    }
  }

  onSessionValidationChange(isValid: boolean): void {
    // Session validation is handled in the session component
    // This method can be used for additional validation logic if needed
  }


  loadClassData(classId: string): void {
    this.isLoading = true;

    // First, get the taxi data
    this.taxisService.getTaxisId(classId)
      .pipe(
        switchMap((taxiResponse: any) => {
          // Then, get the sessions separately using the new endpoint
          return this.taxisService.getTaxisIdSessions(classId).pipe(
            switchMap((sessionsResponse: any) => {
              // Combine both responses
              return of({
                taxi: taxiResponse.data,
                sessions: sessionsResponse.data.sessions
              });
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (combinedData: any) => {
          this.transformApiDataToModel(combinedData.taxi, combinedData.sessions);
          this.isLoading = false;
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

  private transformApiDataToModel(apiData: any, sessionsData: any[] = []): void {
    // Extract teachers and students from users array based on user_type
    const teachers = apiData.users ? apiData.users.filter((user: any) => user.user_type === 'teacher') : [];
    const students = apiData.users ? apiData.users.filter((user: any) => user.user_type === 'student') : [];

    // Transform API data back to form model structure
    this.model = {
      // Basic class info
      name: apiData.name || '',
      classColor: apiData.color || '#ff0000',
      subject: apiData.subject || '',
      level: apiData.level || '',
      notes: apiData.notes || '',

      // Academic info (use IDs for form fields)
      academicYear: apiData.academic_year?._id || apiData.academic_year?.id || '',
      academicPeriod: apiData.academic_period?._id || apiData.academic_period?.id || '',

      // Branch info
      branch: apiData.branch?._id || apiData.branch?.id || apiData.branch || '',

      // Users - extract IDs for form (use _id from API response)
      teachers: teachers.map((teacher: any) => teacher._id),
      students: students.map((student: any) => student._id),
      materials: apiData.scap_products || [],

      // Sessions - use sessions from the separate endpoint
      sessions: this.transformSessionsForForm(sessionsData)
    };

    this.classData = this.model;

    // Set flag BEFORE updating form to prevent session overwrites
    this.isLoadingSessionsData = true;

    // Update form fields with the loaded data to ensure default values are set
    this.updateFormFieldsWithData();

    // Load sessions into the component after change detection
    setTimeout(() => {
      if (this.sessionsComponent && this.model.sessions?.length > 0) {
        this.sessionsComponent.loadSessionsData(this.model.sessions);
        
        // Clear flag after a short delay to allow the form to stabilize
        setTimeout(() => {
          this.isLoadingSessionsData = false;
        }, 200);
        
        // Manually trigger change detection after programmatic update
        this.cdr.detectChanges();
      } else {
        // Clear flag even if no sessions to load
        this.isLoadingSessionsData = false;
      }
    }, 100);
  }

  private updateFormFieldsWithData(): void {
    // Update the form fields with the loaded data, passing model as default values
    // Pass isEditMode flag so form fields service knows whether to filter by active year or selected year
    this.classInfoFields = this.formFieldsService.getClassInfoFields(this.model, this.isEditMode);
    
    // Update the form with the model data
    this.form.patchValue(this.model);
  }

  private transformSessionsForForm(sessions: any[]): SessionFormData[] {
    return sessions.map((session) => {
      return this.sessionManagementService.transformFromApiFormat(session as any);
    });
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
        }),
        takeUntil(this.destroy$)
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
        }),
        takeUntil(this.destroy$)
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
      scap_products: formData.materials || [],
      notes: formData.notes || undefined
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
