import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewEncapsulation, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { FormlyPrimeNGModule } from '@ngx-formly/primeng';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { Store } from '@ngrx/store';
import { AppState } from '@store/app.state';
import { selectAuthState } from '@store/auth/auth.selectors';
import { TaxisService } from '@gen-api/taxis/taxis.service';
import { AcademicYearsService } from '@gen-api/academic-years/academic-years.service';
import { AcademicPeriodsService } from '@gen-api/academic-periods/academic-periods.service';
import { SessionsService } from '@gen-api/sessions/sessions.service';
import { PrimayColorSelectComponent } from '@components/inputs/primay-color-select/primay-color-select.component';
import { ClassroomsService } from '@gen-api/classrooms/classrooms.service';
import { PostSessionsBody, PostSessionsBodyMode, PutSessionsIdBody } from '@gen-api/schemas';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { UsersService } from '@gen-api/users/users.service';
import { TranslateModule } from '@ngx-translate/core';
import { SpinnerComponent } from '@components/spinner/spinner.component';
import { OutlineButtonComponent } from '@components/buttons/outline-button/outline-button.component';
import { SessionFieldsService } from './fields/session-fields.service';
import { SessionNotesFieldsService } from './fields/notes-fields.service';
import { FormValidationService, SESSION_FIELD_LABELS, ValidationConfig } from '@services/validation/form-validation.service';
import { PrimaryDropdownComponent } from '@components/inputs/primary-dropdown/primary-dropdown.component';
import { SessionScheduleFieldsService } from './fields/schedule-fields.service';
import { SessionFormComponent as ReusableSessionFormComponent } from '@components/shared/session-form/session-form.component';
import { SessionManagementService, SessionFormData } from '@services/session-management.service';

