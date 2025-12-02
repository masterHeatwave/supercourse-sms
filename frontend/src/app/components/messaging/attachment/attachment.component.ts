import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { TagModule } from 'primeng/tag';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import { MessagingWrapperService } from '../../../services/messaging/messaging-wrapper.service';
import { Attachment, AttachmentUtils, ATTACHMENT_LIMITS } from '../models/attachment.models';
import { trigger, transition, style, animate } from '@angular/animations';


@Component({
  selector: 'app-attachment',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ProgressBarModule,
    TooltipModule,
    CardModule,
    ScrollPanelModule,
    TagModule
  ],
  templateUrl: './attachment.component.html',
  styleUrls: ['./attachment.component.css'],
  animations: [
    trigger('fileItemAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-15px)' }),
        animate('260ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ]
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
  uploadProgress = 0;
  selectedFiles: File[] = [];

  AttachmentUtils = AttachmentUtils; 

  constructor(
    private apiService: MessagingWrapperService,
    private cdr: ChangeDetectorRef
  ) {}

  /* ----------------------------------------------
      FILE DIALOG
  ------------------------------------------------*/
  openFileDialog(): void {
    if (!this.disabled && !this.isUploading) {
      this.fileInput.nativeElement.click();
    }
  }

  /* ----------------------------------------------
      FILE SELECTION
  ------------------------------------------------*/
  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    const validation = this.validateFiles(files);

    if (!validation.isValid) {
      this.uploadError.emit(validation.errors.join('; '));
      this.resetFileInput();
      return;
    }

    this.selectedFiles = files;
    this.startUpload();
    this.resetFileInput();
  }

  /* ----------------------------------------------
      VALIDATION
  ------------------------------------------------*/
  private validateFiles(files: File[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (files.length > ATTACHMENT_LIMITS.MAX_FILES_PER_UPLOAD) {
      errors.push(`Maximum ${ATTACHMENT_LIMITS.MAX_FILES_PER_UPLOAD} files allowed per upload.`);
    }

    let totalSize = 0;

    for (const file of files) {
      totalSize += file.size;

      const result = AttachmentUtils.validateFile(file);
      if (!result.isValid) {
        errors.push(`${file.name} → ${result.errors.join(', ')}`);
      }
    }

    if (totalSize > ATTACHMENT_LIMITS.MAX_TOTAL_SIZE) {
      errors.push(
        `Total size exceeds ${AttachmentUtils.formatFileSize(ATTACHMENT_LIMITS.MAX_TOTAL_SIZE)}`
      );
    }

    return { isValid: errors.length === 0, errors };
  }

  /* ----------------------------------------------
      UPLOAD PROCESS
  ------------------------------------------------*/
  private startUpload(): void {
    if (!this.chatId || this.selectedFiles.length === 0) {
      this.uploadError.emit('Missing chat ID or no files selected.');
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;
    this.uploadStart.emit(this.selectedFiles);

    const formData = new FormData();
    this.selectedFiles.forEach(f => formData.append('files', f));
    formData.append('chatId', this.chatId);
    if (this.messageId) formData.append('messageId', this.messageId);

    this.apiService.uploadAttachmentsWithProgress(formData).subscribe({
      next: (event: HttpEvent<any>) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.round((event.loaded / event.total) * 100);
          this.cdr.detectChanges();
        }

        if (event.type === HttpEventType.Response) {
          this.handleUploadSuccess(event.body);
        }
      },

      error: (err) => this.handleUploadError(err)
    });
  }

  /* ----------------------------------------------
      SUCCESS
  ------------------------------------------------*/
  private handleUploadSuccess(response: any): void {
    if (response?.success && Array.isArray(response.attachments)) {
      this.uploadComplete.emit(response.attachments);
      this.uploadProgress = 100;
      this.cdr.detectChanges();

      setTimeout(() => this.resetUploadState(), 1400);
    } else {
      this.uploadError.emit('Upload failed: Unknown response.');
      this.resetUploadState();
    }
  }

  /* ----------------------------------------------
      ERROR
  ------------------------------------------------*/
  private handleUploadError(error: any): void {
    let msg = 'Upload failed.';

    if (error.error?.error) msg = error.error.error;
    else if (Array.isArray(error.error?.errors)) msg = error.error.errors.join('; ');
    else if (error.message) msg = error.message;

    this.uploadError.emit(msg);
    this.resetUploadState();
  }

  /* ----------------------------------------------
      RESET HELPERS
  ------------------------------------------------*/
  private resetFileInput(): void {
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  private resetUploadState(): void {
    this.isUploading = false;
    this.uploadProgress = 0;
    this.selectedFiles = [];
    this.cdr.detectChanges();
  }

  /* ----------------------------------------------
      UI HELPERS
  ------------------------------------------------*/
  get acceptedFileTypes(): string {
    return ATTACHMENT_LIMITS.ALLOWED_EXTENSIONS.map(ext => `.${ext}`).join(',');
  }

  getButtonIcon(): string {
    return this.isUploading
      ? (this.uploadProgress === 100 ? 'pi pi-check' : 'pi pi-spin pi-spinner')
      : 'pi pi-paperclip';
  }

  getTooltipText(): string {
    if (!this.isUploading) return 'Attach files';

    return this.uploadProgress === 100
      ? 'Upload completed!'
      : `Uploading ${this.selectedFiles.length} file(s) … ${this.uploadProgress}%`;
  }
}
