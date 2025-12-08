import { Component, OnInit, inject } from '@angular/core';
import { OutlineButtonComponent } from '@components/buttons/outline-button/outline-button.component';
import { TabViewModule } from 'primeng/tabview';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CommonModule } from '@angular/common';
import { ClassesStudentsComponent } from '../classes-students/classes-students.component';
import { OverviewComponent } from '../overview/overview.component';
import { ActivatedRoute, Router } from '@angular/router';
import { TaxisService } from '@gen-api/taxis/taxis.service';
import { SessionsService } from '@gen-api/sessions/sessions.service';
import { UsersService } from '@gen-api/users/users.service';
import { Taxi, Session } from '@gen-api/schemas';
import { SessionsComponent } from '../sessions/sessions.component';
import { MessageService } from 'primeng/api';
import { AttendanceComponent } from '../attendance/attendance.component';
import { ResourcesComponent } from '../resources/resources.component';
import { finalize } from 'rxjs/operators';
import { SessionStatisticsUtil, SessionData } from '../../../utils/session-statistics.util';

interface OverviewInfo {
  class: string;
  level: string;
  cefr: string;
  subject: string;
  classSize: number;
  materials: string;
  teacher: string;
  phone: string;
  email: string;
  createdBy: string;
  creationDate: string;
  lastUpdated: string;
  sessionDuration: string;
  sessionsPerWeek: number;
  totalHoursPerWeek: string;
  weekTimetable: { day: string; startTime: string; endTime: string }[];
  notes?: string;
}

interface Student {
  id: string;
  code: string;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
  birthday: string;
  age: string; // Format: "age (DD/MM/YYYY)"
  is_active: boolean;
}

@Component({
  selector: 'app-single-class',
  standalone: true,
  imports: [
    OutlineButtonComponent,
    TabViewModule,
    TableModule,
    CardModule,
    ProgressSpinnerModule,
    CommonModule,
    OverviewComponent,
    ClassesStudentsComponent,
    SessionsComponent,
    AttendanceComponent,
    ResourcesComponent
  ],
  templateUrl: './single-class.component.html',
  styleUrl: './single-class.component.scss',
  providers: [MessageService]
})
export class SingleClassComponent implements OnInit {
  #route = inject(ActivatedRoute);
  #router = inject(Router);
  #taxisService = inject(TaxisService);
  #sessionsService = inject(SessionsService);
  #usersService = inject(UsersService);

  classId: string | null = null;
  taxi: Taxi | null = null;
  overviewInfo: OverviewInfo | null = null;
  students: Student[] = [];
  sessions: SessionData[] = [];
  upcomingSession: SessionData | null = null;

  loading = false;
  loadingStudents = false;
  loadingSessions = false;

  ngOnInit() {
    this.classId = this.#route.snapshot.paramMap.get('id');
    if (this.classId) {
      this.loadClassData();  // This loads class data AND students via mapTaxiToOverview
      this.loadSessions();   // This loads sessions separately
    }
  }

