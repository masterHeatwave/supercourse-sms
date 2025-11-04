import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { DocumentService, Document } from '@services/document.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { IDocument } from '@interfaces/staff.interfaces';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule, ButtonModule, TableModule, TooltipModule, ToastModule],
  providers: [MessageService],
  template: `
    <div class="document-list">
      <p-toast></p-toast>
      <p-table 
        [value]="processedDocuments" 
        [styleClass]="'p-datatable-sm'" 
        *ngIf="documents.length > 0"
        sortMode="multiple"
        [sortField]="'name'"
        [sortOrder]="1">
        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="name" style="width: 40%">
              Document Name 
              <p-sortIcon field="name"></p-sortIcon>
            </th>
            <th pSortableColumn="type" style="width: 20%">
              Type 
              <p-sortIcon field="type"></p-sortIcon>
            </th>
            <th pSortableColumn="size" style="width: 15%">
              Size 
              <p-sortIcon field="size"></p-sortIcon>
            </th>
            <th style="width: 25%">Actions</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-document let-i="rowIndex">
          <tr>
            <td>{{document.name}}</td>
            <td>{{document.type}}</td>
            <td>{{formatFileSize(document.size)}}</td>
            <td>
              <div class="flex gap-2">
                <button 
                  pButton 
                  icon="pi pi-download" 
                  class="p-button-sm p-button-secondary"
                  pTooltip="Download"
                  (click)="onDownload(document, i)">
                </button>
                <button 
                  *ngIf="showDeleteButton"
                  pButton 
                  icon="pi pi-trash" 
                  class="p-button-sm p-button-danger"
                  pTooltip="Remove"
                  (click)="onRemove(i)">
                </button>
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>
      <div class="my-3 text-center text-gray-500" *ngIf="documents.length === 0">
        No documents uploaded yet
      </div>
    </div>
  `,
  styles: [`
    .document-list {
      max-height: 300px;
      overflow-y: auto;
    }
    .p-datatable .p-datatable-header {
      background: var(--surface-50);
      border: 1px solid var(--surface-300);
    }
    .p-datatable .p-datatable-thead > tr > th {
      background: var(--surface-50);
      border: 1px solid var(--surface-300);
      font-weight: 600;
    }
    .p-datatable .p-sortable-column:hover {
      background: var(--surface-100);
    }
    .p-datatable .p-sortable-column.p-highlight {
      background: var(--primary-50);
      color: var(--primary-700);
    }
    .p-datatable .p-sortable-column.p-highlight .p-sortable-column-icon {
      color: var(--primary-700);
    }
  `]
})
export class DocumentListComponent {
  @Input() documents: (Document | IDocument | string)[] = [];
  @Input() showDeleteButton: boolean = true; // Default to true for backward compatibility
  @Output() download = new EventEmitter<{document: Document | IDocument | string, index: number}>();
  @Output() remove = new EventEmitter<number>();

  constructor(
    private documentService: DocumentService,
    private messageService: MessageService
  ) {}

  // Get processed documents for the table with sorting-friendly properties
  get processedDocuments() {
    return this.documents.map((doc, index) => ({
      name: this.getDocumentName(doc),
      type: this.getDocumentType(doc),
      size: this.getDocumentSize(doc),
      originalIndex: index,
      originalDocument: doc
    }));
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  onDownload(document: any, index: number): void {
    // Use the original document from the processed data
    const originalDoc = document.originalDocument || document;
    
    // Convert to Document type for the service
    const docToDownload: Document = {
      id: this.getDocumentId(originalDoc),
      name: this.getDocumentName(originalDoc),
      type: this.getDocumentType(originalDoc),
      path: this.getDocumentPath(originalDoc),
      upload_date: this.getUploadDate(originalDoc),
      size: this.getDocumentSize(originalDoc)
    };

    this.documentService.downloadDocument(docToDownload).subscribe({
      next: (success: boolean) => {
        if (success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Successfully initiated download for ${document.name}`
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to download ${document.name}`
          });
        }
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'Failed to download document'
        });
      }
    });

    // Also emit the download event for any parent component that wants to listen
    this.download.emit({ document: originalDoc, index: document.originalIndex || index });
  }

  onRemove(index: number): void {
    if (this.showDeleteButton) {
      // The index parameter is from the table row, we need to get the original index from the processed document
      const processedDoc = this.processedDocuments[index];
      if (processedDoc && processedDoc.originalIndex !== undefined) {
        this.remove.emit(processedDoc.originalIndex);
      } else {
        this.remove.emit(index);
      }
    }
  }

  getDocumentId(document: Document | IDocument | string): string {
    if (typeof document === 'string') {
      return document.split('/').pop() || 'unknown';
    }
    return document.id || document.name || 'unknown';
  }

  getDocumentName(document: Document | IDocument | string): string {
    if (typeof document === 'string') {
      return document.split('/').pop() || 'unknown';
    }
    return document.name || 'unknown';
  }

  getDocumentType(document: Document | IDocument | string): string {
    if (typeof document === 'string') {
      return this.getFileTypeDisplay(document);
    }
    return document.type || this.getFileTypeDisplay(document.name || '');
  }

  getDocumentPath(document: Document | IDocument | string): string {
    if (typeof document === 'string') {
      return document;
    }
    if ('path' in document && document.path) {
      return document.path;
    }
    if ('url' in document && document.url) {
      return document.url;
    }
    return '';
  }

  getDocumentSize(document: Document | IDocument | string): number {
    if (typeof document === 'string') {
      return 0;
    }
    return document.size || 0;
  }

  getUploadDate(document: Document | IDocument | string): string {
    if (typeof document === 'string') {
      return new Date().toISOString();
    }
    if ('upload_date' in document && document.upload_date) {
      return document.upload_date;
    }
    return new Date().toISOString();
  }

  private getFileType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'doc':
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      default:
        return 'application/octet-stream';
    }
  }

  private getFileTypeDisplay(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    switch (extension) {
      case 'pdf':
        return 'PDF';
      case 'doc':
      case 'docx':
        return 'Word Document';
      case 'xls':
      case 'xlsx':
        return 'Excel Document';
      case 'ppt':
      case 'pptx':
        return 'PowerPoint Document';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'svg':
        return 'Image';
      case 'txt':
        return 'Text File';
      case 'zip':
      case 'rar':
      case '7z':
        return 'Archive';
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
        return 'Video';
      case 'mp3':
      case 'wav':
      case 'flac':
        return 'Audio';
      default:
        return 'Document';
    }
  }
} 