import { Component, inject, Input, SimpleChanges } from '@angular/core';
import { AnalyticsService } from '../../../services/analytics-service';
import { CalendarComponent } from '../../calendar/calendar.component';
//import { ClassesService } from '../../../services/classes.service';
//import { UsersService } from '../../../services/users.service';
import { TaxisService } from '@gen-api/taxis/taxis.service';
import { selectAuthState } from '@store/auth/auth.selectors';
import { Store } from '@ngrx/store';
import { SessionsService } from '@gen-api/sessions/sessions.service';
import { AbsencesService } from '@gen-api/absences/absences.service';
import { UsersService } from '@gen-api/users/users.service';
import { forkJoin, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { LoadingComponent } from '@pages/dashboard/resources/custom-activities/components/loading/loading.component';
import { AssignmentsForStaffService } from '@gen-api/assignments-for-staff/assignments-for-staff.service';
import { AcademicService } from '@services/academic.service';
import { AssignmentsForStudentsService } from '@gen-api/assignments-for-students/assignments-for-students.service';
import { TranslateModule } from '@ngx-translate/core';
//import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-classes',
  standalone: true,
  imports: [CalendarComponent, LoadingComponent, TranslateModule],
  templateUrl: './classes.component.html',
  styleUrl: './classes.component.scss'
})
export class ClassesComponent {
  @Input() user: any = {};
  @Input() authHeader: string = '';
  classes = [{}];
  isLoading: boolean = false;
  currentSchoolSlug: string = '';
  currentSchoolID: string = '';
  currentBranchID: string = '';
  currentRoleTitle: 'admin' | 'teacher' | 'manager' = 'admin';
  currentUserID: string = '';
  currentAcademicYearId: string = '';
  store = inject(Store);
  private destroy$ = new Subject<void>();

  classesOverview = {
    activeClasses: 0,
    activeStudents: 0,
    activeParents: 0
  };

  teachingStats = {
    studentsPerClass: 0,
    teachingHoursPerClass: 0,
    teachingHours: 0,
    weeklySessions: 0
  };

  classPerformance = {
    assignmentCompletion: 0,
    overallAchievement: 0,
    rewardsPerClass: 0
  };

  overAllAssignments: number = 0;
  completedAssignments: number = 0;
  uniqueStudents: any[] = [];
  taxisWithUser: any;

