import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { OutlineButtonComponent } from '@components/buttons/outline-button/outline-button.component';
import { SearchInputComponent } from '@components/inputs/search-input/search-input.component';

interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  userAvatars: string[];
  permissions: string[];
}

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, ButtonModule, InputTextModule, FormsModule, AvatarModule, AvatarGroupModule, TagModule, TooltipModule, TranslateModule, OutlineButtonComponent, SearchInputComponent],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss'
})
export class RolesComponent {
  searchValue: string = '';
  viewMode: 'grid' | 'list' = 'grid';

  constructor(private router: Router) {}

  roles: Role[] = [
    {
      id: 'admin',
      name: 'Administrator',
      description:
        "Responsible for overseeing the school's operations, including curriculum development, budget management, and strategic planning. They provide direction and support to teachers and staff, ensuring that educational objectives are achieved.",
      userCount: 12,
      userAvatars: ['avatar1.jpg', 'avatar2.jpg', 'avatar3.jpg'],
      permissions: ['School Access', 'Staff Access', 'Student Access', 'Class Access', 'Library Access', 'Board Access']
    },
    {
      id: 'manager',
      name: 'Manager',
      description:
        "Responsible for overseeing the school's operations, including curriculum development, budget management, and strategic planning. They provide direction and support to teachers and staff, ensuring that educational objectives are achieved.",
      userCount: 12,
      userAvatars: ['avatar4.jpg', 'avatar5.jpg', 'avatar6.jpg'],
      permissions: ['School Access', 'Student Access', 'Class Access', 'Library Access']
    },
    {
      id: 'teacher',
      name: 'Teacher',
      description:
        "Responsible for overseeing the school's operations, including curriculum development, budget management, and strategic planning. They provide direction and support to teachers and staff, ensuring that educational objectives are achieved.",
      userCount: 12,
      userAvatars: ['avatar7.jpg', 'avatar8.jpg', 'avatar9.jpg'],
      permissions: ['Student Access', 'Class Access', 'Assessments Access']
    },
    {
      id: 'student',
      name: 'Student',
      description:
        "Responsible for overseeing the school's operations, including curriculum development, budget management, and strategic planning. They provide direction and support to teachers and staff, ensuring that educational objectives are achieved.",
      userCount: 12,
      userAvatars: ['avatar10.jpg', 'avatar11.jpg', 'avatar12.jpg'],
      permissions: ['Class Access', 'Library Access']
    },
    {
      id: 'parent',
      name: 'Parent & Guardian',
      description:
        "Responsible for overseeing the school's operations, including curriculum development, budget management, and strategic planning. They provide direction and support to teachers and staff, ensuring that educational objectives are achieved.",
      userCount: 12,
      userAvatars: ['avatar13.jpg', 'avatar14.jpg', 'avatar15.jpg'],
      permissions: ['Student Access', 'Progress / Grades Access']
    }
  ];

  get filteredRoles() {
    if (!this.searchValue) {
      return this.roles;
    }

    return this.roles.filter(
      (role) =>
        role.name.toLowerCase().includes(this.searchValue.toLowerCase()) || role.description.toLowerCase().includes(this.searchValue.toLowerCase())
    );
  }

  onEditRole(role: Role, event: Event) {
    event.stopPropagation(); // Prevent card click when clicking edit button
    console.log('Edit role:', role);
    // For now, navigate to the same route as view but we'll handle edit mode in the component
    this.router.navigate(['/dashboard/settings/roles', role.id], { queryParams: { mode: 'edit' } });
  }

  onViewRole(role: Role) {
    console.log('View role:', role);
    this.router.navigate(['/dashboard/settings/roles', role.id]);
  }

  onSearchChange(value: string) {
    this.searchValue = value;
  }

  getPermissionSeverity(permission: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    // Assign different colors based on permission type to match mockup
    const permissionColors: { [key: string]: 'success' | 'info' | 'warning' | 'danger' | 'secondary' } = {
      'school access': 'success',
      'student access': 'info',
      'class access': 'warning',
      'staff access': 'danger',
      'assessments access': 'secondary',
      'library access': 'success',
      'board access': 'info',
      'progress / grades access': 'warning'
    };

    return permissionColors[permission.toLowerCase()] || 'info';
  }

  setViewMode(mode: 'grid' | 'list') {
    this.viewMode = mode;
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  // Generate initials for avatar fallback
  getInitials(name: string): string {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}
