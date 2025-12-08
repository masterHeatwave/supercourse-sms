import { Component } from '@angular/core';
import { SecurityViewComponent } from '@components/account/security-view/security-view.component';

@Component({
  selector: 'app-security-page',
  standalone: true,
  imports: [SecurityViewComponent],
  template: '<app-security-view></app-security-view>'
})
export class SecurityComponent {}

