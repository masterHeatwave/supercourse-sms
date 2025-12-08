import { Component, inject, Input, OnInit, SimpleChanges } from '@angular/core';
import { Chart, ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { AnalyticsService } from '../../services/analytics-service';
//import { ClassesService } from '../../services/classes.service';
//import { UsersService } from '../../services/users.service';
import { TaxisService } from '@gen-api/taxis/taxis.service';
import { Store } from '@ngrx/store';
import { selectAuthState } from '@store/auth/auth.selectors';
import { UsersService } from '@gen-api/users/users.service';
import { forkJoin } from 'rxjs';
import { LoadingComponent } from '@pages/dashboard/resources/custom-activities/components/loading/loading.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-school-analytics',
  standalone: true,
  imports: [BaseChartDirective, LoadingComponent, TranslateModule],
  templateUrl: './school-analytics.component.html',
  styleUrl: './school-analytics.component.scss'
})
export class SchoolAnalyticsComponent implements OnInit {
  @Input() user: any = {};
  @Input() authHeader: string = '';
  @Input() percentage: number = 80;
  classes = [{}];
  isLoading: boolean = false;

  store = inject(Store);
  currentSchoolSlug: string = '';
  currentSchoolID: string = '';
  currentBranchID: string = '';
  currentRoleTitle: string = '';
  currentUserID: string = '';

  userStats = {
    activeStudents: 0,
    activeStaffMembers: 0,
    activeClasses: 0,
    activeParents: 0
  };

  teachingStats = {
    studentsPerTeacher: 0,
    teachingHoursPerClass: 0,
    teachingHoursPerTeacher: 0,
    weeklySessions: 0
  };

  schoolPerformance = {
    feesCollected: 0,
    attendance: 0,
    completedSessions: 0
  };

  ngOnChanges(changes: SimpleChanges) {
    /*if ((changes['user'] || changes['authHeader']) && this.user && this.authHeader) {
      this.classesService.getClasses(this.authHeader, this.user.branches[0]).subscribe({
        next: (response: any) => {
          var sum: number = 0;
          var teachers: number = 0;
          var sumMinutes: number = 0;
          var sumTeachers: number = 0;
          var sumStudents: number = 0;
          this.userStats.activeClasses = response.count;
          this.classes = response.data;
          //console.log('classes', this.classes);
          this.teachingStats.studentsPerTeacher = 0;
          this.teachingStats.teachingHoursPerClass = 0;
          this.teachingStats.weeklySessions = 0;
          this.classes.forEach((element: any) => {
            this.teachingStats.studentsPerTeacher +=
              element.studentCount * (element.users.length - element.studentCount > 0 ? element.users.length - element.studentCount : 1);
            this.teachingStats.teachingHoursPerClass += element.sessionStats.totalDurationMinutes;
            this.teachingStats.weeklySessions += element.sessionStats.sessionsPerWeek;
            teachers = element.users.length - element.studentCount;
            if (teachers === 0) {
              teachers = 1;
            }
            sumTeachers += teachers;
            sum = element.sessionStats.totalDurationMinutes / (teachers > 0 ? teachers : 1);
            sumMinutes += sum;
            sumStudents += element.studentCount;

            this.classesService.getAbsencesReport(this.authHeader, element._id).subscribe({
              next: (response: any) => {
                //console.log('response', response.data);
              },
              error: (err) => {
                console.log('Failed to fetch absences', err);
              }
            });
          });
          //console.log('sumTeachers', sumTeachers);
          //console.log('sumStudents', sumStudents);
          //console.log('this.teachingStats.studentsPerTeacher', this.teachingStats.studentsPerTeacher);
          this.teachingStats.studentsPerTeacher = parseFloat((this.teachingStats.studentsPerTeacher / sumTeachers).toFixed(1)); //this.classes.length;

          this.teachingStats.teachingHoursPerClass = parseFloat((this.teachingStats.teachingHoursPerClass / this.classes.length).toFixed(1));
          this.teachingStats.teachingHoursPerClass = parseFloat((this.teachingStats.teachingHoursPerClass / 60).toFixed(1));
          this.teachingStats.teachingHoursPerTeacher = parseFloat((sumMinutes / sumTeachers / 60).toFixed(1));
        },
        error: (err) => console.error('Failed to fetch classes:', err)
      });

      this.usersService.getStudents(this.authHeader).subscribe({
        next: (response) => (this.userStats.activeStudents = response.data.results.length),
        error: (err) => console.error('Failed to fetch students:', err)
      });

      this.usersService.getStaff(this.authHeader).subscribe({
        next: (response) => (this.userStats.activeStaffMembers = response.data.results.length),
        error: (err) => console.error('Failed to fetch staff:', err)
      });
    }*/
    //console.log(this.user);
  }

