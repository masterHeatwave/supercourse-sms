import { Routes } from '@angular/router';
import { authActivateGuard, authGuard } from '@guards/auth.guard';
import { roleGuard, settingsGuard, settingsSubPageGuard, resourcesGuard, resourcesSubPageGuard } from '@guards/role.guard';
import { PageAccess } from '@services/role-access.service';
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
import { ClassroomsPageComponent } from '@pages/dashboard/classrooms/classrooms.component';
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
import { BoardComponent } from '@pages/dashboard/board/board.component';
import { CreatePostComponent } from '@pages/dashboard/board/create/create.component';
import { SinglePostComponent } from '@pages/dashboard/board/single/single.component';
import { EditPostComponent } from '@pages/dashboard/board/edit/edit.component';
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
import { AnalyticsMainViewComponent } from '@pages/dashboard/analyticsSMS/views/main-view/main-view.component';
import { SchoolInfoComponent } from '@pages/dashboard/settings/school-info/school-info.component';
import { AcademicYearsComponent } from '@pages/dashboard/settings/academic-years/academic-years.component';
import { ClassroomsComponent } from '@pages/dashboard/settings/classrooms/classrooms.component';
import { RolesComponent } from '@pages/dashboard/settings/roles/roles.component';
import { SingleAcademicYearComponent } from '@pages/dashboard/settings/academic-years/single/single.component';
import { ViewRoleComponent } from '@pages/dashboard/settings/roles/single/single.component';
import { SingleClassroomPageComponent } from '@pages/dashboard/settings/classrooms/single/single.component';
import { AcademicYearFormComponent } from '@components/academic-years/create-academic-year-form/academic-year-form.component';
import { AccountComponent } from '@pages/dashboard/account/account.component';
import { ProfileComponent } from '@pages/dashboard/account/profile/profile.component';
import { SecurityComponent } from '@pages/dashboard/account/security/security.component';
import { DisplayComponent } from '@pages/dashboard/account/display/display.component';
import { NotificationsComponent } from '@pages/dashboard/account/notifications/notifications.component';

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
      { path: 'dashboard/staff', component: StaffComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.STAFF } },
      { path: 'dashboard/staff/create', component: CreateStaffComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.STAFF } },
      { path: 'dashboard/staff/:id', component: SingleStaffComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.STAFF } },
      { path: 'dashboard/staff/edit/:id', component: EditStaffComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.STAFF } },

      // Students routes
      { path: 'dashboard/students', component: StudentsComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.STUDENTS } },
      { path: 'dashboard/students/create', component: CreateStudentComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.STUDENTS } },
      { path: 'dashboard/students/:id', component: SingleStudentComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.STUDENTS } },
      { path: 'dashboard/students/edit/:id', component: EditStudentComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.STUDENTS } },

      // E-Library routes
      { path: 'dashboard/elibrary', component: ElibraryComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.ELIBRARY } },
      { path: 'dashboard/elibrary/create', component: CreateElibraryComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.ELIBRARY } },
      { path: 'dashboard/elibrary/edit/:id', component: EditElibraryComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.ELIBRARY } },
      { path: 'dashboard/elibrary/:id', component: SingleElibraryComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.ELIBRARY } },

      // Assets routes
      { path: 'dashboard/assets', component: AssetsComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.ASSETS } },
      { path: 'dashboard/assets/create', component: CreateAssetComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.ASSETS } },
      { path: 'dashboard/assets/edit/:id', component: EditAssetComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.ASSETS } },
      { path: 'dashboard/assets/:id', component: SingleAssetComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.ASSETS } },

      // Classes routes
      { path: 'dashboard/classes', component: ClassesComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.CLASSES } },
      { path: 'dashboard/classes/create', component: CreateClassComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.CLASSES } },
      { path: 'dashboard/classes/edit/:id', component: CreateClassComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.CLASSES } },
      { path: 'dashboard/classes/:id', component: SingleClassComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.CLASSES } },

      // Sessions routes
      { path: 'dashboard/sessions', component: SessionsComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.SESSIONS } },
      { path: 'dashboard/sessions/create', component: CreateSessionComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.SESSIONS } },
      { path: 'dashboard/sessions/timetable', component: TimetableComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.TIMETABLE } },
      { path: 'dashboard/sessions/:id', component: SingleSessionPageComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.SESSIONS } },
      { path: 'dashboard/sessions/edit/:id', component: EditSessionComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.SESSIONS } },
      { path: 'dashboard/sessions/online/:id', component: OnlineSessionComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.SESSIONS } },

      // Settings route with child routes
      {
        path: 'dashboard/settings',
        component: SettingsComponent,
        canActivate: [settingsGuard],
        children: [
          { path: '', redirectTo: 'school-info', pathMatch: 'full' },
          {
            path: 'school-info',
            component: SchoolInfoComponent,
            canActivate: [settingsSubPageGuard],
            data: { requiredAccess: PageAccess.SETTINGS_SCHOOL_INFO }
          },
          {
            path: 'academic-years',
            component: AcademicYearsComponent,
            canActivate: [settingsSubPageGuard],
            data: { requiredAccess: PageAccess.SETTINGS_ACADEMIC_YEARS }
          },
          {
            path: 'academic-years/create',
            component: AcademicYearFormComponent,
            canActivate: [settingsSubPageGuard],
            data: { requiredAccess: PageAccess.SETTINGS_ACADEMIC_YEARS }
          },
          {
            path: 'academic-years/edit/:id',
            component: AcademicYearFormComponent,
            canActivate: [settingsSubPageGuard],
            data: { requiredAccess: PageAccess.SETTINGS_ACADEMIC_YEARS }
          },
          {
            path: 'academic-years/:id',
            component: SingleAcademicYearComponent,
            canActivate: [settingsSubPageGuard],
            data: { requiredAccess: PageAccess.SETTINGS_ACADEMIC_YEARS }
          },
          {
            path: 'classrooms',
            component: ClassroomsComponent,
            canActivate: [settingsSubPageGuard],
            data: { requiredAccess: PageAccess.SETTINGS_CLASSROOMS }
          },
          {
            path: 'classroom/:id',
            component: SingleClassroomPageComponent,
            canActivate: [settingsSubPageGuard],
            data: { requiredAccess: PageAccess.SETTINGS_CLASSROOMS }
          },
          {
            path: 'roles',
            component: RolesComponent,
            canActivate: [settingsSubPageGuard],
            data: { requiredAccess: PageAccess.SETTINGS_ROLES }
          },
          {
            path: 'roles/:id',
            component: ViewRoleComponent,
            canActivate: [settingsSubPageGuard],
            data: { requiredAccess: PageAccess.SETTINGS_ROLES }
          }
        ]
      },

      // Board routes
      { path: 'dashboard/board', component: BoardComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.BOARD } },
      { path: 'dashboard/board/create', component: CreatePostComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.BOARD } },
      { path: 'dashboard/board/:id', component: SinglePostComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.BOARD } },
      { path: 'dashboard/board/edit/:id', component: EditPostComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.BOARD } },

      // Calendar routes
      { path: 'dashboard/calendar', component: CalendarComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.CALENDAR } },
      { path: 'dashboard/calendar/events', component: CalendarEventsComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.CALENDAR } },

      // Role management routes
      { path: 'dashboard/settings/roles/:id', component: ViewRoleComponent },

      //* ▼ SUPER COURSE ▼ *//
      // Assignments routes
      { path: 'dashboard/assignments', component: ViewAllAssignmentsComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.ASSIGNMENTS } },
      { path: 'dashboard/assignments/drafted', component: ViewAllDraftedAssignmentsComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.ASSIGNMENTS } },
      { path: 'dashboard/assignments/deleted', component: ViewAllDeletedAssignmentsComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.ASSIGNMENTS } },
      { path: 'dashboard/assignments/create', component: CreateNewAssignmentComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.ASSIGNMENTS } },
      { path: 'dashboard/assignments/edit/:id', component: EditOneAssignmentComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.ASSIGNMENTS } },
      { path: 'dashboard/assignments/:id', component: ViewOneAssignmentComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.ASSIGNMENTS } },

      // Wellness Center
      { path: 'dashboard/wellness-center', component: WellnessCenterComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.WELLNESS_CENTER } },

      // Resources
      {
        path: 'dashboard/resources',
        component: ResourcesComponent,
        canActivate: [resourcesGuard],
        data: { requiredAccess: PageAccess.RESOURCES },
        children: [
          { path: '', redirectTo: 'books', pathMatch: 'full' },
          { path: 'books', component: BooksComponent, canActivate: [resourcesSubPageGuard], data: { requiredAccess: PageAccess.RESOURCES_BOOKS } },
          {
            path: 'files',
            children: [
              { path: '**', pathMatch: 'full', component: FilesComponent, canActivate: [resourcesSubPageGuard], data: { requiredAccess: PageAccess.RESOURCES_FILES } },
            ]
          },
          { path: 'getFile/:prefix', component: CustomActivityComponent, canActivate: [resourcesSubPageGuard], data: { requiredAccess: PageAccess.RESOURCES_CUSTOM_ACTIVITIES } },
          { path: 'custom-activities', component: CustomActivityComponent, canActivate: [resourcesSubPageGuard], data: { requiredAccess: PageAccess.RESOURCES_CUSTOM_ACTIVITIES } },
          { path: 'custom-activities/create', component: CreateViewComponent, canActivate: [resourcesSubPageGuard], data: { requiredAccess: PageAccess.RESOURCES_CUSTOM_ACTIVITIES } },
          { path: 'custom-activities/edit/:id', component: EditViewComponent, canActivate: [resourcesSubPageGuard], data: { requiredAccess: PageAccess.RESOURCES_CUSTOM_ACTIVITIES } },
          { path: 'custom-activities/launch/teacher/:id', component: LaunchTeacherViewComponent, canActivate: [resourcesSubPageGuard], data: { requiredAccess: PageAccess.RESOURCES_CUSTOM_ACTIVITIES } },
          { path: 'custom-activities/launch/student/:id', component: LaunchStudentViewComponent, canActivate: [resourcesSubPageGuard], data: { requiredAccess: PageAccess.RESOURCES_CUSTOM_ACTIVITIES } }
        ]
      },

      // Analytics
      { path: 'dashboard/analytics', component: AnalyticsMainViewComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.ANALYTICS } },

      // Finances
      // { path: 'dashboard/finances', component: FinancesComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.FINANCES } },

      // Marketing Tool
      // { path: 'dashboard/marketing-tool', component: MarketingToolComponent, canActivate: [roleGuard], data: { requiredAccess: PageAccess.MARKETING_TOOL } }
      //* ▲ SUPER COURSE ▲ *//

      // Account routes with child routes
      {
        path: 'dashboard/account',
        component: AccountComponent,
        canActivate: [authGuard],
        children: [
          { path: '', redirectTo: 'profile', pathMatch: 'full' },
          {
            path: 'profile',
            component: ProfileComponent,
            canActivate: [authGuard]
          },
          {
            path: 'security',
            component: SecurityComponent,
            canActivate: [authGuard]
          },
          {
            path: 'display',
            component: DisplayComponent,
            canActivate: [authGuard]
          },
          {
            path: 'notifications',
            component: NotificationsComponent,
            canActivate: [authGuard]
          }
        ]
      },

    ]
  },

  // Wildcard route for 404 handling
  {
    path: '**',
    redirectTo: 'login'
  }
];
