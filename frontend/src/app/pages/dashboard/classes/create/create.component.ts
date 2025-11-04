import { Component } from '@angular/core';
import { CreateClassComponent } from '@components/classes/create-class/create-class.component';

@Component({
  selector: 'app-create',
  standalone: true,
  imports: [
    CreateClassComponent
  ],
  templateUrl: './create.component.html',
  styleUrl: './create.component.scss'
})
export class CreateComponent {

}
