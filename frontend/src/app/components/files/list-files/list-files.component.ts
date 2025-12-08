import { CommonModule } from '@angular/common';
import { Component, effect, inject, Signal, ViewChild } from '@angular/core';
import { CardModule } from 'primeng/card';
import { FileUpload, FileUploadModule } from 'primeng/fileupload';
import { ProgressBarModule } from 'primeng/progressbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { SizeTransformPipe } from '@pipes/size-transform.pipe';
import { StorageService } from '@gen-api/storage/storage.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpEventType } from '@angular/common/http';
import { StorageStateService } from '@services/storage/storage-state.service';
import { StorageSizeComponent } from "../storage-size/storage-size.component";

import { Store } from '@ngrx/store';
import { selectAuthState } from '@store/auth/auth.selectors';
import { FileActionsComponent } from "../file-actions/file-actions.component";
import { PathBreadcrumbsComponent } from "../path-breadcrumbs/path-breadcrumbs.component";
import { CreateFolderComponent } from "../create-folder/create-folder.component";

@Component({
  selector: 'app-list-files',
  standalone: true,
  imports: [TableModule, CardModule, FileUploadModule, CommonModule, ProgressBarModule, ProgressSpinnerModule, SizeTransformPipe, StorageSizeComponent, FileActionsComponent, PathBreadcrumbsComponent, CreateFolderComponent],
  templateUrl: './list-files.component.html',
  styleUrl: './list-files.component.scss'
})
export class ListFilesComponent {
  store = inject(Store);
  currentUserID: string = '';

  @ViewChild('fileUpload') fileUpload!: FileUpload;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private storageService = inject(StorageService);
  private storageStateService = inject(StorageStateService);

  uploadProgress: { [key: string]: number } = {};
  isUploading: boolean = false;

  pendingFiles: any[] = [];

  userId: Signal<string> = this.storageStateService.userId;
  prefix: Signal<string> = this.storageStateService.prefix;
  triggerFetchFiles: Signal<boolean> = this.storageStateService.triggerFetchFiles;

  public isDragging = false;

  constructor() {

    effect(() => {
      const t = this.triggerFetchFiles();
      this.fetchContents(this.prefix());
      // console.log("LIST-OBJECTS (fetched)")
      // console.log(this.mergedTables)
    })

  }

  //data: BucketContents | null = null;
  isLoading: boolean = true;
  error: any = null;
  mergedTables: any = [];


  triggerFileInput(): void {

    if (this.fileUpload) {

      const fileInput = this.fileUpload.advancedFileInput.nativeElement;
      if (fileInput) {
        fileInput.click();
      }
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer && event.dataTransfer.files) {
      const files = event.dataTransfer.files;

      const uploadEvent = {
        files: Array.from(files)
      };

      this.onUpload(uploadEvent);
    }
  }

  fetchContents(prefix: string): void {

    this.isLoading = true;

    this.storageService.getStorageFilesPrefix(prefix)
      .subscribe({
        next: (data) => {

          //console.log(data?.data)
          //console.log(prefix)

          // if (!data || !data.data || data.data.length === 0) {
          //   this.redirect();
          //   return;
          // }

          this.mergedTables = [
            ...this.pendingFiles,
            ...(data?.data ?? []).filter((folder: any) => folder.type === 'folder'),
            ...(data?.data ?? []).filter((file: any) => file.type === 'file')
          ];

          this.isLoading = false

        },
        error: (err) => {
          this.error = err.message;
          this.isLoading = false;
        }
      });



  }

  onRowClick(item: any): void {

    //console.log('Row clicked:', item);

    if (item.type === 'folder') {

      this.router.navigate([item.filename], { relativeTo: this.route });
    }

    else if (item.type === 'file') {

      item.type = 'opening'

      //console.log(encodeURIComponent(item.key))

      this.storageService.getStorageGetFilePrefix(encodeURIComponent(item.key))
        .subscribe({
          next: (data: any) => {

            //console.log(data)

            const url = data.url;

            //console.log(item.contentType)

            if (['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'text/plain',
              'text/html', 'video/mp4', 'audio/mpeg'].includes(item.contentType)) {

              const windowFeatures = 'width=1280,height=720,resizable=yes,scrollbars=yes,status=yes';
              window.open(url, '_blank', windowFeatures);
            } else {

              const a = document.createElement('a');
              a.href = url;
              a.download = item.filename;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }

            item.type = 'file'
            //setTimeout(() => URL.revokeObjectURL(url), 30000);

          },
          error: (err) => {
            item.type = 'file'
            console.error(`Failed to open file ${item.filename}: ${err.message} `);
          }
        });
    }
  }

  onCancelClick(item: any): void {
    // console.log('upload cancel:', item);

  }

  onUpload(event: any): void {

    //console.log(event.files)
    const files = event.files;
    this.fileUpload.clear();

    for (const file of files) {

      this.uploadProgress[file.name] = 0;

      const pendingFileId = Date.now() + '-' + file.name;
      const pendingfile = { id: pendingFileId, type: 'pending', name: file.name, size: file.size }

      this.pendingFiles.push(pendingfile);
      this.mergedTables = [...this.pendingFiles, ...this.mergedTables.filter((item: any) => item.type !== 'pending')];

      //console.log(this.user.id)
      //console.log(this.prefix)

      this.storageService.postStorageUpload({ file }, { userId: this.userId(), prefix: this.prefix() }, { observe: 'events', reportProgress: true })
        .subscribe({
          next: (event) => {
            //console.log(event)
            this.isUploading = true;

            if (event.type === HttpEventType.UploadProgress) {

              if (event.total) {
                //this.uploadProgress[file.name] = Math.round(100 * event.loaded / event.total);
              }
            } else if (event.type === HttpEventType.Response) {

              this.uploadProgress[file.name] = 100;
              //console.log(`${ file.name } uploaded successfully`);

              this.pendingFiles = this.pendingFiles.filter(item => item.id !== pendingFileId);
              this.fetchContents(this.prefix());
              this.storageStateService.triggerFetchSize.update(value => !value);

              setTimeout(() => {
                delete this.uploadProgress[file.name];
              }, 3000);
            }
          },
          error: (err) => {

            console.error(`Upload failed for ${file.name}: ${err.message} `);
            delete this.uploadProgress[file.name];
            this.pendingFiles = this.pendingFiles.filter(item => item.id !== pendingFileId);
            this.mergedTables = [...this.pendingFiles, ...this.mergedTables.filter((item: any) => item.type !== 'pending')];
          }
        });
    }
  }



  // redirect() {
  //   const url = this.router.url;
  //   const root = url.substring(0, url.indexOf('files') + 'files'.length)
  //   this.router.navigate([root]);
  // }



}
