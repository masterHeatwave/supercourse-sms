import { Component, inject, Signal } from '@angular/core';
import { TabViewModule } from 'primeng/tabview';
import { ListFilesComponent } from "../list-files/list-files.component";
import { StorageStateService } from '@services/storage/storage-state.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CreateFolderComponent } from "../create-folder/create-folder.component";
import { PathBreadcrumbsComponent } from "../path-breadcrumbs/path-breadcrumbs.component";
import { StorageSizeComponent } from "../storage-size/storage-size.component";

@Component({
  selector: 'app-master-files',
  standalone: true,
  imports: [TabViewModule, ListFilesComponent, CreateFolderComponent, PathBreadcrumbsComponent, StorageSizeComponent],
  templateUrl: './master-files.component.html',
  styleUrl: './master-files.component.scss'
})
export class MasterFilesComponent {

  private storageStateService = inject(StorageStateService);
  private route = inject(ActivatedRoute);

  prefix: Signal<string> = this.storageStateService.prefix;
  userId: Signal<string> = this.storageStateService.userId;

  userFolder: string = this.userId();

  ngOnInit() {

    this.route.url.subscribe(segments => {

      const prefix = segments.map(s => s.path).join('/');

      this.storageStateService.prefix.set(`${this.userFolder}/${prefix}`)

    });

  }

}
