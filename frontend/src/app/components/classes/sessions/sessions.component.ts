import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimaryTableComponent } from '../../table/primary-table/primary-table.component';
import { calculateSessionStatus, getSessionStatusSeverity } from '../../../utils/session-status.util';
import { getModeLabel } from '../../../utils/session-modes.util';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [
    CommonModule,
    PrimaryTableComponent
  ],
  templateUrl: './sessions.component.html',
  styleUrl: './sessions.component.scss'
})
export class SessionsComponent {
  @Input() sessionsData: any[] = [];
  @Input() studentId?: string; // Optional student ID to filter sessions
  #translateService = inject(TranslateService);
  
  // Prepare data for primary table - filter by student if provided
  get dataSessions() {
    let filteredSessions = this.sessionsData;
    
    // If studentId is provided, filter sessions to only include those with this student
    if (this.studentId) {
      filteredSessions = this.sessionsData.filter(session => {
        if (!session.students || !Array.isArray(session.students)) {
          return false;
        }
        // Check if the student ID is in the session's students array
        return session.students.some((student: any) => {
          const studentIdInSession = typeof student === 'string' ? student : student.id || student._id;
          return studentIdInSession === this.studentId;
        });
      });
    }
    
    return filteredSessions.map(session => {
      const isHybridOrInPerson = session.mode === 'hybrid' || session.mode === 'in_person';
      return {
        code: session.id?.substring(0, 8).toUpperCase() || 'No code',
        status: calculateSessionStatus(session.start_date, session.end_date, session.start_time, session.duration, session.is_cancelled),
        title: this.formatTitle(session),
        branch: session.taxi?.branch || 'N/A',
        mode: getModeLabel(session.mode),
        room: session.classroom?.location || 'N/A',
        absences: this.formatAbsences(session.absences || []),
        startedAt: this.formatStartTime(session.start_time),
        endsIn: this.calculateSessionDuration(session.start_date, session.end_date),
        dateTime: `${this.formatDateTime(session.start_date)}`,
        classroom: isHybridOrInPerson ? (session.classroom?.name || 'Not assigned') : null,
        teachers: this.getTeachersNames(session.teachers),
        sessionMode: session.mode // Keep original mode for filtering
      };
    });
  }
  
  // Configure columns for primary table
  get columns(): any[] {
    const baseColumns: any[] = [
      { field: 'code', header: 'Code' },
      { field: 'status', header: 'Status' },
      { field: 'title', header: 'Title' },
      { field: 'branch', header: 'Branch' },
      { field: 'teachers', header: 'Teacher' },
      { field: 'mode', header: 'Mode' },
      { field: 'absences', header: 'Absences' },
      { 
        field: 'dateTime', 
        header: 'Scheduled Timeframe'
      },
      { field: 'startedAt', header: 'Started At' },
      { field: 'endsIn', header: 'Ends In' }
    ];

    // Add classroom column only if there are sessions with hybrid or in_person mode
    const hasHybridOrInPerson = this.sessionsData.some(session => 
      session.mode === 'hybrid' || session.mode === 'in_person'
    );

    if (hasHybridOrInPerson) {
      // Insert classroom column after mode
      const modeIndex = baseColumns.findIndex(col => col.field === 'mode');
      baseColumns.splice(modeIndex + 1, 0, { 
        field: 'classroom', 
        header: 'Room',
        getValue: (rowData: any) => {
          // Only show classroom for hybrid or in_person modes
          if (rowData.sessionMode === 'hybrid' || rowData.sessionMode === 'in_person') {
            return rowData.classroom || 'Not assigned';
          }
          return ''; // Return empty string for online mode
        }
      });
    }

    return baseColumns;
  }

  private formatDateTime(dateString: string): string {
    if (!dateString) return 'Not scheduled';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  }

  private getTeachersNames(teachers: any[]): string {
    if (!teachers || !teachers.length) return 'No teachers assigned';
    return teachers.map(teacher => `${teacher.firstname} ${teacher.lastname}`).join(', ');
  }

  private formatTitle(session: any): string {
    if (session.taxi) {
      return `${session.taxi.subject || 'Unknown'} - ${session.taxi.level || 'Unknown'}`;
    }
    return 'No subject';
  }


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

  private formatStartTime(startTime: string): string {
    if (!startTime) return 'N/A';
    
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

  private calculateSessionDuration(startTime: string, endTime: string): string {
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

}
