import { Component, effect, inject, Signal, ViewChild } from '@angular/core';
import { StorageStateService } from '@services/storage/storage-state.service';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { CommonModule } from '@angular/common';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-path-breadcrumbs',
  standalone: true,
  imports: [BreadcrumbModule, OverlayPanelModule, CommonModule, MenuModule],
  templateUrl: './path-breadcrumbs.component.html',
  styleUrl: './path-breadcrumbs.component.scss'
})
export class PathBreadcrumbsComponent {
  @ViewChild('menu') menu!: Menu;

  private storageStateService = inject(StorageStateService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  userId: Signal<string> = this.storageStateService.userId;
  prefix: Signal<string> = this.storageStateService.prefix;

  items: MenuItem[] = [];

  collapsedItems: MenuItem[] = [];

  home: MenuItem;

  maxVisible = 3;

  constructor() {

    effect(() => {
      this.items = this.prefix().split('/').map((folderName, index) => ({ label: folderName, command: () => this.onItemClick(index) })).filter(item => item.label !== this.userId()).filter(item => item.label !== '');
      this.updateDisplayItems();
    })

    this.home = { icon: 'pi pi-home', command: () => this.onItemClick(0) };
  }

  updateDisplayItems() {

    if (this.items.length > this.maxVisible) {
      const penultimate = this.items[this.items.length - 2];
      const last = this.items[this.items.length - 1];

      this.collapsedItems = this.items.slice(0, -2);

      const displayItems = [
        {
          label: ' . . . ',
          command: (event: any) => {

            this.menu.toggle(event.originalEvent);
          }
        },
        penultimate,
        last
      ];

      this.items = [...displayItems];

    }
  }

  onItemClick(index: number) {

    const url = this.router.url;
    const root = url.substring(0, url.indexOf('files') + 'files'.length)

    const path = this.prefix().split('/').slice(1, index + 1).join('/');

    // console.log(index)
    // console.log('PREFIX ' + this.prefix())
    // console.log('PATH ' + path)

    this.router.navigate([root + '/' + path]);
  }
}
