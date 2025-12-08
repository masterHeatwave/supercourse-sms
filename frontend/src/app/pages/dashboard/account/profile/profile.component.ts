import { Component } from '@angular/core';
import { ProfileViewComponent } from '@components/account/profile-view/profile-view.component';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [ProfileViewComponent],
  template: '<app-profile-view></app-profile-view>'
})
export class ProfileComponent {}