  constructor(
    private taxisService: TaxisService,
    private usersService: UsersService,
    private sessionsService: SessionsService,
    private absenceService: AbsencesService,
    private assignmentService: AssignmentsForStaffService,
    private studentAssignmentService: AssignmentsForStudentsService,
    private academicTimeFrameService: AcademicService
  ) {
    //private analyticsService: AnalyticsService, private classesService: ClassesService, private usersService: UsersService) {
    /*this.analyticsService.getClassesAnalytics().subscribe(data => {
      this.classesOverview = data.obj.classesOverview;
      this.teachingStats = data.obj.teachingStats;
      this.classPerformance = data.obj.classPerformance;
    });*/
  }

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['user'] || changes['authHeader']) && this.user && this.authHeader) {
      /*this.classesService.getClasses(this.authHeader, this.user.branches[0]).subscribe({
        next: (response) => {
          var sum: number = 0;
          var teachers: number = 0;
          var sumMinutes: number = 0;
          var sumTeachers: number = 0;
          var sumStudents: number = 0;
          this.classesOverview.activeClasses = response.count;
          this.classes = response.data;
          //this.teachingStats.studentsPerTeacher = 0;
          this.teachingStats.teachingHoursPerClass = 0;
          this.teachingStats.weeklySessions = 0;
          this.classes.forEach((element: any) => {
            //this.teachingStats.studentsPerTeacher += element.studentCount;
            this.teachingStats.teachingHoursPerClass += element.sessionStats.totalDurationMinutes;
            this.teachingStats.weeklySessions += element.sessionStats.sessionsPerWeek;
            this.teachingStats.studentsPerClass += element.studentCount;
            //teachers = element.users.length - element.studentCount;
            //if(teachers === 0){
            //teachers = 1;
            //}
            //sumTeachers += teachers;
            //sum = (element.sessionStats.totalDurationMinutes / ( teachers > 0 ? teachers : 1));
            //sumMinutes += sum;
            //sumStudents += element.studentCount;
            this.teachingStats.teachingHours += element.sessionStats.totalDurationMinutes;
          });
          console.log(this.classes);
          //this.teachingStats.studentsPerTeacher = this.teachingStats.studentsPerTeacher / this.classes.length;

          this.teachingStats.teachingHoursPerClass = parseFloat((this.teachingStats.teachingHoursPerClass / this.classes.length).toFixed(1));
          this.teachingStats.teachingHoursPerClass = parseFloat((this.teachingStats.teachingHoursPerClass / 60).toFixed(1));

          this.teachingStats.studentsPerClass = this.teachingStats.studentsPerClass / this.classes.length;
          this.teachingStats.teachingHours = parseFloat((this.teachingStats.teachingHours / 60).toFixed(1));
          //this.teachingStats.teachingHoursPerTeacher = parseFloat((sumMinutes / sumTeachers / 60).toFixed(1));
        },
        error: (err) => console.error('Failed to fetch classes:', err)
      });

      this.usersService.getStudents(this.authHeader).subscribe({
        next: (response) => (this.classesOverview.activeStudents = response.data.results.length),
        error: (err) => console.error('Failed to fetch students:', err)
      });

      this.usersService.getStaff(this.authHeader).subscribe({
        next: (response) => (this.classesOverview.activeStudents = response.data.results.length),
        error: (err) => console.error('Failed to fetch staff:', err)
      });
    }*/
      //console.log(this.user);
    }
  }

  ngOnInit() {
    this.isLoading = true;
    this.store.select(selectAuthState).subscribe((authState: any) => {
      this.currentSchoolSlug = authState.customerContext || '';
      this.currentSchoolID = authState.parentCurrentCustomerId || authState.user?.customers[0] || '';
      this.currentBranchID = authState.currentCustomerId || authState.user?.branches[0] || '';
      this.currentRoleTitle = authState.currentRoleTitle || authState.user?.roles[0].title || '';
      this.currentUserID = authState.user?.id || '';

      this.user = authState.user;
      this.academicTimeFrameService
        .getCurrentAcademicYear()
        .pipe(
          takeUntil(this.destroy$),
          tap((response) => {
            if (!response?.id) throw new Error('Missing academic year ID');
            this.currentAcademicYearId = response.id;
          }),
          switchMap(() =>
            forkJoin({
              taxis: this.taxisService.getTaxis({ branch: this.currentBranchID }),
              students: this.usersService.getUsersStudents({ branch: this.currentBranchID }),
              sessions: this.sessionsService.getSessions({ branch: this.currentBranchID, limit: '1000' }),
              absences: this.absenceService.getAbsences(),
              assignments: this.assignmentService.getAssignmentsStaff({
                academicYearID: this.currentAcademicYearId,
                branchID: this.currentBranchID,
                staffRole: this.currentRoleTitle
              })
            })
          ),
          tap(({ taxis, assignments, students }) => {
            this.taxisWithUser = taxis.data.filter((taxi: any) => taxi.users?.some((u: any) => u._id === this.user.id));
            this.classesOverview.activeStudents = students.data.results.length;

            this.uniqueStudents = [];
            assignments.data.forEach((a) => {
              this.uniqueStudents.push(...(a.studentsIDs ?? []));
            });
            this.uniqueStudents = Array.from(new Map(this.uniqueStudents.map((s) => [s.id, s])).values());
          }),
          switchMap(() =>
            forkJoin(
              this.uniqueStudents.map((student) =>
                this.studentAssignmentService.getAssignmentsStudent({
                  academicYearID: this.currentAcademicYearId,
                  branchID: this.currentBranchID,
                  studentID: student.id
                })
              )
            )
          )
        )
        .subscribe({
          next: (allResponses: any[]) => {
            allResponses.forEach((response) => {
              response.data.forEach((dat: any) => {
                dat.tasks.forEach((task: any) => {
                  this.overAllAssignments++;
                  if (task.taskStatus === 'completed') {
                    this.completedAssignments++;
                  }
                });
              });
            });

            const percentage = (this.completedAssignments / this.overAllAssignments) * 100;
            this.classPerformance.assignmentCompletion = +percentage.toFixed(2);

            const count = this.taxisWithUser.length;
            this.classesOverview.activeClasses = count;

            let studentSum = 0;
            let sumSessions = 0;
            let totalDurationMinutes = 0;

            this.taxisWithUser.forEach((taxi: any) => {
              studentSum += taxi.studentCount ?? 0;
              sumSessions += taxi.sessionStats?.sessionsPerWeek ?? 0;
              totalDurationMinutes += taxi.sessionStats?.totalDurationMinutes ?? 0;
            });

            this.teachingStats.studentsPerClass = +(studentSum / count).toFixed(2);
            this.teachingStats.teachingHoursPerClass = +(totalDurationMinutes / count / 60).toFixed(2);
            this.teachingStats.teachingHours = +(totalDurationMinutes / 60).toFixed(2);
            this.teachingStats.weeklySessions = +sumSessions.toFixed(2);

            this.isLoading = false;
          },
          error: (err) => {
            console.error(err);
            this.isLoading = false;
          }
        });
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
