import { Component } from '@angular/core';
import { Router, RouterModule, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { RoleAccessService } from '@services/role-access.service';
import { Subject, takeUntil } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';

interface ResourcesMenuItem {
  label: string;
  icon: string;
  routerLink: string[];
  id: string;
}

@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [RouterModule, RouterLink, TranslateModule, ButtonModule, DividerModule],
  templateUrl: './resources.component.html',
  styleUrl: './resources.component.scss'
})
export class ResourcesComponent {
  private destroy$ = new Subject<void>();

  private allMenuItems: ResourcesMenuItem[] = [
    { label: 'resources.titleForBooks', icon: 'pi pi-book', routerLink: ['/dashboard/resources/books'], id: 'resources-books' },
    { label: 'resources.titleForFiles', icon: 'pi pi-folder', routerLink: ['/dashboard/resources/files'], id: 'resources-files' },
    { label: 'resources.titleForCustomActivities', icon: 'pi pi-th-large', routerLink: ['/dashboard/resources/custom-activities'], id: 'resources-custom-activities' }
  ];

  menuItems: ResourcesMenuItem[] = [];

  constructor(private router: Router, private roleAccessService: RoleAccessService) {}

  ngOnInit() {
    this.roleAccessService
      .getFilteredResourcesItems()
      .pipe(takeUntil(this.destroy$))
      .subscribe((allowedItems) => {
        this.menuItems = this.allMenuItems.filter((item) => allowedItems.includes(item.id));

        if (this.menuItems.length === 0) {
          console.error('⚠️ RESOURCES NAVBAR IS EMPTY! This means role matching failed.');
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isMenuItemActive(item: ResourcesMenuItem): boolean {
    const currentUrl = this.router.url.replace(/\/$/, '');
    const linkPath = item.routerLink[0].replace(/\/$/, '');

    if (!linkPath) return false;

    return currentUrl.startsWith(linkPath);
  }
}
