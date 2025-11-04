import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '@environments/environment';

export interface Document {
  id?: string;
  name: string;
  type: string;
  path: string;
  uploaded_by?: string;
  upload_date?: string;
  size?: number;
  description?: string;
  tags?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private apiUrl = environment.apiUrl;
  private assetUrl = environment.assetUrl;

  constructor(private http: HttpClient) {}

  /**
   * Download a document from the server
   * @param doc Document to download
   * @returns Observable that completes when download is triggered
   */
  downloadDocument(doc: Document): Observable<boolean> {
    // For files served from assets, we can directly trigger a download
    if (doc.path.startsWith('/assets/')) {
      this.triggerBrowserDownload(doc);
      return of(true);
    }

    // For API-served files
    const downloadUrl = doc.path.startsWith('http') ? doc.path : `${this.assetUrl}/media/${doc.path.replace(/^media\//, '')}`;

    return this.http.get(downloadUrl, { responseType: 'blob' }).pipe(
      tap((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.name;
        document.body.appendChild(link);
        link.click();

        // Clean up
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 100);
      }),
      map(() => true),
      catchError((err) => {
        console.error('Error downloading document:', err);
        return of(false);
      })
    );
  }

  /**
   * Get all documents for a user
   * @param userId User ID
   * @returns Observable list of documents
   */
  getUserDocuments(userId: string): Observable<Document[]> {
    // Return empty array since we're handling documents directly in the component
    return of([]);
  }

  private getFileType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
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

  /**
   * Upload a document for a user
   * @param userId User ID
   * @param file File to upload
   * @param metadata Additional metadata
   * @returns Observable with the uploaded document info
   */
  uploadUserDocument(userId: string, file: File, metadata?: Partial<Document>): Observable<Document> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    if (metadata) {
      if (metadata.name) formData.append('name', metadata.name);
      if (metadata.description) formData.append('description', metadata.description);
      if (metadata.tags) formData.append('tags', JSON.stringify(metadata.tags));
    }

    return this.http.post<{ success: boolean; data: Document }>(`${this.apiUrl}/files/upload`, formData).pipe(
      map((response) => response.data),
      catchError((error) => {
        console.error('Error uploading document:', error);
        throw error;
      })
    );
  }

  /**
   * Delete a user document
   * @param documentId Document ID to delete
   * @returns Observable with success status
   */
  deleteUserDocument(documentId: string): Observable<boolean> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/files/${documentId}`).pipe(
      map((response) => response.success),
      catchError((error) => {
        console.error('Error deleting document:', error);
        return of(false);
      })
    );
  }

  /**
   * Trigger browser download for file via anchor element
   * @param doc Document to download
   */
  private triggerBrowserDownload(doc: Document): void {
    try {
      const link = document.createElement('a');
      link.href = doc.path;
      link.download = doc.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);

      console.log(`Downloading document: ${doc.name}`);
    } catch (error) {
      console.error('Error triggering download:', error);
    }
  }
}
