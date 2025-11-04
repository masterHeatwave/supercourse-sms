import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '@interfaces/api-response';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  constructor(private http: HttpClient) {}

  get<T>(url: string, params?: Record<string, string>, headers?: Record<string, string>): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(url, {
      headers,
      params
    });
  }
  post<T>(url: string, body: object, headers?: Record<string, string>): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(url, body, { headers });
  }
  put<T>(url: string, body: object, headers?: Record<string, string>): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(url, body, { headers });
  }
  patch<T>(url: string, body: object, headers?: Record<string, string>): Observable<ApiResponse<T>> {
    return this.http.patch<ApiResponse<T>>(url, body, { headers });
  }
  delete<T>(url: string, headers?: Record<string, string>): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(url, { headers });
  }
}
