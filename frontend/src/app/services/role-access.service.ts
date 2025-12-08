import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '@store/app.state';
import { selectCurrentRoleTitle } from '@store/auth/auth.selectors';
import { Observable, map } from 'rxjs';

export enum UserRole {
  ADMINISTRATOR = 'Administrator',
  MANAGER = 'Manager',
  TEACHER = 'Teacher',
  STUDENT = 'Student',
  PARENT_GUARDIAN = 'Parent & Guardian'
}

export enum PageAccess {
  DASHBOARD = 'dashboard',
  STAFF = 'staff',
  STUDENTS = 'students',
  CLASSES = 'classes',
  CLASSROOMS = 'classrooms',
  SESSIONS = 'sessions',
  TIMETABLE = 'timetable',
  BOARD = 'board',
  CALENDAR = 'calendar',
  ELIBRARY = 'elibrary',
  ASSETS = 'assets',
  SETTINGS = 'settings',
  SETTINGS_SCHOOL_INFO = 'settings-school-info',
  SETTINGS_SCHOOL_INFO_EDIT = 'settings-school-info-edit',
  SETTINGS_ACADEMIC_YEARS = 'settings-academic-years',
  SETTINGS_CLASSROOMS = 'settings-classrooms',
  SETTINGS_ROLES = 'settings-roles',
  //* ▼ SUPER COURSE ▼ *//
  ASSIGNMENTS = 'assignments',
  PROGRESS = 'progress',
  REVISION_CENTER = 'revision-center',
  WELLNESS_CENTER = 'wellness-center',
  ANALYTICS = 'analytics',
  RESOURCES = 'resources',
  RESOURCES_BOOKS = 'resources-books',
  RESOURCES_FILES = 'resources-files',
  RESOURCES_CUSTOM_ACTIVITIES = 'resources-custom-activities',
  FINANCES = 'finances',
  MARKETING_TOOL = 'marketing-tool',
  //* ▲ SUPER COURSE ▲ *//
}

@Injectable({
  providedIn: 'root'
})
export class RoleAccessService {
  private currentRoleTitle$: Observable<string | null | undefined>;

