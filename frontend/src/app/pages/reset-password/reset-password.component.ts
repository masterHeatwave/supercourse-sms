import { Component } from '@angular/core';
import { ResetPasswordCardComponent } from '@components/reset-password-card/reset-password-card.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ResetPasswordCardComponent],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent {}
