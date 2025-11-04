import { createSelector } from '@ngrx/store';
import { AppState } from '@store/app.state';
import { IAuthState } from '@store/auth/auth.model';

export const selectAuth = (state: AppState) => state.auth;

export const selectAuthState = createSelector(selectAuth, (auth: IAuthState) => auth);

export const selectCurrentCustomerId = createSelector(
  selectAuth,
  (auth: IAuthState) => auth.currentCustomerId
);

export const selectParentCurrentCustomerId = createSelector(
  selectAuth,
  (auth: IAuthState) => auth.parentCurrentCustomerId
);
