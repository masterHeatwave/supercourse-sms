import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TranslateModule } from '@ngx-translate/core';
import { OutlineButtonComponent } from '@components/buttons/outline-button/outline-button.component';

@Component({
  selector: 'app-security-view',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    TranslateModule,
    OutlineButtonComponent
  ],
  templateUrl: './security-view.component.html',
  styleUrl: './security-view.component.scss'
})
export class SecurityViewComponent {
  lastPasswordChange = '2024-12-15';
  twoFactorEnabled = false;

  onChangePassword() {
    // TODO: Implement password change dialog
    console.log('Change password clicked');
  }

  onToggleTwoFactor() {
    // TODO: Implement two-factor authentication toggle
    console.log('Toggle 2FA clicked');
  }

  onViewSessions() {
    // TODO: Implement active sessions view
    console.log('View sessions clicked');
  }
}

