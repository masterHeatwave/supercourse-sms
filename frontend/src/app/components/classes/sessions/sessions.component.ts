import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimaryTableComponent } from '../../table/primary-table/primary-table.component';

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
  
  // Prepare data for primary table
  get dataSessions() {
    return this.sessionsData.map(session => ({
      dateTime: `${this.formatDateTime(session.start_date)}`,
      classroom: session.classroom?.name || 'Not assigned',
      teachers: this.getTeachersNames(session.teachers),
      students: `${session.students?.length || 0} students`
    }));
  }
  
  // Configure columns for primary table
  columns = [
    { 
      field: 'dateTime', 
      header: 'Date & Time'
    },
    { field: 'classroom', header: 'Classroom' },
    { field: 'teachers', header: 'Teachers' },
    { field: 'students', header: 'Students' }
  ];

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
}
