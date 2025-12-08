import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, combineLatest, of } from 'rxjs';
import { switchMap, map, tap, catchError } from 'rxjs/operators';
import { SessionsService } from '@gen-api/sessions/sessions.service';
import { Session, GetSessions200 } from '@gen-api/schemas';
import { PrimaryTableComponent } from '@components/table/primary-table/primary-table.component';
import { SpinnerComponent } from '@components/spinner/spinner.component';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { TagModule } from 'primeng/tag';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import * as XLSX from 'xlsx';
import { Store } from '@ngrx/store';
import { AppState } from '@store/app.state';
import { selectAuthState } from '@store/auth/auth.selectors';
import { getModeLabel } from '../../../utils/session-modes.util';
import { calculateSessionStatus, getSessionStatusSeverity, getSessionStatusLabel } from '../../../utils/session-status.util';

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [CommonModule, PrimaryTableComponent, SpinnerComponent, ButtonModule, TagModule, TranslateModule],
  templateUrl: './sessions.component.html',
  styleUrl: './sessions.component.scss'
})
export class SessionsComponent implements OnInit {
  sessions: Session[] = [];
  totalRecords: number = 0;
  currentCustomerId: string | null | undefined;
  #router = inject(Router);
  #sessionsService = inject(SessionsService);
  #messageService = inject(MessageService);
  #translateService = inject(TranslateService);
  private store = inject(Store<AppState>);

  // Table columns configuration for sessions
  tableColumns = [
    { field: 'code', header: 'sessions.table.code', filterType: 'text' },
    { field: 'status', header: 'sessions.table.status', type: 'status', filterType: 'text' },
    { field: 'title', header: 'sessions.table.title', filterType: 'text' },
    { field: 'class', header: 'sessions.table.class', filterType: 'text' },
    { field: 'teacher', header: 'sessions.table.teachers', filterType: 'text' },
    { field: 'studentsCount', header: 'sessions.table.students', filterType: 'text' },
    { field: 'mode', header: 'sessions.table.mode', filterType: 'text' },
    { field: 'classroom', header: 'sessions.table.classroom', filterType: 'text' },
    { field: 'absences', header: 'sessions.table.absences', filterType: 'text' },
    { field: 'scheduledTimeframe', header: 'Scheduled Timeframe', type: 'timeframe', filterType: 'text' },
    { field: 'startTime', header: 'Started At', type: 'time', filterType: 'text' },
    { field: 'endsIn', header: 'Ends In', type: 'duration', filterType: 'text' }
  ];

  private searchQuerySubject = new BehaviorSubject<string>('');
  searchQuery$ = this.searchQuerySubject.asObservable();

  private pageSubject = new BehaviorSubject<number>(1);
  page$ = this.pageSubject.asObservable();

  private limitSubject = new BehaviorSubject<number>(10);
  limit$ = this.limitSubject.asObservable();

  isLoading: boolean = false;

  // Add view mode state
  private viewModeSubject = new BehaviorSubject<'list' | 'grid'>('list');
  viewMode$ = this.viewModeSubject.asObservable();

  // Helper functions to transform session data for display
  getStatusSeverity(status: string): string {
    return getSessionStatusSeverity(status as 'Live' | 'Scheduled' | 'Completed' | 'Cancelled');
  }

