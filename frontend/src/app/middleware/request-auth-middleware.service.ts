import { inject, Injectable } from '@angular/core';
import { HttpService } from '@services/http/http.service';
import { IAuthState } from '@store/auth/auth.model';
import { Store } from '@ngrx/store';
import { selectAuthState } from '@store/auth/auth.selectors';
import { BehaviorSubject, catchError, filter, map, Observable, switchMap, take, throwError } from 'rxjs';
import { AuthActions } from '@store/auth/auth.actions';

@Injectable({
  providedIn: 'root'
})
export class RequestAuthMiddleware {
  #store = inject(Store);
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_COUNT_KEY = 'auth_retry_count';
  private readonly JWT_INVALID_MESSAGE = 'JWT Token is Invalid';

  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  applyTo(httpService: HttpService) {
    const originalGet = httpService.get.bind(httpService);
    const originalPost = httpService.post.bind(httpService);
    const originalDelete = httpService.delete.bind(httpService);
    const originalPatch = httpService.patch.bind(httpService);
    const originalPut = httpService.put.bind(httpService);

    httpService.get = this.wrapMethod((url: string, params?: Record<string, string>, headers?: Record<string, string>) => {
      return originalGet(url, params, {
        ...headers,
        'x-ss-auth': this.getSSAuthHeader()
      });
    });

    httpService.post = this.wrapMethod((url: string, body: any, headers?: Record<string, string>) => {
      return originalPost(url, body, {
        ...headers,
        'x-ss-auth': this.getSSAuthHeader()
      });
    });

    httpService.delete = this.wrapMethod((url: string, headers?: Record<string, string>) => {
      return originalDelete(url, {
        ...headers,
        'x-ss-auth': this.getSSAuthHeader()
      });
    });

    httpService.put = this.wrapMethod((url: string, body: any, headers?: Record<string, string>) => {
      return originalPut(url, body, {
        ...headers,
        'x-ss-auth': this.getSSAuthHeader()
      });
    });

    httpService.patch = this.wrapMethod((url: string, body: any, headers?: Record<string, string>) => {
      return originalPatch(url, body, {
        ...headers,
        'x-ss-auth': this.getSSAuthHeader()
      });
    });
  }

  private getRetryCount(): number {
    return Number(localStorage.getItem(this.RETRY_COUNT_KEY)) || 0;
  }

  private incrementRetryCount(): void {
    const currentCount = this.getRetryCount();
    localStorage.setItem(this.RETRY_COUNT_KEY, String(currentCount + 1));
  }

  private resetRetryCount(): void {
    localStorage.removeItem(this.RETRY_COUNT_KEY);
  }

  private isTokenInvalidError(error: any): boolean {
    return error.status === 401 && error.error.message === this.JWT_INVALID_MESSAGE;
  }

  private wrapMethod<T>(originalMethod: (...args: any[]) => Observable<T>): (...args: any[]) => Observable<T> {
    return (...args: any[]) => {
      return originalMethod(...args).pipe(
        catchError((error) => {
          if (this.isTokenInvalidError(error)) {
            if (!this.isRefreshing) {
              this.isRefreshing = true;

              return this.refreshToken().pipe(
                switchMap((newToken: string) => {
                  this.isRefreshing = false;
                  this.refreshTokenSubject.next(newToken);

                  // Update headers for pending requests
                  const updatedHeaders = args[args.length - 1];
                  if (updatedHeaders && typeof updatedHeaders === 'object') {
                    updatedHeaders['x-ss-auth'] = this.getSSAuthHeader();
                  }

                  return originalMethod(...args);
                }),
                catchError((refreshError) => {
                  this.isRefreshing = false;
                  this.refreshTokenSubject.next(null);
                  this.logout();
                  return throwError(() => refreshError);
                })
              );
            } else {
              // Wait for the refresh to complete
              return this.refreshTokenSubject.pipe(
                take(1),
                switchMap((newToken) => {
                  if (newToken) {
                    // Update headers for pending requests
                    const updatedHeaders = args[args.length - 1];
                    if (updatedHeaders && typeof updatedHeaders === 'object') {
                      updatedHeaders['x-ss-auth'] = this.getSSAuthHeader();
                    }
                    return originalMethod(...args);
                  } else {
                    this.logout();
                    return throwError(() => error);
                  }
                })
              );
            }
          }

          return throwError(() => error);
        })
      );
    };
  }

  private logout() {
    this.#store.dispatch(AuthActions.logout());
  }

  private getSSAuthHeader() {
    const roleId = this.getRoleId();
    const jwtToken = this.getToken();
    const userId = this.getUserId();

    return `${roleId}:${jwtToken}:${userId}`;
  }

  private refreshToken(): Observable<string> {
    const refreshToken = this.getRefreshToken();
    const token = this.getToken();

    this.#store.dispatch(
      AuthActions.refresh({
        refreshToken,
        token
      })
    );

    // Wait for the auth state to update with a new token and return the new token
    return this.#store.select(selectAuthState).pipe(
      filter((state) => !!state.token && state.token !== token),
      take(1),
      map((state) => state.token!) // We can use ! here because the filter guarantees the token exists
    );
  }

  private getToken(): string {
    let token = '';
    this.#store.select(selectAuthState).subscribe((authState: IAuthState) => {
      token = authState.token || '';
    });
    return token;
  }

  private getUserId(): string {
    let id = '';
    this.#store.select(selectAuthState).subscribe((authState: IAuthState) => {
      id = authState.user?.id || '';
    });
    return id;
  }

  private getRoleId(): string {
    let id: string = '';
    this.#store.select(selectAuthState).pipe(take(1)).subscribe((authState: any) => {
      // 1) If explicitly selected, use it
      if (authState.currentRoleId) {
        id = String(authState.currentRoleId);
        return;
      }

      // 2) Try matching by currentRoleTitle (stored in FE state)
      if (authState.currentRoleTitle && authState.user?.roles?.length > 0) {
        const matchByCurrent = authState.user.roles.find(
          (role: any) => role.title === authState.currentRoleTitle
        );
        if (matchByCurrent) {
          id = String(matchByCurrent.id);
          return;
        }
      }

      // 3) Try matching by backend-provided user.role_title
      if (authState.user?.role_title && authState.user?.roles?.length > 0) {
        const matchByBackend = authState.user.roles.find(
          (role: any) => role.title === authState.user.role_title
        );
        if (matchByBackend) {
          id = String(matchByBackend.id);
          return;
        }
      }

      // 4) Fallback to first role if available
      if (authState.user?.roles?.length > 0) {
        id = String(authState.user.roles[0].id);
      }
    });
    return id;
  }

  private getRefreshToken(): string {
    let refreshToken = '';
    this.#store.select(selectAuthState).subscribe((authState: IAuthState) => {
      refreshToken = authState.refreshToken || '';
    });
    return refreshToken;
  }
}
