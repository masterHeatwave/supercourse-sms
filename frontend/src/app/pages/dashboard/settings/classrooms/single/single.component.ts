import { Component } from '@angular/core';
import { SingleClassroomComponent } from '@components/settings/classrooms-settings/single-classroom/single-classroom.component';

@Component({
  selector: 'app-single-classroom-page',
  standalone: true,
  imports: [SingleClassroomComponent],
  template: '<app-single-classroom></app-single-classroom>'
})
export class SingleClassroomPageComponent {}
