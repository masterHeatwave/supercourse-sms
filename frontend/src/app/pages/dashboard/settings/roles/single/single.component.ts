import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';
import { OutlineButtonComponent } from '@components/buttons/outline-button/outline-button.component';

interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  userAvatars: string[];
  permissions: string[];
}

@Component({
  selector: 'app-view-role',
  standalone: true,
  imports: [CommonModule, ButtonModule, TranslateModule, OutlineButtonComponent],
  templateUrl: './single.component.html',
  styleUrl: './single.component.scss'
})
export class ViewRoleComponent implements OnInit {
  role: Role | null = null;
  roleId: string | null = null;
  isEditMode: boolean = false;
  selectedPermissions: Set<string> = new Set();

  // Mock data - in real app this would come from a service
  private roles: Role[] = [
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

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.roleId = params['id'];
      this.loadRole();
    });
    
    this.route.queryParams.subscribe((queryParams) => {
      this.isEditMode = queryParams['mode'] === 'edit';
    });
  }

  private loadRole() {
    if (this.roleId) {
      this.role = this.roles.find((r) => r.id === this.roleId) || null;
      if (!this.role) {
        // Role not found, redirect back to roles list
        this.router.navigate(['/dashboard/settings/roles']);
      } else if (this.isEditMode) {
        // Initialize selected permissions with current role permissions for edit mode
        this.selectedPermissions = new Set(this.role.permissions);
      }
    }
  }

  hasPermission(permission: string): boolean {
    if (this.isEditMode) {
      return this.selectedPermissions.has(permission);
    }
    return this.role?.permissions.includes(permission) || false;
  }

  togglePermission(permission: string): void {
    if (!this.isEditMode) return;
    
    if (this.selectedPermissions.has(permission)) {
      this.selectedPermissions.delete(permission);
    } else {
      this.selectedPermissions.add(permission);
    }
  }

  onBack(): void {
    this.router.navigate(['/dashboard/settings/roles']);
  }

  onSave(): void {
    console.log('Saving permissions:', Array.from(this.selectedPermissions));
    // TODO: Implement API call to save permissions
    this.onBack();
  }
}

