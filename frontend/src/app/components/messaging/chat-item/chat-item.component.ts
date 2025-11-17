// chat-item.component.ts - Fixed to accept currentUserId as Input
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chat } from '../models/chat.models';

@Component({
  selector: 'app-chat-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-item.component.html',
  styleUrls: ['./chat-item.component.css']
})
export class ChatItemComponent {
  @Input() chat!: Chat;
  @Input() currentUserId: string = ''; 
  @Output() clicked = new EventEmitter<Chat>();

  onClick(): void {
    this.clicked.emit(this.chat);
  }

  getParticipantsDisplay(): string {
    if (this.chat.type === 'group' && this.chat.name) {
      return this.chat.name;
    }

    if (this.chat.participantsDetails && this.chat.participantsDetails.length > 0) {
      const otherUser = this.chat.participantsDetails.find(u => u.userId !== this.currentUserId);
      return otherUser ? (otherUser.displayName || `${otherUser.firstname || ''} ${otherUser.lastname || ''}`.trim()) : 'Unknown User';
    }

    return 'Chat';
  }

  getUnreadCount(): number {
    if (!this.chat.unreadCount) return 0;
    const key = Object.keys(this.chat.unreadCount).find(k => String(k) === String(this.currentUserId));
    return key ? (this.chat.unreadCount as any)[key] : 0;
  }

  hasUnread(): boolean {
    return this.getUnreadCount() > 0;
  }

  formatTime(date: Date): string {
    if (!date) return '';
    const messageDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return messageDate.toLocaleDateString();
  }
}