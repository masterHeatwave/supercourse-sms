import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { SessionsService } from '@gen-api/sessions/sessions.service';
import {
  PostSessionsBody,
  PostSessionsBodyMode,
  PostSessionsBodyDay,
  Session,
  GetSessionsPreviewParams,
  GetSessionsPreviewDay,
  GetSessionsPreview200Data
} from '@gen-api/schemas';

// Extended Session interface to handle recurring session fields that may not be in generated types yet
export interface ExtendedSession extends Session {
  day?: string;
  start_time?: string;
  duration?: number;
  frequency?: number;
}

export interface SessionFormData {
  id?: string;
  day: string;
  startTime: string;
  duration: number; // in hours
  dateRange: [Date, Date];
  frequencyValue: number;
  mode?: string;
  classroom?: string;
  students?: string[];
  teachers?: string[];
  academicPeriod?: string;
}

export interface SessionValidationError {
  type: string;
  message: string;
  field?: string;
  details?: any;
}

export interface SessionPreviewResult {
  data: GetSessionsPreview200Data | null;
  error: SessionValidationError | null;
}

export interface BulkSessionResult {
  success: boolean;
  results: any[];
  errors: SessionValidationError[];
}

@Injectable({
  providedIn: 'root'
})
export class SessionManagementService {
  private sessionsService = inject(SessionsService);

  // Static configuration
  readonly DAYS = [
    { label: 'Monday', value: 'monday' },
    { label: 'Tuesday', value: 'tuesday' },
    { label: 'Wednesday', value: 'wednesday' },
    { label: 'Thursday', value: 'thursday' },
    { label: 'Friday', value: 'friday' },
    { label: 'Saturday', value: 'saturday' },
    { label: 'Sunday', value: 'sunday' }
  ];

  readonly START_TIMES = [
    { label: '06:00', value: '06:00' },
    { label: '06:30', value: '06:30' },
    { label: '07:00', value: '07:00' },
    { label: '07:30', value: '07:30' },
    { label: '08:00', value: '08:00' },
    { label: '08:30', value: '08:30' },
    { label: '09:00', value: '09:00' },
    { label: '09:30', value: '09:30' },
    { label: '10:00', value: '10:00' },
    { label: '10:30', value: '10:30' },
    { label: '11:00', value: '11:00' },
    { label: '11:30', value: '11:30' },
    { label: '12:00', value: '12:00' },
    { label: '12:30', value: '12:30' },
    { label: '13:00', value: '13:00' },
    { label: '13:30', value: '13:30' },
    { label: '14:00', value: '14:00' },
    { label: '14:30', value: '14:30' },
    { label: '15:00', value: '15:00' },
    { label: '15:30', value: '15:30' },
    { label: '16:00', value: '16:00' },
    { label: '16:30', value: '16:30' },
    { label: '17:00', value: '17:00' },
    { label: '17:30', value: '17:30' },
    { label: '18:00', value: '18:00' },
    { label: '18:30', value: '18:30' },
    { label: '19:00', value: '19:00' },
    { label: '19:30', value: '19:30' },
    { label: '20:00', value: '20:00' },
    { label: '20:30', value: '20:30' },
    { label: '21:00', value: '21:00' }
  ];

  readonly DURATIONS = [
    { label: '30 min', value: 0.5 },
    { label: '45 min', value: 0.75 },
    { label: '1 hour', value: 1 },
    { label: '1.5 hours', value: 1.5 },
    { label: '2 hours', value: 2 },
    { label: '2.5 hours', value: 2.5 },
    { label: '3 hours', value: 3 },
    { label: '3.5 hours', value: 3.5 },
    { label: '4 hours', value: 4 },
    { label: '4.5 hours', value: 4.5 },
    { label: '5 hours', value: 5 },
    { label: '5.5 hours', value: 5.5 },
    { label: '6 hours', value: 6 }
  ];

  readonly MODES = [
    { label: 'In-person', value: 'in_person' },
    { label: 'Online', value: 'online' },
    { label: 'Hybrid', value: 'hybrid' }
  ];