@Component({
  selector: 'app-create-session-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormlyModule,
    FormlyPrimeNGModule,
    ButtonModule,
    CardModule,
    ToastModule,
    TranslateModule,
    SpinnerComponent,
    PrimayColorSelectComponent,
    PrimaryDropdownComponent,
    OutlineButtonComponent,
    ReusableSessionFormComponent
  ],
  templateUrl: './session-form.component.html',
  styleUrl: './session-form.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class SessionFormComponent implements OnInit, OnChanges {
  @Input() isEditMode = false;
  @Input() sessionData: any = null;
  @Input() submitButtonLabel = 'Save';

  @Output() sessionCreated = new EventEmitter<any>();
  @Output() sessionUpdated = new EventEmitter<any>();
  @Output() formSubmitError = new EventEmitter<any>();
  @Output() cancelForm = new EventEmitter<void>();

  @ViewChild(ReusableSessionFormComponent) sessionsComponent!: ReusableSessionFormComponent;

  private store = inject(Store<AppState>);
  private taxisService = inject(TaxisService);
  private academicYearsService = inject(AcademicYearsService);
  private academicPeriodsService = inject(AcademicPeriodsService);
  private sessionsService = inject(SessionsService);
  private classroomsService = inject(ClassroomsService);
  private usersService = inject(UsersService);
  private fieldsService = inject(SessionFieldsService);
  private scheduleFieldsService = inject(SessionScheduleFieldsService);
  private notesFieldsService = inject(SessionNotesFieldsService);
  private validationService = inject(FormValidationService);
  private sessionManagementService = inject(SessionManagementService);

  form = new FormGroup({});
  model: any = {
    title: '',
    classes: '',
    teachers: [],
    students: [],
    academicYear: '',
    academicPeriod: ''
  };

  sessions: SessionFormData[] = [];

  isLoading = false;
  currentCustomerId: string | null | undefined;

  classesOptions: Array<{ label: string; value: string }> = [];
  teachersOptions: Array<{ label: string; value: string }> = [];
  studentsOptions: Array<{ label: string; value: string }> = [];

  fields: FormlyFieldConfig[] = [];
  detailsFields: FormlyFieldConfig[] = [];
  notesFields: FormlyFieldConfig[] = [];
  private submissionGuard = this.validationService.createSubmissionGuard();
  private validationConfig: ValidationConfig = {
    fieldLabels: SESSION_FIELD_LABELS
  };

  ngOnInit(): void {
    this.store.select(selectAuthState).subscribe((auth) => {
      this.currentCustomerId = auth.currentCustomerId;
      this.loadOptions();
    });
    // initial fields (empty options) - exclude schedule fields since we're using the reusable component
    this.detailsFields = this.fieldsService.getFields();
    this.notesFields = this.notesFieldsService.getFields();
    this.fields = [
      ...this.detailsFields,
      ...this.notesFields
    ];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sessionData'] && this.isEditMode && this.sessionData) {
      const start = this.sessionData.start_date ? new Date(this.sessionData.start_date) : undefined;
      const end = this.sessionData.end_date ? new Date(this.sessionData.end_date) : undefined;
      const startTime = start
        ? `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`
        : '';
      const duration = start && end ? String(Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000))) : '';
      const modeUi = typeof this.sessionData.mode === 'string' ? this.sessionData.mode.replace(/_/g, '-') : '';

      this.model = {
        title: this.sessionData.title || '',
        classes: this.resolveTaxiId(this.sessionData.taxi),
        teachers: this.normalizeUserIds(this.sessionData.teachers),
        students: this.normalizeUserIds(this.sessionData.students),
        academicYear: this.resolveTaxiId(this.sessionData.academic_year),
        academicPeriod: this.resolveTaxiId(this.sessionData.academic_period),
        classroom: this.resolveTaxiId(this.sessionData.classroom),
        dateRange: start && end ? [start, end] : undefined,
        startTime: this.sessionData.start_time || startTime,
        duration: this.sessionData.duration ? String(Math.round(this.sessionData.duration * 60)) : duration,
        mode: modeUi,
        inviteParticipants: !!this.sessionData.invite_participants,
        classColor: this.sessionData.color || this.sessionData.taxi?.color || '',
        notes: this.sessionData.notes || '',
        // New recurring session fields
        day: this.sessionData.day || '',
        frequency: this.sessionData.frequency || 1
      };

      // Convert session data to sessions array format for the reusable component
      if (this.sessionData) {
        this.sessions = [{
          day: this.sessionData.day || '',
          startTime: this.sessionData.start_time || startTime,
          duration: this.sessionData.duration || 1,
          dateRange: start && end ? [start, end] : [new Date(), new Date()],
          mode: modeUi || 'in-person',
          classroom: this.resolveTaxiId(this.sessionData.classroom),
          frequencyValue: this.sessionData.frequency || 1,
          students: this.normalizeUserIds(this.sessionData.students),
          teachers: this.normalizeUserIds(this.sessionData.teachers),
          academicPeriod: this.resolveTaxiId(this.sessionData.academic_period)
        }];
      }

      this.form.patchValue(this.model);
    }
  }

  private resolveTaxiId(taxi: any): string {
    if (!taxi) return '';
    if (typeof taxi === 'string') return taxi;
    return taxi.id || taxi._id || '';
  }

  private normalizeUserIds(input: any): string[] {
    if (!input) return [];
    if (Array.isArray(input)) {
      return input.map((x) => (typeof x === 'string' ? x : (x?.id || x?._id))).filter(Boolean);
    }
    return [];
  }

  private loadOptions(): void {
    if (!this.currentCustomerId) return;
    this.isLoading = true;

    // Load classes (taxis)
    this.taxisService
      .getTaxis({ branch: this.currentCustomerId, limit: '100', page: '1' } as any)
      .subscribe({
        next: (res: any) => {
          const data = res?.data?.results ?? res?.data ?? [];
          this.classesOptions = data.map((t: any) => ({ label: t.name, value: t.id || t._id }));
          // update fields service and refresh fields
          this.fieldsService.setClassesOptions(this.classesOptions);
          this.rebuildFields();
        },
        error: () => {}
      });

    // Load classrooms
    this.classroomsService.getClassrooms<any>(undefined, { params: { page: '1', limit: '200' } }).subscribe({
      next: (res: any) => {
        const arr: any[] = res?.data?.results ?? res?.data ?? [];
        const options = (arr as any[]).map((c) => ({ label: (c as any)?.name || 'Room', value: (c as any)?.id || (c as any)?._id }));
        this.scheduleFieldsService.setClassrooms(options);
        this.rebuildFields();
      },
      error: () => {}
    });

    // Load academic years and auto-set the active one
    this.academicYearsService.getAcademicYears().subscribe({
      next: (res: any) => {
        const years = res?.data?.results ?? res?.data ?? [];
        const options = years.map((y: any) => ({ label: y.name || y.year, value: y.id || y._id }));
        this.fieldsService.setAcademicYearsOptions(options);

        // Auto-set the active academic year
        const activeYear = years.find((y: any) => y.is_active === true || y.active === true);
        if (activeYear && !this.isEditMode) {
          this.model.academicYear = activeYear.id || activeYear._id;
          this.form.patchValue({ academicYear: this.model.academicYear });
        }

        this.rebuildFields();
      },
      error: () => {}
    });

    // Load academic periods
    this.academicPeriodsService.getAcademicPeriods().subscribe({
      next: (res: any) => {
        const periods = res?.data?.results ?? res?.data ?? [];
        const options = periods.map((p: any) => ({ label: p.name, value: p.id || p._id }));
        this.fieldsService.setAcademicPeriodsOptions(options);
        this.rebuildFields();
      },
      error: () => {}
    });

    // Load teachers (staff)
    this.usersService
      .getUsersStaff({ branch: this.currentCustomerId, page: '1', limit: '200' } as any)
      .subscribe({
        next: (res: any) => {
          const staff = res?.data?.results ?? res?.data ?? [];
          this.teachersOptions = staff.map((u: any) => ({ label: `${u.firstname || ''} ${u.lastname || ''}`.trim(), value: u.id || u._id }));
          this.fieldsService.setTeachersOptions(this.teachersOptions);
          this.rebuildFields();
        },
        error: () => {}
      });

    // Load students
    this.usersService
      .getUsersStudents({ branch: this.currentCustomerId, page: '1', limit: '500' } as any)
      .subscribe({
        next: (res: any) => {
          const students = res?.data?.results ?? res?.data ?? [];
          this.studentsOptions = students.map((u: any) => ({ label: `${u.firstname || ''} ${u.lastname || ''}`.trim(), value: u.id || u._id }));
          this.fieldsService.setStudentsOptions(this.studentsOptions);
          this.rebuildFields();
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }

  private rebuildFields(): void {
    this.detailsFields = this.fieldsService.getFields();
    this.notesFields = this.notesFieldsService.getFields();
    this.fields = [
      ...this.detailsFields,
      ...this.notesFields
    ];
  }

  async onSubmit(): Promise<void> {
    if (!this.submissionGuard.canSubmit()) {
      return;
    }
    this.submissionGuard.startSubmission();

    // Validate main form
    if (!this.form.valid) {
      (Object.values(this.form.controls) as AbstractControl[]).forEach((control) => control.markAsTouched());
      this.validationService.showValidationErrors(this.form, this.validationConfig);
      this.submissionGuard.endSubmission();
      return;
    }

    // Validate sessions using the reusable component
    let areSessionsValid = true;
    if (this.sessionsComponent) {
      areSessionsValid = await this.sessionsComponent.validateBeforeSubmit();
      // Update sessions with current data
      this.sessions = this.sessionsComponent.getSessionsData();
    }

    if (!areSessionsValid) {
      this.submissionGuard.endSubmission();
      return;
    }

    // Ensure we have sessions data
    if (!this.sessions || this.sessions.length === 0) {
      this.validationService.showValidationErrors(this.form, this.validationConfig, ['Please add at least one session']);
      this.submissionGuard.endSubmission();
      return;
    }
    interface SessionFormValue {
      classes: string;
      teachers: string[];
      students: string[];
      academicYear?: string;
      academicPeriod: string;
      inviteParticipants?: boolean;
      classColor?: string;
      notes?: string;
    }

    const formValue = this.form.value as unknown as SessionFormValue;
    const taxiId: string = Array.isArray(formValue.classes) ? formValue.classes[0] : formValue.classes;

    // Create or update session for single taxi
    if (taxiId) {
      console.log('Session form submit debug:', {
        isEditMode: this.isEditMode,
        sessionDataId: this.sessionData?.id,
        sessionData: this.sessionData,
        taxiId: taxiId
      });

      const sessionOperation = this.isEditMode && this.sessionData?.id
        ? this.updateSingleSession(formValue, this.sessionData.id)
        : this.sessionManagementService.createBulkSessions(
            this.sessions.map(session => ({
              ...session,
              // Add form data to each session
              students: formValue.students || [],
              teachers: formValue.teachers || [],
              academicPeriod: formValue.academicPeriod
            })),
            taxiId
          );

      sessionOperation.subscribe({
        next: (result: any) => {
          if (result.success || !!result.data) {
            if (this.isEditMode) {
              this.sessionUpdated.emit([result]);
            } else {
              this.sessionCreated.emit([result]);
            }
          } else {
            this.formSubmitError.emit({
              message: 'Failed to create session'
            });
          }
          this.submissionGuard.endSubmission();
        },
        error: (err: any) => {
          this.formSubmitError.emit({
            message: err?.message || 'Unknown error occurred while creating session'
          });
          this.submissionGuard.endSubmission();
        }
      });
    } else {
      this.submissionGuard.endSubmission();
    }
  }

  onCancel(): void {
    this.cancelForm.emit();
  }

  onSessionsChange(sessions: SessionFormData[]): void {
    this.sessions = sessions;
  }

  onSessionValidationChange(isValid: boolean): void {
    console.log('Sessions validation status:', isValid);
  }

  private updateSingleSession(formValue: any, sessionId: string): Observable<any> {
    // Build the update payload using the form data and session data
    const sessionData = this.sessions[0]; // For single session edit, use first session

    const updateData: PutSessionsIdBody = {
      id: sessionId,
      taxi: formValue.classes,
      classroom: sessionData?.classroom || '',
      students: formValue.students || [],
      teachers: formValue.teachers || [],
      academic_period: formValue.academicPeriod || '',
      mode: sessionData?.mode?.replace(/-/g, '_') as any || 'in_person',
      day: sessionData?.day as any || 'monday',
      start_time: sessionData?.startTime || '09:00',
      duration: sessionData?.duration || 1,
      frequency: sessionData?.frequencyValue || 1,
      start_date: sessionData?.dateRange?.[0]?.toISOString() || new Date().toISOString(),
      end_date: sessionData?.dateRange?.[1]?.toISOString() || new Date().toISOString(),
      notes: formValue.notes || '',
      is_recurring: true
    };

    return this.sessionsService.putSessionsId(sessionId, updateData).pipe(
      map((result: any) => ({ success: true, data: result })),
      catchError((error: any) => {
        console.error('Failed to update session:', error);
        return of({ success: false, error });
      })
    );
  }
}


