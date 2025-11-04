import { Component, ViewChild, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { RadioButtonModule } from 'primeng/radiobutton';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs/operators';
import { SessionsService } from '@gen-api/sessions/sessions.service';
import { AbsencesService } from '@gen-api/absences/absences.service';
import { Session, Absence, AbsenceStatus } from '@gen-api/schemas';
import { SpinnerComponent } from '@components/spinner/spinner.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ColorDotComponent } from '@components/labels/color-dot/color-dot.component';
import { OutlineButtonComponent } from '@components/buttons/outline-button/outline-button.component';
import { ConfirmDialogComponent } from '@components/confirm-dialog/confirm-dialog.component';

interface SessionStudent {
  id: string;
  firstname: string;
  lastname: string;
  present?: boolean;
  absent?: boolean;
}
interface SessionMaterial {
  id: string;
  name: string;
  type: string;
}
@Component({
  selector: 'app-single-session',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, ButtonModule, TagModule, TableModule, TooltipModule, ToastModule, DialogModule, RadioButtonModule, SpinnerComponent, TranslateModule, ColorDotComponent, OutlineButtonComponent, ConfirmDialogComponent],
  templateUrl: './single-session.component.html',
  styleUrl: './single-session.component.scss',
  providers: [MessageService]
})
export class SingleSessionComponent implements OnInit {
  @ViewChild('confirmDlg') confirmDlgRef: any;
  @ViewChild('absenceConfirmDlg') absenceConfirmDlgRef: any;
  #route = inject(ActivatedRoute);
  #router = inject(Router);
  #sessionsService = inject(SessionsService);
  #absencesService = inject(AbsencesService);
  #messageService = inject(MessageService);
  #translate = inject(TranslateService);

  sessionId: string | null = null;
  session: Session | null = null;
  isLoading = true;
  isDeleting = false;
  isLoadingStudents = false;
  updatingAttendance = new Set<string>(); // Track which students are being updated
  sessionAbsences: any[] = []; // Store loaded absences for this session

  students: SessionStudent[] = [];

  // Absence type selection dialog
  selectedStudent: SessionStudent | null = null;
  selectedAbsenceType: AbsenceStatus = AbsenceStatus.unexcused;
  absenceTypes: { value: AbsenceStatus; label: string }[] = [];

  materials: SessionMaterial[] = [
    { id: '1', name: 'Tech it easy! 1 Coursebook', type: 'coursebook' },
    { id: '2', name: 'Tech it easy! 1 Activity Book', type: 'activity' },
    { id: '3', name: "Tech it easy! 1 Writer's Portfolio", type: 'portfolio' },
    { id: '4', name: 'Tech it easy! 1 Revision Book', type: 'revision' }
  ];

