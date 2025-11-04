import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { MutationResult, QueryObserverResult } from '@ngneat/query';
import { Result } from '@ngneat/query/lib/types';

/**
 * Standard API response format for all endpoints
 */
export interface ApiResponse<T> {
  success: boolean;
  status: number;
  data: T;
  message?: string;
  error?: string;
  count?: number;
  pagination?: {
    current: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiErrorResponse<T> extends HttpErrorResponse {
  error: ApiResponse<T>;
}

export type MutationResponse<TParams = string, TData = any> = MutationResult<HttpResponse<ApiResponse<TData>>, ApiErrorResponse<any>, TParams>;

export type QueryResponse<T> = Result<QueryObserverResult<ApiResponse<T>>>;

/**
 * Common query parameters for paginated endpoints
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

/**
 * User-related query params
 * Based on swagger GET /users parameters
 */
export interface UserQueryParams extends PaginationParams {
  is_active?: boolean;
  sort?: string;
  select?: string;
  populate?: string;
  query?: string;
  user_type?: 'STUDENT' | 'STAFF' | 'ADMIN' | 'MANAGER' | 'TEACHER' | 'DRIVER';
  role?: string;
}

/**
 * Academic years query params
 */
export interface AcademicPeriodQueryParams extends PaginationParams {
  academic_year?: string;
  current?: boolean;
}

/**
 * Taxi query params
 */
export interface TaxiQueryParams extends PaginationParams {
  academic_year?: string;
  academic_period?: string;
  branch?: string;
  subject?: string;
  level?: string;
}

/**
 * Classroom query params
 */
export interface ClassroomQueryParams extends PaginationParams {
  location?: string;
  equipment?: string;
  minCapacity?: number;
  available_day?: string;
  available_time?: string;
}

/**
 * Session query params
 */
export interface SessionQueryParams extends PaginationParams {
  taxi?: string;
  classroom?: string;
  academic_period?: string;
  academic_subperiod?: string;
  teacher?: string;
  student?: string;
  from_date?: string;
  to_date?: string;
  is_recurring?: boolean;
}

/**
 * Inventory query params
 */
export interface InventoryQueryParams extends PaginationParams {
  user?: string;
  customer?: string;
  from_date?: string;
  to_date?: string;
  returned?: boolean;
}

/**
 * Post query params
 */
export interface PostQueryParams extends PaginationParams {
  author?: string;
  status?: 'draft' | 'published' | 'archived';
  tag?: string;
  from_date?: string;
  to_date?: string;
  featured?: boolean;
}

/**
 * Notification query params
 */
export interface NotificationQueryParams extends PaginationParams {
  is_read?: boolean;
}

export type QueryItem = {
  [key: string]: string | string[] | boolean | number | null | any;
};

export interface IAdvancedResults<T> {
  results: T;
  totalPages: number;
  totalResults: number;
  page: number;
  limit: number;
}