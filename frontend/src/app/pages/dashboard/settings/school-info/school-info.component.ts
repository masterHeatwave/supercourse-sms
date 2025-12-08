import { Component } from '@angular/core';
import { SchoolInfoComponent as SchoolInfoComponentImpl } from '@components/settings/school-info/school-info.component';

@Component({
  selector: 'app-school-info-page',
  standalone: true,
  imports: [SchoolInfoComponentImpl],
  template: '<app-school-info></app-school-info>'
})
export class SchoolInfoComponent {}