  getStatusLabel(status: string): string {
    return getSessionStatusLabel(status as 'Live' | 'Scheduled' | 'Completed' | 'Cancelled', this.#translateService);
  }

  formatTimeframe(startTime: string, endTime: string): string {
    if (!startTime || !endTime) return this.#translateService.instant('common.unknown');
    const start = new Date(startTime);
    const end = new Date(endTime);

    const locale = this.#translateService.currentLang === 'el' ? 'el-GR' : 'en-US';
    const startTimeFormatted = start.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    const endTimeFormatted = end.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

    return `${startTimeFormatted} - ${endTimeFormatted}`;
  }

  formatStartTime(startTime: string): string {
    if (!startTime) return this.#translateService.instant('common.unknown');
    
    // Handle time-only format (e.g., "19:30", "07:00")
    if (startTime.includes(':') && !startTime.includes('T')) {
      const [hours, minutes] = startTime.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      const locale = this.#translateService.currentLang === 'el' ? 'el-GR' : 'en-US';
      return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    }
    
    // Handle full datetime format
    const start = new Date(startTime);
    const locale = this.#translateService.currentLang === 'el' ? 'el-GR' : 'en-US';
    return start.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  }

  calculateSessionDuration(startTime: string, endTime: string): string {
    if (!startTime || !endTime) return '01H';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    // Format as "01H" or "01H 30M" if there are minutes
    if (diffMins > 0) {
      return `${diffHrs.toString().padStart(2, '0')}H ${diffMins}M`;
    } else {
      return `${diffHrs.toString().padStart(2, '0')}H`;
    }
  }

  calculateTimeLeft(endTime: string): string {
    if (!endTime) return this.#translateService.instant('common.unknown');

    const end = new Date(endTime);
    const now = new Date();

    if (now > end) return this.#translateService.instant('sessions.list.ended');

    const diffMs = end.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHrs = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays}d ${diffHrs}h`;
    } else if (diffHrs > 0) {
      return `${diffHrs}h ${diffMins}m`;
    } else {
      return `${diffMins}m`;
    }
  }

  // Transform session data for display
  transformSessionData(session: any): any {
    // Using 'any' since the API response differs from generated types
    return {
      ...session,
      // Transform nested objects to display values
      code: session.id?.substring(0, 8).toUpperCase() || this.#translateService.instant('sessions.list.na'), // Use first 8 chars of ID as code
      title: session.taxi
        ? `${session.taxi.subject || this.#translateService.instant('common.unknown')} - ${session.taxi.level || this.#translateService.instant('common.unknown')}`
        : this.#translateService.instant('sessions.list.no_subject'), // Combine subject and level
      class: session.taxi?.name || this.#translateService.instant('sessions.list.no_class'), // Use taxi name as class
      teacher: this.formatTeachers(session.teachers || []), // Format teacher names
      mode: getModeLabel(session.mode), // Use centralized mode label mapping
      classroom: session.classroom?.name || this.#translateService.instant('sessions.list.no_classroom'), // Use classroom name
      room: session.classroom?.location || this.#translateService.instant('sessions.list.no_location'), // Use classroom location as room
      absences: this.formatAbsences(session.absences || []), // Format absences count
      scheduledTimeframe: this.formatTimeframe(session.start_date, session.end_date),
      startTime: this.formatStartTime(session.start_time),
      endsIn: this.calculateSessionDuration(session.start_date, session.end_date),
      status: calculateSessionStatus(session.start_date, session.end_date, session.start_time, session.duration, session.is_cancelled || false),
      studentsCount: session.students?.length || 0 // Add students count for reference
    };
  }

  // Format teachers list for display
  private formatTeachers(teachers: any[]): string {
    if (!teachers || teachers.length === 0) {
      return 'No teachers';
    }

    if (teachers.length === 1) {
      const teacher = teachers[0];
      return `${teacher.firstname} ${teacher.lastname}`;
    }

    if (teachers.length <= 2) {
      return teachers.map((teacher) => `${teacher.firstname} ${teacher.lastname}`).join(', ');
    }

    // For more than 2 teachers, show first teacher and count
    const firstTeacher = teachers[0];
    return `${firstTeacher.firstname} ${firstTeacher.lastname} +${teachers.length - 1} more`;
  }

  // Format absences for display
  private formatAbsences(absences: any): string {
    // Handle case where absences might be a number instead of an array
    if (typeof absences === 'number') {
      return absences.toString();
    }
    
    if (!absences || !Array.isArray(absences) || absences.length === 0) {
      return '0';
    }
    
    return absences.length.toString();
  }


