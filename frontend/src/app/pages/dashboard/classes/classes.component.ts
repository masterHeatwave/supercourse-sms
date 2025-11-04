import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { switchMap, map, tap, catchError } from 'rxjs/operators';
import { Taxi } from '@gen-api/schemas';
import { TaxisService } from '@gen-api/taxis/taxis.service';
import { PrimaryTableComponent } from '@components/table/primary-table/primary-table.component';
import { SpinnerComponent } from '@components/spinner/spinner.component';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import * as XLSX from 'xlsx';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Store } from '@ngrx/store';
import { AppState } from '@store/app.state';
import { selectAuthState } from '@store/auth/auth.selectors';

@Component({
  selector: 'app-classes',
  standalone: true,
  imports: [CommonModule, PrimaryTableComponent, SpinnerComponent, ButtonModule, ConfirmDialogModule, TranslateModule],
  templateUrl: './classes.component.html',
  styleUrl: './classes.component.scss',
  providers: [ConfirmationService]
})
export class ClassesComponent implements OnInit {
  classes: Taxi[] = [];
  totalRecords: number = 0;
  currentCustomerId: string | null | undefined;
  private router = inject(Router);
  private messageService = inject(MessageService);
  private translateService = inject(TranslateService);
  private confirmationService = inject(ConfirmationService);
  private store = inject(Store<AppState>);

  // Table columns configuration for taxis (classes)
  tableColumns = [
    {
      field: 'code',
      header: 'classes.table.code',
      filterType: 'text',
      sortable: true,
      iconConfig: {
        icon: 'pi pi-user',
        getColor: (rowData: any) => (rowData.is_active ? '#00897b' : '#ef4444')
      }
    },
    {
      field: 'status',
      header: 'classes.table.status',
      type: 'boolean',
      filterType: 'text',
      sortable: true,
      getValue: (rowData: any) => {
        return rowData.status ? this.translateService.instant('classes.table.current') : this.translateService.instant('classes.table.archived');
      }
    },
    { field: 'model', header: 'classes.table.name', filterType: 'text', sortable: true },
    { field: 'level', header: 'classes.table.level', filterType: 'text', sortable: true },
    { field: 'subject', header: 'classes.table.subject', filterType: 'text', sortable: true },
    { field: 'driver', header: 'classes.table.teacher', filterType: 'text', sortable: true },
    { field: 'students', header: 'classes.table.students', filterType: 'text', sortable: false },
    { field: 'sessionsPerWeek', header: 'classes.table.sessions_per_week', filterType: 'text', sortable: true },
    { field: 'totalDuration', header: 'classes.table.total_duration', filterType: 'text', sortable: false },
    { field: 'days', header: 'classes.table.days', filterType: 'text', sortable: false }
  ];

  private searchQuerySubject = new BehaviorSubject<string>('');
  searchQuery$ = this.searchQuerySubject.asObservable();

  private pageSubject = new BehaviorSubject<number>(1);
  page$ = this.pageSubject.asObservable();

  private limitSubject = new BehaviorSubject<number>(10);
  limit$ = this.limitSubject.asObservable();

  private sortSubject = new BehaviorSubject<{ field: string; order: number } | null>(null);
  sort$ = this.sortSubject.asObservable();

  taxisService = inject(TaxisService);
  isLoading: boolean = false;

  // Add view mode state
  private viewModeSubject = new BehaviorSubject<'list' | 'grid'>('list');
  viewMode$ = this.viewModeSubject.asObservable();

  // Helper functions to transform taxi data for display
  getStatusSeverity(status: string): string {
    switch (status) {
      case 'available':
        return 'success';
      case 'in_use':
        return 'warning';
      case 'maintenance':
        return 'danger';
      default:
        return 'info';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'available':
        return 'Available';
      case 'in_use':
        return 'In Use';
      case 'maintenance':
        return 'Maintenance';
      default:
        return 'Unknown';
    }
  }

  // Transform API data for display - now using data from enhanced API
  transformTaxiToClass(taxi: any): any {
    return {
      ...taxi,
      // Use actual API data
      code: taxi.name || 'N/A',
      model: taxi.name || 'N/A',
      level: taxi.level || 'N/A',
      subject: taxi.subject || 'N/A',
      driver: this.getTeacherNames(taxi.teachers) || 'N/A', // Use separated teachers array
      students: this.getStudentCount(taxi.students) || 'N/A', // Use separated students array
      sessionsPerWeek: taxi.sessionStats?.sessionsPerWeek?.toString() || '0',
      totalDuration: taxi.sessionStats?.totalDurationFormatted || '0h 0m',
      days: taxi.sessionStats?.daysFormatted || 'No sessions',
      status: taxi.status !== false,
      isActive: taxi.status !== false,
      // Transform status for display
      statusSeverity: this.getStatusSeverity(taxi.status ? 'available' : 'maintenance'),
      statusLabel: this.getStatusLabel(taxi.status ? 'available' : 'maintenance')
    };
  }

