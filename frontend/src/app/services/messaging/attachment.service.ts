// attachment.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageService as ApiStorage } from '../../gen-api/storage/storage.service';
import { StorageStateService } from '../storage/storage-state.service';

@Injectable({
  providedIn: 'root'
})
export class AttachmentService {

  private api = inject(ApiStorage);
  private state = inject(StorageStateService);

  /* -----------------------------------------------------------
      UPLOAD (1 file per request, required by backend)
  ----------------------------------------------------------- */
  uploadFile(file: File): Observable<HttpEvent<any>> {
    const userId = this.state.userId();
    if (!userId) throw new Error('User ID missing');

    const prefix = `${userId}`;

    return this.api.postStorageUpload(
      { file },
      { userId, prefix },
      {
        observe: 'events',
        reportProgress: true
      }
    );
  }

  /* -----------------------------------------------------------
      DOWNLOAD - returns signed S3 URL
  ----------------------------------------------------------- */
  downloadFile(key: string, forceDownload: boolean = false): Observable<{ url: string }> {
    return this.api.getStorageGetFilePrefix(key, forceDownload ? { force: true } : undefined
    );
  }

  /* -----------------------------------------------------------
      LIST FILES in path
  ----------------------------------------------------------- */
  listFiles(prefix: string) {
    return this.api.getStorageFilesPrefix(prefix);
  }

  /* -----------------------------------------------------------
      STORAGE SIZE
  ----------------------------------------------------------- */
  getSize(prefix: string) {
    return this.api.getStorageSize({ prefix });
  }

  /* -----------------------------------------------------------
      CREATE FOLDER
  ----------------------------------------------------------- */
  createFolder(folderName: string) {
    const userId = this.state.userId();
    const prefix = `${userId}/${folderName}`;

    return this.api.postStorageCreateFolder({
      userId,
      prefix
    });
  }

  /* -----------------------------------------------------------
      DELETE FILE / FOLDER
  ----------------------------------------------------------- */
  deleteObject(prefix: string) {
    const userId = this.state.userId();

    return this.api.postStorageDelete({
      userId,
      prefix
    });
  }
}
