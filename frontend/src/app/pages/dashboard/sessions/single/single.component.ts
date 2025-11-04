import { Component } from '@angular/core';
import { SingleSessionComponent } from '@components/sessions/single-session/single-session.component';

@Component({
  selector: 'app-single-session-page',
  standalone: true,
  imports: [SingleSessionComponent],
  templateUrl: './single.component.html',
  styleUrl: './single.component.scss'
})
export class SingleSessionPageComponent {}
