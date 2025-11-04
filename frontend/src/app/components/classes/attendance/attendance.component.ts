import { Component, OnInit, inject } from '@angular/core';
import { PrimaryTableComponent } from '@components/table/primary-table/primary-table.component';
import { ActivatedRoute } from '@angular/router';
import { TaxisService } from '@gen-api/taxis/taxis.service';
import { AbsencesService } from '@gen-api/absences/absences.service';
import { finalize } from 'rxjs/operators';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [PrimaryTableComponent],
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.scss'
})
export class AttendanceComponent implements OnInit {
  #route = inject(ActivatedRoute);
  #taxisService = inject(TaxisService);
  #absencesService = inject(AbsencesService);

  classId: string | null = null;

  attendanceColumns: Array<{ field: string; header: string; type?: string }> = [
    { field: 'code', header: 'Code' },
    { field: 'name', header: 'Name' }
  ];
  attendanceData: any[] = [];
  loading = false;

  private readonly DAYS_TO_SHOW = 20; // Today + 10 days before

  ngOnInit(): void {
    this.classId = this.#route.snapshot.paramMap.get('id');
    if (!this.classId) return;

    this.loading = true;
    console.log('[Attendance] Init for classId:', this.classId);
    
    // Generate date columns for today and 10 days before
    const dateColumns = this.generateDateColumns();
    
    // Fetch both attendance and absence data
    const attendanceRequest = this.#taxisService.getTaxisIdAttendance(this.classId!, { limit: String(this.DAYS_TO_SHOW) });
    const absencesRequest = this.#absencesService.getAbsences();

    forkJoin([attendanceRequest, absencesRequest])
      .pipe(finalize(() => {}))
      .subscribe({
        next: ([attendanceRes, absencesRes]: [any, any]) => {
          const attendanceData = attendanceRes?.data || attendanceRes;
          const absencesData = absencesRes?.data || absencesRes;
          
          if (!attendanceData?.rows) {
            console.error('[Attendance] Attendance API returned no rows');
            this.loading = false;
            return;
          }

          // Build columns with generated date columns
          this.attendanceColumns = [
            { field: 'code', header: 'Code' },
            { field: 'name', header: 'Name' },
            ...dateColumns
          ];

          // Process attendance data with absence information
          this.attendanceData = this.processAttendanceDataWithAbsences(attendanceData.rows, dateColumns, absencesData);
          this.loading = false;
        },
        error: (err: any) => {
          console.error('Error loading attendance/absence data:', err);
          this.loading = false;
        },
      });
  }

  private toISODate(dateInput: string | Date): string {
    const d = new Date(dateInput);
    const year = d.getFullYear();
    const month = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatHeaderDate(isoDate: string): string {
    const [year, month, day] = isoDate.split('-').map((x) => parseInt(x, 10));
    const y2 = `${year}`.slice(-2);
    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${y2}`;
  }

  /**
   * Generate date columns for today and 10 days before
   */
  private generateDateColumns(): Array<{ field: string; header: string; type: string }> {
    const columns: Array<{ field: string; header: string; type: string }> = [];
    const today = new Date();
    
    for (let i = 0; i < this.DAYS_TO_SHOW; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const isoDate = this.toISODate(date);
      const header = this.formatHeaderDate(isoDate);
      
      columns.push({
        field: isoDate,
        header: header,
        type: 'date-attendance'
      });
    }
    
    return columns;
  }

  /**
   * Process attendance data with absence information for each date
   */
  private processAttendanceDataWithAbsences(attendanceRows: any[], dateColumns: Array<{ field: string; header: string; type: string }>, absencesData: any): any[] {
    // Create a map of student absences by date
    const absenceMap = this.createAbsenceMap(absencesData);
    
    return attendanceRows.map(row => {
      const processedRow: any = {
        id: row.id,
        code: row.code,
        name: row.name
      };
      
      // Add attendance data for each date column
      dateColumns.forEach(column => {
        const dateField = column.field;
        const studentId = row.id;
        
        // Check if student has an absence record for this date
        const hasAbsence = absenceMap.has(`${studentId}|${dateField}`);
        
        if (hasAbsence) {
          // Red circle for absence
          processedRow[dateField] = false;
        } else {
          // Green circle for no absence (present)
          processedRow[dateField] = true;
        }
      });
      
      return processedRow;
    });
  }

  /**
   * Create a map of student absences by date for quick lookup (filtered by taxi ID)
   */
  private createAbsenceMap(absencesData: any): Map<string, boolean> {
    const absenceMap = new Map<string, boolean>();
    
    if (!absencesData || !Array.isArray(absencesData)) {
      return absenceMap;
    }
    
    // Process individual absence records, filtering by taxi ID
    absencesData.forEach((absence: any) => {
      if (absence.student && absence.date && absence.taxi) {
        const studentId = typeof absence.student === 'string' ? absence.student : absence.student._id || absence.student.id;
        const taxiId = typeof absence.taxi === 'string' ? absence.taxi : absence.taxi._id || absence.taxi.id;
        
        // Only include absences for this specific taxi/class
        if (taxiId === this.classId) {
          const absenceDate = this.toISODate(absence.date);
          const key = `${studentId}|${absenceDate}`;
          absenceMap.set(key, true);
        }
      }
    });
    
    return absenceMap;
  }
}
