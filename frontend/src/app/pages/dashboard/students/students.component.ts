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
import { TooltipModule } from 'primeng/tooltip';
import { Store } from '@ngrx/store';
import { AppState } from '@store/app.state';
import { selectAuthState } from '@store/auth/auth.selectors';
import { mapSubjectToCode, mapLevelToLabel } from '../../../utils/subject-mapping.util';
import { RoleAccessService } from '@services/role-access.service';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, PrimaryTableComponent, SpinnerComponent, ButtonModule, ConfirmDialogModule, TooltipModule, TranslateModule],
  templateUrl: './students.component.html',
  styleUrls: ['./students.component.scss'],
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
  private roleAccessService = inject(RoleAccessService);

  // Table columns configuration adapted from the screenshot and User interface
  tableColumns = [
    {
      field: 'code',
      header: 'students.table.code',
      filterType: 'text',
      sortable: true,
      iconConfig: {
        icon: 'pi pi-user',
        getColor: (rowData: any) => (rowData.is_active ? '#00897b' : '#ef4444')
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
      sortable: true,
      getValue: (rowData: any) => {
        if (!rowData.createdAt) return '';
        
        const registrationDate = new Date(rowData.createdAt);
        
        // Check if date is valid
        if (isNaN(registrationDate.getTime())) return this.translateService.instant('students.table.invalid_date');
        
        // Format time as HH:MM
        const hours = String(registrationDate.getHours()).padStart(2, '0');
        const minutes = String(registrationDate.getMinutes()).padStart(2, '0');
        
        // Format date as DD/MM/YYYY
        const day = String(registrationDate.getDate()).padStart(2, '0');
        const month = String(registrationDate.getMonth() + 1).padStart(2, '0');
        const year = registrationDate.getFullYear();
        
        return `${hours}:${minutes} | ${day}/${month}/${year}`;
      }
    },
    { 
      field: 'phone', 
      header: 'students.table.phone', 
      filterType: 'text', 
      sortable: true,
      getValue: (rowData: any) => {
        if (!rowData.phone) return '';
        
        const phone = rowData.phone.toString();
        
        // If phone already starts with +30, return as is
        if (phone.startsWith('+30')) {
          return phone.replace('+30', '+30 ');
        }
        
        // If phone starts with 30, add + and space
        if (phone.startsWith('30')) {
          return `+${phone.substring(0, 2)} ${phone.substring(2)}`;
        }
        
        // Otherwise, add +30 prefix
        return `+30 ${phone}`;
      }
    },
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
      sortable: true,
      getValue: (rowData: any) => {
        if (rowData.taxis && rowData.taxis.length > 0) {
          const firstTaxi = rowData.taxis[0];
          if (typeof firstTaxi === 'object' && firstTaxi.level) {
            return mapLevelToLabel(firstTaxi.level);
          }
        }
        return '';
      }
    },
    {
      field: 'subject',
      header: 'students.table.subject',
      filterType: 'text',
      sortable: true,
      getValue: (rowData: any) => {
        if (rowData.taxis && rowData.taxis.length > 0) {
          const firstTaxi = rowData.taxis[0];
          if (typeof firstTaxi === 'object' && firstTaxi.subject) {
            return mapSubjectToCode(firstTaxi.subject);
          }
        }
        return '';
      }
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

  // Table view state - students or linked contacts
  private tableViewSubject = new BehaviorSubject<'students' | 'contacts'>('students');
  tableView$ = this.tableViewSubject.asObservable();

  // Linked contacts data
  linkedContactsData: any[] = [];
  linkedContactsLoading = false;
  linkedContactsColumns = [
    {
      field: 'contactName',
      header: 'students.linked_contacts.name',
      filterType: 'text',
      sortable: true
    },
    {
      field: 'contactType',
      header: 'students.linked_contacts.contact_type',
      filterType: 'text',
      sortable: true,
      getValue: (rowData: any) => {
        const relationshipMap: { [key: string]: string } = {
          'parent_guardian': 'students.linked_contacts.parent_guardian',
          'caretaker': 'students.linked_contacts.caretaker'
        };
        const key = relationshipMap[rowData.contactType] || rowData.contactType;
        return this.translateService.instant(key);
      }
    },
    {
      field: 'studentName',
      header: 'students.linked_contacts.student_name',
      filterType: 'text',
      sortable: true
    },
    {
      field: 'studentLevel',
      header: 'students.linked_contacts.student_level',
      filterType: 'text',
      sortable: true
    },
    {
      field: 'studentClass',
      header: 'students.linked_contacts.student_class',
      filterType: 'text',
      sortable: true
    },
    {
      field: 'studentStatus',
      header: 'students.linked_contacts.student_status',
      type: 'boolean',
      filterType: 'boolean',
      sortable: true,
      getValue: (rowData: any) => {
        return rowData.studentStatus 
          ? this.translateService.instant('table.active') 
          : this.translateService.instant('table.inactive');
      },
      getTextColor: (rowData: any) => {
        return rowData.studentStatus ? 'var(--primary-color)' : '#ef4444';
      }
    },
    {
      field: 'phone',
      header: 'students.linked_contacts.phone',
      filterType: 'text',
      sortable: true
    },
    {
      field: 'email',
      header: 'students.linked_contacts.email',
      filterType: 'text',
      sortable: true
    },
    {
      field: 'address',
      header: 'students.linked_contacts.address',
      filterType: 'text',
      sortable: true
    },
    {
      field: 'branch',
      header: 'students.linked_contacts.branch',
      filterType: 'text',
      sortable: true
    }
  ];

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

      // For admins, include inactive users by default
      return this.roleAccessService.isAdministrator().pipe(
        switchMap((isAdmin) => {
          if (isAdmin) {
            // Admin can see all users (active and inactive) unless explicitly filtered
            // Don't add is_active filter, let backend return all users
          } else {
            // Non-admin users only see active users (backend will filter by default)
            //params['is_active'] = 'true';
          }

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

  toggleTableView() {
    const currentView = this.tableViewSubject.value;
    const newView = currentView === 'students' ? 'contacts' : 'students';
    this.tableViewSubject.next(newView);
    
    if (newView === 'contacts' && this.linkedContactsData.length === 0) {
      this.loadLinkedContacts();
    }
  }

  loadLinkedContacts() {
    this.linkedContactsLoading = true;
    this.linkedContactsData = [];

    // Fetch all students with their contacts
    const params: { [key: string]: string } = {
      page: '1',
      limit: '1000', // Get a large number to fetch all students
      archived: 'false',
      branch: this.currentCustomerId || ''
    };

    this.studentsService.getUsersStudents(params).subscribe({
      next: (response: GetUsersStudents200) => {
        const students = response.data?.results || [];
        
        // Flatten contacts - each contact becomes a row with student info
        const contactsData: any[] = [];
        
        students.forEach((student: User) => {
          const studentName = this.getFullName(student);
          
          // Get student level from taxis
          let studentLevel = '';
          let studentClass = '';
          if (student.taxis && Array.isArray(student.taxis) && student.taxis.length > 0) {
            const firstTaxi = student.taxis[0] as any;
            if (typeof firstTaxi === 'object') {
              if (firstTaxi.level) {
                studentLevel = mapLevelToLabel(firstTaxi.level);
              }
              if (firstTaxi.name) {
                studentClass = firstTaxi.name;
              }
            }
          }
          
          // Get branch name(s)
          let branchNames = '';
          if (student.branches && Array.isArray(student.branches) && student.branches.length > 0) {
            branchNames = student.branches
              .map((branch: any) => typeof branch === 'object' ? branch.name : branch)
              .filter((name: string) => name)
              .join(', ');
          }
          
          if (student.contacts && Array.isArray(student.contacts) && student.contacts.length > 0) {
            student.contacts.forEach((contact: any) => {
              contactsData.push({
                id: `${student.id}_${contact._id || contact.id || Math.random()}`,
                studentId: student.id,
                contactName: contact.name || '',
                contactType: contact.relationship || '',
                studentName: studentName,
                studentLevel: studentLevel,
                studentClass: studentClass,
                studentStatus: student.is_active,
                phone: contact.phone || '',
                email: contact.email || '',
                address: student.address || '',
                branch: branchNames
              });
            });
          }
        });

        this.linkedContactsData = contactsData;
        this.linkedContactsLoading = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: this.translateService.instant('api_messages.error_title'),
          detail: error?.error?.message || 'Failed to load linked contacts'
        });
        this.linkedContactsLoading = false;
      }
    });
  }
}
