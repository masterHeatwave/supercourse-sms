import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private uploadUrl = environment.apiUrl + '/uploadImage';
  private removeImageUrl = environment.apiUrl + '/deleteImage';

  constructor(private http: HttpClient) {}

  uploadImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);

    return this.http.post(this.uploadUrl, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }

  deleteImage(file: string): Observable<any> {
    const formData = new FormData();
    formData.append('imageName', file);

    return this.http.post(this.removeImageUrl, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }
}
