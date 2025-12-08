import { Component } from '@angular/core';
import { AcademicYearsSettingsComponent } from '@components/settings/academic-years-settings/academic-years-settings.component';

@Component({
  selector: 'app-academic-years-page',
  standalone: true,
  imports: [AcademicYearsSettingsComponent],
  template: '<app-academic-years-settings></app-academic-years-settings>'
})
export class AcademicYearsComponent {}

