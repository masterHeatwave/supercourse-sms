import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { IAuthState } from '@store/auth/auth.model';
import { AppState } from '@store/app.state';
import { map, take } from 'rxjs/operators';

/**
 * Guard to protect routes that require authentication
 * Redirects to login if not authenticated
 */
export const authGuard: CanActivateFn = () => {
  const store = inject(Store<AppState>);
  const router = inject(Router);

  return store
    .select((state: AppState) => state.auth)
    .pipe(
      take(1), // Important to complete the observable
      map((authState: IAuthState) => {
        if (!authState.isAuthenticated) {
          router.navigate(['/login']);
          return false;
        }
        return true;
      })
    );
};

/**
 * Guard for public routes that should not be accessible when already authenticated
 * Redirects to dashboard if already authenticated
 */
export const authActivateGuard: CanActivateFn = () => {
  const store = inject(Store<AppState>);
  const router = inject(Router);

  return store
    .select((state: AppState) => state.auth)
    .pipe(
      take(1), // Important to complete the observable
      map((authState: IAuthState) => {
        if (authState?.isAuthenticated) {
          router.navigate(['/dashboard']);
          return false;
        }
        return true;
      })
    );
};
