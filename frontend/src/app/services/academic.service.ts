import { Injectable } from '@angular/core';
import { AcademicYearsService } from '@gen-api/academic-years/academic-years.service';
import { AcademicPeriodsService } from '@gen-api/academic-periods/academic-periods.service';
import { AcademicSubperiodsService } from '@gen-api/academic-subperiods/academic-subperiods.service';
import { PostAcademicYearsBody, PostAcademicPeriodsBody, PutAcademicPeriodsIdBody, PostAcademicSubperiodsBody } from '@gen-api/schemas';
import { Observable, forkJoin, map, switchMap, of } from 'rxjs';

export interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  numberOfPeriods: number;
  isActive: boolean;
  isCurrent: boolean;
  notes?: string;
}

export interface AcademicPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  academic_year: string;
}

@Injectable({
  providedIn: 'root'
})
export class AcademicService {
  constructor(
    private academicYearsService: AcademicYearsService,
    private academicPeriodsService: AcademicPeriodsService,
    private academicSubperiodsService: AcademicSubperiodsService
  ) {}

  /**
   * Get all academic years with their period counts
   */
  getAllAcademicYears(): Observable<AcademicYear[]> {
    return this.academicYearsService.getAcademicYears<any>().pipe(
      switchMap((response: any): Observable<AcademicYear[]> => {
        if (!response || !response.data) {
          return of([]);
        }

        const years = response.data;

        // Get periods for each year to count them
        const yearWithPeriodRequests: Observable<AcademicYear>[] = years.map((year: any) =>
          this.academicPeriodsService.getAcademicPeriods({ academic_year: year.id }).pipe(
            map(
              (periodsResponse: any): AcademicYear => ({
                id: year.id,
                name: year.name,
                start_date: year.start_date,
                end_date: year.end_date,
                numberOfPeriods: periodsResponse?.data?.length || 0,
                isActive: year.is_current || false,
                isCurrent: this.isCurrentAcademicYear(year.start_date, year.end_date),
                notes: year.notes || ''
              })
            )
          )
        );

        return yearWithPeriodRequests.length > 0 ? forkJoin(yearWithPeriodRequests) : of([]);
      })
    );
  }

  /**
   * Get paginated academic years with their period counts
   */
  getAcademicYearsPaginated(page: number, limit: number): Observable<{ years: AcademicYear[]; totalResults: number }> {
    return this.academicYearsService
      .getAcademicYears<any>({ params: { page: String(page), limit: String(limit) } })
      .pipe(
        switchMap((response: any): Observable<{ years: AcademicYear[]; totalResults: number }> => {
          if (!response || !response.data) {
            return of({ years: [], totalResults: 0 });
          }

          const yearsArray = response?.data?.results ?? response?.data ?? [];
          const totalResults = response?.data?.totalResults ?? response?.count ?? (Array.isArray(yearsArray) ? yearsArray.length : 0);

          const yearWithPeriodRequests: Observable<AcademicYear>[] = (yearsArray as any[]).map((year: any) =>
            this.academicPeriodsService.getAcademicPeriods({ academic_year: year.id }).pipe(
              map(
                (periodsResponse: any): AcademicYear => ({
                  id: year.id,
                  name: year.name,
                  start_date: year.start_date,
                  end_date: year.end_date,
                  numberOfPeriods: periodsResponse?.data?.length || 0,
                  isActive: year.is_current || false,
                  isCurrent: this.isCurrentAcademicYear(year.start_date, year.end_date),
                  notes: year.notes || ''
                })
              )
            )
          );

          return yearWithPeriodRequests.length > 0
            ? forkJoin(yearWithPeriodRequests).pipe(map((years) => ({ years, totalResults })))
            : of({ years: [], totalResults });
        })
      );
  }

