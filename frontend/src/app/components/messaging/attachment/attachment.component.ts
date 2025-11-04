import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { HttpEventType, HttpEvent } from '@angular/common/http'; 
import { MessagingWrapperService } from '../../../services/messaging/messaging-wrapper.service';  
import { Attachment, AttachmentUtils, ATTACHMENT_LIMITS } from '../models/attachment.models';

@Component({
  selector: 'app-attachment',
  standalone: true,
  imports: [CommonModule, ButtonModule, ProgressBarModule, TooltipModule],
  templateUrl: './attachment.component.html',
  styleUrls: ['./attachment.component.css']
})
export class AttachmentComponent {
  @Input() chatId: string = '';
  @Input() messageId?: string;
  @Input() disabled: boolean = false;
  
  @Output() uploadStart = new EventEmitter<File[]>();
  @Output() uploadComplete = new EventEmitter<Attachment[]>();
  @Output() uploadError = new EventEmitter<string>();
  
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  isUploading = false;
  selectedFiles: File[] = [];
  uploadProgress = 0;
  
  AttachmentUtils = AttachmentUtils;

  get acceptedFileTypes(): string {
    // ✅ Fix: Explicitly type 'ext' parameter
    return ATTACHMENT_LIMITS.ALLOWED_EXTENSIONS.map((ext: string) => '.' + ext).join(',');
  }

  constructor(
    private apiService: MessagingWrapperService,
    private cdr: ChangeDetectorRef
  ) {}

  openFileDialog(): void {
    if (this.disabled || this.isUploading) return;
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const files = Array.from(input.files);
    const validation = this.validateFiles(files);

    if (!validation.isValid) {
      this.uploadError.emit(validation.errors.join('; '));
      this.resetFileInput();
      return;
    }

    this.selectedFiles = [...files];
    this.startUpload();
    this.resetFileInput();
  }

  private validateFiles(files: File[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (files.length > ATTACHMENT_LIMITS.MAX_FILES_PER_UPLOAD) {
      errors.push(`Maximum ${ATTACHMENT_LIMITS.MAX_FILES_PER_UPLOAD} files allowed per upload`);
      return { isValid: false, errors };
    }

    // ✅ Use the static method from AttachmentUtils
    for (const file of files) {
      const fileValidation = AttachmentUtils.validateFile(file);
      if (!fileValidation.isValid) {
        errors.push(`${file.name}: ${fileValidation.errors.join(', ')}`);
      }
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    
    if (totalSize > ATTACHMENT_LIMITS.MAX_TOTAL_SIZE) {
      errors.push(`Total upload size exceeds ${AttachmentUtils.formatFileSize(ATTACHMENT_LIMITS.MAX_TOTAL_SIZE)} limit`);
    }

    return { isValid: errors.length === 0, errors };
  }

  private startUpload(): void {
    if (!this.chatId || this.selectedFiles.length === 0) {
      this.uploadError.emit('No chat ID or files to upload');
      return;
    }

    console.log('Starting upload for', this.selectedFiles.length, 'files to chat', this.chatId);

    this.isUploading = true;
    this.uploadProgress = 0;
    this.uploadStart.emit([...this.selectedFiles]);

    const formData = new FormData();
    this.selectedFiles.forEach(file => formData.append('files', file));
    formData.append('chatId', this.chatId);
    if (this.messageId) {
      formData.append('messageId', this.messageId);
    }

    // ✅ Now this method exists
    this.apiService.uploadAttachmentsWithProgress(formData).subscribe({
      next: (event: HttpEvent<any>) => {  // ✅ Fix: Explicitly type event
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.round((100 * event.loaded) / event.total);
          this.cdr.detectChanges();
        } else if (event.type === HttpEventType.Response && event.body) {
          this.handleUploadSuccess(event.body);
        }
      },
      error: (error: any) => {  // ✅ Fix: Explicitly type error
        console.error('Upload failed:', error);
        this.handleUploadError(error);
      }
    });
  }

  private handleUploadSuccess(response: any): void {
    console.log('Upload successful:', response);

    if (response.success && Array.isArray(response.attachments)) {
      this.uploadComplete.emit(response.attachments);
      this.uploadProgress = 100;
      this.cdr.detectChanges();
      setTimeout(() => this.resetUploadState(), 1500);
    } else {
      const errorMsg = response.errors?.join('; ') || 'Upload failed - unknown error';
      this.uploadError.emit(errorMsg);
      this.resetUploadState();
    }
  }

  private handleUploadError(error: any): void {
    console.error('Upload error details:', error);
    let errorMessage = 'Upload failed';
    
    if (error.error?.error) {
      errorMessage = error.error.error;
    } else if (error.error?.errors && Array.isArray(error.error.errors)) {
      errorMessage = error.error.errors.join('; ');
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.status === 0) {
      errorMessage = 'Network error - please check your connection';
    } else if (error.status >= 500) {
      errorMessage = 'Server error - please try again later';
    }
    
    this.uploadError.emit(errorMessage);
    this.resetUploadState();
  }

  private resetUploadState(): void {
    this.isUploading = false;
    this.selectedFiles = [];
    this.uploadProgress = 0;
    this.cdr.detectChanges();
  }

  private resetFileInput(): void {
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  getButtonIcon(): string {
    if (this.isUploading) {
      return this.uploadProgress === 100 ? 'pi pi-check' : 'pi pi-spin pi-spinner';
    }
    return 'pi pi-paperclip';
  }

  getTooltipText(): string {
    if (this.isUploading) {
      return this.uploadProgress === 100
        ? 'Upload completed!'
        : `Uploading ${this.selectedFiles.length} files... (${this.uploadProgress}%)`;
    }
    return 'Attach files';
  }
}