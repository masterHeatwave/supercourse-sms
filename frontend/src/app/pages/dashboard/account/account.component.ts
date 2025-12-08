import { Component } from '@angular/core';
import { AccountLayoutComponent } from '@components/account/account-layout/account-layout.component';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [AccountLayoutComponent],
  template: '<app-account-layout></app-account-layout>'
})
export class AccountComponent {}

