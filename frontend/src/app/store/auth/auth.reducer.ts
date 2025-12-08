import { createReducer, on } from '@ngrx/store';
import { AuthActions } from '@store/auth/auth.actions';
import { IAuthState } from '@store/auth/auth.model';

export const initialState: IAuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  error: null,
  loading: false,
  success: false,
  currentCustomerId: null,
  parentCurrentCustomerId: null,
  customerContext: null,
  currentRoleId: null,
  currentRoleTitle: null,
  isRefreshingToken: false,
  hasShownSessionExpiredMessage: false,
  impersonation: {
    active: false,
    original: null
  }
};

export const authReducer = createReducer(
  initialState,
  on(AuthActions.init, (state) => ({
    ...state,
    loading: false,
    error: null
  })),
  on(AuthActions.login, (state) => ({
    ...state,
    loading: true,
    success: false,
    error: null
  })),
  on(AuthActions.loginSuccess, (state, { user, token, refreshToken }) => {
    // Set parentCurrentCustomerId to the first customer from user's customers array
    const parentCurrentCustomerId = user?.customers && user.customers.length > 0 
      ? user.customers[0] 
      : null;
    // Determine initial current role based on user.role_title if present, otherwise first role
    const rolesArr: any[] = Array.isArray(user?.roles) ? (user!.roles as any[]) : [];
    const roleFromTitle = user?.role_title
      ? rolesArr.find((r: any) => r?.title === user!.role_title)
      : undefined;
    const initialRole = roleFromTitle || rolesArr[0] || null;
    const initialRoleId = initialRole ? String(initialRole.id) : null;
    const initialRoleTitle = initialRole ? String(initialRole.title) : null;
    
    // Debug logging
    console.log('🔐 Login Success - User Roles:', {
      userRoleTitle: user?.role_title,
      rolesArray: rolesArr,
      initialRole,
      initialRoleId,
      initialRoleTitle
    });
    
    return {
      ...state,
      user: user || null,
      token: token || null,
      refreshToken: refreshToken || null,
      isAuthenticated: true,
      loading: false,
      success: true,
      error: null,
      currentCustomerId: null,
      parentCurrentCustomerId,
      currentRoleId: initialRoleId,
      currentRoleTitle: initialRoleTitle,
      hasShownSessionExpiredMessage: false
    };
  }),
  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
    success: false,
    isAuthenticated: false,
    user: null,
    token: null,
    refreshToken: null,
    currentCustomerId: null,
    parentCurrentCustomerId: null
  })),
  on(AuthActions.refresh, (state) => ({
    ...state,
    loading: true,
    success: false,
    error: null,
    isRefreshingToken: true
  })),
  on(AuthActions.refreshSuccess, (state, { token, refreshToken, user }) => {
    // If user data is provided in refresh, update role information
    let updatedRoleId = state.currentRoleId;
    let updatedRoleTitle = state.currentRoleTitle;
    
    if (user) {
      const rolesArr: any[] = Array.isArray(user?.roles) ? (user!.roles as any[]) : [];
      const roleFromTitle = user?.role_title
        ? rolesArr.find((r: any) => r?.title === user!.role_title)
        : undefined;
      const initialRole = roleFromTitle || rolesArr[0] || null;
      updatedRoleId = initialRole ? String(initialRole.id) : state.currentRoleId;
      updatedRoleTitle = initialRole ? String(initialRole.title) : state.currentRoleTitle;
    }
    
    return {
      ...state,
      token,
      refreshToken,
      user: user || state.user,
      isAuthenticated: true,
      loading: false,
      success: true,
      error: null,
      isRefreshingToken: false,
      currentRoleId: updatedRoleId,
      currentRoleTitle: updatedRoleTitle
    };
  }),
  on(AuthActions.refreshFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
    success: false,
    isAuthenticated: false,
    user: null,
    token: null,
    refreshToken: null,
    currentCustomerId: null,
    parentCurrentCustomerId: null,
    isRefreshingToken: false
  })),
  on(AuthActions.resetRefreshAttempt, (state) => ({
    ...state,
    isRefreshingToken: false
  })),
  on(AuthActions.forceLogout, () => ({
    ...initialState
  })),
  on(AuthActions.logout, () => ({
    ...initialState
  })),
  on(AuthActions.setCurrentCustomer, (state, { customerId }) => ({
    ...state,
    currentCustomerId: customerId
  })),
  on(AuthActions.setParentCurrentCustomer, (state, { customerId }) => ({
    ...state,
    parentCurrentCustomerId: customerId
  })),
  on(AuthActions.setCustomerContext, (state, { context }) => ({
    ...state,
    customerContext: context
  })),
  on(AuthActions.clearCustomerContext, (state) => ({
    ...state,
    customerContext: null
  })),
  on(AuthActions.changeCurrentRole, (state, { roleId, roleTitle }) => ({
    ...state,
    currentRoleId: roleId,
    currentRoleTitle: roleTitle
  })),
  on(AuthActions.impersonateSuccess, (state, { user, token, refreshToken }) => ({
    ...state,
    impersonation: {
      active: true,
      original: state.impersonation?.active
        ? state.impersonation?.original // already impersonating, keep deepest original
        : {
            user: state.user,
            token: state.token,
            refreshToken: state.refreshToken,
            currentRoleId: state.currentRoleId ?? null,
            currentRoleTitle: state.currentRoleTitle ?? null,
            customerContext: state.customerContext,
          },
    },
    user,
    token,
    refreshToken,
    isAuthenticated: true,
    // reset currentRoleId so interceptor recalculates from student's roles
    currentRoleId: null,
    currentRoleTitle: null,
  })),
  on(AuthActions.exitImpersonation, (state) => ({
    ...state,
    user: state.impersonation?.original?.user ?? state.user,
    token: state.impersonation?.original?.token ?? state.token,
    refreshToken: state.impersonation?.original?.refreshToken ?? state.refreshToken,
    currentRoleId: state.impersonation?.original?.currentRoleId ?? state.currentRoleId,
    currentRoleTitle: state.impersonation?.original?.currentRoleTitle ?? state.currentRoleTitle,
    customerContext: state.impersonation?.original?.customerContext ?? state.customerContext,
    impersonation: { active: false, original: null },
  })),
  on(AuthActions.setSessionExpiredMessageShown, (state, { shown }) => ({
    ...state,
    hasShownSessionExpiredMessage: shown
  }))
);
