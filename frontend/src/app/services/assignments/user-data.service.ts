import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { Store } from '@ngrx/store';
import { selectAuthState } from '@store/auth/auth.selectors';

@Injectable({
  providedIn: 'root'
})

export class UserDataService {
  store = inject(Store);
  
  private authState = toSignal(this.store.select(selectAuthState), { initialValue: null });
  
  constructor() {
    effect(() => {
      console.info('🏫 Current school slug:', this.currentSchoolSlug());
      console.info('🏫 Current school ID:', this.currentSchoolID());
      console.info('🏫 Current branch ID:', this.currentBranchID());
      console.info('🏫 Current role title:', this.currentRoleTitle());
      console.info('🏫 Current user ID:', this.currentUserID());
    });
  }
  
  currentSchoolSlug = computed(() => this.authState()?.customerContext || '');
  currentSchoolID = computed(() => this.authState()?.parentCurrentCustomerId || '');
  currentBranchID = computed(() => this.authState()?.currentCustomerId || '');
  currentRoleTitle = computed(() => this.authState()?.currentRoleTitle || '');
  currentUserID = computed(() => this.authState()?.user?.id || '');
}
