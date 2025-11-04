import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { switchMap, map, tap } from 'rxjs/operators';
import { UsersService } from '@gen-api/users/users.service'; // Changed from StaffQueryAll
// Type alias for better readability
import { PrimaryTableComponent } from '@components/table/primary-table/primary-table.component';
import { SpinnerComponent } from '@components/spinner/spinner.component';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import * as XLSX from 'xlsx';
import { GetUsersStudents200, User } from '@gen-api/schemas';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Store } from '@ngrx/store';
import { AppState } from '@store/app.state';
import { selectAuthState } from '@store/auth/auth.selectors';

@Component({
  selector: 'app-students', // Changed selector
  standalone: true,
  imports: [CommonModule, PrimaryTableComponent, SpinnerComponent, ButtonModule, ConfirmDialogModule, TranslateModule],
  templateUrl: './students.component.html', // Changed template URL
  styleUrl: './students.component.scss', // Changed style URL
  providers: [ConfirmationService]
})
export class StudentsComponent implements OnInit {
  // Changed class name
  students: User[] = []; // Changed from staff
  totalRecords: number = 0;
  currentCustomerId: string | null | undefined;
  private router = inject(Router);
  private messageService = inject(MessageService);
  private translateService = inject(TranslateService);
  private confirmationService = inject(ConfirmationService);
  private store = inject(Store<AppState>);

  // Table columns configuration adapted from the screenshot and User interface
  tableColumns = [
    {
      field: 'code',
      header: 'students.table.code',
      filterType: 'text',
      sortable: true,
      iconConfig: {
        icon: 'pi pi-user',
        getColor: (rowData: any) => (rowData.on_live_session ? '#00897b' : '#ef4444')
      }
    },
    {
      field: 'is_active',
      header: 'students.table.status',
      type: 'boolean',
      filterType: 'boolean',
      sortable: true,
      getValue: (rowData: any) => {
        return rowData.is_active ? this.translateService.instant('table.active') : this.translateService.instant('table.inactive');
      }
    },
    {
      field: 'name', // Custom field for combined name
      header: 'students.table.name',
      filterType: 'text',
      sortable: true
    },
    {
      field: 'createdAt', // Registration Date
      header: 'students.table.registration',
      type: 'date',
      filterType: 'date',
      sortable: true
    },
    { field: 'phone', header: 'students.table.phone', filterType: 'text', sortable: true },
    { field: 'email', header: 'students.table.email', filterType: 'text', sortable: true },
    {
      field: 'birthday', // Use birthday for Age (DoB)
      header: 'students.table.age_dob',
      type: 'date',
      filterType: 'date',
      sortable: true,
      getValue: (rowData: any) => {
        if (!rowData.birthday) return '';

        const birthDate = new Date(rowData.birthday);
        const today = new Date();

        // Check if birthDate is valid
        if (isNaN(birthDate.getTime())) return this.translateService.instant('students.table.invalid_date');

        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        // Adjust age if birthday hasn't occurred this year
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        const locale = this.translateService.currentLang === 'el' ? 'el-GR' : 'en-GB';
        const formattedDate = birthDate.toLocaleDateString(locale, {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });

        return `${age} (${formattedDate})`;
      }
    },
    {
      field: 'class',
      header: 'students.table.class',
      filterType: 'text',
      sortable: true,
      getValue: (rowData: any) => {
        if (rowData.taxis && rowData.taxis.length > 0) {
          const firstTaxi = rowData.taxis[0];
          return typeof firstTaxi === 'object' ? firstTaxi.name : this.translateService.instant('students.table.class_assigned');
        }
        return '';
      }
    },
    {
      field: 'level',
      header: 'students.table.level',
      filterType: 'text',
      sortable: true
    },
    {
      field: 'subject',
      header: 'students.table.subject',
      filterType: 'text',
      sortable: true
    },
    {
      field: 'health',
      header: 'students.table.health',
      filterType: 'text',
      sortable: true,
      getValue: (rowData: any) => {
        return rowData.hasAllergies ? this.translateService.instant('students.table.allergies_medication') : this.translateService.instant('students.table.none');
      },
      getTextColor: (rowData: any) => {
        return rowData.hasAllergies ? '#ef4444' : 'inherit';
      }
    },
    {
      field: 'branches',
      header: 'students.table.branch',
      filterType: 'text',
      sortable: true,
      getValue: (rowData: any) => {
        if (rowData.branches && rowData.branches.length > 0) {
          const firstBranch = rowData.branches[0];
          return typeof firstBranch === 'object' ? firstBranch.name : this.translateService.instant('students.table.branch_assigned');
        }
        return rowData.default_branch?.name || this.translateService.instant('students.table.no_branch_assigned');
      }
    }
  ];

  private searchQuerySubject = new BehaviorSubject<string>('');
  searchQuery$ = this.searchQuerySubject.asObservable();

  private pageSubject = new BehaviorSubject<number>(1);
  page$ = this.pageSubject.asObservable();

  private limitSubject = new BehaviorSubject<number>(10);
  limit$ = this.limitSubject.asObservable();

  studentsService = inject(UsersService);
  isLoading: boolean = false;

  // Add view mode state
  private viewModeSubject = new BehaviorSubject<'list' | 'grid'>('list');
  viewMode$ = this.viewModeSubject.asObservable();

  // Helper function to get full name
  getFullName(student: User): string {
    return `${student.firstname || ''} ${student.lastname || ''}`.trim();
  }

