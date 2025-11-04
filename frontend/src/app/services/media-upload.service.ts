import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MediaUploadService {
  constructor(private http: HttpClient) {}

  /**
   * Upload a file to the media endpoint
   * @param file The file to upload
   * @returns Observable with the file path
   */
  uploadFile(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('media', file);

    return this.http.post<any>(`${environment.apiUrl}/media/upload`, formData).pipe(
      map(response => {
        if (response.success && response.data && response.data.path) {
          return response.data.path;
        }
        throw new Error('Failed to upload file');
      })
    );
  }

  /**
   * Upload multiple files to the media endpoint
   * @param files Array of files to upload
   * @returns Observable with array of file paths
   */
  uploadMultipleFiles(files: File[]): Observable<string[]> {
    // Create an array of upload observables
    const uploadObservables = files.map(file => this.uploadFile(file));
    
    // Use forkJoin to wait for all uploads to complete
    return new Observable<string[]>(observer => {
      const results: string[] = [];
      let completed = 0;
      
      if (files.length === 0) {
        observer.next([]);
        observer.complete();
        return;
      }
      
      uploadObservables.forEach((upload, index) => {
        upload.subscribe({
          next: (path) => {
            results[index] = path;
            completed++;
            
            if (completed === files.length) {
              observer.next(results);
              observer.complete();
            }
          },
          error: (err) => {
            observer.error(err);
          }
        });
      });
    });
  }
}