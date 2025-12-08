import { createActionGroup, props, emptyProps } from '@ngrx/store';
import { PostAuthLogin200Data, PostAuthRefresh200Data } from '@gen-api/schemas';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    Init: emptyProps(),
    Login: props<{ email: string; password: string; context?: string | null }>(),
    'Login Success': props<PostAuthLogin200Data>(),
    'Login Failure': props<{ error: any }>(),
    Logout: emptyProps(),
    'Logout Success': emptyProps(),
    'Logout Failure': props<{ error: any }>(),
    Refresh: props<{ refreshToken: string; token: string }>(),
    'Refresh Success': props<PostAuthRefresh200Data>(),
    'Refresh Failure': props<{ error: any }>(),
    'Set Current Customer': props<{ customerId: string }>(),
    'Set Parent Current Customer': props<{ customerId: string }>(),
    'Set Customer Context': props<{ context: string | null }>(),
    'Clear Customer Context': emptyProps(),
    'Change Current Role': props<{ roleId: string; roleTitle: string }>(),
    'Reset Refresh Attempt': emptyProps(),
    'Force Logout': emptyProps(),
    'Impersonate Student': props<{ studentId: string }>(),
    'Impersonate Success': props<{ user: any; token: string; refreshToken: string }>(),
    'Exit Impersonation': emptyProps(),
    'Set Session Expired Message Shown': props<{ shown: boolean }>()
  }
});
