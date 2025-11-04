import { Component, EventEmitter, Output, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { FormsModule } from '@angular/forms';
import type { MenuItem } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { DividerModule } from 'primeng/divider';
import { RadioButtonModule } from 'primeng/radiobutton';
import { Store } from '@ngrx/store';
import { AppState } from '@store/app.state';
import { AuthActions } from '@store/auth/auth.actions';
import { IAuthState, IRole } from '@store/auth/auth.model';
import { User } from '@gen-api/schemas';
import { Subject } from 'rxjs';
import { CustomersService } from '@gen-api/customers/customers.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { MessagingContainerComponent } from '@components/messaging/messaging-container/messaging-container.component';


@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [ButtonModule, ToolbarModule, AvatarModule, MenuModule, CommonModule, RouterModule, DividerModule, RadioButtonModule, FormsModule, TranslateModule, MessagingContainerComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Output() toggleSidebarEvent = new EventEmitter<void>();
  @ViewChild('userMenu') userMenu: any;
  @ViewChild('messagingContainer') messagingContainer!: MessagingContainerComponent;

  currentPageTitle = 'Dashboard';
  items: MenuItem[] = [];
  selectedSchool: string = '';
  selectedRole: string = '';
  selectedChildId: string = '';
  currentUser: User | null = null;
  userRoles: { label: string; value: string; id: string }[] = [];
  roleMenuItems: any;
  childMenuItems: any;
  childrenOptions: { label: string; value: string; id: string }[] = [];
  isImpersonating = false;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private store: Store<AppState>,
    private customersService: CustomersService,
    public translate: TranslateService,
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updatePageTitle();
      });

    // Subscribe to the auth state to get current user
    this.store
      .select((state: AppState) => state.auth)
      .pipe(takeUntil(this.destroy$))
      .subscribe((authState: IAuthState) => {
        this.currentUser = authState.user;
        this.isImpersonating = !!authState.impersonation?.active;

        // Extract roles from the user
        this.updateUserRoles();

        // Set the selected role using currentRoleTitle/currentRoleId, then fallbacks
        if (authState.currentRoleTitle) {
          this.selectedRole = authState.currentRoleTitle;
        } else if (authState.currentRoleId && this.currentUser?.roles) {
          // Find the role that matches the currentRoleId
          const currentRole = this.currentUser.roles.find((role: any) => role.id === authState.currentRoleId);

          if (currentRole) {
            this.selectedRole = currentRole.title;
          }
        } else if (this.currentUser && typeof this.currentUser.role_title === 'string') {
          this.selectedRole = this.currentUser.role_title;
        } else if (this.userRoles.length > 0) {
          // Default to first role if no primary role set
          this.selectedRole = this.userRoles[0].value;
        }

        // Update customer/school name if available
        if (authState.currentCustomerId) {
          // Fetch the customer name using the customer service
          this.customersService.getCustomersId(authState.currentCustomerId).subscribe({
            next: (response: any) => {
              if (response?.data) {
                this.selectedSchool = response.data.name || response.data.nickname || 'Current School';
              }
            },
            error: (error: any) => {
              console.error('Error fetching customer:', error);
              this.selectedSchool = 'Current School';
            }
          });
        } else if (this.currentUser && this.currentUser.default_branch && this.currentUser.branches && this.currentUser.branches.length > 0) {
          // Find the branch name from the branches array
          const branch = this.currentUser?.branches?.find((b: any) => b.id === this.currentUser?.default_branch);

          if (branch && typeof branch === 'object') {
            this.selectedSchool = (branch as any).name || '';
          } else if (this.currentUser.customers?.[0] && typeof this.currentUser.customers[0] === 'object') {
            const customer = this.currentUser.customers[0] as any;
            this.selectedSchool = customer.name || customer.nickname || '';
          }
        }

        // Fetch children if user is parent or we are impersonating
        this.fetchChildren();

        // Update menu items with the roles and children
        this.updateMenuItems();
      });

    // Set initial title
    this.updatePageTitle();
  }

  updateUserRoles() {
    if (!this.currentUser?.roles || !Array.isArray(this.currentUser.roles)) {
      this.userRoles = [];
      return;
    }

    this.userRoles = this.currentUser.roles.map((role: any) => ({
      label: role.title,
      value: role.title,
      id: role.id
    }));
  }

  updateMenuItems() {
    // Create the role menu items with the actual user roles
    this.roleMenuItems = {
      radioGroup: 'role',
      options: this.userRoles,
      selectedValue: this.selectedRole,
      onChange: (event: any) => this.onRoleChange(event)
    };

    // Create the child menu items if any children exist
    this.childMenuItems = this.childrenOptions.length > 0 ? {
      radioGroup: 'child',
      options: this.childrenOptions,
      selectedValue: this.selectedChildId,
      onChange: (event: any) => this.onChildChange(event)
    } : null;

    this.items = [
      {
        label: 'Select role',
        isHeader: true
      },
      this.roleMenuItems,
      ...(this.childMenuItems ? [{ separator: true }, { label: 'Login as', isHeader: true }, this.childMenuItems] : []),
      ...(this.isImpersonating
        ? [{ separator: true }, { label: 'Return to my account', icon: 'pi pi-undo', command: () => this.exitImpersonation() }]
        : []),
      {
        separator: true
      },
      {
        label: 'Profile',
        isHeader: true
      },
      {
        label: 'View Profile',
        icon: 'pi pi-user',
        command: () => {
          // eslint-disable-next-line no-console
          console.log('View Profile clicked');
        }
      },
      {
        label: 'Account Settings',
        icon: 'pi pi-cog',
        command: () => {
          // eslint-disable-next-line no-console
          console.log('Settings clicked');
        }
      },
      {
        label: 'School',
        isHeader: true
      },
      {
        label: 'View School',
        icon: 'pi pi-building',
        command: () => {
          // eslint-disable-next-line no-console
          console.log('View School clicked');
        }
      },
      {
        label: 'School Settings',
        icon: 'pi pi-cog',
        command: () => {

          window.location.href = '/dashboard/settings';
        }
      },
      {
        separator: true
      },
      {
        label: 'Logout',
        icon: 'pi pi-sign-out',
        command: () => {
          this.logout();
        }
      }
    ];
  }

  onRoleChange(role: any) {
    if (role && role.id && role.value) {
      this.selectedRole = role.value;

      // Dispatch the action to update the role in the state
      this.store.dispatch(
        AuthActions.changeCurrentRole({
          roleId: role.id,
          roleTitle: role.value
        })
      );

      // Force a refresh to update the auth header with the new role
      window.location.reload();
    }
  }

  onChildChange(child: any) {
    if (child && child.id) {
      this.selectedChildId = child.id;
      // Dispatch impersonation action
      this.store.dispatch(AuthActions.impersonateStudent({ studentId: child.id }));
      // Force a refresh after a short delay to reinitialize app state
      setTimeout(() => window.location.reload(), 300);
    }
  }

  exitImpersonation() {
    this.store.dispatch(AuthActions.exitImpersonation());
    setTimeout(() => window.location.reload(), 300);
  }

  private fetchChildren() {
    // Call backend endpoint to fetch children linked by contact email
    // Using placeholder; interceptor will replace with real API URL and attach headers
    const url = `http://localhost:3193/v1/users/children`;
    this.http.get<any>(url).subscribe({
      next: (resp) => {
        const results = resp?.data?.results || [];
        this.childrenOptions = results.map((s: any) => ({
          label: `${s.firstname || ''} ${s.lastname || ''}`.trim(),
          value: `${s.firstname || ''} ${s.lastname || ''}`.trim(),
          id: s.id || s._id,
        }));
        // Update items to include children
        this.updateMenuItems();
      },
      error: () => {
        this.childrenOptions = [];
        this.updateMenuItems();
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updatePageTitle() {
    const currentUrl = this.router.url;

    // Split the URL by '/' and filter out empty segments
    const segments = currentUrl.split('/').filter((segment) => segment);

    if (segments.length > 0) {
      // If we're in edit or view mode (URL contains 'edit' or a UUID-like string)
      if (segments.includes('edit') || segments[segments.length - 1].match(/^[0-9a-f]{24}$/i)) {
        // Get the parent section (e.g., 'staff' from /dashboard/staff/edit/123)
        const parentSection = segments[segments.indexOf('dashboard') + 1];
        this.currentPageTitle = this.formatTitle(parentSection);
      } else {
        // Normal case - use the last segment
        const lastSegment = segments[segments.length - 1];
        this.currentPageTitle = this.formatTitle(lastSegment);
      }
    } else {
      this.currentPageTitle = 'Dashboard';
    }
  }

  private formatTitle(segment: string): string {
    // Split by dash, capitalize each word, and join with space
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  setLanguage(lang: 'en' | 'el') {
    this.translate.use(lang);
    try {
      localStorage.setItem('lang', lang);
    } catch { }
  }

  /**
  * Open the messaging panel
  */
  openMessaging(): void {
    this.messagingContainer.show();
  }

  toggleSidebar() {
    this.toggleSidebarEvent.emit();
  }

  /**
   * Logout the user by dispatching the logout action
   */
  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
