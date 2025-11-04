import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentListComponent } from '../../document-list/document-list.component';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { environment } from '../../../../environments/environment';
import { IDocument } from '../../../interfaces/student.interface';

@Component({
  selector: 'app-documents-table',
  standalone: true,
  imports: [CommonModule, DocumentListComponent, ButtonModule, ToastModule],
  templateUrl: './documents-table.component.html',
  styleUrl: './documents-table.component.scss',
  providers: [MessageService]
})
export class DocumentsTableComponent {
  @Input() documentsData: (IDocument | string)[] = [];
  @Output() documentDeleted = new EventEmitter<IDocument | string>();

  constructor(private messageService: MessageService) {}

  // Get data in the format needed for document list
  get processedDocuments(): (IDocument | string)[] {
    if (!this.documentsData || !Array.isArray(this.documentsData)) {
      console.log('No documents data or not array:', this.documentsData);
      return [];
    }

    return this.documentsData.map((doc) => {
      if (typeof doc === 'string') {
        // If document is just a path string, create a proper structure
        const name = doc.split('/').pop() || doc;
        const cleanPath = doc.replace(/^media\//, '');
        
        return {
          name: name,
          url: doc.startsWith('http') ? doc : `${environment.assetUrl}/media/${cleanPath}`,
          type: this.getFileType(name),
          size: undefined,
          path: doc
        } as IDocument;
      } else {
        // If document is an IDocument object, ensure proper URL
        const cleanPath = doc.url ? doc.url.replace(/^media\//, '') : '';
        
        return {
          ...doc,
          url: doc.url ? (doc.url.startsWith('http') ? doc.url : `${environment.assetUrl}/media/${cleanPath}`) : '',
          type: doc.type || this.getFileType(doc.name || ''),
          name: doc.name || doc.url?.split('/').pop() || 'Document'
        } as IDocument;
      }
    });
  }

  private getFileType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
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

  onDownloadDocument(event: { document: IDocument | string; index: number }) {
    console.log('Download document:', event.document);
    
    const doc = event.document;
    let downloadUrl = '';
    let fileName = '';

    if (typeof doc === 'string') {
      downloadUrl = doc.startsWith('http') ? doc : `${environment.assetUrl}/media/${doc.replace(/^media\//, '')}`;
      fileName = doc.split('/').pop() || 'document';
    } else {
      downloadUrl = doc.url || '';
      fileName = doc.name || 'document';
    }

    if (downloadUrl) {
      try {
        const link = window.document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        link.target = '_blank';
        link.style.display = 'none';
        
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Download started for ${fileName}`
        });
      } catch (error) {
        console.error('Download error:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to download document'
        });
      }
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Document URL not found'
      });
    }
  }

  onRemoveDocument(index: number) {
    console.log('Remove document at index:', index);
    
    if (index >= 0 && index < this.documentsData.length) {
      const documentToRemove = this.documentsData[index];
      
      // Emit the original document for deletion
      this.documentDeleted.emit(documentToRemove);
      
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Document has been removed'
      });
    }
  }
}
