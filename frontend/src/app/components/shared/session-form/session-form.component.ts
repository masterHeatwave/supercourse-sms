import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { MessagesModule } from 'primeng/messages';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { PrimaryDropdownComponent } from '@components/inputs/primary-dropdown/primary-dropdown.component';
import { ClassroomsService } from '@gen-api/classrooms/classrooms.service';
import { CustomerService } from '@services/customer.service';
import { SessionManagementService, SessionFormData, SessionPreviewResult } from '@services/session-management.service';
import { GetSessionsPreview200Data } from '@gen-api/schemas';
import { Message } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AppState } from '@store/app.state';

@Component({
  selector: 'app-session-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DropdownModule,
    CalendarModule,
    InputNumberModule,
    DialogModule,
    MessagesModule,
    InputTextModule,
    InputTextareaModule,
    PrimaryDropdownComponent
  ],
  templateUrl: './session-form.component.html',
  styleUrls: ['./session-form.component.scss']
})
export class SessionFormComponent implements OnInit, OnDestroy, OnChanges {
  @Input() initialData: SessionFormData[] = [];
  @Input() taxiId?: string;
  @Input() academicPeriodId?: string;
  @Input() disabled = false;
  @Input() students: string[] = [];
  @Input() teachers: string[] = [];

  @Output() sessionsChange = new EventEmitter<SessionFormData[]>();
  @Output() validationChange = new EventEmitter<boolean>();

  sessionsForm: FormGroup;

  // Service injections
  sessionService = inject(SessionManagementService);
  private classroomsService = inject(ClassroomsService);
  private customerService = inject(CustomerService);
  private fb = inject(FormBuilder);
  private store = inject(Store<AppState>);
  private destroy$ = new Subject<void>();

  // Component state
  classrooms: any[] = [];
  sessionPreviews: { [key: number]: GetSessionsPreview200Data } = {};
  sessionValidationMessages: { [key: number]: Message[] } = {};

  // Loading states
  isPreviewingSession = false;
  isValidatingBulk = false;