  ngOnInit() {
    this.initializeAbsenceTypes();
    this.sessionId = this.#route.snapshot.paramMap.get('id');
    if (this.sessionId) {
      this.loadSession();
    } else {
      this.isLoading = false;
      this.showError(this.#translate.instant('sessions.errors.id_not_found'));
    }
  }

  loadSession() {
    if (!this.sessionId) return;

    this.isLoading = true;
    this.#sessionsService
      .getSessionsId(this.sessionId)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.session = response.data;
            this.loadSessionAbsences();
          } else {
            this.showError(this.#translate.instant('sessions.errors.load_failed'));
          }
        },
        error: (error) => {
          console.error('Error loading session:', error);
          this.showError(this.#translate.instant('sessions.errors.load_failed'));
        }
      });
  }

  loadSessionAbsences() {
    if (!this.sessionId) return;

    console.log('Loading absences for session ID:', this.sessionId);

    // Load absences for this session
    this.#absencesService.getAbsences()
      .subscribe({
        next: (response) => {
          console.log('Raw absences response:', response);

          // Handle different response structures
          let absencesData: any[] = [];
          if (Array.isArray(response)) {
            // Direct array response
            absencesData = response;
          } else if (response.success && response.data) {
            // Wrapped response
            absencesData = response.data;
          } else if (response.data && Array.isArray(response.data)) {
            // Alternative wrapped response
            absencesData = response.data;
          }

          console.log('Processed absences data:', absencesData);

          if (absencesData.length > 0) {
            // Filter absences for this specific session
            this.sessionAbsences = absencesData.filter((absence: any) => {
              const absenceSessionId = absence.session?.id || absence.session?._id || absence.session;
              const matches = absenceSessionId === this.sessionId;
              console.log('Checking absence session ID:', absenceSessionId, 'against:', this.sessionId, 'matches:', matches);
              if (matches) {
                console.log('Found matching absence:', absence);
              }
              return matches;
            });

            console.log('Filtered session absences:', this.sessionAbsences);
          } else {
            this.sessionAbsences = [];
          }

          // Now load students with the absence data
          this.loadSessionStudents();
        },
        error: (error) => {
          console.error('Error loading absences:', error);
          this.sessionAbsences = [];
          this.loadSessionStudents();
        }
      });
  }

  loadSessionStudents() {
    if (!this.session) return;

    this.isLoadingStudents = true;

    try {
      // Initialize students array with all enrolled students
      this.students = [];

      if (this.session.students && this.session.students.length > 0) {
        // Check if students are populated objects or just IDs
        const firstStudent = this.session.students[0];

        if (typeof firstStudent === 'object' && firstStudent !== null) {
          // Students are populated objects
          this.students = this.session.students.map((student: any) => ({
            id: student._id || student.id,
            firstname: student.firstname || 'Unknown',
            lastname: student.lastname || 'Student',
            present: true, // Default to present, will be updated by absences
            absent: false
          }));
          console.log('Loaded students from populated objects:', this.students);
        } else {
          // Students are just IDs, create basic objects
          this.students = this.session.students.map((studentId: string) => ({
            id: studentId,
            firstname: 'Student',
            lastname: `#${studentId.slice(-4)}`,
            present: true,
            absent: false
          }));
          console.log('Loaded students from IDs:', this.students);
        }
      }

      // Update attendance status based on loaded absences
      this.updateAttendanceFromAbsences(this.sessionAbsences);
    } catch (error) {
      console.error('Error loading session students:', error);
      this.showError(this.#translate.instant('sessions.errors.students_load_failed'));
    } finally {
      this.isLoadingStudents = false;
    }
  }

  updateAttendanceFromAbsences(absences: any[]) {
    if (!absences || !Array.isArray(absences)) return;

    console.log('Updating attendance from absences:', absences);

    // Create a map of student IDs to absence status
    const absenceMap = new Map<string, { status: string; date: string; id: string }>();

    absences.forEach((absence: any) => {
      if (absence.student && typeof absence.student === 'object') {
        const studentId = absence.student.id || absence.student._id;
        if (studentId) {
          absenceMap.set(studentId, {
            status: absence.status,
            date: absence.date,
            id: absence.id
          });
        }
      } else if (typeof absence.student === 'string') {
        absenceMap.set(absence.student, {
          status: absence.status,
          date: absence.date,
          id: absence.id
        });
      }
    });

    console.log('Absence map:', absenceMap);

    // Update student attendance status
    this.students = this.students.map(student => {
      const absence = absenceMap.get(student.id);
      console.log(`Checking student ${student.firstname} ${student.lastname} (ID: ${student.id}) against absence map:`, absence);
      if (absence) {
        // If there's an absence record, mark as absent
        console.log(`✅ Student ${student.firstname} ${student.lastname} is ABSENT`);
        return {
          ...student,
          present: false,
          absent: true
        };
      } else {
        // No absence record means present
        console.log(`❌ Student ${student.firstname} ${student.lastname} is PRESENT (no absence found)`);
        return {
          ...student,
          present: true,
          absent: false
        };
      }
    });

    console.log('Updated students:', this.students);
  }

  deleteSession() {
    if (!this.sessionId || this.isDeleting) return;
    this.isDeleting = true;
    this.#sessionsService
      .deleteSessionsId(this.sessionId)
      .pipe(finalize(() => (this.isDeleting = false)))
      .subscribe({
        next: () => {
          this.#messageService.add({
            severity: 'success',
            summary: this.#translate.instant('api_messages.success_title'),
            detail: this.#translate.instant('sessions.messages.deleted')
          });
          this.navigateBack();
        },
        error: (error) => {
          console.error('Error deleting session:', error);
          this.showError(this.#translate.instant('sessions.errors.delete_failed'));
        }
      });
  }

  openDeleteDialog() {
    if (this.confirmDlgRef && typeof this.confirmDlgRef.confirm === 'function') {
      this.confirmDlgRef.confirm('Delete Session', 'Are you sure you want to delete this session?');
    }
  }

  onConfirmDelete(accepted: boolean) {
    if (accepted) {
      this.deleteSession();
    }
  }

  editSession() {
    if (this.sessionId) {
      this.#router.navigate(['/dashboard/sessions/edit', this.sessionId]);
    }
  }

  launchSessionOnline() {
    if (this.sessionId) {
      this.#router.navigate(['/dashboard/sessions/online', this.sessionId]);
    }
  }

  navigateBack() {
    this.#router.navigate(['/dashboard/sessions']);
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return this.#translate.instant('common.unknown');
    try {
      const date = new Date(dateString);
      const locale = this.#translate.currentLang === 'el' ? 'el-GR' : 'en-US';
      return date.toLocaleString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return this.#translate.instant('sessions.errors.invalid_date');
    }
  }

  formatTime(dateString: string): string {
    if (!dateString) return this.#translate.instant('common.unknown');
    try {
      const date = new Date(dateString);
      const locale = this.#translate.currentLang === 'el' ? 'el-GR' : 'en-US';
      return date.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return this.#translate.instant('sessions.errors.invalid_time');
    }
  }

  // Formats only the date part: e.g., Wednesday, October 11, 2024
  formatDate(dateString: string): string {
    if (!dateString) return this.#translate.instant('common.unknown');
    try {
      const date = new Date(dateString);
      const locale = this.#translate.currentLang === 'el' ? 'el-GR' : 'en-US';
      return date.toLocaleDateString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return this.#translate.instant('sessions.errors.invalid_date');
    }
  }

  // Formats time range in 24-hour HH:mm - HH:mm
  formatTimeRange(startDateString: string, endDateString: string): string {
    if (!startDateString || !endDateString) return this.#translate.instant('common.unknown');
    try {
      const start = new Date(startDateString);
      const end = new Date(endDateString);
      const locale = this.#translate.currentLang === 'el' ? 'el-GR' : 'en-US';
      const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false };
      const startText = start.toLocaleTimeString(locale, options);
      const endText = end.toLocaleTimeString(locale, options);
      return `${startText} - ${endText}`;
    } catch {
      return this.#translate.instant('sessions.errors.invalid_time');
    }
  }

  // Map API mode values to user-friendly labels
  formatMode(mode?: string): string {
    if (!mode) return 'N/A';
    switch (mode) {
      case 'in_person':
        return 'In-person';
      case 'online':
        return 'Online';
      case 'hybrid':
        return 'Hybrid';
      default:
        return 'N/A';
    }
  }

  getAttendanceStatus(student: SessionStudent): string {
    if (student.present) return this.#translate.instant('sessions.attendance.present');
    if (student.absent) return this.#translate.instant('sessions.attendance.absent');
    return this.#translate.instant('common.unknown');
  }

  getAttendanceSeverity(student: SessionStudent): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' {
    if (student.present) return 'success';
    if (student.absent) return 'danger';
    return 'warning';
  }

  getTotalPresent(): number {
    return this.students.filter((s) => s.present).length;
  }

  getTotalAbsent(): number {
    return this.students.filter((s) => s.absent).length;
  }

  getSessionStatus(): string {
    if (!this.session) return this.#translate.instant('common.unknown');

    const now = new Date();
    const startDate = new Date(this.session.start_date);
    const endDate = new Date(this.session.end_date);

    if (now < startDate) return this.#translate.instant('sessions.status.upcoming');
    if (now > endDate) return this.#translate.instant('sessions.status.completed');
    return this.#translate.instant('sessions.status.in_progress');
  }

  getStatusSeverity(): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' {
    const status = this.getSessionStatus();
    switch (status) {
      case 'sessions.status.upcoming':
        return 'info';
      case 'sessions.status.completed':
        return 'success';
      case 'sessions.status.in_progress':
        return 'warning';
      default:
        return 'secondary';
    }
  }

  openChat() {
    // Implementation for opening chat
    this.#messageService.add({
      severity: 'info',
      summary: this.#translate.instant('sessions.chat.title'),
      detail: this.#translate.instant('sessions.chat.opening')
    });
  }

  downloadFiles() {
    // Implementation for downloading session files
    this.#messageService.add({
      severity: 'info',
      summary: this.#translate.instant('sessions.download.title'),
      detail: this.#translate.instant('sessions.download.downloading')
    });
  }

  // Attendance management methods
  toggleAttendance(student: SessionStudent, isPresent: boolean) {
    if (!this.session || !this.sessionId) return;

    const studentId = student.id;

    // Prevent multiple simultaneous updates for the same student
    if (this.updatingAttendance.has(studentId)) return;

    if (isPresent) {
      // Mark as present - remove any existing absence
      this.updatingAttendance.add(studentId);
      this.markStudentPresent(student);
    } else {
      // Mark as absent - show dialog to select absence type
      this.selectedStudent = student;
      this.selectedAbsenceType = AbsenceStatus.unexcused; // Reset to default
      this.openAbsenceTypeDialog();
    }
  }

  private markStudentPresent(student: SessionStudent) {
    if (!this.session || !this.sessionId) return;

    // Find existing absence for this student and session
    const existingAbsence = this.findExistingAbsence(student.id);

    if (existingAbsence) {
      // Delete the existing absence
      this.#absencesService.deleteAbsencesId(existingAbsence.id)
        .pipe(finalize(() => this.updatingAttendance.delete(student.id)))
        .subscribe({
          next: () => {
            // Update local state
            student.present = true;
            student.absent = false;

            // Remove the absence from our local array
            this.sessionAbsences = this.sessionAbsences.filter(absence => {
              const absenceStudentId = absence.student?.id || absence.student?._id || absence.student;
              return absenceStudentId !== student.id;
            });

            this.showSuccess(this.#translate.instant('sessions.attendance.marked_present', { name: `${student.firstname} ${student.lastname}` }));
          },
          error: (error) => {
            console.error('Error marking student present:', error);
            this.showError(this.#translate.instant('sessions.attendance.mark_present_failed'));
          }
        });
    } else {
      // No absence to remove, just update local state
      student.present = true;
      student.absent = false;
      this.updatingAttendance.delete(student.id);
      this.showSuccess(this.#translate.instant('sessions.attendance.marked_present', { name: `${student.firstname} ${student.lastname}` }));
    }
  }

  private markStudentAbsent(student: SessionStudent, absenceType: AbsenceStatus) {
    if (!this.session || !this.sessionId) return;

    this.updatingAttendance.add(student.id);

    // Create new absence record
    const absenceData: Absence = {
      session: this.sessionId,
      student: student.id,
      date: new Date().toISOString(),
      status: absenceType,
      taxi: this.session.taxi.id,
      academic_period: this.session.academic_period.id
    };

    this.#absencesService.postAbsences(absenceData)
      .pipe(finalize(() => this.updatingAttendance.delete(student.id)))
      .subscribe({
        next: (response) => {
          // Update local state
          student.present = false;
          student.absent = true;

          // Add the new absence to our local array
          if (response.success && response.data) {
            this.sessionAbsences.push(response.data);
          }

          this.showSuccess(this.#translate.instant('sessions.attendance.marked_absent', { name: `${student.firstname} ${student.lastname}` }));
        },
        error: (error) => {
          console.error('Error marking student absent:', error);
          this.showError(this.#translate.instant('sessions.attendance.mark_absent_failed'));
        }
      });
  }

  private findExistingAbsence(studentId: string): any {
    if (!this.sessionAbsences || this.sessionAbsences.length === 0) return null;

    return this.sessionAbsences.find((absence: any) => {
      const absenceStudentId = absence.student?.id || absence.student?._id || absence.student;
      return absenceStudentId === studentId;
    });
  }

  isUpdatingAttendance(studentId: string): boolean {
    return this.updatingAttendance.has(studentId);
  }

  private showSuccess(message: string) {
    this.#messageService.add({
      severity: 'success',
      summary: this.#translate.instant('api_messages.success_title'),
      detail: message
    });
  }

  private showError(message: string) {
    this.#messageService.add({
      severity: 'error',
      summary: this.#translate.instant('api_messages.error_title'),
      detail: message
    });
  }

  // Absence type dialog methods
  openAbsenceTypeDialog() {
    if (this.absenceConfirmDlgRef && typeof this.absenceConfirmDlgRef.confirm === 'function') {
      const header = 'Select Absence Type';
      const message = `Select the type of absence for ${this.selectedStudent?.firstname} ${this.selectedStudent?.lastname}:`;
      this.absenceConfirmDlgRef.confirm(header, message);
    }
  }

  onAbsenceTypeConfirm(absenceType: AbsenceStatus) {
    if (this.selectedStudent) {
      this.markStudentAbsent(this.selectedStudent, absenceType);
    }
    this.selectedStudent = null;
    this.selectedAbsenceType = AbsenceStatus.unexcused;
  }

  onAbsenceTypeCancel(cancelled: boolean) {
    if (!cancelled) {
      // Dialog was cancelled
      this.selectedStudent = null;
      this.selectedAbsenceType = AbsenceStatus.unexcused;
    }
  }

  getAbsenceTypeLabel(type: AbsenceStatus): string {
    const absenceType = this.absenceTypes.find(at => at.value === type);
    return absenceType ? absenceType.label : type;
  }

  private initializeAbsenceTypes() {
    // Dynamically get all AbsenceStatus values from the enum
    const absenceStatusValues = Object.values(AbsenceStatus) as AbsenceStatus[];

    this.absenceTypes = absenceStatusValues.map(status => ({
      value: status,
      label: this.formatAbsenceTypeLabel(status)
    }));
  }

  private formatAbsenceTypeLabel(status: AbsenceStatus): string {
    // Convert enum value to a readable label
    switch (status) {
      case AbsenceStatus.unexcused:
        return 'Unexcused';
      case AbsenceStatus.excused:
        return 'Excused';
      case AbsenceStatus.justified:
        return 'Justified';
      default:
        // Fallback: capitalize first letter and replace underscores with spaces
        const statusString = String(status);
        return statusString.charAt(0).toUpperCase() + statusString.slice(1).replace(/_/g, ' ');
    }
  }
}