  /**
   * Validate session data client-side
   */
  validateSession(sessionData: SessionFormData): SessionValidationError | null {
    // Check required fields
    if (!sessionData.day || !sessionData.startTime || !sessionData.duration ||
        !sessionData.dateRange?.[0] || !sessionData.dateRange?.[1] || !sessionData.classroom) {
      return {
        type: 'VALIDATION_ERROR',
        message: 'Please fill in all required fields (Day, Start Time, Duration, Date Range, Classroom).',
        field: 'required_fields'
      };
    }

    // Validate date range
    const [startDate, endDate] = sessionData.dateRange;
    if (startDate >= endDate) {
      return {
        type: 'VALIDATION_ERROR',
        message: 'End date must be after start date.',
        field: 'dateRange'
      };
    }

    // Validate duration minimum
    if (sessionData.duration < 0.5) {
      return {
        type: 'VALIDATION_ERROR',
        message: 'Duration must be at least 30 minutes (0.5 hours).',
        field: 'duration'
      };
    }

    // Validate frequency
    if (sessionData.frequencyValue < 1 || sessionData.frequencyValue > 52) {
      return {
        type: 'VALIDATION_ERROR',
        message: 'Frequency must be between 1 and 52 weeks.',
        field: 'frequencyValue'
      };
    }

    return null; // Valid
  }

  /**
   * Generate session preview using API
   */
  async generatePreview(sessionData: SessionFormData): Promise<SessionPreviewResult> {
    try {
      const validation = this.validateSession(sessionData);
      if (validation) {
        return { data: null, error: validation };
      }

      const [startDate, endDate] = sessionData.dateRange;
      const previewParams: GetSessionsPreviewParams = {
        day: sessionData.day as GetSessionsPreviewDay,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        frequency: sessionData.frequencyValue,
        start_time: sessionData.startTime,
        duration: sessionData.duration
      };

      const response = await this.sessionsService.getSessionsPreview(previewParams).toPromise();

      if (response?.success && response.data) {
        return { data: response.data, error: null };
      } else {
        return {
          data: null,
          error: {
            type: 'PREVIEW_ERROR',
            message: 'Failed to generate session preview. Please check your session data.'
          }
        };
      }
    } catch (error: any) {
      return {
        data: null,
        error: {
          type: 'NETWORK_ERROR',
          message: 'Failed to preview session. Please try again.',
          details: error
        }
      };
    }
  }

  /**
   * Transform form data to API format
   */
  transformToApiFormat(sessionData: SessionFormData, taxiId: string): PostSessionsBody {
    // Convert UI mode values to API format
    const uiMode: string = sessionData.mode || '';
    let apiMode: PostSessionsBodyMode = 'in_person'; // Default
    if (uiMode) {
      const normalized = uiMode.replace(/-/g, '_');
      if (['in_person', 'online', 'hybrid'].includes(normalized)) {
        apiMode = normalized as PostSessionsBodyMode;
      }
    }

    // Map UI day values to API enum
    const apiDay: PostSessionsBodyDay | undefined = sessionData.day ?
      sessionData.day as PostSessionsBodyDay : undefined;

    // Calculate start and end dates for the recurring period
    const [startDate, endDate] = sessionData.dateRange;

    return {
      taxi: taxiId,
      classroom: sessionData.classroom || '674ef35b831f5b2a65bc3f47', // Use selected or fallback
      students: sessionData.students || [],
      teachers: sessionData.teachers || [],
      academic_period: sessionData.academicPeriod || '',
      is_recurring: true,
      mode: apiMode,
      day: apiDay,
      start_time: sessionData.startTime,
      duration: sessionData.duration,
      frequency: sessionData.frequencyValue || 1,
      start_date: this.formatDateAsLocal(startDate),
      end_date: this.formatDateAsLocal(endDate)
    };
  }

