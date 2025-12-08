import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, AvatarModule],
  templateUrl: './post-card.component.html',
  styleUrl: './post-card.component.scss'
})
export class PostCardComponent {
  @Input() title: string = 'Lorem ipsum dolor sit amet';
  @Input() content: string =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla sem neque, dictum et efficitur sit amet, mattis id tortor.';
  @Input() date: string = '25 Nov';
  @Input() postImage: string = 'assets/images/default-post.jpg';
  @Input() avatarImage: string = 'assets/images/default-avatar.jpg';
  @Input() liked: boolean = false;
  @Input() isPinned: boolean = false;
  @Input() tags: string[] = [];
  @Input() author: string | null = null;
  @Input() hasPoll: boolean = false;
  @Input() showLikeButton: boolean = false;
  @Input() priority: string = 'normal';
  @Input() readOnly: boolean = false; // When true, disables all interactive actions
  @Output() likeClicked = new EventEmitter<void>();

  togglePin(): void {
    this.isPinned = !this.isPinned;
  }

  onLikeClick(event: Event): void {
    if (this.readOnly) {
      event.stopPropagation();
      return;
    }
    event.stopPropagation();
    this.likeClicked.emit();
  }

  getPriorityConfig(): { label: string; color: string; bgColor: string } {
    const priorityMap: { [key: string]: { label: string; color: string; bgColor: string } } = {
      high: { label: 'High', color: '#ef4444', bgColor: '#fee2e2' },
      normal: { label: 'Normal', color: '#22c55e', bgColor: '#dcfce7' },
      low: { label: 'Low', color: '#3b82f6', bgColor: '#dbeafe' }
    };
    return priorityMap[this.priority?.toLowerCase()] || priorityMap['normal'];
  }
}
