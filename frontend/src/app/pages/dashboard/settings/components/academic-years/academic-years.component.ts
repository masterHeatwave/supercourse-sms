import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimaryTableComponent } from '@components/table/primary-table/primary-table.component';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { CalendarModule } from 'primeng/calendar';
import { InputTextareaModule } from 'primeng/inputtextarea';

import { AcademicService, AcademicYear, AcademicPeriod } from '@services/academic.service';
import { ConfirmDialogComponent } from '@components/confirm-dialog/confirm-dialog.component';
import { BehaviorSubject, catchError, of, switchMap, map, forkJoin, Observable, combineLatest } from 'rxjs';
import { Router } from '@angular/router';
import { OutlineButtonComponent } from '@components/buttons/outline-button/outline-button.component';
import { SearchInputComponent } from '@components/inputs/search-input/search-input.component';

@Component({
  selector: 'app-academic-years',
  standalone: true,
  imports: [
    CommonModule,
    PrimaryTableComponent,
    ButtonModule,
    InputTextModule,
    FormsModule,
    TooltipModule,
    CalendarModule,
    InputTextareaModule,
    ConfirmDialogComponent,
    OutlineButtonComponent,
    SearchInputComponent
  ],
  templateUrl: './academic-years.component.html',
  styleUrl: './academic-years.component.scss'
})
export class AcademicYearsComponent implements OnInit {
  @ViewChild(ConfirmDialogComponent) confirmDialog?: ConfirmDialogComponent;
  searchValue: string = '';
  pendingDeleteAcademicYear: AcademicYear | null = null;
  academicYears: AcademicYear[] = [];
  totalRecords: number = 0;
  periods: { [yearId: string]: AcademicPeriod[] } = {};
  loading = true;
  error = false;
  private previousActiveYearId: string | null = null;

  constructor(private academicService: AcademicService, private router: Router) {}

  ngOnInit() {
    this.setupPaginatedStream();
  }

  private pageSubject = new BehaviorSubject<number>(1);
  private limitSubject = new BehaviorSubject<number>(10);

  private setupPaginatedStream() {
    this.loading = true;
    this.error = false;

    combineLatest([this.pageSubject, this.limitSubject])
      .pipe(
        switchMap(([page, limit]) =>
          this.academicService.getAcademicYearsPaginated(page, limit).pipe(
            catchError((error) => {
              console.error('Error loading academic years:', error);
              this.error = true;
              this.loading = false;
              return of({ years: [], totalResults: 0 });
            })
          )
        )
      )
      .subscribe(({ years, totalResults }) => {
        this.loading = false;
        this.academicYears = years;
        this.totalRecords = totalResults;
      });
  }

  loadAcademicPeriods(yearId: string) {
    this.academicService
      .getAcademicPeriods(yearId)
      .pipe(
        catchError((error) => {
          console.error(`Error loading periods for year ${yearId}:`, error);
          return of([]);
        })
      )
      .subscribe((periods: AcademicPeriod[]) => {
        this.periods[yearId] = periods;
      });
  }

  validateOverlaps(yearId: string): { hasOverlaps: boolean; overlaps: string[] } {
    const periods = this.periods[yearId] || [];
    return this.academicService.validatePeriodOverlaps(periods);
  }

  tableColumns = [
    {
      field: 'name',
      header: 'Title',
      sortable: true
    },
    {
      field: 'start_date',
      header: 'Start date',
      sortable: true,
      getValue: (rowData: AcademicYear) => this.formatDate(rowData.start_date)
    },
    {
      field: 'end_date',
      header: 'End date',
      sortable: true,
      getValue: (rowData: AcademicYear) => this.formatDate(rowData.end_date)
    },
    {
      field: 'numberOfPeriods',
      header: 'Number of Periods',
      sortable: true
    },
    {
      field: 'isActive',
      header: 'Selection',
      type: 'toggle',
      toggleConfig: {
        onChange: (rowData: AcademicYear, checked: boolean) => this.onActiveToggle(rowData, checked),
        disabled: () => false
      }
    }
  ];