  /**
   * Format date as local ISO string without timezone conversion
   */
  private formatDateAsLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
  }

  /**
   * Transform API data to form format
   */
  transformFromApiFormat(session: ExtendedSession): SessionFormData {
    console.log('Transforming session from API:', {
      id: session.id,
      start_time: session.start_time,
      day: session.day,
      duration: session.duration,
      frequency: session.frequency,
      start_date: session.start_date,
      end_date: session.end_date
    });

    // Extract day from start_date or use the day field if available
    const startDate = new Date(session.start_date);
    const endDate = new Date(session.end_date);

    // Use the day field from API if available, otherwise calculate from start_date
    let day = session.day;
    if (!day) {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      day = dayNames[startDate.getDay()];
    }

    // Use the start_time field from API if available, otherwise extract from start_date
    let startTime = session.start_time;
    if (!startTime) {
      // Use local time instead of UTC to preserve the actual time
      const hours = startDate.getHours().toString().padStart(2, '0');
      const minutes = startDate.getMinutes().toString().padStart(2, '0');
      startTime = `${hours}:${minutes}`;
    }

    // Use the duration field from API (already in hours)
    // Be more careful with duration - don't default to 1 if it's actually 0
    let duration = session.duration;
    if (duration === undefined || duration === null) {
      // Calculate duration from start_date and end_date if duration field is missing
      const durationMs = endDate.getTime() - startDate.getTime();
      const durationHours = durationMs / (1000 * 60 * 60); // Convert ms to hours
      duration = Math.max(0.5, durationHours); // Minimum 0.5 hours
      console.log(`Duration not in API, calculated from dates: ${durationHours} hours`);
    }

    console.log(`Final duration: ${duration} hours`);

    // Calculate date range (use the actual dates from the session)
    const dateRange: [Date, Date] = [startDate, endDate];

    // Handle mode conversion from API to UI format
    const apiMode = (session.mode ?? '').toString().toLowerCase();
    const uiMode = apiMode ? apiMode.replace(/_/g, '-') : '';

    // Handle classroom - it can be a populated object or just an ID string
    let classroomId = '';
    if (session.classroom) {
      if (typeof session.classroom === 'object' && session.classroom !== null) {
        classroomId = (session.classroom as any).id || (session.classroom as any)._id || '';
      } else if (typeof session.classroom === 'string') {
        classroomId = session.classroom;
      }
    }

    // Handle academic period - it can be a populated object or just an ID string
    let academicPeriodId = '';
    if (session.academic_period) {
      if (typeof session.academic_period === 'object' && session.academic_period !== null) {
        academicPeriodId = (session.academic_period as any).id || (session.academic_period as any)._id || '';
      } else if (typeof session.academic_period === 'string') {
        academicPeriodId = session.academic_period;
      }
    }

    return {
      id: session.id,
      day: day || 'monday',
      startTime: startTime || '09:00',
      duration,
      dateRange,
      frequencyValue: session.frequency || 1,
      mode: uiMode,
      classroom: classroomId,
      students: session.students || [],
      teachers: session.teachers || [],
      academicPeriod: academicPeriodId
    };
  }

  /**
   * Create multiple sessions
   */
  createBulkSessions(sessionsData: SessionFormData[], taxiId: string): Observable<BulkSessionResult> {
    if (!sessionsData || sessionsData.length === 0) {
      return of({ success: true, results: [], errors: [] });
    }

    const sessionCalls = sessionsData.map((session, index) => {
      const apiData = this.transformToApiFormat(session, taxiId);
      return this.sessionsService.postSessions(apiData).pipe(
        catchError((error) => {
          console.error(`Failed to create session ${index + 1}:`, error);
          return of({ error: true, index, details: error });
        })
      );
    });

    return forkJoin(sessionCalls).pipe(
      switchMap((results) => {
        const successResults = results.filter(r => !(r as any).error);
        const errors = results
          .filter(r => (r as any).error)
          .map((r: any) => ({
            type: 'SESSION_CREATE_ERROR',
            message: `Failed to create session ${r.index + 1}`,
            details: r.details
          }));

        return of({
          success: errors.length === 0,
          results: successResults,
          errors
        });
      })
    );
  }

  /**
   * Delete sessions by taxi ID
   */
  deleteSessionsByTaxi(taxiId: string): Observable<boolean> {
    return this.sessionsService.getSessions({ taxi: taxiId }).pipe(
      switchMap((response) => {
        const existingSessions: Session[] = (response?.data?.results ?? response?.data ?? []) as Session[];
        const deleteIds = existingSessions.map((s: Session) => s.id);

        if (deleteIds.length === 0) {
          return of(true);
        }

        const deleteCalls = deleteIds.map((id: string) =>
          this.sessionsService.deleteSessionsId(id).pipe(
            catchError((error) => {
              console.error('Failed to delete session:', id, error);
              return of(null);
            })
          )
        );

        return forkJoin(deleteCalls).pipe(
          switchMap(() => of(true))
        );
      }),
      catchError(() => of(false))
    );
  }

  /**
   * Update sessions (delete old, create new)
   */
  updateBulkSessions(sessionsData: SessionFormData[], taxiId: string): Observable<BulkSessionResult> {
    return this.deleteSessionsByTaxi(taxiId).pipe(
      switchMap(() => this.createBulkSessions(sessionsData, taxiId))
    );
  }
}