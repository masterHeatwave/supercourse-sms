import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
//import { environment } from '../../../environments/environment';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {
  private uploadUrl = `${environment.apiUrl}/media/upload`;
  private removeImageUrl = environment.apiUrl + '/deleteImage';

  constructor(private http: HttpClient) {}

  uploadImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('media', file);

    return this.http.post(this.uploadUrl, formData).pipe(
      catchError((error) => {
        console.error('Upload failed', error);
        return of({
          success: false,
          message: 'Upload failed, please try again'
        });
      })
    );
  }

  deleteImage(file: string): Observable<any> {
    const formData = new FormData();
    formData.append('imageName', file);
    return this.http.post(this.removeImageUrl, formData).pipe(
      catchError((error) => {
        console.error('Delete failed', error);
        return of({
          success: false,
          message: 'Delete failed, please try again'
        });
      })
    );
  }
}
