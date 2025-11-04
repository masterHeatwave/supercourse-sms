import { Component } from '@angular/core';
import { ForgotPasswordCardComponent } from '@components/forgot-password-card/forgot-password-card.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ForgotPasswordCardComponent],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {}
