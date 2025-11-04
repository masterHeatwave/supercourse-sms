import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { switchMap, map, tap, catchError } from 'rxjs/operators';
import { User } from '@gen-api/schemas';
import { UsersService } from '@gen-api/users/users.service';
import { PrimaryTableComponent } from '@components/table/primary-table/primary-table.component';
import { SpinnerComponent } from '@components/spinner/spinner.component';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import * as XLSX from 'xlsx';
import { CustomersService } from '@gen-api/customers/customers.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Store } from '@ngrx/store';
import { AppState } from '@store/app.state';
import { selectAuthState } from '@store/auth/auth.selectors';

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [CommonModule, PrimaryTableComponent, SpinnerComponent, ButtonModule, ConfirmDialogModule, TranslateModule],
  templateUrl: './staff.component.html',
  styleUrl: './staff.component.scss',
  providers: [ConfirmationService]
})
export class StaffComponent implements OnInit {
  staff: User[] = [];
  totalRecords: number = 0;
  currentCustomerId: string | null | undefined;
  private router = inject(Router);
  private messageService = inject(MessageService);
  private translateService = inject(TranslateService);
  private staffService = inject(UsersService);
  private customersService = inject(CustomersService);
  private confirmationService = inject(ConfirmationService);
  private store = inject(Store<AppState>);
  private parentCustomerId: string | null | undefined;

  tableColumns = [
    {
      field: 'code',
      header: 'staff.table.code',
      filterType: 'text',
      sortable: true,
      iconConfig: {
        icon: 'pi pi-user',
        getColor: (rowData: any) => (rowData.is_active ? '#00897b' : '#ef4444')
      }
    },
    {
      field: 'is_active',
      header: 'staff.table.status',
      type: 'boolean',
      filterType: 'boolean',
      sortable: true,
      getValue: (rowData: any) => {
        return rowData.is_active ? this.translateService.instant('table.active') : this.translateService.instant('table.inactive');
      }
    },
    { 
      field: '', 
      header: 'staff.table.name', 
      filterType: 'text', 
      sortable: true,
      getValue: (rowData: any) => {
        const firstName = rowData.firstname || '';
        const lastName = rowData.lastname || '';
        const fullName = `${firstName} ${lastName}`.trim();
        return fullName || '';
      }
    },
    {
      field: 'roles',
      header: 'staff.table.role',
      filterType: 'text',
      sortable: true,
      getValue: (rowData: any) => {
        if (rowData.roles && rowData.roles.length > 0) {
          return rowData.roles.map((role: any) => role.title).join(', ');
        }
        return this.translateService.instant('staff.table.no_role_assigned');
      }
    },
    {
      field: 'taxis',
      header: 'staff.table.class',
      filterType: 'text',
      sortable: true,
      getValue: (rowData: any) => {
        if (rowData.taxis && rowData.taxis.length > 0) {
          return rowData.taxis.map((taxi: any) => taxi.name).join(', ');
        }
        return '';
      }
    },
    { field: 'address', header: 'staff.table.address', filterType: 'text', sortable: true },
    { field: 'city', header: 'staff.table.city', filterType: 'text', sortable: true },
    { field: 'zipcode', header: 'staff.table.zip', filterType: 'text', sortable: true },
    { field: 'phone', header: 'staff.table.phone', filterType: 'text', sortable: true },
    { field: 'email', header: 'staff.table.email', filterType: 'text', sortable: true },
    {
      field: 'branches',
      header: 'branches',
      filterType: 'text',
      type: 'button',
      buttonConfig: {
        label: 'branches',
        icon: 'pi pi-building',
        class: 'branches-button',
        popover: {
          content: (rowData: any) => {
            if (!rowData.branches || !rowData.branches.length) return 'No branches assigned';
            return rowData.branches.map((branch: any) => branch.name).join(', ');
          },
          showDelay: 150,
          hideDelay: 150
        }
      }
    }
  ];

  private searchQuerySubject = new BehaviorSubject<string>('');
  searchQuery$ = this.searchQuerySubject.asObservable();

  private searchQueryFieldSubject = new BehaviorSubject<{ label: string; value: string }>({ label: 'Email', value: 'email' });
  searchQueryField$ = this.searchQueryFieldSubject.asObservable();

  private pageSubject = new BehaviorSubject<number>(1);
  page$ = this.pageSubject.asObservable();

  private limitSubject = new BehaviorSubject<number>(10);
  limit$ = this.limitSubject.asObservable();

  isLoading: boolean = false;

  // Add view mode state
  private viewModeSubject = new BehaviorSubject<'list' | 'grid'>('list');
  viewMode$ = this.viewModeSubject.asObservable();