  /**
   * Get academic year by ID
   */
  getAcademicYearById(yearId: string): Observable<AcademicYear | null> {
    return this.academicYearsService.getAcademicYearsId<any>(yearId).pipe(
      switchMap((response: any): Observable<AcademicYear | null> => {
        const year = response?.data;
        if (!year) {
          return of(null);
        }
        return this.academicPeriodsService.getAcademicPeriods({ academic_year: year.id }).pipe(
          map((periodsResponse: any): AcademicYear => ({
            id: year.id,
            name: year.name,
            start_date: year.start_date,
            end_date: year.end_date,
            numberOfPeriods: periodsResponse?.data?.length || 0,
            isActive: year.is_current || false,
            isCurrent: this.isCurrentAcademicYear(year.start_date, year.end_date),
            notes: year.notes || ''
          }))
        );
      })
    );
  }

  /**
   * Get academic periods for a specific year
   */
  getAcademicPeriods(yearId: string): Observable<AcademicPeriod[]> {
    return this.academicPeriodsService.getAcademicPeriods({ academic_year: yearId }).pipe(map((response: any) => response?.data || []));
  }

  /**
   * Create a new academic year
   */
  createAcademicYear(yearData: PostAcademicYearsBody) {
    return this.academicYearsService.postAcademicYears(yearData);
  }

  /**
   * Update an academic year
   */
  updateAcademicYear(yearId: string, yearData: { name?: string; start_date?: string; end_date?: string; notes?: string; is_current?: boolean }) {
    return this.academicYearsService.putAcademicYearsId(yearId, yearData);
  }

  /**
   * Delete an academic year
   */
  deleteAcademicYear(yearId: string) {
    return this.academicYearsService.deleteAcademicYearsId(yearId);
  }

  /**
   * Create a new academic period
   */
  createAcademicPeriod(periodData: PostAcademicPeriodsBody) {
    return this.academicPeriodsService.postAcademicPeriods(periodData);
  }

  /**
   * Update an academic period
   */
  updateAcademicPeriod(periodId: string, periodData: Omit<PutAcademicPeriodsIdBody, 'id'>) {
    const updateData: PutAcademicPeriodsIdBody = {
      id: periodId,
      ...periodData
    };
    return this.academicPeriodsService.putAcademicPeriodsId(periodId, updateData);
  }

  /**
   * Delete an academic period
   */
  deleteAcademicPeriod(periodId: string) {
    return this.academicPeriodsService.deleteAcademicPeriodsId(periodId);
  }

  /**
   * Create a new academic subperiod (term)
   */
  createAcademicSubperiod(subperiodData: PostAcademicSubperiodsBody) {
    return this.academicSubperiodsService.postAcademicSubperiods(subperiodData);
  }

  /**
   * Delete an academic subperiod (term)
   */
  deleteAcademicSubperiod(subperiodId: string) {
    return this.academicSubperiodsService.deleteAcademicSubperiodsId(subperiodId);
  }

  /**
   * Get academic subperiods for a specific period
   */
  getAcademicSubperiodsForPeriod(academicPeriodId: string) {
    return this.academicSubperiodsService
      .getAcademicSubperiods<any>({ academic_period: academicPeriodId })
      .pipe(map((response: any) => response?.data || []));
  }

  /**
   * Validate that periods within an academic year don't overlap
   */
  validatePeriodOverlaps(periods: AcademicPeriod[]): { hasOverlaps: boolean; overlaps: string[] } {
    const overlaps: string[] = [];

    for (let i = 0; i < periods.length; i++) {
      for (let j = i + 1; j < periods.length; j++) {
        const period1 = periods[i];
        const period2 = periods[j];

        const start1 = new Date(period1.start_date);
        const end1 = new Date(period1.end_date);
        const start2 = new Date(period2.start_date);
        const end2 = new Date(period2.end_date);

        // Check for overlap: periods overlap if start1 <= end2 && start2 <= end1
        if (start1 <= end2 && start2 <= end1) {
          overlaps.push(`"${period1.name}" overlaps with "${period2.name}"`);
        }
      }
    }

    return {
      hasOverlaps: overlaps.length > 0,
      overlaps
    };
  }

  /**
   * Check if dates represent the current academic year
   */
  private isCurrentAcademicYear(startDate: string, endDate: string): boolean {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    return today >= start && today <= end;
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  }

  /**
   * Get the current academic year
   */
  getCurrentAcademicYear(): Observable<AcademicYear | null> {
    return this.academicYearsService.getAcademicYearsCurrent<any>().pipe(map((response: any) => response?.data || null));
  }
}
