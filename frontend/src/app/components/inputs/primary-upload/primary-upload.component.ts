import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ToastModule } from 'primeng/toast';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { AppState } from '@store/app.state';
import { Store } from '@ngrx/store';
import { selectAuthState } from '@store/auth/auth.selectors';
import { IAuthState } from '@store/auth/auth.model';
import { API_ASSET_URL, ENDPOINTS } from '@config/endpoints';
import { MessageService } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-primary-upload',
  templateUrl: './primary-upload.component.html',
  standalone: true,
  imports: [ToastModule, HttpClientModule, CommonModule]
})
export class PrimaryUploadComponent extends FieldType<FieldTypeConfig> {
  @ViewChild('fileInput') fileInput!: ElementRef;
  @Output() mediaIdChange: EventEmitter<any> = new EventEmitter<any>();

  #http = inject(HttpClient);
  #messageService = inject(MessageService);
  #translateService = inject(TranslateService);

  uploadedFile: any | undefined = undefined;
  bearerToken: string | null = null;

  error: any;
  loading: boolean = false;

  getDefaultValue() {
    return this.props['defaultValue'] || '';
  }

  getIsRounded() {
    return this.props['isRounded'] || '';
  }

  constructor(private store: Store<AppState>, private cdr: ChangeDetectorRef) {
    super();
  }

  deleteImage(event: Event) {
    event.stopPropagation(); // Prevent triggering file input click
    this.uploadedFile = undefined;
    this.formControl.setValue(null);
    this.formControl.markAsDirty();
    this.formControl.updateValueAndValidity();
    this.mediaIdChange.emit(null);
    this.cdr.detectChanges();
  }

  ngOnInit() {
    this.store.select(selectAuthState).subscribe((authState: IAuthState) => {
      this.bearerToken = authState.token;
    });
    
    // Handle default value which could be a path string
    const defaultValue = this.getDefaultValue();
    if (defaultValue) {
      if (typeof defaultValue === 'string') {
        // If it's a string, assume it's a path
        this.uploadedFile = defaultValue;
      } else if (typeof defaultValue === 'object') {
        // If it's an object with path property
        this.uploadedFile = defaultValue;
      }
    }
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadFile(input.files[0]);
    }
  }

  uploadFile(file: File) {
    this.loading = true;
    const formData = new FormData();
    formData.append('media', file, file.name);

    // Create headers with authentication
    const headers: any = {};

    // Get auth state from store to manually add auth headers
    this.store
      .select(selectAuthState)
      .pipe(take(1))
      .subscribe((authState: IAuthState) => {
        if (authState.isAuthenticated && authState.token && authState.user && authState.user.roles && authState.user.roles.length > 0) {
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
      });

    // Use the ENDPOINTS config to ensure correct API URL with auth headers
    this.#http.post<any>(ENDPOINTS.MEDIA_UPLOAD, formData, { headers }).subscribe({
      next: (response) => {
        if (response && response.data) {
          // Store the full response data for component's internal use
          this.uploadedFile = response.data;
          // Only set the path for the form control value
          this.formControl.setValue(response.data.path);
          this.cdr.detectChanges();
          this.mediaIdChange.emit(response.data.id);

          this.#messageService.add({
            severity: 'success',
            summary: this.#translateService.instant('api_messages.success_title'),
            detail: this.#translateService.instant('File uploaded successfully')
          });
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = error;
        this.loading = false;

        const errorMessage = error?.error?.message || 'An error occurred while uploading file';
        this.#messageService.add({
          severity: 'error',
          summary: this.#translateService.instant('api_messages.error_title'),
          detail: this.#translateService.instant(errorMessage)
        });
      }
    });
  }

  getImagePath() {
    // Handle both object and string formats
    if (typeof this.uploadedFile === 'string') {
      return this.uploadedFile;
    } else if (this.uploadedFile && this.uploadedFile.path) {
      return this.uploadedFile.path;
    }
    return '';
  }

  getImageAPIPath(path: string) {
    if (!path) return '';
    return `${API_ASSET_URL}/media/${path.split('/').pop()}`;
  }
}
