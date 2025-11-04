import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

export interface SettingsNavItem {
  id: number;
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-settings-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './settings-sidebar.component.html',
  styleUrl: './settings-sidebar.component.scss'
})
export class SettingsSidebarComponent {
  @Input() activeIndex: number = 0;
  @Output() activeIndexChange = new EventEmitter<number>();

  navItems: SettingsNavItem[] = [
    { id: 0, label: 'School Info', icon: 'pi pi-building', route: 'school-info' },
    { id: 1, label: 'Academic Years', icon: 'pi pi-calendar', route: 'academic-years' },
    { id: 2, label: 'Classrooms', icon: 'pi pi-home', route: 'classrooms' },
    { id: 3, label: 'Roles', icon: 'pi pi-users', route: 'roles' }
  ];

  constructor(private router: Router) {}

  onNavItemClick(index: number) {
    this.activeIndex = index;
    this.activeIndexChange.emit(index);
    // Navigate to the corresponding route
    this.router.navigate(['/dashboard/settings', this.navItems[index].route]);
  }
}
