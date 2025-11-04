import { Component } from '@angular/core';
import { SingleStaffComponent } from '@components/staff/single-staff/single-staff.component';


@Component({
  selector: 'app-single-staff-page',
  standalone: true,
  imports: [SingleStaffComponent],
  templateUrl: './single.component.html',
  styleUrl: './single.component.scss',
})
export class SingleComponent {

}
