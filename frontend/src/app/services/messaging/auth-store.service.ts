// services/auth/auth-store.service.ts

import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { selectAuthState } from '@store/auth/auth.selectors';

export interface AuthContext {
  currentSchoolSlug: string;
  currentSchoolID: string;
  currentBranchID: string;
  currentRoleTitle: string;
  currentUserID: string;
  user?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthStoreService {
  private store = inject(Store);

  /**
   * Get current user ID as observable
   */
  getCurrentUserID$(): Observable<string> {
    return this.store.select(selectAuthState).pipe(
      map((authState: any) => authState.user?.id || ''),
      distinctUntilChanged()
    );
  }

  /**
   * Get current user ID synchronously (for initialization)
   * WARNING: May return empty string if store not initialized yet
   */
  getCurrentUserIDSync(): string {
    let userId = '';
    this.store.select(selectAuthState).pipe(
      map((authState: any) => authState.user?.id || '')
    ).subscribe(id => userId = id).unsubscribe();
    return userId;
  }

  /**
   * Get full auth context as observable
   */
  getAuthContext$(): Observable<AuthContext> {
    return this.store.select(selectAuthState).pipe(
      map((authState: any) => ({
        currentSchoolSlug: authState.customerContext || '',
        currentSchoolID: authState.parentCurrentCustomerId || authState.user?.customers?.[0] || '',
        currentBranchID: authState.currentCustomerId || authState.user?.branches?.[0] || '',
        currentRoleTitle: authState.currentRoleTitle || authState.user?.roles?.[0]?.title || '',
        currentUserID: authState.user?.id || '',
        user: authState.user
      })),
      distinctUntilChanged((prev, curr) => 
        prev.currentUserID === curr.currentUserID &&
        prev.currentSchoolSlug === curr.currentSchoolSlug
      )
    );
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated$(): Observable<boolean> {
    return this.getCurrentUserID$().pipe(
      map(userId => !!userId && userId.length > 0)
    );
  }
}