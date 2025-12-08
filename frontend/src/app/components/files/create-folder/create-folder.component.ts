import { Component, inject, Signal } from '@angular/core';
import { StorageService } from '@gen-api/storage/storage.service';
import { StorageStateService } from '@services/storage/storage-state.service';
import { FloatLabelModule } from "primeng/floatlabel";
import { Button } from "primeng/button";
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-folder',
  standalone: true,
  imports: [FloatLabelModule, Button, InputTextModule, FormsModule],
  templateUrl: './create-folder.component.html',
  styleUrl: './create-folder.component.scss'
})
export class CreateFolderComponent {
  private storageStateService = inject(StorageStateService);
  private storageService = inject(StorageService);

  userId: Signal<string> = this.storageStateService.userId;
  prefix: Signal<string> = this.storageStateService.prefix;

  folder: string = '';

  createFolder() {

    if (this.userId()) {

      const rootFolder = this.prefix().endsWith('/') ? this.prefix().slice(0, -1) : this.prefix();

      this.storageService.postStorageCreateFolder({ userId: this.userId(), prefix: this.folder === '' ? `${rootFolder}/New folder` : `${rootFolder}/${this.folder}` }).subscribe({
        next: (response) => {
          console.log('CREATED-FOLDER')
          this.folder = '';
          this.storageStateService.triggerFetchFiles.update(value => !value);
        },
        error: (err) => {
          console.error('Error creating folder:', err);
        }
      });
    }
  }
}
