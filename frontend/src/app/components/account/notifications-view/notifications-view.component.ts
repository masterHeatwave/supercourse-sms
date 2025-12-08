import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputSwitchModule } from 'primeng/inputswitch';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

@Component({
  selector: 'app-notifications-view',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    InputSwitchModule,
    FormsModule,
    TranslateModule
  ],
  templateUrl: './notifications-view.component.html',
  styleUrl: './notifications-view.component.scss'
})
export class NotificationsViewComponent {
  emailNotifications: NotificationSetting[] = [
    {
      id: 'email-sessions',
      label: 'account.notifications.emailSessions',
      description: 'account.notifications.emailSessionsDesc',
      enabled: true
    },
    {
      id: 'email-assignments',
      label: 'account.notifications.emailAssignments',
      description: 'account.notifications.emailAssignmentsDesc',
      enabled: true
    },
    {
      id: 'email-announcements',
      label: 'account.notifications.emailAnnouncements',
      description: 'account.notifications.emailAnnouncementsDesc',
      enabled: false
    }
  ];

  pushNotifications: NotificationSetting[] = [
    {
      id: 'push-sessions',
      label: 'account.notifications.pushSessions',
      description: 'account.notifications.pushSessionsDesc',
      enabled: true
    },
    {
      id: 'push-messages',
      label: 'account.notifications.pushMessages',
      description: 'account.notifications.pushMessagesDesc',
      enabled: true
    },
    {
      id: 'push-reminders',
      label: 'account.notifications.pushReminders',
      description: 'account.notifications.pushRemindersDesc',
      enabled: false
    }
  ];

  onNotificationChange(setting: NotificationSetting) {
    // TODO: Save notification preference to backend
    console.log('Notification setting changed:', setting);
  }
}

