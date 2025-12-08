import { Component, effect, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { AssignmentsForStaffService } from '@gen-api/assignments-for-staff/assignments-for-staff.service';
import { GetAssignmentsStaff200 } from '@gen-api/schemas/getAssignmentsStaff200';
import { GetAssignmentsStaffStaffRole } from '@gen-api/schemas/getAssignmentsStaffStaffRole';

import { AcademicTimeframeService } from '@services/assignments/academic-timeframe.service';
import { UserDataService } from '@services/assignments/user-data.service';

import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-list-staff',
  standalone: true,
  imports: [TableModule, DatePipe, TranslateModule],
  templateUrl: './list-staff.component.html',
  styleUrl: './list-staff.component.scss'
})

export class ListStaffComponent implements OnInit {
  assignmentsForStaffService = inject(AssignmentsForStaffService);
  academicTimeframeService = inject(AcademicTimeframeService);
  userDataService = inject(UserDataService);

  assignmentsForStaff: GetAssignmentsStaff200 = {} as GetAssignmentsStaff200;
  
  constructor() {
    effect(() => {
      const branchID = this.userDataService.currentBranchID();
      const roleTitle = this.userDataService.currentRoleTitle();
      const userID = this.userDataService.currentUserID();
      const academicYearID = this.academicTimeframeService.academicYear().id;
      const academicPeriodID = this.academicTimeframeService.currentAcademicPeriod().id;
      const academicSubperiodIDs = this.academicTimeframeService.allAcademicSubperiods().map(subperiod => subperiod.id);
      const academicSubperiodIDsString = academicSubperiodIDs.length === 1 ? academicSubperiodIDs[0] : academicSubperiodIDs.join(',');
      
      if (branchID && roleTitle && academicYearID) {
        this.assignmentsForStaffService.getAssignmentsStaff({
          branchID,
          staffRole: roleTitle.toLowerCase() as GetAssignmentsStaffStaffRole,
          staffID: userID,
          academicYearID,
          academicPeriodID: academicPeriodID || undefined,
          academicSubperiodID: academicSubperiodIDsString
        }).subscribe({
          next: (data: GetAssignmentsStaff200) => {
            this.assignmentsForStaff = data;
          },
          complete: () => {
            console.info('✅ Assignments for Staff loaded:', this.assignmentsForStaff);
            
            this.assignmentsForStaff.data?.sort((a, b) => {
              const dateA = new Date(a.updatedAt || 0).getTime();
              const dateB = new Date(b.updatedAt || 0).getTime();
              return dateB - dateA;
            });
          },
          error: (err) => {
            console.error(err);
          }
        });
      }
    });
  }
  
  ngOnInit() {
    
  }
}
