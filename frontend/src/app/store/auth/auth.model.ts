import { User } from '@gen-api/schemas';

export interface IPermission {
  id: string;
  name: string;
  description: string;
}

export interface IRole {
  id: string;
  title: string;
  description?: string;
  permissions: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ILoginResponse {
  data: {
    token: string;
    refreshToken: string;
    user: User;
  };
  message: string;
  success: boolean;
  status: number;
}

export interface IAuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  error: any;
  loading: boolean;
  success: boolean;
  currentCustomerId: string | null;
  parentCurrentCustomerId: string | null;
  customerContext: string | null;
  currentRoleId?: string | null;
  currentRoleTitle?: string | null;
  isRefreshingToken: boolean;
  hasShownSessionExpiredMessage: boolean;
  impersonation?: {
    active: boolean;
    original: {
      user: User | null;
      token: string | null;
      refreshToken: string | null;
      currentRoleId?: string | null;
      currentRoleTitle?: string | null;
      customerContext: string | null;
    } | null;
  };
}