  students$ = combineLatest({
    page: this.pageSubject,
    limit: this.limitSubject
  }).pipe(
    tap(() => (this.isLoading = true)),
    switchMap(({ page, limit }) => {
      const params: { [key: string]: string } = {
        page: page.toString(),
        limit: limit.toString(),
        archived: 'false',
        branch: this.currentCustomerId || ''
      };

      return this.studentsService.getUsersStudents(params).pipe(
        map((response: GetUsersStudents200) => {
          this.isLoading = false;
          const studentData = response.data?.results || [];
          this.totalRecords = response.data?.totalResults || 0;
          // Add computed fields to each student object
          return studentData.map((student: User) => ({
            ...student,
            name: this.getFullName(student)
          }));
        })
      );
    }),
    tap((students) => {
      console.log('Students:', students);
      this.students = students;
    })
  );

  ngOnInit() {
    this.store.select(selectAuthState).subscribe((authState) => {
      this.currentCustomerId = authState.currentCustomerId;
      this.pageSubject.next(1);
    });
    this.students$.subscribe();
    this.pageSubject.next(1);
  }

  onPageChange(event: { page: number; rows: number }) {
    this.pageSubject.next(event.page);
    this.limitSubject.next(event.rows);
  }

  onRowsPerPageChange(rows: number) {
    this.limitSubject.next(rows);
    this.pageSubject.next(1); // Reset to first page when changing rows per page
  }

  onStudentSelect(student: User) {
    this.router.navigate(['/dashboard/students/', student.id]);
  }

  onEditStudent(student: User) {
    this.router.navigate(['/dashboard/students/edit', student.id]);
  }

  onFilterChange(event: { field: string; value: any }) {
    console.log('Filter change:', event);
    if (event.field === 'is_active') {
      console.log('Status filter:', event.value);
    } else if (event.field === 'createdAt' || event.field === 'birthday') {
      console.log('Date filter:', event.field, event.value);
    }
    this.pageSubject.next(1);
  }

  navigateToCreate() {
    this.router.navigate(['/dashboard/students/create']);
  }

  toggleViewMode() {
    const currentMode = this.viewModeSubject.value;
    const newMode = currentMode === 'list' ? 'grid' : 'list';
    this.viewModeSubject.next(newMode);
  }

  // Build a human-readable value for a given column and row, matching how the table displays it
  private getColumnDisplayValue(col: any, row: any): any {
    try {
      // Prefer custom renderer if provided
      if (typeof col.getValue === 'function') {
        return col.getValue(row);
      }

      let value = row?.[col.field];

      if (value === undefined || value === null) return '';

      // Handle date formatting similar to the table
      if (col.type === 'date') {
        const d = new Date(value);
        if (!isNaN(d.getTime())) {
          const locale = this.translateService.currentLang === 'el' ? 'el-GR' : 'en-GB';
          return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
        }
      }

      // Arrays -> join sensible representation
      if (Array.isArray(value)) {
        return value
          .map((v) => (v && typeof v === 'object' ? (v.name ?? v.title ?? String(v.id ?? '')) : String(v)))
          .filter((v) => v !== undefined && v !== null)
          .join(', ');
      }

      // Objects -> common display property if present
      if (typeof value === 'object') {
        if ('name' in value) return value.name;
        if ('title' in value) return (value as any).title;
        if ('id' in value) return String((value as any).id);
        return '';
      }

      return value;
    } catch {
      return '';
    }
  }

  // Prepare rows for export using translated headers and displayed column order
  private buildExportRows(data: any[]): any[] {
    const headers = this.tableColumns.map((c) => this.translateService.instant(c.header ?? c.field ?? ''));
    return data.map((row) => {
      const out: any = {};
      this.tableColumns.forEach((col, idx) => {
        const header = headers[idx] || col.field || '';
        out[header] = this.getColumnDisplayValue(col, row);
      });
      return out;
    });
  }

  downloadExcel() {
    const exportRows = this.buildExportRows(this.students || []);
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook: XLSX.WorkBook = { Sheets: { Students: worksheet }, SheetNames: ['Students'] };
    XLSX.writeFile(workbook, 'students-list.xlsx');
  }

  onDeleteStudent(student: User) {
    if (!student.id) {
      this.messageService.add({
        severity: 'error',
        summary: this.translateService.instant('api_messages.error_title'),
        detail: this.translateService.instant('students.errors.no_id')
      });
      return;
    }

    const studentName = `${student.firstname || ''} ${student.lastname || ''}`.trim() || student.username || this.translateService.instant('students.table.name');

    this.confirmationService.confirm({
      message: this.translateService.instant('students.confirm_delete.message', { name: studentName }),
      header: this.translateService.instant('students.confirm_delete.header'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteStudent(student.id!);
      },
      reject: () => {
        // User cancelled - no action needed
      }
    });
  }

  private deleteStudent(studentId: string) {
    this.studentsService.deleteUsersStudentsId(studentId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.translateService.instant('api_messages.success_title'),
          detail: this.translateService.instant('students.messages.deleted')
        });

        // Refresh the students list by triggering the observable
        this.pageSubject.next(this.pageSubject.value);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: this.translateService.instant('api_messages.error_title'),
          detail: error?.error?.message || this.translateService.instant('students.errors.delete_failed')
        });
      }
    });
  }
}
