import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputSwitchModule } from 'primeng/inputswitch';
import { TableModule } from 'primeng/table';
import { AccordionModule } from 'primeng/accordion';
//import { ActivityDataService } from '../../services/activity-data.service';
//import { TokenService } from '../../services/token.service';
//import { Router, RouterModule } from '@angular/router';
//import { LoginService } from '../../services/login.service';
import { DataService } from '../../services/data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectAuthState } from '@store/auth/auth.selectors';
import { CustomActivitiesService } from '@gen-api/custom-activities/custom-activities.service';
import { CustomerService } from '@services/customer.service';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { OverlayModule } from 'primeng/overlay';
import { CheckboxModule } from 'primeng/checkbox';
import { LoadingComponent } from '../../components/loading/loading.component';
import { InfoDialogComponent } from '@components/dialogs/info-dialog/info-dialog.component';
import { WarningDialogComponent } from '@components/dialogs/warning-dialog/warning-dialog.component';
import { TranslateModule } from '@ngx-translate/core';
import { LaunchStudentViewComponent } from '../launch-student-view/launch-student-view.component';
import { LaunchTeacherViewComponent } from '../launch-teacher-view/launch-teacher-view.component';
import { SolvedViewComponent } from '../solved-view/solved-view.component';
//import { LocalStorageService } from '../../services/local-storage.service';

@Component({
  selector: 'custom-activity',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    InputSwitchModule,
    FormsModule,
    CardModule,
    //RouterModule,
    AccordionModule,
    OverlayModule,
    OverlayPanelModule,
    CheckboxModule,
    LoadingComponent,
    WarningDialogComponent,
    InfoDialogComponent,
    TranslateModule,
    LaunchStudentViewComponent,
    SolvedViewComponent
  ],
  templateUrl: './custom-activity.component.html',
  styleUrl: './custom-activity.component.scss'
})
export class CustomActivityComponent {
  privateCustomActivities: any = [];

  publicCustomActivities: any = [];

  studentActivities: any = [];
  assignments: any = [];

  userId: string = '';
  userType: string = '';
  user: any = {};

  view: string = 'table';

  store = inject(Store);

  currentSchoolSlug: string = '';
  currentSchoolID: string = '';
  currentBranchID: string = '';
  currentRoleTitle: string = '';
  currentUserID: string = '';
  //branches: [] = [];
  //buttons = [{ id: '1', label: '' }];
  //selectedActivityId: string = '';
  //@ViewChild('op') op!: OverlayPanel;
  isLoading: boolean = false;
  isWarningDialogVisible: boolean = false;
  warningMessage: string = '';
  isInfoDialogVisible: boolean = false;
  infoMessage: string = '';
  active: boolean = false;
  activityId: string = '';

  constructor(
    private dataService: DataService,
    private router: Router,
    private route: ActivatedRoute,
    private customActivityService: CustomActivitiesService,
    private branchesService: CustomerService
  ) {
  }

