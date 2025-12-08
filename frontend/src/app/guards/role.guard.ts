import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from '@store/app.state';
import { selectCurrentRoleTitle } from '@store/auth/auth.selectors';
import { map, take } from 'rxjs/operators';
import { RoleAccessService, PageAccess } from '@services/role-access.service';

/**
 * Guard to protect routes based on user role
 * Usage: canActivate: [roleGuard], data: { requiredAccess: PageAccess.STAFF }
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const store = inject(Store<AppState>);
  const router = inject(Router);
  const roleAccessService = inject(RoleAccessService);

  const requiredAccess = route.data['requiredAccess'] as PageAccess;

  if (!requiredAccess) {
    // No specific access required, allow access
    return true;
  }

  return store.select(selectCurrentRoleTitle).pipe(
    take(1),
    map((roleTitle) => {
      const hasAccess = roleAccessService.hasAccessSync(requiredAccess, roleTitle);

      if (!hasAccess) {
        // Redirect to dashboard if no access
        router.navigate(['/dashboard']);
        return false;
      }

      return true;
    })
  );
};

/**
 * Guard specifically for settings routes
 * Redirects to dashboard if user doesn't have access to settings
 */
export const settingsGuard: CanActivateFn = () => {
  const store = inject(Store<AppState>);
  const router = inject(Router);
  const roleAccessService = inject(RoleAccessService);

  return store.select(selectCurrentRoleTitle).pipe(
    take(1),
    map((roleTitle) => {
      const hasAccess = roleAccessService.hasAccessSync(PageAccess.SETTINGS, roleTitle);

      if (!hasAccess) {
        router.navigate(['/dashboard']);
        return false;
      }

      return true;
    })
  );
};

/**
 * Guard for school info edit access
 * Managers can view but not edit school info
 */
export const schoolInfoEditGuard: CanActivateFn = () => {
  const store = inject(Store<AppState>);
  const router = inject(Router);
  const roleAccessService = inject(RoleAccessService);

  return store.select(selectCurrentRoleTitle).pipe(
    take(1),
    map((roleTitle) => {
      const hasAccess = roleAccessService.hasAccessSync(PageAccess.SETTINGS_SCHOOL_INFO_EDIT, roleTitle);

      if (!hasAccess) {
        // Redirect back to school info view (read-only)
        router.navigate(['/dashboard/settings/school-info']);
        return false;
      }

      return true;
    })
  );
};

/**
 * Guard for specific settings sub-pages (academic years, classrooms, roles)
 */
export const settingsSubPageGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const store = inject(Store<AppState>);
  const router = inject(Router);
  const roleAccessService = inject(RoleAccessService);

  const requiredAccess = route.data['requiredAccess'] as PageAccess;

  if (!requiredAccess) {
    return true;
  }

  return store.select(selectCurrentRoleTitle).pipe(
    take(1),
    map((roleTitle) => {
      const hasAccess = roleAccessService.hasAccessSync(requiredAccess, roleTitle);

      if (!hasAccess) {
        // Redirect to settings home (school info) or dashboard
        router.navigate(['/dashboard/settings/school-info']);
        return false;
      }

      return true;
    })
  );
};

/**
 * Guard specifically for resources routes
 * Redirects to dashboard if user doesn't have access to resources
 */
export const resourcesGuard: CanActivateFn = () => {
  const store = inject(Store<AppState>);
  const router = inject(Router);
  const roleAccessService = inject(RoleAccessService);

  return store.select(selectCurrentRoleTitle).pipe(
    take(1),
    map((roleTitle) => {
      const hasAccess = roleAccessService.hasAccessSync(PageAccess.RESOURCES, roleTitle);

      if (!hasAccess) {
        router.navigate(['/dashboard']);
        return false;
      }

      return true;
    })
  );
};

/**
 * Guard for specific resources sub-pages
 */
export const resourcesSubPageGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const store = inject(Store<AppState>);
  const router = inject(Router);
  const roleAccessService = inject(RoleAccessService);

  const requiredAccess = route.data['requiredAccess'] as PageAccess;

  if (!requiredAccess) {
    return true;
  }

  return store.select(selectCurrentRoleTitle).pipe(
    take(1),
    map((roleTitle) => {
      const hasAccess = roleAccessService.hasAccessSync(requiredAccess, roleTitle);

      if (!hasAccess) {
        // Redirect to resources home or dashboard
        router.navigate(['/dashboard/resources']);
        return false;
      }

      return true;
    })
  );
};