  get filteredData() {
    if (!this.searchValue) {
      return this.academicYears;
    }

    return this.academicYears.filter(
      (year) =>
        year.name.toLowerCase().includes(this.searchValue.toLowerCase()) ||
        this.formatDate(year.start_date).toLowerCase().includes(this.searchValue.toLowerCase()) ||
        this.formatDate(year.end_date).toLowerCase().includes(this.searchValue.toLowerCase())
    );
  }

  formatDate(dateString: string): string {
    return this.academicService.formatDate(dateString);
  }

  onEdit(academicYear: AcademicYear) {
    // Route to edit academic year page
    this.router.navigate(['/dashboard/settings/academic-years/edit', academicYear.id]);
  }

  onViewAcademicYear(academicYear: AcademicYear) {
    // Route to view academic year page
    this.router.navigate(['/dashboard/settings/academic-years', academicYear.id]);
  }

  onSearchChange(value: string) {
    this.searchValue = value;
  }

  onDelete(academicYear: AcademicYear) {
    this.confirmDelete(academicYear);
  }

  confirmDelete(academicYear: AcademicYear) {
    this.pendingDeleteAcademicYear = academicYear;
    const header = `Delete Academic Year`;
    const message = `Are you sure you want to delete "${academicYear.name}"? This will permanently delete the entire academic year including all periods and subperiods.`;
    this.confirmDialog?.confirm(header, message);
  }

  onConfirmDelete(accepted: boolean) {
    if (!accepted || !this.pendingDeleteAcademicYear) {
      this.pendingDeleteAcademicYear = null;
      return;
    }

    const ay = this.pendingDeleteAcademicYear;
    this.pendingDeleteAcademicYear = null;

    this.academicService
      .deleteAcademicYear(ay.id)
      .pipe(
        catchError((error) => {
          console.error('Error deleting academic year:', error);
          alert('Failed to delete academic year');
          return of(null);
        })
      )
      .subscribe((response) => {
        if (response !== null) {
          this.pageSubject.next(this.pageSubject.value);
        }
      });
  }



  onSetActiveYear(academicYear: AcademicYear) {
    if (academicYear.isActive) {
      return; // Already active, no need to do anything
    }

    // Optimistic UI: switch active locally without reloading
    this.previousActiveYearId = this.academicYears.find((y) => y.isActive)?.id || null;
    this.academicYears = this.academicYears.map((y) => ({ ...y, isActive: y.id === academicYear.id }));

    this.setActiveAcademicYear(academicYear.id)
      .pipe(
        catchError((error) => {
          console.error('Error setting active academic year:', error);
          // Revert on error
          this.academicYears = this.academicYears.map((y) => ({ ...y, isActive: y.id === this.previousActiveYearId }));
          return of(null);
        })
      )
      .subscribe();
  }

  onActiveToggle(academicYear: AcademicYear, checked: boolean) {
    if (!checked) {
      // Enforce single active: do not allow turning off the active toggle directly
      // Revert switch immediately without fetching
      const idx = this.academicYears.findIndex((y) => y.id === academicYear.id);
      if (idx > -1) this.academicYears[idx].isActive = true;
      return;
    }
    this.onSetActiveYear(academicYear);
  }

  private setActiveAcademicYear(yearId: string): Observable<any> {
    // Update local data optimistically
    this.academicYears.forEach((year) => {
      year.isActive = year.id === yearId;
    });

    // Use the updateAcademicYear method to set is_current to true
    return this.academicService.updateAcademicYear(yearId, { is_current: true });
  }

  onAdd() {
    // Navigate to create academic year page
    this.router.navigate(['/dashboard/settings/academic-years/create']);
  }

  toggleViewMode() {}

  onExport() {}



  onRetry() {
    this.pageSubject.next(this.pageSubject.value);
  }

  onPageChange(event: { page: number; rows: number }) {
    this.pageSubject.next(event.page);
    this.limitSubject.next(event.rows);
  }

  onRowsPerPageChange(rows: number) {
    this.limitSubject.next(rows);
    this.pageSubject.next(1);
  }
}
