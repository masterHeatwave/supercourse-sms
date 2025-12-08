import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { AuthActions } from '@store/auth/auth.actions';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap, withLatestFrom, filter, delay } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '@gen-api/auth/auth.service';
import { MessageService } from 'primeng/api';
import { LoadingService } from '@services/loading/loading.service';
import { TranslateService } from '@ngx-translate/core';
import { ApiErrorResponse } from '@interfaces/api-response';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { CustomerService } from '../../services/customer.service';
// (AuthService already imported above)

@Injectable()
export class AuthEffects {
  #authService = inject(AuthService);
  #actions$ = inject(Actions);
  #router = inject(Router);
  #messageService = inject(MessageService);
  #loadingService = inject(LoadingService);
  #translateService = inject(TranslateService);
  #store = inject(Store);
  #customerService = inject(CustomerService);
  #http = inject(HttpClient);

  // Note: Session expired message flag is now managed in the auth state

  login$ = createEffect(() =>
    this.#actions$.pipe(
      ofType(AuthActions.login),
      tap(() => this.#loadingService.setLoading(true)),
      switchMap(({ email, password, context }) => {
        let headers = new HttpHeaders();
        if (context) {
          headers = headers.set('x-customer-slug', context);
        }
        return this.#authService.postAuthLogin({ email, password }, { headers }).pipe(
          switchMap((response) => {
            if (response && response.data && response.data.token && response.data.user) {
              return of(AuthActions.setCustomerContext({ context: context ?? null }), AuthActions.loginSuccess(response.data));
            } else {
              return of(AuthActions.loginFailure({ error: response }));
            }
          }),
          catchError((error: ApiErrorResponse<any>) => {
            this.showErrorMessage(error);
            return of(AuthActions.loginFailure({ error }));
          }),
          tap(() => this.#loadingService.setLoading(false))
        );
      })
    )
  );

