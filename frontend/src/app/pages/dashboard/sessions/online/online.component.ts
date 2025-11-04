import { Component, OnInit } from '@angular/core';
import { OnlineSessionComponent } from '@components/sessions/online-session/online-session.component';

@Component({
  selector: 'app-online-session-page',
  standalone: true,
  imports: [OnlineSessionComponent],
  templateUrl: './online.component.html',
  styleUrl: './online.component.scss'
})
export class OnlineComponent implements OnInit {

  ngOnInit() { }

}
