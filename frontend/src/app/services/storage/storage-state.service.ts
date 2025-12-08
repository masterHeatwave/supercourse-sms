import { inject, Injectable, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { IAuthState } from '@store/auth/auth.model';
import { selectAuthState } from '@store/auth/auth.selectors';
import { ActivatedRoute, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class StorageStateService {

  private store = inject(Store);

  userId = signal<string>('');
  prefix = signal<string>('');

  triggerFetchFiles = signal<boolean>(false);
  triggerFetchSize = signal<boolean>(false);

  constructor() {

    this.store.select(selectAuthState).subscribe((authState: IAuthState) => {
      this.userId.set(authState.user?.id ?? '');
      this.prefix.set('');
    })

  }
}