  loadClassData() {
    if (!this.classId) return;
    
    this.loading = true;
    this.#taxisService.getTaxisId(this.classId)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            this.taxi = response.data;
            this.mapTaxiToOverview(response.data);
          }
        },
        error: (error) => {
          console.error('Error loading class data:', error);
        }
      });
  }

  loadStudents() {
    if (!this.classId) return;
    
    this.loadingStudents = true;
    // Students are loaded from taxi data in mapTaxiToOverview
    // This is called after getTaxisId completes, so just wait for that
  }

  loadSessions() {
    if (!this.classId) return;

    this.loadingSessions = true;
    // Only show scheduled recurring sessions, exclude emergency/one-time sessions
    this.#sessionsService.getSessions({ taxi: this.classId }, { params: { include_instances: 'only' } })
      .pipe(finalize(() => this.loadingSessions = false))
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data && response.data.results && Array.isArray(response.data.results)) {
            this.sessions = response.data.results.map((session: any) => ({
              id: session.id,
              start_date: session.start_date,
              end_date: session.end_date,
              start_time: session.start_time,
              duration: session.duration,
              is_cancelled: session.is_cancelled || false, // Default to false if not provided
              taxi: session.taxi, // Include taxi data for title and branch
              mode: session.mode, // Include mode for display
              absences: session.absences || [], // Include absences
              classroom: session.classroom,
              teachers: session.teachers || [],
              students: session.students || []
            }));
            // Find the upcoming session
            this.findUpcomingSession();
            // Recalculate session statistics after sessions are loaded
            this.updateSessionStatistics();
          } else {
            // If data is not an array, initialize with empty array
            this.sessions = [];
            console.warn('Sessions data is not an array:', response.data);
          }
        },
        error: (error) => {
          console.error('Error loading sessions:', error);
          this.loadingSessions = false;
        }
      });
  }

  // Update session statistics using the utility
  private updateSessionStatistics() {
    if (!this.overviewInfo) return;

    const statistics = SessionStatisticsUtil.calculateAllStatistics(this.sessions);
    
    
    // Determine which sessions per week value to use
    const finalSessionsPerWeek = this.overviewInfo.sessionsPerWeek || statistics.sessionsPerWeek;
    
    // Calculate total hours per week consistently
    // If using API sessionsPerWeek, recalculate totalHoursPerWeek with that value
    const totalHoursPerWeek = finalSessionsPerWeek > 0 && statistics.averageSessionDuration > 0
      ? (finalSessionsPerWeek * statistics.averageSessionDuration) / 60
      : 0;
    
    this.overviewInfo = {
      ...this.overviewInfo,
      // Always calculate total session duration (sum of all sessions) as requested
      sessionDuration: SessionStatisticsUtil.formatDuration(statistics.totalSessionDuration),
      // Use API value if available, otherwise use calculated value
      sessionsPerWeek: finalSessionsPerWeek,
      // Calculate total hours per week consistently
      totalHoursPerWeek: totalHoursPerWeek > 0 
        ? SessionStatisticsUtil.formatDuration(Math.round(totalHoursPerWeek * 60))
        : '0h',
      weekTimetable: statistics.weekTimetable
    };
  }

  mapTaxiToOverview(taxi: Taxi) {
    // Extract teacher information (first teacher if available)
    const primaryTeacher = taxi.teachers?.[0];
    const teacherName = primaryTeacher ? 
      `${primaryTeacher.firstname || ''} ${primaryTeacher.lastname || ''}`.trim() : 'Not assigned';
    
    // Use API sessionStats if available, otherwise will be calculated from sessions
    const apiSessionStats = (taxi as any).sessionStats;
    
    this.overviewInfo = {
      class: taxi.name || 'Unnamed Class',
      level: taxi.level || 'Not specified',
      cefr: 'Not specified', // This might need to be added to the API
      subject: taxi.subject || 'Not specified',
      classSize: taxi.studentCount || 0,
      materials: 'Not specified', // This might need to be added to the API
      teacher: teacherName,
      phone: primaryTeacher?.phone || 'Not available',
      email: primaryTeacher?.email || 'Not available',
      createdBy: 'System', // This might need to be added to the API
      creationDate: new Date(taxi.createdAt).toLocaleDateString(),
      lastUpdated: new Date(taxi.updatedAt).toLocaleDateString(),
      // sessionDuration will always be calculated as sum of all sessions
      sessionDuration: '',
      // Use API data if available for sessions per week
      sessionsPerWeek: apiSessionStats?.sessionsPerWeek || 0,
      // totalHoursPerWeek will be calculated based on sessions per week
      totalHoursPerWeek: '',
      weekTimetable: [], // Will be updated when sessions load
      notes: (taxi as any).notes || 'No notes available for this class.' // Try to get notes from API response
    };

    // Load students from taxi data
    if (taxi.students) {
      console.log('Students:', taxi.students);
      this.students = taxi.students.map(student => ({
        id: student.id || '',
        code: student.code || 'Not provided',
        firstname: student.firstname || '',
        lastname: student.lastname || '',
        email: student.email || '',
        phone: student.phone,
        birthday: student.birthday || '',
        age: this.calculateAge(student.birthday),
        is_active: true // Default to active since TaxiStudentsItem doesn't have is_active field
      }));
    } else {
      console.log('No students found in taxi data');
      this.students = [];
    }
    this.loadingStudents = false; // Always set to false after processing

    // Update session statistics if sessions are already loaded
    if (this.sessions.length > 0) {
      this.updateSessionStatistics();
    }
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getClassroomName(classroom: any): string {
    if (!classroom) return 'Not assigned';
    if (typeof classroom === 'object') {
      return classroom.name || classroom.title || 'Unnamed Classroom';
    }
    return classroom.toString();
  }

  getTeachersNames(teachers: any[]): string {
    if (!teachers || teachers.length === 0) return 'Not assigned';
    return teachers.map(teacher => {
      if (typeof teacher === 'object') {
        return `${teacher.firstname || ''} ${teacher.lastname || ''}`.trim();
      }
      return teacher.toString();
    }).filter(name => name).join(', ');
  }

  getStudentsCount(students: any[]): number {
    return students?.length || 0;
  }

  calculateAge(birthday: string | undefined): string {
    if (!birthday) return 'Not provided';
    
    try {
      const birthDate = new Date(birthday);
      const today = new Date();
      
      // Check if birthDate is valid
      if (isNaN(birthDate.getTime())) return 'Invalid date';
      
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      // Adjust age if birthday hasn't occurred this year
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      // Format the date similar to students.component.ts
      const locale = 'en-GB'; // You can make this dynamic based on language if needed
      const formattedDate = birthDate.toLocaleDateString(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      return `${age} (${formattedDate})`;
    } catch (error) {
      console.error('Error calculating age:', error);
      return 'Invalid date';
    }
  }

  /**
   * Find the next upcoming or currently live session (not cancelled)
   */
  private findUpcomingSession() {
    const now = new Date();

    // Filter sessions that are upcoming or currently live (not cancelled)
    const availableSessions = this.sessions
      .filter(session => {
        if (session.is_cancelled) return false;
        const sessionStart = new Date(session.start_date);
        const sessionEnd = new Date(session.end_date);
        // Include if: session is in progress (live) OR session starts in the future
        return sessionEnd > now || sessionStart > now;
      })
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

    this.upcomingSession = availableSessions.length > 0 ? availableSessions[0] : null;
  }

  /**
   * Navigate to the upcoming session page
   */
  goToUpcomingSession() {
    if (this.upcomingSession?.id) {
      this.#router.navigate(['/dashboard/sessions', this.upcomingSession.id]);
    }
  }
}
