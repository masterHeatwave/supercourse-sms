import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { SchoolAnalyticsComponent } from '../../components/school-analytics/school-analytics.component';
import { PlatformUseAnalyticsComponent } from '../../components/platform-use-analytics/platform-use-analytics.component';
import { LearningAnalyticsComponent } from '../../components/learning-analytics/learning-analytics.component';
//import { TokenService } from '../../services/token.service';
import { ClassesComponent } from '../../components/teacher/classes/classes.component';
import { EngagementComponent } from '../../components/teacher/engagement/engagement.component';
import { MyActivityComponent } from '../../components/teacher/my-activity/my-activity.component';
//import { LoginService } from '../../services/login.service';
import { Subscription, switchMap } from 'rxjs';
//import { UsersService } from '../../services/users.service';
//import { SocketService } from '../../services/socket.service';

import { Store } from '@ngrx/store';
import { selectAuthState } from '@store/auth/auth.selectors';
import { TaxisService } from '@gen-api/taxis/taxis.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'main-view',
  standalone: true,
  imports: [
    ButtonModule,
    CommonModule,
    SchoolAnalyticsComponent,
    PlatformUseAnalyticsComponent,
    LearningAnalyticsComponent,
    ClassesComponent,
    EngagementComponent,
    MyActivityComponent,
    TranslateModule
  ],
  templateUrl: './main-view.component.html',
  styleUrl: './main-view.component.scss'
})
export class AnalyticsMainViewComponent {
  store = inject(Store);
  currentSchoolSlug: string = '';
  currentSchoolID: string = '';
  currentBranchID: string = '';
  currentRoleTitle: string = '';
  currentUserID: string = '';

  onlineCounts = {
    admin: 0,
    manager: 0,
    teacher: 0,
    student: 0,
    parent: 0
  };

  isSelected: boolean = false;
  authHeader: string = '';
  user: any = {
    user_type: ''
  };
  students: any = [];
  staff: any = [];
  parents: any = [];

  selectedButton: string = 'school';
  private sub!: Subscription;

  constructor(private taxisService: TaxisService) {
    //private socketService: SocketService){
    //this.loginService.login().subscribe({
    //next: (response) => {
    //this.authHeader = response.data.authHeader;
    //console.log(response.data);
    //this.user = response.data.user;
    //this.user.user_type = 'teacher';
    //if (this.user.user_type === 'admin') {
    //this.selectedButton = 'school';
    //} else {
    //if (this.user.user_type === 'teacher') {
    //this.selectedButton = 'classes';
    //}
    //}
    //this.sub = this.socketService.on<any>('onlineUsers').subscribe((counts) => {
    //this.onlineCounts = counts;
    //console.log('online counts:', this.onlineCounts);
    //});
    //console.log(this.user);
    //this.socketService.emit('setRole', this.user.user_type, this.user.id);
    /*this.usersService.getStudents(this.authHeader).subscribe((response) => {
          this.students = response.data.results;
          console.log(this.students.length);
        });
        this.usersService.getStaff(this.authHeader).subscribe((response) => {
          this.staff = response.data.results;
          console.log(this.staff.length);
        });*/
    //console.log(this.user.branches[0])
    /*this.usersService.getParents(this.authHeader).subscribe((response) => {
          this.parents = response.data.results;
          console.log(this.parents.length);
        });*/
    //},
    //error: (err) => {
    //console.error('Fail:', err);
    //}
    //});
  }

  ngOnInit() {
    this.store.select(selectAuthState).subscribe((authState: any) => {
      this.currentSchoolSlug = authState.customerContext || '';
      this.currentSchoolID = authState.parentCurrentCustomerId || authState.user?.customers[0] || '';
      this.currentBranchID = authState.currentCustomerId || authState.user?.branches[0] || '';
      this.currentRoleTitle = authState.currentRoleTitle || authState.user?.roles[0].title || '';
      this.currentUserID = authState.user?.id || '';

      this.user = authState.user;

      //console.log(this.currentRoleTitle.toLocaleLowerCase());

      if (this.currentRoleTitle.toLocaleLowerCase() !== 'teacher') {
        this.selectedButton = 'school';
      } else {
        if (this.currentRoleTitle.toLocaleLowerCase() === 'teacher') {
          this.selectedButton = 'classes';
        }
      }
      /*if (this.user.user_type !== 'teacher') {
        this.selectedButton = 'school';
      } else {
        if (this.user.user_type === 'teacher') {
          this.selectedButton = 'classes';
        }
      }*/
    });
  }

  select(button: string) {
    this.selectedButton = button;
    console.log(this.selectedButton);
  }
}