  constructor() {
    this.sessionsForm = this.fb.group({
      sessions: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadClassrooms();
    this.initializeSessions();

    // Watch for form changes and emit
    this.sessionsForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.emitChanges();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // When students or teachers input changes, emit the updated session data
    if ((changes['students'] || changes['teachers']) && !changes['students']?.firstChange && !changes['teachers']?.firstChange) {
      this.emitChanges();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get sessions(): FormArray {
    return this.sessionsForm.get('sessions') as FormArray;
  }

  private initializeSessions(): void {
    if (this.initialData && this.initialData.length > 0) {
      this.initialData.forEach(sessionData => {
        this.addSessionWithData(sessionData);
      });
    } else {
      this.addSession(); // Add one empty session by default
    }
  }

  private createSessionFormGroup(data?: SessionFormData): FormGroup {

    const group = this.fb.group({
      id: [data?.id || ''],
      day: [data?.day || '', Validators.required],
      startTime: [data?.startTime || '', Validators.required],
      duration: [data?.duration !== undefined ? data.duration : 1, [Validators.required, Validators.min(0.5)]],
      dateRange: [data?.dateRange || null, Validators.required],
      frequencyValue: [data?.frequencyValue || 1, [Validators.required, Validators.min(1), Validators.max(52)]],
      mode: [data?.mode || '', Validators.required], // Mode is required
      classroom: [data?.classroom || ''] // Classroom is always optional (regardless of mode)
    });

    // Note: Classroom field is always optional for all modes (online, hybrid, in_person)
    // The classroom control is set without any validators and remains that way
    const classroomControl = group.get('classroom');
    classroomControl?.clearValidators();
    classroomControl?.updateValueAndValidity();

    return group;
  }

  addSession(): void {
    const sessionGroup = this.createSessionFormGroup();
    this.sessions.push(sessionGroup);
  }

  addSessionWithData(data: SessionFormData): void {
    const sessionGroup = this.createSessionFormGroup(data);
    this.sessions.push(sessionGroup);
  }

  removeSession(index: number): void {

    // Remove the session from FormArray
    this.sessions.removeAt(index);

    // Clean up associated data
    delete this.sessionPreviews[index];
    delete this.sessionValidationMessages[index];

    // Reindex remaining data to prevent gaps
    this.reindexSessionData(index);

    // Emit changes to parent
    this.emitChanges();
  }

  private reindexSessionData(removedIndex: number): void {
    // Reindex previews and validation messages after removal
    const newPreviews: { [key: number]: any } = {};
    const newValidationMessages: { [key: number]: any } = {};

    Object.keys(this.sessionPreviews).forEach(key => {
      const idx = parseInt(key);
      if (idx > removedIndex) {
        newPreviews[idx - 1] = this.sessionPreviews[idx];
      } else if (idx < removedIndex) {
        newPreviews[idx] = this.sessionPreviews[idx];
      }
    });

    Object.keys(this.sessionValidationMessages).forEach(key => {
      const idx = parseInt(key);
      if (idx > removedIndex) {
        newValidationMessages[idx - 1] = this.sessionValidationMessages[idx];
      } else if (idx < removedIndex) {
        newValidationMessages[idx] = this.sessionValidationMessages[idx];
      }
    });

    this.sessionPreviews = newPreviews;
    this.sessionValidationMessages = newValidationMessages;
  }



  canPreviewSession(sessionIndex: number): boolean {
    const sessionForm = this.sessions.at(sessionIndex) as FormGroup;
    const values = sessionForm.value;
    return !!(values.day && values.startTime && values.duration &&
              values.dateRange?.[0] && values.dateRange?.[1]);
  }

  async previewSession(sessionIndex: number): Promise<void> {
    this.isPreviewingSession = true;
    this.clearValidationMessages(sessionIndex);

    try {
      const sessionForm = this.sessions.at(sessionIndex) as FormGroup;
      const sessionData = this.getSessionData(sessionForm.value);

      const result = await this.sessionService.generatePreview(sessionData);

      if (result.data) {
        this.sessionPreviews[sessionIndex] = result.data;
      } else if (result.error) {
        this.handleSessionError(sessionIndex, result.error);
      }
    } catch (error) {
      this.handleSessionError(sessionIndex, {
        type: 'NETWORK_ERROR',
        message: 'Failed to preview session. Please try again.'
      });
    } finally {
      this.isPreviewingSession = false;
    }
  }

  clearPreview(sessionIndex: number): void {
    delete this.sessionPreviews[sessionIndex];
  }

  async validateAllSessions(): Promise<void> {
    this.isValidatingBulk = true;

    try {
      const allValid = await Promise.all(
        this.sessions.controls.map((_, index) => this.validateSession(index))
      );

      const isValid = allValid.every(valid => valid);
      this.validationChange.emit(isValid);
    } finally {
      this.isValidatingBulk = false;
    }
  }

  async validateSession(sessionIndex: number): Promise<boolean> {
    const sessionForm = this.sessions.at(sessionIndex) as FormGroup;
    const sessionData = this.getSessionData(sessionForm.value);

    const error = this.sessionService.validateSession(sessionData);

    if (error) {
      this.handleSessionError(sessionIndex, error);
      return false;
    } else {
      this.clearValidationMessages(sessionIndex);
      return true;
    }
  }

  private getSessionData(formValue: any): SessionFormData {
    return {
      id: formValue.id,
      day: formValue.day,
      startTime: formValue.startTime,
      duration: formValue.duration,
      dateRange: formValue.dateRange,
      frequencyValue: formValue.frequencyValue,
      mode: formValue.mode,
      classroom: formValue.classroom,
      academicPeriod: this.academicPeriodId,
      students: this.students,
      teachers: this.teachers
    };
  }

  private handleSessionError(sessionIndex: number, error: any): void {
    this.sessionValidationMessages[sessionIndex] = [{
      severity: 'error',
      summary: 'Validation Error',
      detail: error.message || 'An error occurred'
    }];
  }

  private clearValidationMessages(sessionIndex: number): void {
    delete this.sessionValidationMessages[sessionIndex];
  }

  private emitChanges(): void {
    const sessionData = this.sessions.controls.map(control =>
      this.getSessionData(control.value)
    );
    this.sessionsChange.emit(sessionData);
  }

  // Classroom management methods
  private loadClassrooms(): void {
    // Get current customer/branch ID from store
    this.store.select((state: AppState) => state.auth.currentCustomerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((customerId: string | null) => {
        if (customerId) {
          this.classroomsService.getClassrooms({ branch: customerId })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (response: any) => {
                const classroomsData = response?.data?.results || response?.data || [];
                this.classrooms = classroomsData.map((classroom: any) => ({
                  label: classroom.name,
                  value: classroom.id || classroom._id
                }));
              },
              error: (error) => {
                console.error('Failed to load classrooms:', error);
                this.classrooms = [];
              }
            });
        }
      });
  }

  // Public API methods
  getSessionsData(): SessionFormData[] {
    return this.sessions.controls.map(control =>
      this.getSessionData(control.value)
    );
  }

  async validateBeforeSubmit(): Promise<boolean> {
    const validations = await Promise.all(
      this.sessions.controls.map((_, index) => this.validateSession(index))
    );
    return validations.every(valid => valid);
  }

  resetForm(): void {
    while (this.sessions.length > 0) {
      this.sessions.removeAt(0);
    }
    this.sessionPreviews = {};
    this.sessionValidationMessages = {};
    this.addSession();
  }

  // Helper method to check if classroom should be shown for a session
  // Classroom is only shown for in_person and hybrid modes, but is optional when shown
  isClassroomVisible(index: number): boolean {
    const sessionControl = this.sessions.at(index);
    const mode = sessionControl?.get('mode')?.value;
    // Only show classroom when mode is explicitly 'hybrid' or 'in_person'
    return mode === 'hybrid' || mode === 'in_person';
  }

  loadSessionsData(data: SessionFormData[]): void {
    // Clear existing sessions
    while (this.sessions.length > 0) {
      this.sessions.removeAt(0);
    }
    this.sessionPreviews = {};
    this.sessionValidationMessages = {};

    // Load new session data
    if (data && data.length > 0) {
      data.forEach((sessionData) => {
        this.addSessionWithData(sessionData);
      });
    } else {
      // Add one empty session if no data provided
      this.addSession();
    }
  }
}