import { Component } from '@angular/core';
import { RolesSettingsComponent } from '@components/settings/roles-settings/roles-settings.component';

@Component({
  selector: 'app-roles-page',
  standalone: true,
  imports: [RolesSettingsComponent],
  template: '<app-roles-settings></app-roles-settings>'
})
export class RolesComponent {}