  staff$ = combineLatest({
    query: this.searchQuerySubject,
    field: this.searchQueryFieldSubject,
    page: this.pageSubject,
    limit: this.limitSubject
  }).pipe(
    tap(() => (this.isLoading = true)),
    switchMap(({ page, limit, query, field }) => {
      const params: { [key: string]: string } = {
        page: page.toString(),
        limit: limit.toString(),
        query: query,
        archived: 'false',
        branch: this.currentCustomerId || ''
      };

      if (query && field.value) {
        params[field.value] = query;
      }

      // Fetch staff and customers in parallel
      return combineLatest([
        this.staffService.getUsersStaff(params).pipe(
          catchError((error) => {
            this.isLoading = false;
            this.staff = [];
            this.showErrorMessage(error);
            return of({ data: { results: [], totalResults: 0 } });
          })
        ),
        this.customersService.getCustomers().pipe(catchError(() => of({ data: [] })))
      ]);
    }),
    map(([staffResponse, customersResponse]) => {
      this.isLoading = false;
      const staffList = staffResponse?.data?.results || [];
      this.totalRecords = staffResponse?.data?.totalResults || 0;
      const customers = customersResponse.data || [];

      // Attach customerDetails to each staff
      const processedStaff = staffList.map((staff: any) => {
        return staff;
      });

      return processedStaff;
    }),
    tap((staffs) => {
      this.staff = staffs;
    })
  );

  ngOnInit() {
    this.store.select(selectAuthState).subscribe((authState) => {
      this.currentCustomerId = authState.currentCustomerId;
      this.pageSubject.next(1);
    });
    this.staff$.subscribe();
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

  onStaffSelect(staff: User) {
    this.router.navigate(['/dashboard/staff/', staff.id]);
  }

  onEditStaff(staff: User) {
    this.router.navigate(['/dashboard/staff/edit/', staff.id]);
  }

  onFilterChange(event: { field: string; value: any }) {
    if (event.field === 'is_active') {
      this.searchQueryFieldSubject.next({ label: 'Status', value: 'is_active' });
      this.searchQuerySubject.next(event.value === null ? '' : event.value.toString());
    } else if (event.field === 'createdAt') {
      this.searchQueryFieldSubject.next({ label: 'Created At', value: 'createdAt' });
      this.searchQuerySubject.next(event.value ? event.value.toISOString() : '');
    }
  }

  navigateToCreate() {
    this.router.navigate(['/dashboard/staff/create']);
  }

  private showErrorMessage(error: any) {
    const errorMessage = error?.error?.message || 'An error occurred while loading staff';
    this.messageService.add({
      severity: 'error',
      summary: this.translateService.instant('api_messages.error_title'),
      detail: this.translateService.instant(errorMessage)
    });
  }

  toggleViewMode() {
    const currentMode = this.viewModeSubject.value;
    const newMode = currentMode === 'list' ? 'grid' : 'list';
    this.viewModeSubject.next(newMode);
  }

  // Build a human-readable value for a given column and row, matching how the table displays it
  private getColumnDisplayValue(col: any, row: any): any {
    try {
      if (typeof col.getValue === 'function') {
        return col.getValue(row);
      }

      let value = row?.[col.field];
      if (value === undefined || value === null) return '';

      if (col.type === 'date') {
        const d = new Date(value);
        if (!isNaN(d.getTime())) {
          const locale = this.translateService.currentLang === 'el' ? 'el-GR' : 'en-GB';
          return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
        }
      }

      if (Array.isArray(value)) {
        return value
          .map((v) => (v && typeof v === 'object' ? (v.name ?? v.title ?? String(v.id ?? '')) : String(v)))
          .filter((v) => v !== undefined && v !== null)
          .join(', ');
      }

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
    const exportRows = this.buildExportRows(this.staff || []);
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook: XLSX.WorkBook = { Sheets: { Staff: worksheet }, SheetNames: ['Staff'] };
    XLSX.writeFile(workbook, 'staff-list.xlsx');
  }

  onDeleteStaff(staff: User) {
    if (!staff.id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No staff ID provided'
      });
      return;
    }

    const staffName = `${staff.firstname || ''} ${staff.lastname || ''}`.trim() || staff.username || 'this staff member';

    this.confirmationService.confirm({
      message: `This will permanently remove ${staffName} from the system. All associated data will be lost and this action cannot be undone.`,
      header: 'Delete Staff Member',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteStaff(staff.id!);
      },
      reject: () => {
        // User cancelled - no action needed
      }
    });
  }

  private deleteStaff(staffId: string) {
    this.staffService.deleteUsersStaffId(staffId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Staff member has been deleted successfully'
        });

        // Refresh the staff list by triggering the observable
        this.pageSubject.next(this.pageSubject.value);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error?.error?.message || 'Failed to delete staff member'
        });
      }
    });
  }
}
