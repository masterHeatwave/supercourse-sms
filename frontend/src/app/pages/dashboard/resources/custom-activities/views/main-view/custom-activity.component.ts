import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
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
    AccordionModule
  ],
  templateUrl: './custom-activity.component.html',
  styleUrl: './custom-activity.component.scss'
})
export class CustomActivityComponent {
  privateCustomActivities: any = [];

  publicCustomActivities: any = [];

  studentActivities: any = [];

  userId: string = '';
  userType: string = '';
  user: any = {};

  view: string = 'table';

  store = inject(Store);
  customActivityService = inject(CustomActivitiesService);

  currentSchoolSlug: string = '';
  currentSchoolID: string = '';
  currentBranchID: string = '';
  currentRoleTitle: string = '';
  currentUserID: string = '';

  constructor(
    private dataService: DataService,
    private router: Router,
    private route: ActivatedRoute,
    // private customActivityService: CustomActivitiesService
  ) {}

  ngOnInit() {
    this.store.select(selectAuthState).subscribe((authState: any) => {
      this.currentSchoolSlug = authState.customerContext || '';
      this.currentSchoolID = authState.parentCurrentCustomerId || authState.user?.customers[0] || '';
      this.currentBranchID = authState.currentCustomerId || authState.user?.branches[0] || '';
      this.currentRoleTitle = authState.currentRoleTitle || authState.user?.roles[0].title || '';
      this.currentUserID = authState.user?.id || '';
      this.user = authState.user;
      this.userType = authState.user.user_type;
    });
    this.dataService.setData('userId', this.currentUserID);
    if (this.user.user_type !== 'student') {
      this.customActivityService.getCustomActivitiesUserUserId(this.currentUserID).subscribe({
        next: (response: any) => {
          this.privateCustomActivities = response.data;
          this.customActivityService.getCustomActivitiesPublicActivitiesUserId(this.currentUserID).subscribe({
            next: (response) => {
              //console.log(response);
              this.publicCustomActivities = response.data;
            },
            error: (err) => {
              console.log(err.error);
            }
          });
          //this.user = response.data.userId;
          //console.log('response.data', response.data);
        },
        error: (err) => {
          console.log(err.error);
        }
      });
    } else {
      this.customActivityService.getCustomActivitiesStudentActivitiesUserUserId(this.currentUserID).subscribe({
        next: (response) => {
          this.studentActivities = response.data;
        },
        error: (err) => {
          console.log(err.error);
        }
      });
    }
  }

  onTileClick(event: MouseEvent) {
    this.view = 'tiles';
  }

  onTableClick(event: MouseEvent) {
    this.view = 'table';
  }

  onCreateClick(event: MouseEvent, userId: string) {
    //console.log('Clicked');
    //console.log('userId = ', userId);
    this.router.navigate(
      ['create'],
      {
        relativeTo: this.route
      }
      //{ queryParams: { userId } }
    );
  }

  duplicateActivity(id: string) {
    //console.log('duplicating1', id);
    this.customActivityService.postCustomActivitiesDuplicateActivityId(id).subscribe({
      next: (response: any) => {
        //console.log(response);
        this.privateCustomActivities.push(response.data);
      },
      error: (err) => {
        console.log(err);
      }
    });
  }

  duplicatePublicActivity(id: string) {
    //console.log('duplicating2', id);
    this.customActivityService.postCustomActivitiesDuplicatePublicActivityIdUserUserId(id, this.currentUserID).subscribe({
      next: (response: any) => {
        //console.log(response);
        this.privateCustomActivities.push(response.data);
      },
      error: (err) => {
        console.log(err);
      }
    });
  }

  editActivity(id: string) {
    //console.log('id', id);
    //this.router.navigate(['edit', id]);
    this.router.navigate(
      ['edit', id],
      {
        relativeTo: this.route
      }
      //{ queryParams: { userId } }
    );
  }

  launchActivity(id: string) {
    //this.router.navigate(['/resources/custom-activities/launch/' + this.userType, id]);
    this.router.navigate(['launch/teacher', id], {
      relativeTo: this.route
    });
  }

  deleteActivity(id: string) {
    this.customActivityService.deleteCustomActivitiesActivityId(id).subscribe({
      next: (response) => {
        this.privateCustomActivities = this.privateCustomActivities.filter((activity: any) => activity.id !== id);
      },
      error: (err) => {
        console.log(err);
      }
    });
  }
}