  // Define access control matrix
  private accessMatrix: Record<UserRole, PageAccess[]> = {
    [UserRole.ADMINISTRATOR]: [
      PageAccess.DASHBOARD,
      PageAccess.STAFF,
      PageAccess.STUDENTS,
      PageAccess.CLASSES,
      PageAccess.CLASSROOMS,
      PageAccess.SESSIONS,
      PageAccess.TIMETABLE,
      PageAccess.BOARD,
      PageAccess.CALENDAR,
      PageAccess.ELIBRARY,
      PageAccess.ASSETS,
      PageAccess.SETTINGS,
      PageAccess.SETTINGS_SCHOOL_INFO,
      PageAccess.SETTINGS_SCHOOL_INFO_EDIT,
      PageAccess.SETTINGS_ACADEMIC_YEARS,
      PageAccess.SETTINGS_CLASSROOMS,
      PageAccess.SETTINGS_ROLES,
      //* ▼ SUPER COURSE ▼ *//
      PageAccess.ASSIGNMENTS,
      PageAccess.PROGRESS,
      PageAccess.REVISION_CENTER,
      PageAccess.WELLNESS_CENTER,
      PageAccess.ANALYTICS,
      PageAccess.RESOURCES,
      PageAccess.RESOURCES_BOOKS,
      PageAccess.RESOURCES_FILES,
      PageAccess.RESOURCES_CUSTOM_ACTIVITIES,
      PageAccess.FINANCES,
      PageAccess.MARKETING_TOOL,
      //* ▲ SUPER COURSE ▲ *//
    ],
    [UserRole.MANAGER]: [
      PageAccess.DASHBOARD,
      PageAccess.STAFF,
      PageAccess.STUDENTS,
      PageAccess.CLASSES,
      PageAccess.CLASSROOMS,
      PageAccess.SESSIONS,
      PageAccess.TIMETABLE,
      PageAccess.BOARD,
      PageAccess.CALENDAR,
      PageAccess.ELIBRARY,
      PageAccess.ASSETS,
      PageAccess.SETTINGS,
      PageAccess.SETTINGS_SCHOOL_INFO, // Can view but not edit
      // Note: SETTINGS_SCHOOL_INFO_EDIT is excluded
      // SETTINGS_ACADEMIC_YEARS, SETTINGS_CLASSROOMS, SETTINGS_ROLES are excluded
      //* ▼ SUPER COURSE ▼ *//
      PageAccess.ASSIGNMENTS,
      PageAccess.PROGRESS,
      PageAccess.REVISION_CENTER,
      PageAccess.WELLNESS_CENTER,
      PageAccess.ANALYTICS,
      PageAccess.RESOURCES,
      PageAccess.RESOURCES_BOOKS,
      PageAccess.RESOURCES_FILES,
      PageAccess.RESOURCES_CUSTOM_ACTIVITIES,
      PageAccess.FINANCES,
      PageAccess.MARKETING_TOOL,
      //* ▲ SUPER COURSE ▲ *//
    ],
    [UserRole.TEACHER]: [
      PageAccess.DASHBOARD,
      PageAccess.STUDENTS,
      PageAccess.CLASSES,
      PageAccess.SESSIONS,
      PageAccess.TIMETABLE,
      PageAccess.BOARD,
      PageAccess.CALENDAR,
      // No Settings access, no E-Library, no Assets
      //* ▼ SUPER COURSE ▼ *//
      PageAccess.ASSIGNMENTS,
      PageAccess.PROGRESS,
      PageAccess.REVISION_CENTER,
      PageAccess.WELLNESS_CENTER,
      PageAccess.ANALYTICS,
      PageAccess.RESOURCES,
      PageAccess.RESOURCES_BOOKS,
      PageAccess.RESOURCES_FILES,
      PageAccess.RESOURCES_CUSTOM_ACTIVITIES,
      PageAccess.FINANCES,
      PageAccess.MARKETING_TOOL,
      //* ▲ SUPER COURSE ▲ *//
    ],
    [UserRole.STUDENT]: [
      PageAccess.DASHBOARD,
      PageAccess.CLASSES,
      PageAccess.SESSIONS,
      // No Timetable, Board, Calendar access
      //* ▼ SUPER COURSE ▼ *//
      PageAccess.ASSIGNMENTS,
      PageAccess.PROGRESS,
      PageAccess.REVISION_CENTER,
      PageAccess.WELLNESS_CENTER,
      PageAccess.ANALYTICS,
      PageAccess.RESOURCES,
      PageAccess.RESOURCES_BOOKS,
      PageAccess.RESOURCES_FILES,
      PageAccess.RESOURCES_CUSTOM_ACTIVITIES,
      PageAccess.FINANCES,
      PageAccess.MARKETING_TOOL,
      //* ▲ SUPER COURSE ▲ *//
    ],
    [UserRole.PARENT_GUARDIAN]: [
      PageAccess.DASHBOARD,
      PageAccess.STUDENTS,
      PageAccess.CLASSES,
      PageAccess.SESSIONS,
      PageAccess.TIMETABLE,
      PageAccess.CALENDAR,
      // No Board access
      //* ▼ SUPER COURSE ▼ *//
      PageAccess.ASSIGNMENTS,
      PageAccess.PROGRESS,
      PageAccess.REVISION_CENTER,
      PageAccess.WELLNESS_CENTER,
      PageAccess.ANALYTICS,
      PageAccess.RESOURCES,
      PageAccess.RESOURCES_BOOKS,
      PageAccess.RESOURCES_FILES,
      PageAccess.RESOURCES_CUSTOM_ACTIVITIES,
      PageAccess.FINANCES,
      PageAccess.MARKETING_TOOL,
      //* ▲ SUPER COURSE ▲ *//
    ]
  };

  constructor(private store: Store<AppState>) {
    this.currentRoleTitle$ = this.store.select(selectCurrentRoleTitle);
  }

  /**
   * Check if the current user has access to a specific page
   */
  hasAccess(page: PageAccess): Observable<boolean> {
    return this.currentRoleTitle$.pipe(
      map(roleTitle => {
        if (!roleTitle) return false;
        
        const role = this.getRoleFromTitle(roleTitle);
        if (!role) return false;

        const allowedPages = this.accessMatrix[role] || [];
        return allowedPages.includes(page);
      })
    );
  }

