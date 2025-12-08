import { Injectable, inject, signal, computed, effect } from '@angular/core';

import { AcademicYearsService } from '@gen-api/academic-years/academic-years.service';
import { AcademicPeriodsService } from '@gen-api/academic-periods/academic-periods.service';
import { AcademicSubperiodsService } from '@gen-api/academic-subperiods/academic-subperiods.service';

import { UserDataService } from './user-data.service';

interface AcademicYear {
  id: string;
  name: string;
  start_date: Date;
  end_date: Date;
  is_manual_active: boolean;
  is_current: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface AcademicPeriod {
  id: string;
  academic_year: AcademicYear | string;
  name: string;
  start_date: Date;
  end_date: Date;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AcademicSubperiod {
  id: string;
  academic_period: AcademicPeriod | string;
  name: string;
  start_date: Date;
  end_date: Date;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})

export class AcademicTimeframeService {
  academicYearsService = inject(AcademicYearsService);
  academicPeriodsService = inject(AcademicPeriodsService);
  academicSubperiodsService = inject(AcademicSubperiodsService);
  userDataService = inject(UserDataService);
  
  private academicYearSignal = signal<AcademicYear>({} as AcademicYear);

  private allAcademicPeriodsSignal = signal<AcademicPeriod[]>([]); // Of the selected academic year
  private selectedAcademicPeriodSignal = signal<AcademicPeriod>({} as AcademicPeriod); // Selected period by user
  private currentAcademicPeriodSignal = signal<AcademicPeriod>({} as AcademicPeriod); // Current calendar period

  private allAcademicSubperiodsSignal = signal<AcademicSubperiod[]>([]); // Of the selected academic period
  private selectedAcademicSubperiodsSignal = signal<AcademicSubperiod[]>([]); // Selected subperiods by user
  private currentAcademicSubperiodSignal = signal<AcademicSubperiod>({} as AcademicSubperiod); // Current calendar subperiod
  
  academicYear = this.academicYearSignal.asReadonly();

  allAcademicPeriods = this.allAcademicPeriodsSignal.asReadonly()
  selectedAcademicPeriod = this.selectedAcademicPeriodSignal.asReadonly();
  currentAcademicPeriod = this.currentAcademicPeriodSignal.asReadonly();
  
  allAcademicSubperiods = this.allAcademicSubperiodsSignal.asReadonly();
  selectedAcademicSubperiods = this.selectedAcademicSubperiodsSignal.asReadonly();
  currentAcademicSubperiod = this.currentAcademicSubperiodSignal.asReadonly();
  
  constructor() {
    this.getAcademicYear();
    
    effect(() => {
      const academicYearID = this.academicYear().id;
      
      this.getAllAcademicPeriods(academicYearID);
      this.getCurrentAcademicPeriod();
    });
    
    effect(() => {
      this.getAllAcademicSubperiods();
      this.getCurrentAcademicSubperiod();
    });
  }
  
  getAcademicYear() {
    const currentUserRole = this.userDataService.currentRoleTitle().toLowerCase();
    
    this.academicYearsService.getAcademicYearsStatusDual().subscribe({
      next: (response: any) => {
        const selectedAcademicYear = response.data.manual_active_academic_year;
        const calendarAcademicYear = response.data.date_current_academic_year;
        const areTheSame = response.data.are_the_same;
        
        let currentAcademicYear: AcademicYear = {} as AcademicYear;
        
        if (currentUserRole === 'admin') { // <-- Users who can change academic year manually in settings
          currentAcademicYear = selectedAcademicYear || calendarAcademicYear || {};
        } else {
          currentAcademicYear = calendarAcademicYear || {};
        }
        
        this.academicYearSignal.set(currentAcademicYear);
      },
      complete: () => {
        console.info('📅 Current academic year:', this.academicYear());
      },
      error: (err) => {
        console.error(err);
      }
    });
  }
  
  // getSelectedAcademicYear() {
  //   this.academicYearsService.getAcademicYearsSelected().subscribe({
  //     next: (year: any) => {
  //       this.academicYearSignal.set(year.data || {});
  //     },
  //     complete: () => {
  //       console.info('📅 Selected academic year:', this.academicYear());
  //     },
  //     error: (err) => {
  //       console.error(err);
  //     }
  //   });
  // }
  
  // getCalendarAcademicYear() {
  //   this.academicYearsService.getAcademicYearsCurrent().subscribe({
  //     next: (year: any) => {
  //       this.academicYearSignal.set(year.data || {});
  //     },
  //     complete: () => {
  //       console.info('📅 Calendar academic year:', this.academicYear());
  //     },
  //     error: (err) => {
  //       console.error(err);
  //     }
  //   });
  // }
  
  getAllAcademicPeriods(academicYearID: string) {
    this.academicPeriodsService.getAcademicPeriods({ academic_year: academicYearID }).subscribe({
      next: (periods: any) => {
        this.allAcademicPeriodsSignal.set(periods.data || []);
      },
      complete: () => {
        console.info('📅 All academic periods:', this.allAcademicPeriods());
        
        this.getCurrentAcademicPeriod();
      },
      error: (err) => {
        console.error(err);
      }
    });
  }
  
  getCurrentAcademicPeriod() {
    this.academicPeriodsService.getAcademicPeriodsCurrent().subscribe({
      next: (period: any) => {
        const currentPeriod = period.data || {};
        this.currentAcademicPeriodSignal.set(currentPeriod);
        
        const allPeriods = this.allAcademicPeriods();
        const existsInAllPeriods = allPeriods.some(p => p.id === currentPeriod.id);
        
        if (existsInAllPeriods) {
          this.selectedAcademicPeriodSignal.set(currentPeriod);
        } else if (allPeriods.length > 0) {
          this.selectedAcademicPeriodSignal.set(allPeriods[0]);
        }
      },
      complete: () => {
        console.info('📅 Current academic period:', this.currentAcademicPeriod());
        console.info('📅 Selected academic period:', this.selectedAcademicPeriod());
      },
      error: (err) => {
        console.error(err);
      }
    });
  }
  
  getAllAcademicSubperiods() {
    const academicPeriodID = this.selectedAcademicPeriod().id;
    
    this.academicSubperiodsService.getAcademicSubperiods({ academic_period: academicPeriodID }).subscribe({
      next: (subperiods: any) => {
        this.allAcademicSubperiodsSignal.set(subperiods.data || []);
      },
      complete: () => {
        console.info('📅 All academic subperiods (of the selected academic period):', this.allAcademicSubperiods());
      },
      error: (err) => {
        console.error(err);
      }
    });
  }
  
  getCurrentAcademicSubperiod() {
    this.academicSubperiodsService.getAcademicSubperiodsCurrent().subscribe({
      next: (subperiod: any) => {
        this.currentAcademicSubperiodSignal.set(subperiod.data || {});
      },
      complete: () => {
        console.info('📅 Current academic subperiod (of the selected academic period):', this.currentAcademicSubperiod());
      },
      error: (err) => {
        console.error(err);
      }
    });
  }
  
  // changeAcademicPeriod(academicPeriod: AcademicPeriod) {
  //   this.selectedAcademicPeriodSignal.set(academicPeriod);
  //   console.info('📅 Selected academic period (by user):', this.selectedAcademicPeriod());
  // }
  
  // chageAcademicSubperiods(academicSubperiods: AcademicSubperiod[]) {
  //   this.selectedAcademicSubperiodsSignal.set(academicSubperiods);
  //   console.info('📅 Selected academic subperiods (by user):', this.selectedAcademicSubperiods());
  // }
}
