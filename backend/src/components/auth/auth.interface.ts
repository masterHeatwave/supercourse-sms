import { IUser } from '@components/users/user.interface';

export interface RegisterDto {
  username: string;
  email: string;
  firstname: string;
  lastname: string;
  phone: string;
  mobile: string;
  password: string;
  confirmPassword: string;
  city?: string;
  country?: string;
  address?: string;
  zipcode?: string;
  birthday?: Date;
}

export interface AuthenticateDto {
  email: string;
  password: string;
}

export interface RefreshDto {
  refreshToken: string;
}

export interface VerifyEmailDto {
  token: string;
}

export interface ForgotPasswordParams {
  email: string;
}

export interface ValidateResetTokenParams {
  token: string;
  email: string;
}

export interface ResetPasswordParams {
  email: string;
  token: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: IUser;
  authHeader?: string; // Added for convenience
}

export interface InternalAuthResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: IUser;
  };
}
