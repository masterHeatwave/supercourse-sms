import { HttpClient, HttpEventType } from '@angular/common/http';
import { Component, inject, Input, Signal } from '@angular/core';
import { StorageService } from '@gen-api/storage/storage.service';
import { StorageStateService } from '@services/storage/storage-state.service';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-file-actions',
  standalone: true,
  imports: [ButtonModule, ProgressSpinnerModule],
  templateUrl: './file-actions.component.html',
  styleUrl: './file-actions.component.scss'
})
export class FileActionsComponent {

  private storageStateService = inject(StorageStateService);
  private storageService = inject(StorageService);

  http = inject(HttpClient);

  userId: Signal<string> = this.storageStateService.userId;
  prefix: Signal<string> = this.storageStateService.prefix;

  isDownloading: boolean = false;
  progress: number = 0;

  isDeleting: boolean = false;

  displayShareModal: boolean = false;

  @Input() item: any;

  onDeleteClick(item: any): void {
    console.log('Del clicked:', item);
    this.deleteObject(item)
  }

  onDownloadClick(item: any): void {
    //console.log('Download clicked:', item);
    this.downloadObject(item);
  }

  onShareClick(item: any): void {
    console.log('Share clicked:', item);
    this.displayShareModal = true;
  }

  deleteObject(item: any) {

    if (this.userId()) {
      this.isDeleting = true;
      this.storageService.postStorageDelete({ userId: this.userId(), prefix: item.key }).subscribe({
        next: (response) => {
          //console.log('DELETED-OBJECT')
          this.isDeleting = false;
          this.storageStateService.triggerFetchFiles.update(value => !value);
          this.storageStateService.triggerFetchSize.update(value => !value);
        },
        error: (err) => {
          console.error('Error deleting folder:', err);
        }
      });
    }
  }

  downloadObject(item: any) {
    this.storageService.getStorageGetFilePrefix(encodeURIComponent(item.key), { force: true })
      .subscribe({
        next: (data: any) => {

          const url = data.url;
          const a = document.createElement('a');
          a.href = url;
          a.download = item.filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

        },
        error: (err) => {
          console.error(`Failed to open file ${item.filename}: ${err.message} `);
        }
      });
  }

}
