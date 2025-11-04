import { Routes } from '@angular/router';
import { authActivateGuard, authGuard } from '@guards/auth.guard';
import { LayoutComponent } from './layout/layout.component';
import { LoginComponent } from '@pages/login/login.component';
import { DashboardComponent } from '@pages/dashboard/dashboard.component';
import { ResetPasswordComponent } from '@pages/reset-password/reset-password.component';
import { ForgotPasswordComponent } from '@pages/forgot-password/forgot-password.component';
import { StaffComponent } from '@pages/dashboard/staff/staff.component';
import { CreateComponent as CreateStaffComponent } from '@pages/dashboard/staff/create/create.component';
import { StudentsComponent } from '@pages/dashboard/students/students.component';
import { CreateStudentComponent } from '@pages/dashboard/students/create/create.component';
import { ClassesComponent } from '@pages/dashboard/classes/classes.component';
import { CreateComponent as CreateClassComponent } from '@pages/dashboard/classes/create/create.component';
import { SessionsComponent } from '@pages/dashboard/sessions/sessions.component';
import { CreateComponent as CreateSessionComponent } from '@pages/dashboard/sessions/create/create.component';
import { EditSessionComponent } from '@pages/dashboard/sessions/edit/edit.component';
import { TimetableComponent } from '@pages/dashboard/sessions/timetable/timetable.component';
import { SingleSessionPageComponent } from '@pages/dashboard/sessions/single/single.component';
import { DashboardIndexComponent } from '@pages/dashboard/index/index.component';
import { SingleComponent as SingleStaffComponent } from '@pages/dashboard/staff/single/single.component';
import { EditComponent, EditComponent as EditStaffComponent } from '@pages/dashboard/staff/edit/edit.component';
import { SingleComponent as SingleStudentComponent } from '@pages/dashboard/students/single/single.component';
import { EditStudentComponent } from '@pages/dashboard/students/edit/edit.component';
import { SingleComponent as SingleClassComponent } from '@pages/dashboard/classes/single/single.component';
import { SettingsComponent } from '@pages/dashboard/settings/settings.component';
import { ViewRoleComponent } from '@pages/dashboard/settings/components/roles/view-role/view-role.component';
import { BoardComponent } from '@pages/dashboard/board/board.component';
import { CreatePostComponent } from '@pages/dashboard/board/create/create.component';
import { SingleComponent as SingleAcademicYearComponent } from '@pages/dashboard/settings/components/academic-years/single/single.component';
import { AcademicYearsComponent } from '@pages/dashboard/settings/components/academic-years/academic-years.component';
import { AcademicYearFormComponent } from '@components/academic-years/create-academic-year-form/academic-year-form.component';
import { SchoolInfoComponent } from '@pages/dashboard/settings/components/school-info/school-info.component';
import { ClassroomsComponent } from '@pages/dashboard/settings/components/classrooms/classrooms.component';
import { RolesComponent } from '@pages/dashboard/settings/components/roles/roles.component';
import { ElibraryComponent } from '@pages/dashboard/elibrary/elibrary.component';
import { CreateElibraryComponent } from '@pages/dashboard/elibrary/create/create.component';
import { EditElibraryComponent } from '@pages/dashboard/elibrary/edit/edit.component';
import { SingleElibraryComponent } from '@pages/dashboard/elibrary/single/single.component';
import { AssetsComponent } from '@pages/dashboard/assets/assets.component';
import { CreateAssetComponent } from '@pages/dashboard/assets/create/create.component';
import { EditAssetComponent } from '@pages/dashboard/assets/edit/edit.component';
import { SingleAssetComponent } from '@pages/dashboard/assets/single/single.component';
import { CalendarComponent } from '@pages/dashboard/calendar/calendar.component';
import { CalendarEventsComponent } from '@pages/dashboard/calendar/events/events.component';
// Super Course additions
import { ViewAllAssignmentsComponent } from '@pages/dashboard/assignments/view-all-assignments/view-all-assignments.component';
import { ViewOneAssignmentComponent } from '@pages/dashboard/assignments/view-one-assignment/view-one-assignment.component';
import { ViewAllDraftedAssignmentsComponent } from '@pages/dashboard/assignments/view-all-drafted-assignments/view-all-drafted-assignments.component';
import { ViewAllDeletedAssignmentsComponent } from '@pages/dashboard/assignments/view-all-deleted-assignments/view-all-deleted-assignments.component';
import { CreateNewAssignmentComponent } from '@pages/dashboard/assignments/create-new-assignment/create-new-assignment.component';
import { EditOneAssignmentComponent } from '@pages/dashboard/assignments/edit-one-assignment/edit-one-assignment.component';
import { OnlineSessionComponent } from '@components/sessions/online-session/online-session.component';
import { WellnessCenterComponent } from '@pages/dashboard/wellness-center/views/main-view/main-view.component';
import { ResourcesComponent } from '@pages/dashboard/resources/resources.component';
import { CustomActivityComponent } from '@pages/dashboard/resources/custom-activities/views/main-view/custom-activity.component';
import { CreateViewComponent } from '@pages/dashboard/resources/custom-activities/views/create-view/create-view.component';
import { EditViewComponent } from '@pages/dashboard/resources/custom-activities/views/edit-view/edit-view.component';
import { LaunchTeacherViewComponent } from '@pages/dashboard/resources/custom-activities/views/launch-teacher-view/launch-teacher-view.component';
import { LaunchStudentViewComponent } from '@pages/dashboard/resources/custom-activities/views/launch-student-view/launch-student-view.component';
import { FilesComponent } from '@pages/dashboard/resources/files/files.component';
import { BooksComponent } from '@pages/dashboard/resources/books/books.component';