  loginSuccess$ = createEffect(
    () =>
      this.#actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap((response) => {
          // Log authentication data for debugging
          const roles = response.user?.roles || [];

          // Navigate to dashboard
          this.#router.navigate(['/dashboard']);
        })
      ),
    { dispatch: false }
  );

  // Effect to set the default branch after login
  setDefaultBranch$ = createEffect(() =>
    this.#actions$.pipe(
      ofType(AuthActions.loginSuccess),
      // Add a small delay to ensure the auth state is set before making API calls
      delay(300),
      switchMap(() => {
        return this.#customerService.getCurrentUserCustomers().pipe(
          map((customers) => {
            const nonPrimaryBranches = customers.filter((customer) => !customer.is_primary);

            if (nonPrimaryBranches.length > 0) {
              return AuthActions.setCurrentCustomer({ customerId: nonPrimaryBranches[0].id });
            }

            if (customers.length > 0) {
              return AuthActions.setCurrentCustomer({ customerId: customers[0].id });
            }

            console.warn('No branches available');
            return { type: '[Auth] No Branch Available' };
          }),
          catchError((error) => {
            console.error('Error setting default branch:', error);
            return of({ type: '[Auth] Default Branch Error' });
          })
        );
      })
    )
  );

  logout$ = createEffect(() =>
    this.#actions$.pipe(
      ofType(AuthActions.logout),
      tap(() => this.#loadingService.setLoading(true)),
      switchMap(() =>
        this.#authService.postAuthLogout().pipe(
          map(() => AuthActions.logoutSuccess()),
          catchError((error: ApiErrorResponse<any>) => {
            // Don't show error messages for 401 on logout - this is expected when token is expired
            if (error.status !== 401) {
              this.showErrorMessage(error);
            }
            // Always treat logout as successful, even if the API call fails
            return of(AuthActions.logoutSuccess());
          }),
          tap(() => this.#loadingService.setLoading(false))
        )
      )
    )
  );

  logoutSuccess$ = createEffect(
    () =>
      this.#actions$.pipe(
        ofType(AuthActions.logoutSuccess),
        tap(() => {
          this.#router.navigate(['/login']);
          this.#store.dispatch(AuthActions.clearCustomerContext());
        })
      ),
    { dispatch: false }
  );

  refresh$ = createEffect(() =>
    this.#actions$.pipe(
      ofType(AuthActions.refresh),
      tap(() => this.#loadingService.setLoading(true)),
      switchMap(({ refreshToken }) =>
        this.#authService.postAuthRefresh({ token: refreshToken, refreshToken }).pipe(
          switchMap((response) => {
            if (response && response.data) {
              return of(AuthActions.refreshSuccess(response.data));
            } else {
              return of(AuthActions.refreshFailure({ error: response }));
            }
          }),
          catchError((error: ApiErrorResponse<any>) => {
            this.showErrorMessage(error);
            return of(AuthActions.refreshFailure({ error }));
          }),
          tap(() => this.#loadingService.setLoading(false))
        )
      )
    )
  );

  refreshFailure$ = createEffect(
    () =>
      this.#actions$.pipe(
        ofType(AuthActions.refreshFailure),
        withLatestFrom(this.#store.select((state: any) => state.auth.hasShownSessionExpiredMessage)),
        tap(([action, hasShownMessage]) => {
          if (!hasShownMessage) {
            this.#store.dispatch(AuthActions.setSessionExpiredMessageShown({ shown: true }));
            this.#messageService.add({
              severity: 'warn',
              summary: 'Session Expired',
              detail: 'Your session has expired. Please log in again.'
            });
            this.#router.navigate(['/login']);
          }
        })
      ),
    { dispatch: false }
  );

  forceLogout$ = createEffect(
    () =>
      this.#actions$.pipe(
        ofType(AuthActions.forceLogout),
        withLatestFrom(this.#store.select((state: any) => state.auth.hasShownSessionExpiredMessage)),
        tap(([action, hasShownMessage]) => {
          if (!hasShownMessage) {
            this.#store.dispatch(AuthActions.setSessionExpiredMessageShown({ shown: true }));
            this.#messageService.add({
              severity: 'warn',
              summary: 'Session Expired',
              detail: 'Your session has expired. Please log in again.'
            });
            this.#router.navigate(['/login']);
          }
        })
      ),
    { dispatch: false }
  );

  refreshSuccess$ = createEffect(
    () =>
      this.#actions$.pipe(
        ofType(AuthActions.refreshSuccess),
        tap(({ token, refreshToken, user }) => {
          console.log('Token refreshed successfully');
          // No navigation needed - user stays on current page with refreshed token
        })
      ),
    { dispatch: false }
  );

  impersonate$ = createEffect(() =>
    this.#actions$.pipe(
      ofType(AuthActions.impersonateStudent),
      switchMap(({ studentId }) =>
        this.#http.post<any>(`http://localhost:3193/v1/auth/impersonate/student/${studentId}`, {}).pipe(
          switchMap((response) => {
            const data: any = response?.data ?? response;
            if (data && data.token && data.user) {
              return of(
                AuthActions.impersonateSuccess({ user: data.user, token: data.token, refreshToken: data.refreshToken })
              );
            }
            return of({ type: '[Auth] Impersonate Failure' });
          }),
          catchError((error: ApiErrorResponse<any>) => {
            this.showErrorMessage(error);
            return of({ type: '[Auth] Impersonate Failure' });
          })
        )
      )
    )
  );

  private showErrorMessage(error: any) {
    // Don't show notifications for errors that should be suppressed
    if (error.error?.suppressNotification) {
      return;
    }
    
    const errorMessage = error?.error?.message || 'An error occurred';
    this.#messageService.add({
      severity: 'error',
      summary: this.#translateService.instant('api_messages.error_title'),
      detail: this.#translateService.instant(errorMessage)
    });
  }
}
