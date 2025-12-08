import { Component, EventEmitter, Output, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { FormlyModule } from '@ngx-formly/core';
import { ReactiveFormsModule, FormGroup, FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { CalendarModule } from 'primeng/calendar';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { PrimaryInputComponent } from '@components/inputs/primary-input/primary-input.component';
import { PrimaryDateRangeComponent } from '@components/inputs/primary-date-range/primary-date-range.component';
import { PrimaryTextareaComponent } from '@components/inputs/primary-textarea/primary-textarea.component';
import { OutlineButtonComponent } from '@components/buttons/outline-button/outline-button.component';
import { AcademicYearFieldsService } from './fields';
import { AcademicYear, AcademicService } from '@services/academic.service';
import { catchError, of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-academic-year-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    FormlyModule,
    ButtonModule,
    DialogModule,
    TranslateModule,
    CalendarModule,
    InputTextModule,
    InputTextareaModule,
    TooltipModule,
    ToastModule,
    PrimaryInputComponent,
    PrimaryDateRangeComponent,
    PrimaryTextareaComponent,
    OutlineButtonComponent
  ],
  providers: [MessageService],
  templateUrl: './academic-year-form.component.html',
  styleUrl: './academic-year-form.component.scss'
})
export class AcademicYearFormComponent implements OnInit, OnChanges {
  @Input() editingAcademicYear: AcademicYear | null = null;
  @Input() isEditing = false;
  @Output() onCancel = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<any>();

  // Routing properties
  isEditMode = false;
  academicYearId: string | null = null;

  private academicYearFieldsService = inject(AcademicYearFieldsService);

  form = new FormGroup({});
  model: any = {
    title: '',
    academicYearRange: {
      startDate: null,
      endDate: null
    },
    periods: [
      {
        title: '',
        periodRange: {
          startDate: null,
          endDate: null
        }
      }
    ],
    notes: ''
  };

  options: FormlyFormOptions = {};
  fields: FormlyFieldConfig[] = [];

  // Term dialog state
  displayTermDialog = false;
  currentTermPeriodIndex: number | null = null;
  termDialogModel: { title: string; startDate: Date | null; endDate: Date | null } = {
    title: '',
    startDate: null,
    endDate: null,
  };

