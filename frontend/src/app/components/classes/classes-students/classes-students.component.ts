import { Component, Input, inject, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { UsersService } from '@gen-api/users/users.service';
import { PrimaryTableComponent } from '../../table/primary-table/primary-table.component';
import { SpinnerComponent } from '../../spinner/spinner.component';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-classes-students',
  standalone: true,
  imports: [
    CommonModule,
    PrimaryTableComponent,
    SpinnerComponent,
    ButtonModule,
    ConfirmDialogModule,
    TranslateModule
  ],
  providers: [ConfirmationService] ,
  templateUrl: './classes-students.component.html',
  styleUrl: './classes-students.component.scss'
})
export class ClassesStudentsComponent implements OnInit, OnChanges {
  @Input() studentsData: any[] = [];

  students: any[] = [];
  totalRecords: number = 0;
  currentCustomerId: string | null | undefined;
  private router = inject(Router);
  private messageService = inject(MessageService);
  private translateService = inject(TranslateService);
  private confirmationService = inject(ConfirmationService);

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
      field: 'name', // Custom field for combined name
      header: 'students.table.name',
      filterType: 'text',
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
      field: 'level',
      header: 'students.table.level',
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
  getFullName(student: any): string {
    return `${student.firstname || ''} ${student.lastname || ''}`.trim();
  }

  // Prepare data for primary table - adapted for input data
  get dataStudents() {
    return this.studentsData.map(student => ({
      _id: student._id || student.id,
      id: student._id || student.id,
      code: student.code || '',
      name: this.getFullName(student),
      firstname: student.firstname || '',
      lastname: student.lastname || '',
      phone: student.phone || '',
      email: student.email || '',
      birthday: student.birthday || student.age || '',
      createdAt: student.createdAt || '',
      is_active: student.is_active !== undefined ? student.is_active : true,
      taxis: student.taxis || [],
      level: student.level || '',
      subject: student.subject || '',
      hasAllergies: student.hasAllergies || false,
      branches: student.branches || [],
      default_branch: student.default_branch || null,
      on_live_session: student.on_live_session || false
    }));
  }

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['studentsData']) {
      this.students = this.dataStudents;
      this.totalRecords = this.students.length;
    }
  }

  onPageChange(event: { page: number; rows: number }) {
    this.pageSubject.next(event.page);
    this.limitSubject.next(event.rows);
  }

  onRowsPerPageChange(rows: number) {
    this.limitSubject.next(rows);
    this.pageSubject.next(1); // Reset to first page when changing rows per page
  }

  onStudentSelect(student: any) {
    const studentId = student._id || student.id;
    this.router.navigate(['/dashboard/students/', studentId]);
  }

  onEditStudent(student: any) {
    const studentId = student._id || student.id;
    this.router.navigate(['/dashboard/students/edit', studentId]);
  }

  onFilterChange(event: { field: string; value: any }) {
    this.pageSubject.next(1);
  }
}
