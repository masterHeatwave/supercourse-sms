import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'image-text',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-text.component.html',
  styleUrl: './image-text.component.scss'
})
export class ImageTextComponent {
  @Input() imageUrl: string = '';
  @Input() imageSize: number = 36;
  @Input() text: string = '';
  @Input() label: string = '';
  @Input() textPosition: 'left' | 'right' = 'right';
  @Input() textStyle: {
    color: string;
    'font-size': string;
  } = { color: 'black', 'font-size': '22px' };

  @Output() clicked: EventEmitter<any> = new EventEmitter();

  handleClick() {
    this.clicked.emit({ text: this.text, label: this.label });
  }
}
