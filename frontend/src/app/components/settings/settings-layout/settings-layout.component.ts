import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { RoleAccessService } from '@services/role-access.service';
import { Subject, takeUntil } from 'rxjs';

interface SettingsMenuItem {
  label: string;
  icon: string;
  routerLink: string[];
  id: string;
}

@Component({
  selector: 'app-settings-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule
  ],
  templateUrl: './settings-layout.component.html',
  styleUrl: './settings-layout.component.scss'
})
export class SettingsLayoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // All available settings menu items
  private allMenuItems: SettingsMenuItem[] = [
    { label: 'settings.schoolInfo', icon: 'pi pi-building', routerLink: ['/dashboard/settings/school-info'], id: 'school-info' },
    { label: 'settings.academicYears', icon: 'pi pi-calendar', routerLink: ['/dashboard/settings/academic-years'], id: 'academic-years' },
    { label: 'settings.classrooms.title', icon: 'pi pi-th-large', routerLink: ['/dashboard/settings/classrooms'], id: 'classrooms' },
    { label: 'settings.roles.title', icon: 'pi pi-shield', routerLink: ['/dashboard/settings/roles'], id: 'roles' }
  ];

  // Filtered menu items based on role
  menuItems: SettingsMenuItem[] = [];

  constructor(
    private router: Router,
    private roleAccessService: RoleAccessService
  ) {}

  ngOnInit() {
    // Subscribe to role changes and filter menu items
    this.roleAccessService.getFilteredSettingsItems()
      .pipe(takeUntil(this.destroy$))
      .subscribe(allowedItems => {
        // Filter menu items based on allowed items
        this.menuItems = this.allMenuItems.filter(item => 
          allowedItems.includes(item.id)
        );

        // If no items after filtering, log warning
        if (this.menuItems.length === 0) {
          console.error('⚠️ SETTINGS SIDEBAR IS EMPTY! This means role matching failed.');
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Determine if a settings menu item should appear active based on current URL
   */
  isMenuItemActive(item: SettingsMenuItem): boolean {
    const currentUrl = this.router.url.replace(/\/$/, '');
    const linkPath = item.routerLink[0].replace(/\/$/, '');
    
    if (!linkPath) return false;
    
    // Exact match for better precision
    return currentUrl.startsWith(linkPath);
  }
}