  /**
   * Check if current user has access synchronously (for guards)
   */
  hasAccessSync(page: PageAccess, roleTitle: string | null | undefined): boolean {
    if (!roleTitle) return false;
    
    const role = this.getRoleFromTitle(roleTitle);
    if (!role) return false;

    const allowedPages = this.accessMatrix[role] || [];
    return allowedPages.includes(page);
  }

  /**
   * Get current role title as observable
   */
  getCurrentRoleTitle(): Observable<string | null | undefined> {
    return this.currentRoleTitle$;
  }

  /**
   * Get all accessible pages for the current role
   */
  getAccessiblePages(): Observable<PageAccess[]> {
    return this.currentRoleTitle$.pipe(
      map(roleTitle => {
        if (!roleTitle) return [];
        
        const role = this.getRoleFromTitle(roleTitle);
        if (!role) return [];

        return this.accessMatrix[role] || [];
      })
    );
  }

  /**
   * Check if user is an administrator
   */
  isAdministrator(): Observable<boolean> {
    return this.currentRoleTitle$.pipe(
      map(roleTitle => roleTitle === UserRole.ADMINISTRATOR)
    );
  }

  /**
   * Check if user is a manager
   */
  isManager(): Observable<boolean> {
    return this.currentRoleTitle$.pipe(
      map(roleTitle => roleTitle === UserRole.MANAGER)
    );
  }

  /**
   * Check if user is a teacher
   */
  isTeacher(): Observable<boolean> {
    return this.currentRoleTitle$.pipe(
      map(roleTitle => roleTitle === UserRole.TEACHER)
    );
  }

  /**
   * Check if user is a student
   */
  isStudent(): Observable<boolean> {
    return this.currentRoleTitle$.pipe(
      map(roleTitle => roleTitle === UserRole.STUDENT)
    );
  }

  /**
   * Check if user is a parent/guardian
   */
  isParentGuardian(): Observable<boolean> {
    return this.currentRoleTitle$.pipe(
      map(roleTitle => roleTitle === UserRole.PARENT_GUARDIAN)
    );
  }

  /**
   * Convert role title to UserRole enum
   */
  private getRoleFromTitle(roleTitle: string): UserRole | null {
    const roleTitleTrimmed = roleTitle.trim();
        
    // Role mapping for common variations and backend inconsistencies
    const roleMapping: { [key: string]: UserRole } = {
      // Uppercase variations
      'ADMIN': UserRole.ADMINISTRATOR,
      'ADMINISTRATOR': UserRole.ADMINISTRATOR,
      'MANAGER': UserRole.MANAGER,
      'TEACHER': UserRole.TEACHER,
      'STUDENT': UserRole.STUDENT,
      'PARENT': UserRole.PARENT_GUARDIAN,
      'PARENT & GUARDIAN': UserRole.PARENT_GUARDIAN,
      'PARENT&GUARDIAN': UserRole.PARENT_GUARDIAN,
      'PARENT AND GUARDIAN': UserRole.PARENT_GUARDIAN,
      'PARENT_GUARDIAN': UserRole.PARENT_GUARDIAN,
      // Title case variations
      'Admin': UserRole.ADMINISTRATOR,
      'Administrator': UserRole.ADMINISTRATOR,
      'Manager': UserRole.MANAGER,
      'Teacher': UserRole.TEACHER,
      'Student': UserRole.STUDENT,
      'Parent': UserRole.PARENT_GUARDIAN,
      'Parent & Guardian': UserRole.PARENT_GUARDIAN,
      'Parent and Guardian': UserRole.PARENT_GUARDIAN,
    };
    
    // Check mapping first (case-sensitive)
    if (roleMapping[roleTitleTrimmed]) {
      return roleMapping[roleTitleTrimmed];
    }
    
    // Exact match with enum values
    if (Object.values(UserRole).includes(roleTitleTrimmed as UserRole)) {
      return roleTitleTrimmed as UserRole;
    }

    // Case-insensitive match
    const foundRole = Object.values(UserRole).find(
      role => role.toLowerCase() === roleTitleTrimmed.toLowerCase()
    );
    
    if (foundRole) {
      console.log('✅ Case-insensitive match found:', foundRole);
    } else {
      console.error('❌ No role match found for:', roleTitleTrimmed);
      console.error('Available roles:', Object.values(UserRole));
      console.error('💡 Tip: Add this role to the roleMapping in role-access.service.ts');
    }

    return foundRole || null;
  }