  ngOnInit() {
    this.store.select(selectAuthState).subscribe((authState: any) => {
      this.currentSchoolSlug = authState.customerContext || '';
      this.currentSchoolID = authState.parentCurrentCustomerId || authState.user?.customers[0] || '';
      this.currentBranchID = authState.currentCustomerId || authState.user?.branches[0] || '';
      this.currentRoleTitle = authState.currentRoleTitle || authState.user?.roles[0].title || '';
      this.currentUserID = authState.user?.id || '';
      this.user = authState.user;
      this.isLoading = true;
      /*this.branchesService.getCurrentUserCustomers().subscribe({
        next: (response: any) => {
          this.branches = response.filter((branch: any) => branch.is_main_customer === false);
          this.branches.forEach((branch: any, i) => {
            this.buttons[i] = { label: '', id: (i + 1).toString() };
            this.buttons[i].label = branch.name;
            this.buttons[i].id = branch.id;
          });
          console.log(this.buttons);
        }
      });*/

      this.dataService.setData('userId', this.currentUserID);
      if (this.currentRoleTitle.toLocaleLowerCase() !== 'student') {
        this.customActivityService.getCustomActivitiesUserUserId(this.currentUserID).subscribe({
          next: (response: any) => {
            this.privateCustomActivities = response.data;
          },
          error: (err) => {
            console.log(err.error.data.error.message);
          }
        });
        this.customActivityService.getCustomActivitiesPublicActivitiesUserId(this.currentUserID).subscribe({
          next: (response) => {
            this.publicCustomActivities = response.data;
          },
          error: (err) => {
            console.log(err.error.data.error.message);
          }
        });
      } else {
        this.customActivityService.getCustomActivitiesStudentActivitiesUserUserId(this.currentUserID).subscribe({
          next: (response: any) => {
            this.studentActivities = response.data;
            this.studentActivities = response.data.filter((activity: any) =>
              activity.students.some((student: any) => student.studentId === this.currentUserID && student.completed === true)
            );

            console.log(this.studentActivities);
          },
          error: (err) => {
            console.log(err.error.data.error.message);
          }
        });
      }
      this.isLoading = false;
    });
  }

  showOverlay(event: Event, activityId: string) {
    //this.selectedActivityId = activityId;
    //this.op.toggle(event);
  }

  buttonClicked(branchId: string, op: OverlayPanel, activityId: string) {
    /*this.isLoading = true;
    this.customActivityService.postCustomActivitiesDuplicateActivityId(activityId).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.infoMessage = 'Copy was successful.';
        this.isInfoDialogVisible = true;
        if (branchId === this.currentBranchID) {
          this.privateCustomActivities.push(response.data);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.warningMessage = err.error.data.error.message;
        this.isWarningDialogVisible = true;
        console.log(err);
      }
    });
    op.hide();*/
  }

  toggleView(event: MouseEvent) {
    if (this.view === 'tiles') {
      this.view = 'table';
    } else {
      this.view = 'tiles';
    }
  }

  onCreateClick(event: MouseEvent, userId: string) {
    this.router.navigate(['create'], {
      relativeTo: this.route
    });
  }

  duplicateActivity(id: string) {
    this.isLoading = true;
    this.customActivityService.postCustomActivitiesDuplicateActivityId(id).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        //this.infoMessage = 'Copy was successful.';
        //this.isInfoDialogVisible = true;
        this.privateCustomActivities.push(response.data);
      },
      error: (err) => {
        this.isLoading = false;
        this.warningMessage = err.error.data.error.message;
        this.isWarningDialogVisible = true;
        console.log(err);
      }
    });
  }

  duplicatePublicActivity(id: string) {
    this.isLoading = true;
    this.customActivityService.postCustomActivitiesDuplicatePublicActivityIdUserUserId(id, this.currentUserID).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.privateCustomActivities.push(response.data);
      },
      error: (err) => {
        this.isLoading = false;
        this.warningMessage = err.error.data.error.message;
        this.isWarningDialogVisible = true;
        console.log(err);
      }
    });
  }

  editActivity(id: string) {
    this.router.navigate(['edit', id], {
      relativeTo: this.route
    });
  }

  launchActivity(id: string) {
    let route = '';
    if (this.currentRoleTitle === 'STUDENT') {
      this.activityId = id;
      console.log('Launging activity:', this.activityId);
      this.active = true;
    } else {
      route = 'teacher';
      this.router.navigate(['launch/' + route, id], {
        relativeTo: this.route
      });
    }
  }

  deleteActivity(id: string) {
    this.isLoading = true;
    this.customActivityService.deleteCustomActivitiesActivityId(id).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.privateCustomActivities = this.privateCustomActivities.filter((activity: any) => activity.id !== id);
      },
      error: (err) => {
        this.isLoading = false;
        this.warningMessage = err.error.data.error.message;
        this.isWarningDialogVisible = true;
        console.log(err);
      }
    });
  }
}
