import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { PrimaryTableComponent } from '@components/table/primary-table/primary-table.component';
import { TranslateModule } from '@ngx-translate/core';
import { AcademicService, AcademicYear, AcademicPeriod } from '@services/academic.service';
import { catchError, of, switchMap, forkJoin, map } from 'rxjs';
import { OutlineButtonComponent } from '@components/buttons/outline-button/outline-button.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-view-academic-year',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    TagModule,
    DividerModule,
    TooltipModule,
    PrimaryTableComponent,
    TranslateModule,
    OutlineButtonComponent
  ],
  templateUrl: './view-academic-year.component.html',
  styleUrl: './view-academic-year.component.scss'
})
export class ViewAcademicYearComponent implements OnInit {
  @Input() academicYear!: AcademicYear;
  @Output() onClose = new EventEmitter<void>();
  @Output() onEdit = new EventEmitter<AcademicYear>();
  @Output() onDelete = new EventEmitter<AcademicYear>();

  periods: AcademicPeriod[] = [];
  loading = true;
  error = false;

  // Group periods with their subperiods (terms)
  groupedPeriods: { period: AcademicPeriod; subperiods: AcademicSubperiod[] }[] = [];

  // Sorting state for the custom grid
  sortField: 'name' | 'start_date' | 'end_date' = 'name';
  sortOrder: 1 | -1 = 1; // 1 asc, -1 desc

  constructor(private academicService: AcademicService, private router: Router) {}

  ngOnInit() {
    if (this.academicYear?.id) {
      this.loadPeriods();
    }
  }

  loadPeriods() {
    this.loading = true;
    this.error = false;

    this.academicService
      .getAcademicPeriods(this.academicYear.id)
      .pipe(
        catchError((error) => {
          console.error('Error loading periods:', error);
          this.error = true;
          return of([] as AcademicPeriod[]);
        }),
        switchMap((periods: AcademicPeriod[]) => {
          this.periods = periods;
          if (!periods || periods.length === 0) {
            return of([] as { period: AcademicPeriod; subperiods: AcademicSubperiod[] }[]);
          }

          const subperiodRequests = periods.map((p) =>
            this.academicService
              .getAcademicSubperiodsForPeriod(p.id)
              .pipe(map((subs: AcademicSubperiod[]) => ({ period: p, subperiods: subs || [] })))
          );
          return forkJoin(subperiodRequests);
        }),
        catchError((error) => {
          // If subperiods fail to load, fall back to showing periods only
          console.error('Error loading subperiods:', error);
          return of(this.periods.map((p) => ({ period: p, subperiods: [] as AcademicSubperiod[] })));
        })
      )
      .subscribe((grouped) => {
        this.groupedPeriods = grouped;
        this.loading = false;
      });
  }

  periodsTableColumns = [
    {
      field: 'name',
      header: 'Period Name',
      sortable: true
    },
    {
      field: 'start_date',
      header: 'Start Date',
      sortable: true,
      getValue: (rowData: AcademicPeriod) => this.formatDate(rowData.start_date)
    },
    {
      field: 'end_date',
      header: 'End Date',
      sortable: true,
      getValue: (rowData: AcademicPeriod) => this.formatDate(rowData.end_date)
    },
    {
      field: 'duration',
      header: 'Duration',
      getValue: (rowData: AcademicPeriod) => this.calculateDuration(rowData.start_date, rowData.end_date)
    }
  ];

  formatDate(dateString: string): string {
    return this.academicService.formatDate(dateString);
  }

  calculateDuration(startDate: string, endDate: string): string {
    if (!startDate || !endDate) return '';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days`;
    } else if (diffDays < 365) {
      const months = Math.round(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      const years = Math.round(diffDays / 365);
      return `${years} year${years > 1 ? 's' : ''}`;
    }
  }

  close() {
    // Navigate back to academic years list
    this.router.navigate(['/dashboard/settings/academic-years']);
  }

  edit() {
    // Navigate to edit page
    this.router.navigate(['/dashboard/settings/academic-years/edit', this.academicYear.id]);
  }

  onRetry() {
    this.loadPeriods();
  }

  delete() {
    if (!this.academicYear) return;
    
    if (confirm(`Are you sure you want to delete "${this.academicYear.name}"? This will permanently delete the entire academic year including all periods and subperiods.`)) {
      this.academicService.deleteAcademicYear(this.academicYear.id)
        .pipe(
          catchError((error) => {
            console.error('Error deleting academic year:', error);
            alert('Failed to delete academic year');
            return of(null);
          })
        )
        .subscribe((response) => {
          if (response !== null) {
            // Navigate back to academic years list
            this.router.navigate(['/dashboard/settings/academic-years']);
          }
        });
    }
  }

  onEditPeriod(period: AcademicPeriod) {
    console.log('Edit period:', period);
    // TODO: Implement period editing
  }

  onDeletePeriod(period: AcademicPeriod) {
    console.log('Delete period:', period);
    if (confirm(`Are you sure you want to delete the period "${period.name}"?`)) {
      this.academicService.deleteAcademicPeriod(period.id)
        .pipe(
          catchError((error) => {
            console.error('Error deleting period:', error);
            alert('Failed to delete period');
            return of(null);
          })
        )
        .subscribe((response) => {
          if (response !== null) {
            this.loadPeriods(); // Reload periods
          }
        });
    }
  }

  onViewPeriod(period: AcademicPeriod) {
    console.log('View period:', period);
    // TODO: Implement period viewing
  }

  // --- Sorting helpers for periods grid ---
  onHeaderSort(field: 'name' | 'start_date' | 'end_date') {
    if (this.sortField === field) {
      this.sortOrder = (this.sortOrder === 1 ? -1 : 1);
    } else {
      this.sortField = field;
      this.sortOrder = 1;
    }
  }

  getSortIcon(field: 'name' | 'start_date' | 'end_date'): string {
    if (this.sortField !== field) return 'pi pi-sort-alt';
    return this.sortOrder === 1 ? 'pi pi-sort-amount-up' : 'pi pi-sort-amount-down';
  }

  get sortedGroupedPeriods(): { period: AcademicPeriod; subperiods: AcademicSubperiod[] }[] {
    const compareVals = (a: any, b: any): number => {
      if (a == null && b == null) return 0;
      if (a == null) return -1;
      if (b == null) return 1;
      if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
      if (!isNaN(Date.parse(a)) && !isNaN(Date.parse(b))) return new Date(a).getTime() - new Date(b).getTime();
      const as = String(a).toLowerCase();
      const bs = String(b).toLowerCase();
      return as.localeCompare(bs);
    };

    const field = this.sortField;
    const order = this.sortOrder;
    const getVal = (p: { period: AcademicPeriod }) => {
      return p.period[field];
    };

    const sortedGroups = [...this.groupedPeriods].sort((a, b) => compareVals(getVal(a), getVal(b)) * order);

    // Also sort subperiods inside each group by the same field
    return sortedGroups.map((g) => ({
      period: g.period,
      subperiods: [...g.subperiods].sort((a, b) => compareVals(a[field], b[field]) * order)
    }));
  }
}

// Local interface for subperiods to avoid leaking `any`
interface AcademicSubperiod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  academic_period: string;
}