export const routes: Routes = [
  // Public routes (login, forgot password, reset password)
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [authActivateGuard] // Prevent accessing if already logged in
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    canActivate: [authActivateGuard] // Prevent accessing if already logged in
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
    canActivate: [authActivateGuard] // Prevent accessing if already logged in
  },

  // Protected routes that require authentication
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard], // Protect all child routes
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        component: DashboardComponent,
        children: [{ path: '', component: DashboardIndexComponent }]
      },
      // Staff routes
      { path: 'dashboard/staff', component: StaffComponent },
      { path: 'dashboard/staff/create', component: CreateStaffComponent },
      { path: 'dashboard/staff/:id', component: SingleStaffComponent },
      { path: 'dashboard/staff/edit/:id', component: EditStaffComponent },

      // Students routes
      { path: 'dashboard/students', component: StudentsComponent },
      { path: 'dashboard/students/create', component: CreateStudentComponent },
      { path: 'dashboard/students/:id', component: SingleStudentComponent },
      { path: 'dashboard/students/edit/:id', component: EditStudentComponent },

      // E-Library routes
      { path: 'dashboard/elibrary', component: ElibraryComponent },
      { path: 'dashboard/elibrary/create', component: CreateElibraryComponent },
      { path: 'dashboard/elibrary/edit/:id', component: EditElibraryComponent },
      { path: 'dashboard/elibrary/:id', component: SingleElibraryComponent },

      // Assets routes
      { path: 'dashboard/assets', component: AssetsComponent },
      { path: 'dashboard/assets/create', component: CreateAssetComponent },
      { path: 'dashboard/assets/edit/:id', component: EditAssetComponent },
      { path: 'dashboard/assets/:id', component: SingleAssetComponent },

      // Classes routes
      { path: 'dashboard/classes', component: ClassesComponent },
      { path: 'dashboard/classes/create', component: CreateClassComponent },
      { path: 'dashboard/classes/edit/:id', component: CreateClassComponent },
      { path: 'dashboard/classes/:id', component: SingleClassComponent },

      // Sessions routes
      { path: 'dashboard/sessions', component: SessionsComponent },
      { path: 'dashboard/sessions/create', component: CreateSessionComponent },
      { path: 'dashboard/sessions/timetable', component: TimetableComponent },
      { path: 'dashboard/sessions/:id', component: SingleSessionPageComponent },
      { path: 'dashboard/sessions/edit/:id', component: EditSessionComponent },
      { path: 'dashboard/sessions/online/:id', component: OnlineSessionComponent },

      // Settings route with child routes
      {
        path: 'dashboard/settings',
        component: SettingsComponent,
        children: [
          { path: '', redirectTo: 'school-info', pathMatch: 'full' },
          { path: 'school-info', component: SchoolInfoComponent },
          { path: 'academic-years', component: AcademicYearsComponent },
          { path: 'academic-years/create', component: AcademicYearFormComponent },
          { path: 'academic-years/edit/:id', component: AcademicYearFormComponent },
          { path: 'academic-years/:id', component: SingleAcademicYearComponent },
          { path: 'classrooms', component: ClassroomsComponent },
          { path: 'roles', component: RolesComponent }
        ]
      },

      // Academic years overview route (moved outside Settings so it renders under main navbar layout)
      { path: 'dashboard/academic-years/:id', component: SingleAcademicYearComponent },

      // Board route
      { path: 'dashboard/board', component: BoardComponent },
      { path: 'dashboard/board/create', component: CreatePostComponent },

      // Calendar routes
      { path: 'dashboard/calendar', component: CalendarComponent },
      { path: 'dashboard/calendar/events', component: CalendarEventsComponent },

      // Role management routes
      { path: 'dashboard/settings/roles/:id', component: ViewRoleComponent },

      // Assignments routes
      { path: 'dashboard/assignments', component: ViewAllAssignmentsComponent },
      { path: 'dashboard/assignments/drafted', component: ViewAllDraftedAssignmentsComponent },
      { path: 'dashboard/assignments/deleted', component: ViewAllDeletedAssignmentsComponent },
      { path: 'dashboard/assignments/create', component: CreateNewAssignmentComponent },
      { path: 'dashboard/assignments/edit/:id', component: EditOneAssignmentComponent },
      { path: 'dashboard/assignments/:id', component: ViewOneAssignmentComponent },

      // Resources
      // { path: 'dashboard/resources', component: ResourcesComponent },

      // Wellness Center
      { path: 'dashboard/wellness-center', component: WellnessCenterComponent },
      
      // Resources
      {
        path: 'dashboard/resources',
        component: ResourcesComponent,
        children: [
          { path: '', redirectTo: 'books', pathMatch: 'full' },
          { path: 'books', component: BooksComponent },
          { path: 'files', component: FilesComponent },
          { path: 'custom-activities', component: CustomActivityComponent },
          { path: 'custom-activities/create', component: CreateViewComponent },
          { path: 'custom-activities/edit/:id', component: EditViewComponent },
          { path: 'custom-activities/launch/teacher/:id', component: LaunchTeacherViewComponent },
          { path: 'custom-activities/launch/student/:id', component: LaunchStudentViewComponent }
        ]
      }
    ]
  },

  // Wildcard route for 404 handling
  {
    path: '**',
    redirectTo: 'login'
  }
];
