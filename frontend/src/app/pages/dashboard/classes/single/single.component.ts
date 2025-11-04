import { Component } from '@angular/core';
import { SingleClassComponent } from '@components/classes/single-class/single-class.component';

@Component({
  selector: 'app-single-class-page',
  standalone: true,
  imports: [
    SingleClassComponent
  ],
  templateUrl: './single.component.html',
  styleUrl: './single.component.scss'
})
export class SingleComponent {

}
