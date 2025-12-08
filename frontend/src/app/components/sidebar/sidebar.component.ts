import { Component, Input, Output, EventEmitter, OnInit, HostListener, PLATFORM_ID, Inject, OnDestroy } from '@angular/core';
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
import { RoleAccessService } from '@services/role-access.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [SidebarModule, ButtonModule, MenuModule, CommonModule, RouterModule, ImageModule, BranchSelectorComponent, TranslateModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  isMobile = false;
  private isBrowser: boolean;
  private destroy$ = new Subject<void>();

  private allMenuItems: MenuItem[] = [
    { label: 'sidebar.dashboard', icon: 'pi pi-home', routerLink: ['/dashboard/'], id: 'dashboard' },
    { label: 'sidebar.staff', icon: 'pi pi-hashtag', routerLink: ['/dashboard/staff'], id: 'staff' },
    { label: 'sidebar.students', icon: 'pi pi-users', routerLink: ['/dashboard/students'], id: 'students' },
    { label: 'sidebar.classes', icon: 'pi pi-warehouse', routerLink: ['/dashboard/classes'], id: 'classes' },
    { label: 'sidebar.sessions', icon: 'pi pi-clock', routerLink: ['/dashboard/sessions'], id: 'sessions' },
    { label: 'sidebar.timetable', icon: 'pi pi-calendar-clock', routerLink: ['/dashboard/sessions/timetable'], id: 'timetable' },
    { label: 'sidebar.resources', icon: 'pi pi-box', routerLink: ['/dashboard/resources'], id: 'resources' }, //* SUPER COURSE
    { label: 'sidebar.assignments', icon: 'pi pi-book', routerLink: ['/dashboard/assignments'], id: 'assignments' }, //* SUPER COURSE
    { label: 'sidebar.progress', icon: 'pi pi-chart-line', routerLink: ['/dashboard/progress'], id: 'progress' }, //* SUPER COURSE
    { label: 'sidebar.revision-center', icon: 'pi pi-microchip-ai', routerLink: ['/dashboard/revision-center'], id: 'revision-center' }, //* SUPER COURSE
    { label: 'sidebar.wellness-center', icon: 'pi pi-face-smile', routerLink: ['/dashboard/wellness-center'], id: 'wellness-center' }, //* SUPER COURSE
    { label: 'sidebar.board', icon: 'pi pi-clipboard', routerLink: ['/dashboard/board'], id: 'board' },
    { label: 'sidebar.calendar', icon: 'pi pi-calendar-minus', routerLink: ['/dashboard/calendar'], id: 'calendar' },
    { label: 'sidebar.elibrary', icon: 'pi pi-book', routerLink: ['/dashboard/elibrary'], id: 'elibrary' },
    { label: 'sidebar.assets', icon: 'pi pi-list', routerLink: ['/dashboard/assets'], id: 'assets' },
    { label: 'sidebar.analytics', icon: 'pi pi-chart-pie', routerLink: ['/dashboard/analytics'], id: 'analytics' }, //* SUPER COURSE
    { label: 'sidebar.finances', icon: 'pi pi-money-bill', routerLink: ['/dashboard/finances'], id: 'finances' }, //* SUPER COURSE
    { label: 'sidebar.marketing-tool', icon: 'pi pi-image', routerLink: ['/dashboard/marketing-tool'], id: 'marketing-tool' }, //* SUPER COURSE
  ];

  // Filtered menu items based on role
  menuItems: MenuItem[] = [];

  constructor(
    private router: Router, 
    @Inject(PLATFORM_ID) platformId: object,
    private roleAccessService: RoleAccessService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.checkScreenSize();
    }

    // Subscribe to role changes and filter menu items
    this.roleAccessService.getFilteredSidebarItems()
      .pipe(takeUntil(this.destroy$))
      .subscribe(allowedItems => {
        
        // Filter menu items based on allowed items
        this.menuItems = this.allMenuItems.filter(item => 
          allowedItems.includes(item.id as string)
        );
        
        // If no items after filtering, log warning
        if (this.menuItems.length === 0) {
          console.error('⚠️ SIDEBAR IS EMPTY! This means role matching failed.');
          console.error('Check the console logs above for role matching details.');
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
