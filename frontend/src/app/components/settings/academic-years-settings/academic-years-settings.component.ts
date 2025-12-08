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
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { OutlineButtonComponent } from '@components/buttons/outline-button/outline-button.component';
import { SearchInputComponent } from '@components/inputs/search-input/search-input.component';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-academic-years-settings',
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
  templateUrl: './academic-years-settings.component.html',
  styleUrl: './academic-years-settings.component.scss'
})
export class AcademicYearsSettingsComponent implements OnInit {
  @ViewChild(ConfirmDialogComponent) confirmDialog?: ConfirmDialogComponent;
  searchValue: string = '';
  pendingDeleteAcademicYear: AcademicYear | null = null;
  academicYears: AcademicYear[] = [];
  totalRecords: number = 0;
  periods: { [yearId: string]: AcademicPeriod[] } = {};
  loading = true;
  error = false;
  private previousActiveYearId: string | null = null;
  viewMode: 'list' | 'grid' = 'list';

  constructor(private academicService: AcademicService, private router: Router) {}

  ngOnInit() {
    this.setupPaginatedStream();
    
    // Refresh data when returning from create/edit pages
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        // Check if we're navigating back to the academic years list
        if (event.url === '/dashboard/settings/academic-years' || event.urlAfterRedirects === '/dashboard/settings/academic-years') {
          // Refresh the data without hard reload
          this.pageSubject.next(this.pageSubject.value);
        }
      });
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
      field: 'isManualActive',
      header: 'Selection',
      type: 'toggle',
      toggleConfig: {
        onChange: (rowData: AcademicYear, checked: boolean) => this.onActiveToggle(rowData, checked),
        disabled: (rowData: AcademicYear) => rowData.isManualActive === true
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
    if (academicYear.isManualActive) {
      return; // Already manually active, no need to do anything
    }

    // Optimistic UI: switch active locally without reloading
    this.previousActiveYearId = this.academicYears.find((y) => y.isManualActive)?.id || null;
    this.academicYears = this.academicYears.map((y) => ({ ...y, isManualActive: y.id === academicYear.id }));

    this.setActiveAcademicYear(academicYear.id)
      .pipe(
        catchError((error) => {
          console.error('Error setting active academic year:', error);
          // Revert on error
          this.academicYears = this.academicYears.map((y) => ({ ...y, isActive: y.id === this.previousActiveYearId }));
          return of(null);
        })
      )
      .subscribe((response) => {
        // Only refresh if the update was successful
        if (response) {
          // Hard refresh the app after successfully changing active academic year
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }
      });
  }

  onActiveToggle(academicYear: AcademicYear, checked: boolean) {
    if (!checked) {
      // Enforce single active: do not allow turning off the manually active toggle directly
      // Revert switch immediately without fetching
      const idx = this.academicYears.findIndex((y) => y.id === academicYear.id);
      if (idx > -1) this.academicYears[idx].isManualActive = true;
      return;
    }
    this.onSetActiveYear(academicYear);
  }

  private setActiveAcademicYear(yearId: string): Observable<any> {
    // Update local data optimistically
    this.academicYears.forEach((year) => {
      year.isManualActive = year.id === yearId;
    });

    // Update the academic year to set is_manual_active to true
    // The backend will automatically deactivate all other academic years
    return this.academicService.updateAcademicYear(yearId, { is_manual_active: true }).pipe(
      switchMap((yearResponse) => {
        // Get ALL periods from the database (not just from loaded academic years)
        // This ensures we update periods from all academic years, even if they're not in the current page
        return this.academicService.getAllAcademicPeriods().pipe(
          switchMap((allPeriods: any[]) => {
            if (!Array.isArray(allPeriods) || allPeriods.length === 0) {
              console.log('No periods found to update');
              return of(yearResponse);
            }

            console.log(`Found ${allPeriods.length} periods to check. Active year ID: ${yearId}`);

            // Collect all period update requests
            const updateRequests: Observable<any>[] = [];

            allPeriods.forEach((period: any) => {
              // Get the academic_year ID from the period
              // It might be an object with id/_id or a string
              let periodYearId: string | null = null;
              
              if (period.academic_year) {
                if (typeof period.academic_year === 'string') {
                  periodYearId = period.academic_year;
                } else if (period.academic_year.id) {
                  periodYearId = period.academic_year.id;
                } else if (period.academic_year._id) {
                  periodYearId = period.academic_year._id;
                }
              }
              
              if (!periodYearId) {
                console.warn(`Period ${period.id} (${period.name}) has no academic_year ID, skipping`);
                return;
              }
              
              // Set is_active = true ONLY for periods of the active academic year
              // Set is_active = false for ALL other periods
              const isActive = String(periodYearId) === String(yearId);
              
              console.log(`Period ${period.name} (Year: ${periodYearId}): Setting is_active = ${isActive} (current: ${period.is_active})`);
              
              // Always update to ensure consistency (even if status appears correct)
              updateRequests.push(
                this.academicService.updateAcademicPeriod(period.id, { is_active: isActive } as any).pipe(
                  map((response) => {
                    console.log(`Successfully updated period ${period.id} (${period.name}) to is_active = ${isActive}`);
                    return response;
                  }),
                  catchError((error) => {
                    console.error(`Error updating period ${period.id} (${period.name}):`, error);
                    return of(null);
                  })
                )
              );
            });

            console.log(`Updating ${updateRequests.length} periods`);

            // Execute all period updates in parallel
            return updateRequests.length > 0
              ? forkJoin(updateRequests).pipe(
                  map((results) => {
                    const successCount = results.filter(r => r !== null).length;
                    console.log(`Successfully updated ${successCount} out of ${updateRequests.length} periods`);
                    return yearResponse;
                  })
                )
              : of(yearResponse);
          }),
          catchError((error) => {
            console.error('Error loading or updating periods:', error);
            // Return the year response even if period updates fail
            return of(yearResponse);
          })
        );
      })
    );
  }

  onAdd() {
    // Navigate to create academic year page
    this.router.navigate(['/dashboard/settings/academic-years/create']);
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'list' ? 'grid' : 'list';
  }

  onExport() {
    // Prepare data for export
    const exportData = this.filteredData.map((year) => ({
      'Title': year.name,
      'Start Date': this.formatDate(year.start_date),
      'End Date': this.formatDate(year.end_date),
      'Number of Periods': year.numberOfPeriods || 0,
      'Active': year.isActive ? 'Yes' : 'No'
    }));

    // Create worksheet
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);

    // Create workbook
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Academic Years': worksheet },
      SheetNames: ['Academic Years']
    };

    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0];
    const filename = `academic-years-${date}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, filename);
  }

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
