import { Component } from '@angular/core';
import { NotificationsViewComponent } from '@components/account/notifications-view/notifications-view.component';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [NotificationsViewComponent],
  template: '<app-notifications-view></app-notifications-view>'
})
export class NotificationsComponent {}

