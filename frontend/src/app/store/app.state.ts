import { IAuthState } from '@store/auth/auth.model';
import { ISidebarState } from '@store/sidebar/sidebar.model';

export interface AppState {
  auth: IAuthState;
  sidebar: ISidebarState;
}
