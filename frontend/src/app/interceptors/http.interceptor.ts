import { HttpInterceptorFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '@store/app.state';
import { IAuthState } from '@store/auth/auth.model';
import { catchError, mergeMap, take } from 'rxjs/operators';
import { environment } from '../../environments/environment'; // Import environment
import { AuthActions } from '@store/auth/auth.actions';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';

const apiUrlPlaceholder = `http://localhost:3193/v1`; // Define placeholder

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(Store<AppState>);
  const router = inject(Router);

  // Define public routes that should not trigger force logout on 401
  const publicRoutes = ['/login', '/forgot-password', '/reset-password'];
  const isPublicRoute = publicRoutes.some(route => router.url.startsWith(route));

  // 1. Check and update URL first
  let updatedReq: HttpRequest<any> = req;
  if (req.url.startsWith(apiUrlPlaceholder)) {
    const newUrl = req.url.replace(apiUrlPlaceholder, environment.apiUrl);
    updatedReq = req.clone({ url: newUrl });
  }

  // 2. For all requests (using updatedReq), add JWT token and API key
  return store
    .select((state: AppState) => state.auth)
    .pipe(
      take(1),
      mergeMap((authState: IAuthState) => {
        // Set up headers with API key for ALL requests
        const headers: { [key: string]: string } = {
          'c-api-key': 'replaceme' // Apply API key to ALL requests
        };

        // Add authorization header if user is authenticated
        if (authState.isAuthenticated && authState.token) {
          // Add required x-ss-auth header with role ID, JWT token, and user ID
          const user = authState.user;
          if (user && user.roles && user.roles.length > 0) {
            // Determine roleId priority: currentRoleId -> currentRoleTitle -> user.role_title -> first role
            let roleId: string | undefined;
            if (authState.currentRoleId) {
              roleId = String(authState.currentRoleId);
            } else if (authState.currentRoleTitle) {
              const matchByCurrent = user.roles.find((r: any) => r.title === authState.currentRoleTitle);
              roleId = matchByCurrent ? String(matchByCurrent.id) : undefined;
            }
            if (!roleId && user.role_title) {
              const matchByBackend = user.roles.find((r: any) => r.title === user.role_title);
              roleId = matchByBackend ? String(matchByBackend.id) : undefined;
            }
            if (!roleId) {
              roleId = String(user.roles[0].id);
            }

            const jwtToken = authState.token;
            const userId = user.id;

            // Ensure all components are present and valid before creating the header
            if (roleId && jwtToken && userId) {
              headers['x-ss-auth'] = `${roleId}:${jwtToken}:${userId}`;
            } else {
              console.error('Missing required data for x-ss-auth header', {
                hasRoleId: !!roleId,
                hasToken: !!jwtToken,
                hasUserId: !!userId
              });
            }
          } else {
            console.error('User missing roles, cannot set x-ss-auth header');
          }

          // Add Authorization header with Bearer token as a fallback
          headers['Authorization'] = `Bearer ${authState.token}`;

          // Add X-Customer-ID header if we have a currentCustomerId
          if (authState.currentCustomerId) {
            headers['X-Customer-ID'] = authState.currentCustomerId;
          }
        }

        // Add x-customer-slug header if context exists in authState
        if (authState.customerContext) {
          headers['x-customer-slug'] = authState.customerContext;
        }

        // Clone the potentially URL-updated request to add headers
        const finalReq = updatedReq.clone({
          setHeaders: headers
        });

        return next(finalReq).pipe(
          catchError((error: HttpErrorResponse) => {
            // Handle 401 Unauthorized error - suppress all notifications for 401s
            if (error.status === 401) {
              console.log('[HTTP Interceptor] Received 401 Unauthorized error, suppressing notification');
              
              // Don't force logout on public routes - let them handle 401s gracefully
              if (isPublicRoute) {
                console.log('[HTTP Interceptor] 401 on public route, not forcing logout');
                return throwError(() => error);
              }
              
              // Only dispatch forceLogout if user is still authenticated and not on public route
              // This prevents multiple dispatches from simultaneous failed requests
              if (authState.isAuthenticated) {
                console.log('[HTTP Interceptor] User still authenticated, forcing logout');
                store.dispatch(AuthActions.forceLogout());
              } else {
                console.log('[HTTP Interceptor] User already logged out, skipping forceLogout dispatch');
              }
              
              // Return a silent error that won't trigger notifications
              // This prevents any 401 error from showing as a notification
              return throwError(() => new HttpErrorResponse({
                error: { 
                  message: 'Session expired. Please login again.',
                  suppressNotification: true // Custom flag to indicate this shouldn't show notifications
                },
                status: 401,
                statusText: 'Unauthorized - Session Expired'
              }));
            }

            // For other errors, just propagate them
            return throwError(() => error);
          })
        );
      })
    );
};
