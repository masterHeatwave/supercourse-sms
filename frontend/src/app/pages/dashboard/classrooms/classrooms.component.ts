import { Component } from '@angular/core';
import { ClassroomsSettingsComponent } from '@components/settings/classrooms-settings/classrooms-settings.component';

@Component({
  selector: 'app-classrooms-page',
  standalone: true,
  imports: [ClassroomsSettingsComponent],
  template: '<app-classrooms-settings></app-classrooms-settings>'
})
export class ClassroomsPageComponent {}

