import { Component, effect, inject, OnInit } from '@angular/core';

import { UserDataService } from '@services/assignments/user-data.service';

import { ToolbarStaffComponent } from '@components/assignments/toolbar-staff/toolbar-staff.component';
import { ToolbarStudentComponent } from '@components/assignments/toolbar-student/toolbar-student.component';
import { ToolbarParentComponent } from '@components/assignments/toolbar-parent/toolbar-parent.component';
import { ListStaffComponent } from '@components/assignments/list-staff/list-staff.component';

@Component({
  selector: 'app-view-all-assignments',
  standalone: true,
  imports: [
    ToolbarStaffComponent,
    ToolbarStudentComponent,
    ToolbarParentComponent,
    ListStaffComponent
  ],
  templateUrl: './view-all-assignments.component.html',
  styleUrl: './view-all-assignments.component.scss'
})

export class ViewAllAssignmentsComponent implements OnInit {
  userDataService = inject(UserDataService);
  
  currentSchoolSlug: string = '';
  currentSchoolID: string = '';
  currentBranchID: string = '';
  currentRoleTitle: string = '';
  currentUserID: string = '';
  
  constructor() {
    effect(() => {
      this.currentSchoolSlug = this.userDataService.currentSchoolSlug();
      this.currentSchoolID = this.userDataService.currentSchoolID();
      this.currentBranchID = this.userDataService.currentBranchID();
      this.currentRoleTitle = this.userDataService.currentRoleTitle();
      this.currentUserID = this.userDataService.currentUserID();
    });
  }
  
  ngOnInit() {
    
  }
}