  sessions$ = combineLatest({
    page: this.pageSubject,
    limit: this.limitSubject
  }).pipe(
    tap(() => (this.isLoading = true)),
    switchMap(({ page, limit }) => {
      return this.#sessionsService.getSessions<any>(undefined, {
        params: { page: page.toString(), limit: limit.toString(), branch: this.currentCustomerId || '' }
      }).pipe(
        catchError((error) => {
          this.isLoading = false;
          this.showErrorMessage(error);
          return of({} as any);
        })
      );
    }),
    map((response) => {
      this.isLoading = false;

      // Support both paginated { data: { results, totalResults, ... } } and legacy { data: Session[], count }
      const sessionsArray = (response as any)?.data?.results ?? (response as any)?.data ?? [];

      if (!sessionsArray || sessionsArray.length === 0) {
        return {
          sessions: [],
          totalResults: 0
        };
      }

      return {
        sessions: sessionsArray.map((session: any) => this.transformSessionData(session)),
        totalResults: (response as any)?.data?.totalResults ?? (response as any)?.count ?? sessionsArray.length
      };
    }),
    tap(({ sessions, totalResults }) => {
      this.sessions = sessions;
      this.totalRecords = totalResults;
    })
  );

  ngOnInit() {
    this.store.select(selectAuthState).subscribe((authState) => {
      this.currentCustomerId = authState.currentCustomerId;
      this.pageSubject.next(1);
    });
    this.sessions$.subscribe();
    this.pageSubject.next(1);
  }

  onPageChange(event: { page: number; rows: number }) {
    this.pageSubject.next(event.page);
    this.limitSubject.next(event.rows);
  }

  onRowsPerPageChange(rows: number) {
    this.limitSubject.next(rows);
    this.pageSubject.next(1);
  }

  onSessionSelect(session: any) {
    this.#router.navigate(['/dashboard/sessions/', session.id]);
  }

  onEditSession(session: any) {
    this.#router.navigate(['/dashboard/sessions/edit/', session.id]);
  }

  onDeleteSession(session: any) {
    if (!session?.id) return;
    this.#sessionsService.deleteSessionsId(session.id).subscribe({
      next: () => {
        this.#messageService.add({
          severity: 'success',
          summary: this.#translateService.instant('api_messages.success_title'),
          detail: this.#translateService.instant('sessions.messages.deleted')
        });
        this.pageSubject.next(1);
      },
      error: (error) => {
        const msg = error?.error?.message || 'sessions.errors.delete_failed';
        this.#messageService.add({ severity: 'error', summary: this.#translateService.instant('api_messages.error_title'), detail: this.#translateService.instant(msg) });
      }
    });
  }
  onFilterChange(event: { field: string; value: any }) {
    // Implement filtering logic
    if (event.field === 'status') {
      // Handle status filter
    } else if (event.field === 'startTime') {
      // Handle date filter
    } else {
      // Handle text filters
    }
    // Reset to first page when filter changes
    this.pageSubject.next(1);
  }

  navigateToCreate() {
    this.#router.navigate(['/dashboard/sessions/create']);
  }

  navigateToTimetable() {
    this.#router.navigate(['/dashboard/sessions/timetable']);
  }

  private showErrorMessage(error: any) {
    const errorMessage = error?.error?.message || 'An error occurred while loading sessions';
    this.#messageService.add({
      severity: 'error',
      summary: this.#translateService.instant('api_messages.error_title'),
      detail: this.#translateService.instant(errorMessage)
    });
  }

  toggleViewMode() {
    const currentMode = this.viewModeSubject.value;
    const newMode = currentMode === 'list' ? 'grid' : 'list';
    this.viewModeSubject.next(newMode);
  }

  downloadExcel() {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.sessions);
    const workbook: XLSX.WorkBook = { Sheets: { Sessions: worksheet }, SheetNames: ['Sessions'] };
    XLSX.writeFile(workbook, 'sessions-list.xlsx');
  }
}
