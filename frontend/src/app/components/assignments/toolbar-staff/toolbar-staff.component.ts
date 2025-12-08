import { Component, inject, OnInit, effect } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToolbarModule } from 'primeng/toolbar';

import { AcademicTimeframeService } from '@services/assignments/academic-timeframe.service';

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

@Component({
  selector: 'assignment-toolbar-staff',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, FormsModule, TranslateModule, ButtonModule, DropdownModule, MultiSelectModule, ToolbarModule],
  templateUrl: './toolbar-staff.component.html',
  styleUrl: './toolbar-staff.component.scss'
})

export class ToolbarStaffComponent implements OnInit {
  academicTimeframeService = inject(AcademicTimeframeService);
  
  allAcademicPeriods: AcademicPeriod[] = [];
  allAcademicSubperiods: AcademicSubperiod[] = [];
  
  selectedAcademicPeriod: AcademicPeriod = {} as AcademicPeriod;
  selectedAcademicSubperiods: AcademicSubperiod[] = [];

  constructor() {
    effect(() => {
      this.allAcademicPeriods = this.academicTimeframeService.allAcademicPeriods();
      this.allAcademicSubperiods = this.academicTimeframeService.allAcademicSubperiods();
      
      this.selectedAcademicPeriod = this.academicTimeframeService.selectedAcademicPeriod();
      this.selectedAcademicSubperiods = this.academicTimeframeService.selectedAcademicSubperiods();
    });
  }

  ngOnInit() {
    
  }

  onAcademicPeriodChange() {
    // this.academicTimeframeService.changeAcademicPeriod(this.selectedAcademicPeriod);
    // this.academicTimeframeService.chageAcademicSubperiods([]);
    // this.selectedAcademicSubperiods = [];
  }
  
  onAcademicSubperiodsChange() {
    // this.academicTimeframeService.chageAcademicSubperiods(this.selectedAcademicSubperiods);
  }
}
