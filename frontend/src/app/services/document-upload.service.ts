import { Injectable } from '@angular/core';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DocumentUploadService {
  /**
   * Returns a reusable document upload field configuration for forms
   * @param title Optional custom title for the document section
   * @returns FormlyFieldConfig[] array for document upload section
   */
  getDocumentUploadFields(title: string = 'Upload document'): FormlyFieldConfig[] {
    return [
      {
        fieldGroupClassName: '',
        fieldGroup: [
          {
            template: `<h3 class="text-primary font-bold text-2xl mb-2">${title}:</h3>`,
          },
          {
            key: 'documents',
            type: 'primary-upload-file',
            className: 'mb-3',
            props: {
              label: 'Upload documents',
              required: false
            }
          }
        ]
      }
    ];
  }

  /**
   * Process uploaded files
   * @param files Array of uploaded files
   * @returns Processed file data
   */
  processUploadedFiles(files: any[]): any[] {
    // In a real implementation, this might handle file validation, 
    // conversion, or any other processing
    return files;
  }

  /**
   * Remove a file from the uploaded files array
   * @param files Current array of files
   * @param index Index of file to remove
   * @returns Updated array of files
   */
  removeFile(files: any[], index: number): any[] {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    return updatedFiles;
  }

  /**
   * Download a document
   * @param document Document to download
   * @returns Observable with download success status
   */
  downloadDocument(doc: any): Observable<boolean> {
    // In a real implementation, this would connect to a backend API
    // to stream the file for download
    
    try {
      // Create a blob from the file data (in a real app this might come from the server)
      if (doc instanceof File) {
        const url = URL.createObjectURL(doc);
        
        // Create a link and trigger the download
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.name;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return of(true);
      } else if (doc.url) {
        // If the document already has a URL (e.g., from the server)
        window.open(doc.url, '_blank');
        return of(true);
      }
    } catch (error) {
      console.error('Error downloading document:', error);
    }
    
    return of(false);
  }
} 