  /**
   * Get sidebar menu items filtered by role
   */
  getFilteredSidebarItems(): Observable<string[]> {
    return this.currentRoleTitle$.pipe(
      map(roleTitle => {
        
        if (!roleTitle) {
          console.warn('No role title found in auth store');
          return [];
        }
        
        const role = this.getRoleFromTitle(roleTitle);
        if (!role) {
          console.warn('Could not map role title to known role:', roleTitle);
          return [];
        }
        
        const pages = this.accessMatrix[role] || [];
        
        const menuItems: string[] = [];
        
        if (pages.includes(PageAccess.DASHBOARD)) menuItems.push('dashboard');
        if (pages.includes(PageAccess.STAFF)) menuItems.push('staff');
        if (pages.includes(PageAccess.STUDENTS)) menuItems.push('students');
        if (pages.includes(PageAccess.CLASSES)) menuItems.push('classes');
        if (pages.includes(PageAccess.CLASSROOMS)) menuItems.push('classrooms');
        if (pages.includes(PageAccess.SESSIONS)) menuItems.push('sessions');
        if (pages.includes(PageAccess.TIMETABLE)) menuItems.push('timetable');
        if (pages.includes(PageAccess.BOARD)) menuItems.push('board');
        if (pages.includes(PageAccess.CALENDAR)) menuItems.push('calendar');
        if (pages.includes(PageAccess.ELIBRARY)) menuItems.push('elibrary');
        if (pages.includes(PageAccess.ASSETS)) menuItems.push('assets');
        //* ▼ SUPER COURSE ▼ *//
        if (pages.includes(PageAccess.ASSIGNMENTS)) menuItems.push('assignments');
        if (pages.includes(PageAccess.PROGRESS)) menuItems.push('progress');
        if (pages.includes(PageAccess.REVISION_CENTER)) menuItems.push('revision-center');
        if (pages.includes(PageAccess.WELLNESS_CENTER)) menuItems.push('wellness-center');
        if (pages.includes(PageAccess.ANALYTICS)) menuItems.push('analytics');
        if (pages.includes(PageAccess.RESOURCES)) menuItems.push('resources');
        if (pages.includes(PageAccess.FINANCES)) menuItems.push('finances');
        if (pages.includes(PageAccess.MARKETING_TOOL)) menuItems.push('marketing-tool');
        //* ▲ SUPER COURSE ▲ *//

        return menuItems;
      })
    );
  }

  /**
   * Get settings sidebar items filtered by role
   */
  getFilteredSettingsItems(): Observable<string[]> {
    return this.getAccessiblePages().pipe(
      map(pages => {
        const settingsItems: string[] = [];
        
        if (pages.includes(PageAccess.SETTINGS_SCHOOL_INFO)) settingsItems.push('school-info');
        if (pages.includes(PageAccess.SETTINGS_ACADEMIC_YEARS)) settingsItems.push('academic-years');
        if (pages.includes(PageAccess.SETTINGS_CLASSROOMS)) settingsItems.push('classrooms');
        if (pages.includes(PageAccess.SETTINGS_ROLES)) settingsItems.push('roles');

        return settingsItems;
      })
    );
  }
  
  /**
   * Get resources navbar items filtered by role
   */
  getFilteredResourcesItems(): Observable<string[]> {
    return this.getAccessiblePages().pipe(
      map(pages => {
        const resourcesItems: string[] = [];
        
        if (pages.includes(PageAccess.RESOURCES_BOOKS)) resourcesItems.push('resources-books');
        if (pages.includes(PageAccess.RESOURCES_FILES)) resourcesItems.push('resources-files');
        if (pages.includes(PageAccess.RESOURCES_CUSTOM_ACTIVITIES)) resourcesItems.push('resources-custom-activities');

        return resourcesItems;
      })
    );
  }
}
