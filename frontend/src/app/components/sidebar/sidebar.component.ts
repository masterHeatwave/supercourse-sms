import { Component, Input, Output, EventEmitter, OnInit, HostListener, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SidebarModule } from 'primeng/sidebar';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import type { MenuItem } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ImageModule } from 'primeng/image';
import { BranchSelectorComponent } from '../branch-selector/branch-selector.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [SidebarModule, ButtonModule, MenuModule, CommonModule, RouterModule, ImageModule, BranchSelectorComponent, TranslateModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  isMobile = false;
  private isBrowser: boolean;

  menuItems: MenuItem[] = [
    { label: 'sidebar.dashboard', icon: 'pi pi-home', routerLink: ['/dashboard/'] },
    { label: 'sidebar.staff', icon: 'pi pi-hashtag', routerLink: ['/dashboard/staff'] },
    { label: 'sidebar.students', icon: 'pi pi-users', routerLink: ['/dashboard/students'] },
    { label: 'sidebar.classes', icon: 'pi pi-warehouse', routerLink: ['/dashboard/classes'] },
    { label: 'sidebar.sessions', icon: 'pi pi-clock', routerLink: ['/dashboard/sessions'] },
    { label: 'sidebar.timetable', icon: 'pi pi-calendar-clock', routerLink: ['/dashboard/sessions/timetable'] },
    { label: 'sidebar.resources', icon: 'pi pi-box', routerLink: ['/dashboard/resources'] },
    { label: 'sidebar.assignments', icon: 'pi pi-book', routerLink: ['/dashboard/assignments'] },
    { label: 'sidebar.progress', icon: 'pi pi-chart-line', routerLink: ['/dashboard/progress'] },
    { label: 'sidebar.revision-center', icon: 'pi pi-microchip-ai', routerLink: ['/dashboard/revision-center'] },
    // { label: 'sidebar.resources', icon: 'pi pi-server', routerLink: ['/dashboard/resources'] },
    { label: 'sidebar.wellness-center', icon: 'pi pi-face-smile', routerLink: ['/dashboard/wellness-center'] },
    { label: 'sidebar.board', icon: 'pi pi-clipboard', routerLink: ['/dashboard/board'] },
    { label: 'sidebar.calendar', icon: 'pi pi-calendar-minus', routerLink: ['/dashboard/calendar'] },
    { label: 'sidebar.elibrary', icon: 'pi pi-book', routerLink: ['/dashboard/elibrary'] },
    { label: 'sidebar.assets', icon: 'pi pi-list', routerLink: ['/dashboard/assets'] }
  ];

  constructor(private router: Router, @Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.checkScreenSize();
    }
  }

  @HostListener('window:resize')
  checkScreenSize() {
    if (this.isBrowser) {
      this.isMobile = window.innerWidth < 768; // Adjust breakpoint as needed
    }
  }

  onHide() {
    this.visibleChange.emit(false);
  }

  /**
   * Determine if a sidebar menu item should appear active based on current URL.
   * Special handling to avoid marking "Sessions" active when on "Timetable".
   */
  isMenuItemActive(item: MenuItem): boolean {
    const currentUrl = (this.router?.url || '').replace(/\/$/, '');
    const rawLink = Array.isArray(item.routerLink)
      ? String(item.routerLink[0] ?? '')
      : String((item as any).routerLink ?? '');
    const linkPath = rawLink.replace(/\/$/, '');

    if (!linkPath) return false;

    // Dashboard root should be exact
    if (linkPath === '/dashboard') {
      return currentUrl === '/dashboard';
    }

    // Sessions should be active for its section, except when on timetable
    if (linkPath === '/dashboard/sessions') {
      return currentUrl.startsWith('/dashboard/sessions') && !currentUrl.startsWith('/dashboard/sessions/timetable');
    }

    // Default: startsWith semantics (parent remains active for children)
    return currentUrl.startsWith(linkPath);
  }
}