  // Helper method to extract teacher names from teachers array
  private getTeacherNames(teachers: any[]): string {
    if (!teachers || teachers.length === 0) return 'No teacher assigned';
    if (teachers.length === 1) {
      const teacher = teachers[0];
      return `${teacher.firstname} ${teacher.lastname}`;
    }
    return `${teachers.length} teachers`;
  }

  // Helper method to count students from students array
  private getStudentCount(students: any[]): string {
    if (!students || students.length === 0) return '0 students';
    return `${students.length} student${students.length === 1 ? '' : 's'}`;
  }

  classes$ = combineLatest({
    page: this.pageSubject,
    limit: this.limitSubject,
    sort: this.sortSubject
  }).pipe(
    tap(() => (this.isLoading = true)),
    switchMap(({ page, limit, sort }) => {
      const baseParams: { [key: string]: string } = {
        branch: this.currentCustomerId || ''
      };

      return this.taxisService.getTaxis<any>(undefined, {
        params: { ...baseParams, page: page.toString(), limit: limit.toString() }
      }).pipe(
        map((response: any) => {
          this.isLoading = false;
          const taxisArray = response?.data?.results ?? response?.data ?? [];

          // Transform API data which now includes sessions and statistics
          let transformedData = (taxisArray as any[]).map((taxi: any) => this.transformTaxiToClass(taxi));

          // Apply client-side sorting if sort is specified
          if (sort && sort.field) {
            transformedData = transformedData.sort((a: any, b: any) => {
              const aValue = a[sort.field];
              const bValue = b[sort.field];

              if (aValue == null && bValue == null) return 0;
              if (aValue == null) return sort.order === 1 ? -1 : 1;
              if (bValue == null) return sort.order === 1 ? 1 : -1;

              let comparison = 0;
              if (typeof aValue === 'string' && typeof bValue === 'string') {
                comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
              } else if (typeof aValue === 'number' && typeof bValue === 'number') {
                comparison = aValue - bValue;
              } else {
                comparison = String(aValue).localeCompare(String(bValue));
              }

              return sort.order === 1 ? comparison : -comparison;
            });
          }

          // Update total records from pagination meta if available
          this.totalRecords = response?.data?.totalResults ?? response?.pagination?.total ?? transformedData.length;

          return transformedData;
        }),
        catchError((error) => {
          console.error('Error loading classes:', error);
          this.isLoading = false;
          this.totalRecords = 0;
          return of([]);
        })
      );
    }),
    tap((classes) => {
      this.classes = classes;
      // totalRecords set above in map, keep for safety if not set
      if (this.totalRecords === 0 && classes) {
        this.totalRecords = classes.length;
      }
    })
  );

  ngOnInit() {
    this.store.select(selectAuthState).subscribe((authState) => {
      this.currentCustomerId = authState.currentCustomerId;
      this.pageSubject.next(1);
    });
    this.classes$.subscribe();
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

  onClassSelect(classItem: any) {
    this.router.navigate(['/dashboard/classes/', classItem.id]);
  }

  onEditClass(classItem: any) {
    this.router.navigate(['/dashboard/classes/edit/', classItem.id]);
  }

  onFilterChange(event: { field: string; value: any }) {
    // eslint-disable-next-line no-console
    console.log('Filter change:', event);
    // Implement filtering logic based on your API capabilities
    if (event.field === 'isActive') {
      // Handle boolean filter
      // eslint-disable-next-line no-console
      console.log('Active filter:', event.value);
    } else {
      // Handle text filters
      // eslint-disable-next-line no-console
      console.log('Text filter:', event.field, event.value);
    }
    // Reset to first page when filter changes
    this.pageSubject.next(1);
  }

  navigateToCreate() {
    this.router.navigate(['/dashboard/classes/create']);
  }

  toggleViewMode() {
    const currentMode = this.viewModeSubject.value;
    const newMode = currentMode === 'list' ? 'grid' : 'list';
    this.viewModeSubject.next(newMode);
  }

  downloadExcel() {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.classes);
    const workbook: XLSX.WorkBook = { Sheets: { Classes: worksheet }, SheetNames: ['Classes'] };
    XLSX.writeFile(workbook, 'classes-list.xlsx');
  }

  onDeleteClass(classItem: any) {
    if (!classItem.id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No class ID provided'
      });
      return;
    }

    const className = classItem.name || classItem.code || 'this class';

    this.confirmationService.confirm({
      message: `This will permanently remove ${className} from the system. All associated data including sessions will be lost and this action cannot be undone.`,
      header: 'Delete Class',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteClass(classItem.id!);
      },
      reject: () => {
        // User cancelled - no action needed
      }
    });
  }

  private deleteClass(classId: string) {
    this.taxisService.deleteTaxisId(classId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Class has been deleted successfully'
        });

        // Refresh the classes list by triggering the observable
        this.pageSubject.next(this.pageSubject.value);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error?.error?.message || 'Failed to delete class'
        });
      }
    });
  }

  onSortChange(event: { field: string; order: number }) {
    this.sortSubject.next(event);
  }
}
