import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { FileUploadModule } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { HttpClient } from '@angular/common/http';
import { ENDPOINTS } from '@config/endpoints';
import { Store } from '@ngrx/store';
import { AppState } from '@store/app.state';
import { selectAuthState } from '@store/auth/auth.selectors';
import { IAuthState } from '@store/auth/auth.model';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-primary-upload-file',
  standalone: true,
  imports: [FileUploadModule, ButtonModule, CommonModule, ToastModule],
  templateUrl: './primary-upload-file.component.html',
  styleUrl: './primary-upload-file.component.scss'
})
export class PrimaryUploadFileComponent extends FieldType<FieldTypeConfig> {
  #http = inject(HttpClient);
  #messageService = inject(MessageService);
  #store = inject(Store<AppState>);
  #cdr = inject(ChangeDetectorRef);

  uploadedFiles: any[] = [];
  uploading: boolean = false;

  onFileSelect(event: any) {
    this.uploading = true;
    console.log('File select event:', event);
    
    // Check the structure of the event and handle the files accordingly
    const filesToUpload = [];
    
    // PrimeNG FileUpload events can have different structures
    if (event && event.files && Array.isArray(event.files)) {
      // Standard array of files
      for (let i = 0; i < event.files.length; i++) {
        filesToUpload.push(event.files[i]);
      }
    } else if (event && event.currentFiles && Array.isArray(event.currentFiles)) {
      // Sometimes files are in currentFiles
      for (let i = 0; i < event.currentFiles.length; i++) {
        filesToUpload.push(event.currentFiles[i]);
      }
    } else if (event && event.originalEvent && event.originalEvent.files) {
      // Handle originalEvent case
      for (let i = 0; i < event.originalEvent.files.length; i++) {
        filesToUpload.push(event.originalEvent.files[i]);
      }
    }
    
    console.log('Files to upload:', filesToUpload);
    
    if (filesToUpload.length === 0) {
      this.#messageService.add({
        severity: 'error',
        summary: 'Upload Error',
        detail: 'No files found to upload'
      });
      this.uploading = false;
      return;
    }
    
    // Upload each file individually
    const uploadPromises = filesToUpload.map(file => this.uploadSingleFile(file));
    
    Promise.all(uploadPromises)
      .then((results) => {
        // Filter out failed uploads
        const successfulUploads = results.filter((result) => result);
        if (successfulUploads.length > 0) {
          this.#messageService.add({
            severity: 'success',
            summary: 'Upload Success',
            detail: `Successfully uploaded ${successfulUploads.length} file(s)`
          });
        }
        this.uploading = false;
      })
      .catch((error) => {
        console.error('Document upload error:', error);
        this.#messageService.add({
          severity: 'error',
          summary: 'Upload Error',
          detail: 'Failed to upload documents'
        });
        this.uploading = false;
      });
  }

  async uploadSingleFile(file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('media', file, file.name);

      // Create headers with authentication
      const headers: any = {};

      // Get auth state from store to manually add auth headers
      const authState = await new Promise<IAuthState>(resolve => {
        this.#store.select(selectAuthState).pipe(take(1)).subscribe(state => {
          resolve(state);
        });
      });
      
      if (
        authState &&
        authState.isAuthenticated && 
        authState.token && 
        authState.user?.roles?.length
      ) {
        const roleId = String(authState.user.roles[0].id);
        const jwtToken = authState.token;
        const userId = authState.user.id;
        headers['x-ss-auth'] = `${roleId}:${jwtToken}:${userId}`;

        // Add customer ID header if available
        if (authState.currentCustomerId) {
          headers['X-Customer-ID'] = authState.currentCustomerId;
        }

        // Add customer slug if available
        if (authState.customerContext) {
          headers['x-customer-slug'] = authState.customerContext;
        }
      }

      // Make the HTTP request using firstValueFrom instead of deprecated toPromise()
      const response = await new Promise<any>((resolve, reject) => {
        this.#http.post<any>(ENDPOINTS.MEDIA_UPLOAD, formData, { headers })
          .subscribe({
            next: (res) => resolve(res),
            error: (err) => reject(err)
          });
      });

      // Handle successful upload
      if (response && response.data) {
        // Store just the path information
        const fileData = {
          path: response.data.path,
          name: file.name,
          type: file.type,
          size: file.size,
          originalFile: file
        };

        this.uploadedFiles.push(fileData);
        this.formControl.setValue(this.uploadedFiles.map((f) => f.path));
        this.#cdr.detectChanges();
        return fileData;
      }
      return null;
    } catch (error) {
      console.error('Error uploading file:', error);
      this.#messageService.add({
        severity: 'error',
        summary: 'Upload Error',
        detail: `Failed to upload ${file.name}`
      });
      return null;
    }
  }

  removeFile(index: number) {
    this.uploadedFiles.splice(index, 1);
    this.formControl.setValue(this.uploadedFiles.map((f) => f.path));
  }
}