  constructor(
    private academicService: AcademicService, 
    private messageService: MessageService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {
    this.fields = this.academicYearFieldsService.getAcademicYearFields();
  }

  ngOnInit() {
    // Check if we're in edit mode based on route
    this.route.params.subscribe(params => {
      this.academicYearId = params['id'] || null;
      this.isEditMode = !!this.academicYearId;
      
      if (this.isEditMode && this.academicYearId) {
        // Load the academic year data for editing
        this.loadAcademicYearForEdit();
      } else {
        // Initialize form for create mode
        this.initializeForm();
      }
    });
  }

  private loadAcademicYearForEdit() {
    if (!this.academicYearId) return;
    
    this.academicService.getAcademicYearById(this.academicYearId)
      .pipe(
        catchError((error) => {
          console.error('Error loading academic year for edit:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load academic year for editing'
          });
          return of(null);
        })
      )
      .subscribe((academicYear: AcademicYear | null) => {
        if (academicYear) {
          this.editingAcademicYear = academicYear;
          this.isEditing = true;
          this.initializeForm();
        }
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['editingAcademicYear'] || changes['isEditing']) {
      this.initializeForm();
    }
  }

  private initializeForm() {
    if (this.isEditing && this.editingAcademicYear) {
      // Pre-fill form with existing data
      this.model = {
        title: this.editingAcademicYear.name,
        academicYearRange: {
          startDate: new Date(this.editingAcademicYear.start_date),
          endDate: new Date(this.editingAcademicYear.end_date)
        },
        periods: [
          {
            title: '',
            periodRange: {
              startDate: null,
              endDate: null
            }
          }
        ],
        notes: this.editingAcademicYear.notes || ''
      };

      // Load existing periods for this academic year
      this.loadExistingPeriods();
    } else {
      // Reset form for create mode
      this.model = {
        title: '',
        academicYearRange: {
          startDate: null,
          endDate: null
        },
        periods: [
          {
            title: '',
            periodRange: {
              startDate: null,
              endDate: null
            }
          }
        ],
        notes: ''
      };
    }
  }

  private loadExistingPeriods() {
    if (!this.editingAcademicYear) {
      return;
    }

    this.academicService
      .getAcademicPeriods(this.editingAcademicYear.id)
      .pipe(
        catchError((error) => {
          console.error('Error loading existing periods:', error);
          return of([]);
        })
      )
      .subscribe((periods) => {
        if (periods && periods.length > 0) {
          // Convert periods to the form model format
          this.model.periods = periods.map((period) => ({
            id: period.id, // Store the ID for potential updates
            title: period.name,
            periodRange: {
              startDate: new Date(period.start_date),
              endDate: new Date(period.end_date)
            },
            terms: []
          }));

          // For each period, load existing subperiods (terms)
          this.model.periods.forEach((p: any, idx: number) => {
            if (!p.id) return;
            this.academicService
              .getAcademicSubperiodsForPeriod(p.id)
              .pipe(
                catchError((error) => {
                  console.error('Error loading subperiods for period', p.id, error);
                  return of([]);
                })
              )
              .subscribe((subs: any[]) => {
                this.model.periods[idx].terms = subs.map((s: any) => ({
                  id: s.id,
                  title: s.name,
                  startDate: new Date(s.start_date),
                  endDate: new Date(s.end_date)
                }));
              });
          });
        } else {
          // If no periods exist, show one empty period
          this.model.periods = [
            {
              title: '',
              periodRange: {
                startDate: null,
                endDate: null
              }
            }
          ];
        }
      });
  }

  onSubmit() {
    if (this.form.valid) {
      if (this.isEditMode && this.academicYearId) {
        // Update existing academic year
        this.updateAcademicYear();
      } else {
        // Create new academic year
        this.createAcademicYear();
      }
    } else {
      this.messageService.add({ severity: 'warn', summary: 'Form invalid', detail: 'Please review required fields.' });
    }
  }

  private createAcademicYear() {
    const academicYearData = {
      name: this.model.title,
      start_date: this.model.academicYearRange?.startDate,
      end_date: this.model.academicYearRange?.endDate,
      notes: this.model.notes || ''
    };

    this.academicService.createAcademicYear(academicYearData)
      .pipe(
        catchError((error) => {
          console.error('Error creating academic year:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to create academic year'
          });
          return of(null);
        })
      )
      .subscribe((response: any) => {
        if (response) {
          const academicYearId = response.data?.id;
          if (academicYearId) {
            // Create periods for the academic year
            this.createPeriodsForAcademicYear(academicYearId);
          } else {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Academic year created successfully'
            });
            this.location.back();
          }
        }
      });
  }

  private updateAcademicYear() {
    if (!this.academicYearId) return;

    const academicYearData = {
      name: this.model.title,
      start_date: this.model.academicYearRange?.startDate,
      end_date: this.model.academicYearRange?.endDate,
      notes: this.model.notes || ''
    };

    this.academicService.updateAcademicYear(this.academicYearId, academicYearData)
      .pipe(
        catchError((error) => {
          console.error('Error updating academic year:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update academic year'
          });
          return of(null);
        })
      )
      .subscribe((response) => {
        if (response) {
          // Update periods for the academic year
          this.updatePeriodsForAcademicYear(this.academicYearId!);
        }
      });
  }

  cancel() {
    // Navigate back without hard refresh
    this.location.back();
  }

  addPeriod() {
    // Check if all existing periods are complete
    if (this.model.periods && this.model.periods.length > 0) {
      const incompletePeriods = this.model.periods.filter(
        (period: any) => !period.title || !period.periodRange?.startDate || !period.periodRange?.endDate
      );

      if (incompletePeriods.length > 0) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Incomplete Period',
          detail: 'Please fill in all fields (title, start date, and end date) for existing periods before adding a new one.',
          life: 5000
        });
        return;
      }
    }

    // All periods are complete, add a new one
    if (!this.model.periods) {
      this.model.periods = [];
    }
    this.model.periods.push({
      title: '',
      periodRange: {
        startDate: null,
        endDate: null
      }
    });

    this.messageService.add({
      severity: 'success',
      summary: 'Period Added',
      detail: 'New academic period has been added successfully.',
      life: 3000
    });
  }

  removePeriod(index: number) {
    if (this.model.periods && this.model.periods.length > 1) {
      this.model.periods.splice(index, 1);
    }
  }

  getMinDateForPeriod(): Date | null {
    return this.model.academicYearRange?.startDate || null;
  }

  getMaxDateForPeriod(): Date | null {
    return this.model.academicYearRange?.endDate || null;
  }

  addTermToPeriod(periodIndex: number) {
    const period = this.model.periods[periodIndex];

    // Validate that the period has all required fields
    if (!period.title || !period.periodRange?.startDate || !period.periodRange?.endDate) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Incomplete Period',
        detail: 'Please fill in the period title, start date, and end date before adding terms.',
        life: 5000
      });
      return;
    }

    // Open dialog to add a new term
    this.currentTermPeriodIndex = periodIndex;
    const periodStart: Date = new Date(period.periodRange.startDate);
    const periodEnd: Date = new Date(period.periodRange.endDate);
    const lastEnd = this.getLastTermEndDate(periodIndex);
    let suggestedStart: Date = lastEnd ? this.addDays(new Date(lastEnd), 1) : new Date(periodStart);
    // Clamp suggestedStart within period
    if (suggestedStart < periodStart) suggestedStart = new Date(periodStart);
    if (suggestedStart > periodEnd) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No space for new term',
        detail: 'All dates in this period are already covered by existing terms.',
        life: 4000,
      });
      this.currentTermPeriodIndex = null;
      return;
    }
    this.termDialogModel = {
      title: `Term ${(period.terms?.length || 0) + 1}`,
      startDate: suggestedStart,
      endDate: periodEnd,
    };
    this.displayTermDialog = true;
  }

  removeTerm(periodIndex: number, termIndex: number) {
    const period = this.model.periods[periodIndex];
    if (!period || !period.terms) return;
    period.terms.splice(termIndex, 1);
  }

  deleteTermFromServer(periodIndex: number, termIndex: number, subperiodId: string) {
    this.academicService.deleteAcademicSubperiod(subperiodId).subscribe({
      next: () => {
        this.removeTerm(periodIndex, termIndex);
        this.messageService.add({ severity: 'success', summary: 'Term deleted', detail: 'The term has been deleted.' });
      },
      error: (err) => {
        console.error('[AY-Form] Failed to delete subperiod:', err);
        this.messageService.add({ severity: 'error', summary: 'Delete failed', detail: 'Could not delete term.' });
      }
    });
  }

  getTermMinDate(): Date | null {
    if (this.currentTermPeriodIndex === null) return null;
    const period = this.model.periods[this.currentTermPeriodIndex];
    const periodStart: Date = new Date(period?.periodRange?.startDate);
    const periodEnd: Date = new Date(period?.periodRange?.endDate);
    const lastEnd = this.getLastTermEndDate(this.currentTermPeriodIndex);
    let min = lastEnd ? this.addDays(new Date(lastEnd), 1) : new Date(periodStart);
    // Ensure min is not after period end
    if (min > periodEnd) min = new Date(periodEnd);
    return min;
  }

  getTermMaxDate(): Date | null {
    if (this.currentTermPeriodIndex === null) return null;
    return this.model.periods[this.currentTermPeriodIndex]?.periodRange?.endDate || null;
  }

  getPeriodStartDate(): Date | null {
    if (this.currentTermPeriodIndex === null) return null;
    const period = this.model.periods[this.currentTermPeriodIndex];
    return period?.periodRange?.startDate || null;
  }

  private getLastTermEndDate(periodIndex: number): Date | null {
    const period = this.model.periods[periodIndex];
    if (!period?.terms || period.terms.length === 0) return null;
    const ends = period.terms
      .filter((t: any) => t?.endDate)
      .map((t: any) => new Date(t.endDate).getTime());
    if (ends.length === 0) return null;
    const max = Math.max(...ends);
    return new Date(max);
  }

  private addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  saveTermFromDialog() {
    if (this.currentTermPeriodIndex === null) return;
    const { title, startDate, endDate } = this.termDialogModel;
    if (!title || !startDate || !endDate) {
      this.messageService.add({ severity: 'warn', summary: 'Incomplete Term', detail: 'Please fill in title, start and end dates.', life: 4000 });
      return;
    }
    if (startDate > endDate) {
      this.messageService.add({ severity: 'warn', summary: 'Invalid Dates', detail: 'Start date must be before end date.', life: 4000 });
      return;
    }
    const period = this.model.periods[this.currentTermPeriodIndex];
    const periodStart: Date = new Date(period.periodRange.startDate);
    const periodEnd: Date = new Date(period.periodRange.endDate);
    if (startDate < periodStart || endDate > periodEnd) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Out of range',
        detail: 'Term dates must be within the period range.',
        life: 4000,
      });
      return;
    }
    // If editing and period has an id, save immediately to backend
    if (this.isEditing && period.id) {
      const payload = {
        name: title,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        academic_period: period.id
      } as any;
      this.academicService.createAcademicSubperiod(payload).subscribe({
        next: (resp: any) => {
          if (!period.terms) period.terms = [];
          period.terms.push({ title, startDate, endDate, id: resp?.data?.id });
          this.messageService.add({ severity: 'success', summary: 'Term saved', detail: 'Term was saved successfully.', life: 3000 });
          this.displayTermDialog = false;
          this.currentTermPeriodIndex = null;
          this.termDialogModel = { title: '', startDate: null, endDate: null };
        },
        error: (err) => {
          console.error('[AY-Form] Failed to create subperiod:', err);
          this.messageService.add({ severity: 'error', summary: 'Failed to save term', detail: 'Please try again.' });
        }
      });
      return;
    }

    // Otherwise, store locally; it will be saved when the academic year is saved
    if (!period.terms) period.terms = [];
    period.terms.push({ title, startDate, endDate });
    this.messageService.add({ severity: 'info', summary: 'Term queued', detail: 'Term will be saved when you click Save.', life: 3000 });
    this.displayTermDialog = false;
    this.currentTermPeriodIndex = null;
    this.termDialogModel = { title: '', startDate: null, endDate: null };
  }

  cancelTermDialog() {
    this.displayTermDialog = false;
    this.currentTermPeriodIndex = null;
    this.termDialogModel = { title: '', startDate: null, endDate: null };
  }

  private createPeriodsForAcademicYear(academicYearId: string) {
    if (!this.model.periods || this.model.periods.length === 0) {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Academic year created successfully'
      });
      this.router.navigate(['/dashboard/settings/academic-years']);
      return;
    }

    // Filter out incomplete periods
    const validPeriods = this.model.periods.filter((period: any) => 
      period.title && period.periodRange?.startDate && period.periodRange?.endDate
    );

    if (validPeriods.length === 0) {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Academic year created successfully'
      });
      this.router.navigate(['/dashboard/settings/academic-years']);
      return;
    }

    // Create periods sequentially
    this.createPeriodsSequentially(academicYearId, validPeriods, 0);
  }

  private createPeriodsSequentially(academicYearId: string, periods: any[], index: number) {
    if (index >= periods.length) {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Academic year and periods created successfully'
      });
      this.router.navigate(['/dashboard/settings/academic-years']);
      return;
    }

    const period = periods[index];
    const periodData = {
      name: period.title,
      start_date: new Date(period.periodRange.startDate).toISOString(),
      end_date: new Date(period.periodRange.endDate).toISOString(),
      academic_year: academicYearId
    };

    this.academicService.createAcademicPeriod(periodData)
      .pipe(
        catchError((error) => {
          console.error('Error creating period:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to create period: ${period.title}`
          });
          return of(null);
        })
      )
      .subscribe((response: any) => {
        if (response) {
          // Create subperiods (terms) for this period if they exist
          if (period.terms && period.terms.length > 0) {
            this.createSubperiodsForPeriod(response.data?.id, period.terms);
          }
        }
        // Continue with next period
        this.createPeriodsSequentially(academicYearId, periods, index + 1);
      });
  }

  private createSubperiodsForPeriod(periodId: string, subperiods: any[]) {
    subperiods.forEach((subperiod: any) => {
      if (subperiod.title && subperiod.startDate && subperiod.endDate) {
        const subperiodData = {
          name: subperiod.title,
          start_date: new Date(subperiod.startDate).toISOString(),
          end_date: new Date(subperiod.endDate).toISOString(),
          academic_period: periodId
        };

        this.academicService.createAcademicSubperiod(subperiodData)
          .pipe(
            catchError((error) => {
              console.error('Error creating subperiod:', error);
              return of(null);
            })
          )
          .subscribe();
      }
    });
  }

  private updatePeriodsForAcademicYear(academicYearId: string) {
    // For updates, we need to handle existing periods properly
    // First, get existing periods to compare with new ones
    this.academicService.getAcademicPeriods(academicYearId)
      .pipe(
        catchError((error) => {
          console.error('Error loading existing periods:', error);
          return of([]);
        })
      )
      .subscribe((existingPeriods: any[]) => {
        this.handlePeriodUpdates(academicYearId, existingPeriods);
      });
  }

  private handlePeriodUpdates(academicYearId: string, existingPeriods: any[]) {
    if (!this.model.periods || this.model.periods.length === 0) {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Academic year updated successfully'
      });
      this.router.navigate(['/dashboard/settings/academic-years']);
      return;
    }

    // Filter out incomplete periods
    const validPeriods = this.model.periods.filter((period: any) => 
      period.title && period.periodRange?.startDate && period.periodRange?.endDate
    );

    if (validPeriods.length === 0) {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Academic year updated successfully'
      });
      this.router.navigate(['/dashboard/settings/academic-years']);
      return;
    }

    // Check if periods have IDs (meaning they already exist)
    const periodsWithIds = validPeriods.filter((period: any) => period.id);
    const newPeriods = validPeriods.filter((period: any) => !period.id);

    if (periodsWithIds.length > 0) {
      // Update existing periods
      this.updateExistingPeriods(periodsWithIds);
    }

    if (newPeriods.length > 0) {
      // Create new periods
      this.createNewPeriods(academicYearId, newPeriods);
    } else {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Academic year updated successfully'
      });
      this.router.navigate(['/dashboard/settings/academic-years']);
    }
  }

  private updateExistingPeriods(periods: any[]) {
    let completedUpdates = 0;
    const totalUpdates = periods.length;

    periods.forEach((period: any) => {
      const periodData = {
        name: period.title,
        start_date: new Date(period.periodRange.startDate).toISOString(),
        end_date: new Date(period.periodRange.endDate).toISOString()
      };

      this.academicService.updateAcademicPeriod(period.id, periodData)
        .pipe(
          catchError((error) => {
            console.error('Error updating period:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Failed to update period: ${period.title}`
            });
            return of(null);
          })
        )
        .subscribe((response: any) => {
          completedUpdates++;
          if (completedUpdates === totalUpdates) {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Academic year and periods updated successfully'
            });
            this.location.back();
          }
        });
    });
  }

  private createNewPeriods(academicYearId: string, periods: any[]) {
    this.createPeriodsSequentially(academicYearId, periods, 0);
  }

  /**
   * Calculate the position and width of a term segment on the timeline
   */
  getTermPosition(period: any, term: any): { left: number; width: number } {
    if (!period.periodRange?.startDate || !period.periodRange?.endDate || !term.startDate || !term.endDate) {
      return { left: 0, width: 0 };
    }

    const periodStart = new Date(period.periodRange.startDate).getTime();
    const periodEnd = new Date(period.periodRange.endDate).getTime();
    const termStart = new Date(term.startDate).getTime();
    const termEnd = new Date(term.endDate).getTime();

    const periodDuration = periodEnd - periodStart;

    // Calculate left position as percentage
    const left = ((termStart - periodStart) / periodDuration) * 100;

    // Calculate width as percentage
    const width = ((termEnd - termStart) / periodDuration) * 100;

    return {
      left: Math.max(0, Math.min(100, left)),
      width: Math.max(0, Math.min(100 - left, width))
    };
  }

  /**
   * Get a distinct color for each term
   */
  getTermColor(index: number): string {
    const colors = [
      '#3b82f6', // blue
      '#10b981', // green
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#06b6d4', // cyan
      '#f97316', // orange
    ];
    return colors[index % colors.length];
  }
}
