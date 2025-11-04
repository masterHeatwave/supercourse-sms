import { Component } from '@angular/core';
import { SingleStudentComponent } from '@components/students/single-student/single-student.component';

@Component({
  selector: 'app-single-student-page',
  standalone: true,
  imports: [ SingleStudentComponent ],
  templateUrl: './single.component.html',
  styleUrl: './single.component.scss'
})
export class SingleComponent {

}
