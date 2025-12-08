import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

interface AccountMenuItem {
  label: string;
  icon: string;
  routerLink: string[];
  id: string;
}

@Component({
  selector: 'app-account-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule
  ],
  templateUrl: './account-layout.component.html',
  styleUrl: './account-layout.component.scss'
})
export class AccountLayoutComponent implements OnInit {
  // All available account menu items
  menuItems: AccountMenuItem[] = [
    { label: 'account.profileTab', icon: 'pi pi-user', routerLink: ['/dashboard/account/profile'], id: 'profile' },
    { label: 'account.securityTab', icon: 'pi pi-lock', routerLink: ['/dashboard/account/security'], id: 'security' },
    { label: 'account.displayTab', icon: 'pi pi-palette', routerLink: ['/dashboard/account/display'], id: 'display' },
    { label: 'account.notificationsTab', icon: 'pi pi-bell', routerLink: ['/dashboard/account/notifications'], id: 'notifications' }
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    // No role-based filtering needed for account settings
    // All users can access their own account settings
  }

  /**
   * Determine if an account menu item should appear active based on current URL
   */
  isMenuItemActive(item: AccountMenuItem): boolean {
    const currentUrl = this.router.url.replace(/\/$/, '');
    const linkPath = item.routerLink[0].replace(/\/$/, '');
    
    if (!linkPath) return false;
    
    // Exact match for better precision
    return currentUrl.startsWith(linkPath);
  }
}

