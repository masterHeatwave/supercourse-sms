import { Component, Input } from '@angular/core';
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

  togglePin(): void {
    this.isPinned = !this.isPinned;
  }
}