  constructor(
    private analyticsService: AnalyticsService,
    //private classesService: ClassesService,
    private taxisService: TaxisService,
    private usersService: UsersService
  ) {}

  ngOnInit() {
    this.doughnutChartData = {
      labels: [],
      datasets: [
        {
          data: [this.percentage, 100 - this.percentage],
          backgroundColor: ['#2f8bbe', 'lightgray'],
          borderWidth: 0
        }
      ]
    };

    this.store.select(selectAuthState).subscribe((authState: any) => {
      this.currentSchoolSlug = authState.customerContext || '';
      this.currentSchoolID = authState.parentCurrentCustomerId || authState.user?.customers[0] || '';
      this.currentBranchID = authState.currentCustomerId || authState.user?.branches[0] || '';
      this.currentRoleTitle = authState.currentRoleTitle || authState.user?.roles[0].title || '';
      this.currentUserID = authState.user?.id || '';

      this.user = authState.user;
      this.isLoading = true;

      forkJoin({
        students: this.usersService.getUsersStudents({ branch: this.currentBranchID }),
        taxis: this.taxisService.getTaxis({ branch: this.currentBranchID }),
        staff: this.usersService.getUsersStaff({ branch: this.currentBranchID })
      }).subscribe({
        next: ({ students, taxis, staff }) => {
          this.userStats.activeStudents = students.data.results.length;
          this.userStats.activeClasses = taxis.count;
          this.userStats.activeStaffMembers = staff.data.results.length;
          this.userStats.activeParents = 0; //?

          let studentSum: number = 0;
          let teacherSum: number = 0;
          let studentsObj: any[] = [];
          let sumTeachers = 0;
          let sum = 0;
          let sumMinutes = 0;
          taxis.data.forEach((taxi: any) => {
            //this.teachingStats.studentsPerTeacher +=
            //taxi.studentCount * (taxi.users.length - taxi.studentCount > 0 ? taxi.users.length - taxi.studentCount : 1);
            studentsObj.push(...taxi.students);
            studentSum += taxi.studentCount;
            teacherSum += taxi.teacherCount || 1;
            this.teachingStats.teachingHoursPerClass += Number((taxi.sessionStats.totalDurationMinutes / 60 / taxis.count).toFixed(2));
            this.teachingStats.weeklySessions += taxi.sessionStats.sessionsPerWeek;

            let teachers = taxi.users.length - taxi.studentCount;
            if (teachers === 0) {
              teachers = 1;
            }
            sumTeachers += teachers;
            sum = taxi.sessionStats.totalDurationMinutes / (teachers > 0 ? teachers : 1);
            sumMinutes += sum;
            //sumStudents += element.studentCount;
          });

          const uniqueStudents = studentsObj.filter(
            (student, index, self) => student._id !== undefined && student._id !== null && index === self.findIndex((s) => s._id === student._id)
          );

          this.teachingStats.studentsPerTeacher = Number((studentSum / teacherSum).toFixed(2));
          this.teachingStats.teachingHoursPerTeacher = Number((sumMinutes / sumTeachers / 60).toFixed(2));
          //this.teachingStats.studentsPerTeacher = Number((this.teachingStats.studentsPerTeacher / sumTeachers).toFixed(2));
          console.log(uniqueStudents);
          console.log(taxis);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error fetching dashboard stats:', err);
        }
      });
    });
    /*this.analyticsService.getSchoolAnalytics().subscribe(data => {
      //console.log(data.obj);
      this.userStats = data.obj.userStats;
      //this.teachingStats = data.obj.teachingStats;
      this.schoolPerformance = data.obj.schoolPerformance
      //console.log(this.userStats);
    });*/
  }

  public doughnutChartData!: ChartConfiguration<'doughnut'>['data'];

  public doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    cutout: '40',
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: false
      },
      datalabels: {
        display: false
      }
    }
  };

  centerTextPlugin = {
    id: 'centerTextPlugin',
    beforeDraw: (chart: Chart) => {
      const { width } = chart;
      const { height } = chart;
      const ctx = chart.ctx;
      const txt = this.percentage;

      ctx.save();
      ctx.font = 'bold 28px Roboto, "Helvetica Neue", sans-serif';
      ctx.fillStyle = '#2f8bbe';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(txt + '%', width / 2, height / 2);
      ctx.restore();
    }
  };

  chartPlugins = [this.centerTextPlugin];
}
