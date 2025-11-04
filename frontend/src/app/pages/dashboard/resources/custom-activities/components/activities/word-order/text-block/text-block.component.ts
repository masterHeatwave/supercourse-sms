import { DragDropModule } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'text-block',
  standalone: true,
  imports: [DragDropModule],
  templateUrl: './text-block.component.html',
  styleUrl: './text-block.component.scss',
})
export class TextBlockComponent {
  @Input() text: string = '';
  @Output() remove = new EventEmitter<void>();
  @Output() contentChanged = new EventEmitter<string>();

  onRemove() {
    this.remove.emit();
  }

  onChange(event: Event) {
    let target = event.target as HTMLDivElement;
    this.contentChanged.emit(target.innerText);
  }
}
