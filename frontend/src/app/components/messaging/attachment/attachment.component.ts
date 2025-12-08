import {
  Component, Input, Output, EventEmitter,
  ViewChild, ElementRef, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { TagModule } from 'primeng/tag';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import { Attachment, AttachmentUtils, ATTACHMENT_LIMITS } from '../models/attachment.models';
import { trigger, transition, style, animate } from '@angular/animations';

import { AttachmentService } from '../../../services/messaging/attachment.service';

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
    private attachmentService: AttachmentService,
    private cdr: ChangeDetectorRef
  ) {}

  /* --------------------------------------------------------------
      OPEN FILE DIALOG
  -------------------------------------------------------------- */
  openFileDialog(): void {
    if (!this.disabled && !this.isUploading) {
      this.fileInput.nativeElement.click();
    }
  }

  /* --------------------------------------------------------------
      FILE SELECT
  -------------------------------------------------------------- */
  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

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

  /* --------------------------------------------------------------
      VALIDATION
  -------------------------------------------------------------- */
  private validateFiles(files: File[]) {
    const errors: string[] = [];
    let totalSize = 0;

    if (files.length > ATTACHMENT_LIMITS.MAX_FILES_PER_UPLOAD) {
      errors.push(`Maximum ${ATTACHMENT_LIMITS.MAX_FILES_PER_UPLOAD} files allowed.`);
    }

    for (const f of files) {
      totalSize += f.size;
      const res = AttachmentUtils.validateFile(f);
      if (!res.isValid) errors.push(`${f.name}: ${res.errors.join(', ')}`);
    }

    if (totalSize > ATTACHMENT_LIMITS.MAX_TOTAL_SIZE) {
      errors.push(`Total size exceeds ${AttachmentUtils.formatFileSize(ATTACHMENT_LIMITS.MAX_TOTAL_SIZE)}`);
    }

    return { isValid: errors.length === 0, errors };
  }

  /* --------------------------------------------------------------
      UPLOAD (one-by-one)
  -------------------------------------------------------------- */
  private startUpload(): void {
    if (!this.chatId || this.selectedFiles.length === 0) {
      this.uploadError.emit('Missing chat ID or files.');
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;
    this.uploadStart.emit(this.selectedFiles);

    const uploaded: Attachment[] = [];
    let completed = 0;

    this.selectedFiles.forEach(file => {
      this.attachmentService.uploadFile(file).subscribe({
        next: (event: HttpEvent<any>) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            this.uploadProgress = Math.round((event.loaded / event.total) * 100);
            this.cdr.detectChanges();
          }

          if (event.type === HttpEventType.Response) {
            uploaded.push(event.body.data);
            completed++;

            if (completed === this.selectedFiles.length) {
              this.uploadComplete.emit(uploaded);
              this.resetUploadState();
            }
          }
        },

        error: (err) => {
          this.handleUploadError(err);
          this.resetUploadState();
        }
      });
    });
  }

  /* --------------------------------------------------------------
      ERROR HANDLING
  -------------------------------------------------------------- */
  private handleUploadError(error: any): void {
    let msg = 'Upload failed.';
    if (error.error?.error) msg = error.error.error;
    if (error.error?.errors) msg = error.error.errors.join('; ');
    if (error.message) msg = error.message;

    this.uploadError.emit(msg);
  }

  /* --------------------------------------------------------------
      RESET HELPERS
  -------------------------------------------------------------- */
  private resetFileInput(): void {
    this.fileInput.nativeElement.value = '';
  }

  private resetUploadState(): void {
    this.isUploading = false;
    this.uploadProgress = 0;
    this.selectedFiles = [];
    this.cdr.detectChanges();
  }

  /* --------------------------------------------------------------
      DOWNLOAD
  -------------------------------------------------------------- */
  downloadAttachment(file: Attachment) {
    this.attachmentService.downloadFile(file.key).subscribe(res => {
      window.open(res.url, '_blank');
    });
  }

  /* --------------------------------------------------------------
      DELETE
  -------------------------------------------------------------- */
  deleteAttachment(file: Attachment) {
    this.attachmentService.deleteObject(file.key).subscribe({
      next: () => {
        // Optionally emit event to parent
      },
      error: (err) => this.uploadError.emit('Delete failed: ' + err?.message)
    });
  }

  displayAttachment() {
    return this.selectedFiles.length > 0;
  }

  /* --------------------------------------------------------------
      UI HELPERS
  -------------------------------------------------------------- */
  get acceptedFileTypes(): string {
    return ATTACHMENT_LIMITS.ALLOWED_EXTENSIONS.map(ext => `.${ext}`).join(',');
  }

  getButtonIcon(): string {
    if (!this.isUploading) return 'pi pi-paperclip';
    return this.uploadProgress === 100 ? 'pi pi-check' : 'pi pi-spin pi-spinner';
  }

  getTooltipText(): string {
    if (!this.isUploading) return 'Attach files';
    return this.uploadProgress === 100
      ? 'Upload complete'
      : `Uploading... ${this.uploadProgress}%`;
  }
}
