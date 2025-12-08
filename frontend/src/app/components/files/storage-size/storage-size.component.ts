import { Component, effect, inject, Signal } from '@angular/core';
import { StorageService } from '@gen-api/storage/storage.service';
import { StorageStateService } from '@services/storage/storage-state.service';

@Component({
  selector: 'app-storage-size',
  standalone: true,
  imports: [],
  templateUrl: './storage-size.component.html',
  styleUrl: './storage-size.component.scss'
})
export class StorageSizeComponent {


  private storageService = inject(StorageService)
  private storageStateService = inject(StorageStateService);

  userId: Signal<string> = this.storageStateService.userId;
  triggerFetchBucketSize: Signal<boolean> = this.storageStateService.triggerFetchSize;

  data: any | null = null;
  isLoading = true;
  error: any = null;



  constructor() {

    effect(() => {
      const t = this.triggerFetchBucketSize();
      this.fetchBucketSize(this.userId());
      //console.log("BUCKET-SIZE (fetched)")
    })

  }

  fetchBucketSize(userId: string): void {

    if (userId) {
      this.isLoading = true;

      this.storageService.getStorageSize({ prefix: userId })
        .subscribe({
          next: (data: any) => {
            this.data = data.data;
            this.isLoading = false;
          },
          error: (err) => {
            this.error = err.message;
            this.isLoading = false;
          }
        });
    }
  }

  formatedData(): string {

    const usedGB = ((this.data?.used || 0) / 1074000000).toFixed(2);
    const quotaGB = ((this.data?.quota || 0) / 1074000000).toFixed(2);

    return `${usedGB} GiB of ${quotaGB} GiB used`;
  }

}
