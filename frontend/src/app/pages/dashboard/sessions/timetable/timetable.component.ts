import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SessionsService } from '@gen-api/sessions/sessions.service';
import { Session, GetSessions200 } from '@gen-api/schemas';
import { BehaviorSubject, combineLatest, of } from 'rxjs';
import { switchMap, map, tap, catchError } from 'rxjs/operators';
import { SpinnerComponent } from '@components/spinner/spinner.component';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  type: 'session';
  data: any;
}

interface WeekDay {
  date: Date;
  dayName: string;
  dayNumber: number;
  events: CalendarEvent[];
}

@Component({
  selector: 'app-timetable',
  standalone: true,
  imports: [CommonModule, FormsModule, SpinnerComponent, ButtonModule, CalendarModule, DropdownModule, TagModule, TooltipModule, TranslateModule],
  templateUrl: './timetable.component.html',
  styleUrl: './timetable.component.scss'
})
export class TimetableComponent implements OnInit {
  #sessionsService = inject(SessionsService);
  #messageService = inject(MessageService);
  #translateService = inject(TranslateService);
  #router = inject(Router);

  isLoading = false;
  currentWeek: WeekDay[] = [];
  selectedWeekStart = new Date();
  timeSlots: string[] = [];

  // Filter options (labels are translation keys)
  filterOptions = [
    { label: 'sessions.timetable.filters.all_sessions', value: 'all' },
    { label: 'sessions.timetable.filters.my_sessions', value: 'my' },
    { label: 'sessions.timetable.filters.scheduled', value: 'scheduled' },
    { label: 'sessions.timetable.filters.in_progress', value: 'in_progress' },
    { label: 'sessions.timetable.filters.completed', value: 'completed' }
  ];
  selectedFilter = 'all';

  private searchQuerySubject = new BehaviorSubject<string>('');
  private pageSubject = new BehaviorSubject<number>(1);
  private limitSubject = new BehaviorSubject<number>(100); // Load more for calendar view

  sessions$ = combineLatest({
    page: this.pageSubject,
    limit: this.limitSubject
  }).pipe(
    tap(() => (this.isLoading = true)),
    switchMap(({ page, limit }) => {
      return this.#sessionsService.getSessions<any>(undefined, {
        params: { page: page.toString(), limit: limit.toString() }
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
      const sessionsArray = (response as any)?.data?.results ?? (response as any)?.data ?? [];

      if (!sessionsArray || (sessionsArray as any[]).length === 0) {
        return [];
      }

      return (sessionsArray as any[]).map((session: any) => this.transformSessionToEvent(session));
    }),
    tap((events) => {
      this.generateCurrentWeek(events);
    })
  );

  ngOnInit() {
    this.timeSlots = this.getTimeSlots();
    this.setCurrentWeek();
    this.sessions$.subscribe();
  }

  setCurrentWeek() {
    const today = new Date();
    const startOfWeek = new Date(today);
    // Get Monday as start of week
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    this.selectedWeekStart = startOfWeek;
  }

  generateCurrentWeek(events: CalendarEvent[] = []) {
    this.currentWeek = [];
    const startOfWeek = new Date(this.selectedWeekStart);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);

      const dayEvents = events.filter((event) => {
        const eventDate = new Date(event.start);
        return eventDate.toDateString() === date.toDateString();
      });

      const locale = this.#translateService.currentLang === 'el' ? 'el-GR' : 'en-US';
      this.currentWeek.push({
        date: new Date(date),
        dayName: date.toLocaleDateString(locale, { weekday: 'long' }),
        dayNumber: date.getDate(),
        events: dayEvents
      });
    }
  }

  previousWeek() {
    const newDate = new Date(this.selectedWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    this.selectedWeekStart = newDate;
    this.sessions$.subscribe(); // Refresh data
  }

  nextWeek() {
    const newDate = new Date(this.selectedWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    this.selectedWeekStart = newDate;
    this.sessions$.subscribe(); // Refresh data
  }

  goToToday() {
    this.setCurrentWeek();
    this.sessions$.subscribe(); // Refresh data
  }

  transformSessionToEvent(session: any): CalendarEvent {
    const startDate = new Date(session.start_date);
    const endDate = new Date(session.end_date);

    // Determine color based on status
    let color = '#3b82f6'; // Default blue
    const status = this.calculateSessionStatus(session.start_date, session.end_date);

    switch (status) {
      case 'scheduled':
        color = '#3b82f6'; // Blue
        break;
      case 'in_progress':
        color = '#10b981'; // Green
        break;
      case 'completed':
        color = '#6b7280'; // Gray
        break;
      case 'cancelled':
        color = '#ef4444'; // Red
        break;
    }

    return {
      id: session.id,
      title: `${session.taxi.subject} - ${session.taxi.level}`,
      start: startDate,
      end: endDate,
      color: color,
      type: 'session',
      data: {
        ...session,
        className: session.taxi.name || '',
        teacher: this.formatTeachers(session.teachers || []),
        classroom: session.classroom?.name || 'No classroom',
        studentsCount: session.students?.length || 0,
        status: status
      }
    };
  }

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

    const firstTeacher = teachers[0];
    return `${firstTeacher.firstname} ${firstTeacher.lastname} +${teachers.length - 1} more`;
  }

  private calculateSessionStatus(startDate: string, endDate: string): string {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) {
      return 'scheduled';
    } else if (now >= start && now <= end) {
      return 'in_progress';
    } else {
      return 'completed';
    }
  }

  getTimeSlots(): string[] {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      const time = new Date();
      time.setHours(hour, 0, 0, 0);
      const locale = this.#translateService.currentLang === 'el' ? 'el-GR' : 'en-US';
      slots.push(
        time.toLocaleTimeString(locale, {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
      );
    }
    return slots;
  }

  getAllDayEvents(events: CalendarEvent[]): CalendarEvent[] {
    return events.filter((event) => {
      const duration = event.end.getTime() - event.start.getTime();
      const hours = duration / (1000 * 60 * 60);
      return hours >= 4;
    });
  }

  getEventsForHour(events: CalendarEvent[], timeSlot: string): CalendarEvent[] {
    const [hours] = timeSlot.split(':');
    const slotHour = parseInt(hours, 10);

    return events.filter((event) => {
      const eventHour = event.start.getHours();
      const duration = event.end.getTime() - event.start.getTime();
      const eventHours = duration / (1000 * 60 * 60);

      return eventHours < 4 && eventHour === slotHour;
    });
  }

  onEventClick(event: CalendarEvent) {
    this.#router.navigate(['/dashboard/sessions', event.id]);
  }

  navigateToSessions() {
    this.#router.navigate(['/dashboard/sessions']);
  }

  getStatusSeverity(status: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | undefined {
    switch (status) {
      case 'scheduled':
        return 'info';
      case 'in_progress':
        return 'success';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'warning';
    }
  }

  hasAllDayEvents(): boolean {
    return this.currentWeek.some((day) => this.getAllDayEvents(day.events).length > 0);
  }

  hasNoEvents(): boolean {
    return this.currentWeek.every((day) => day.events.length === 0);
  }

  getWeekEndDate(): Date {
    const endDate = new Date(this.selectedWeekStart);
    endDate.setDate(endDate.getDate() + 6);
    return endDate;
  }

  private showErrorMessage(error: any) {
    const errorMessage = error?.error?.message || 'An error occurred while loading timetable';
    this.#messageService.add({
      severity: 'error',
      summary: this.#translateService.instant('api_messages.error_title'),
      detail: this.#translateService.instant(errorMessage)
    });
  }
}
