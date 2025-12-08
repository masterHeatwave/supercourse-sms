import { Component } from '@angular/core';
import { SettingsLayoutComponent } from '@components/settings/settings-layout/settings-layout.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [SettingsLayoutComponent],
  template: '<app-settings-layout></app-settings-layout>'
})
export class SettingsComponent {}
