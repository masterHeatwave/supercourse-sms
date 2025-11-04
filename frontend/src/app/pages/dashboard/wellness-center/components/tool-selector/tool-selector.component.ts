import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'tool-selector',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './tool-selector.component.html',
  styleUrl: './tool-selector.component.scss',
})
export class ToolSelectorComponent {
  @Output() viewChanged: EventEmitter<string> = new EventEmitter<string>();
  constructor(private router: Router) {}

  navigateTo(where: string) {
    this.viewChanged.emit(where);
  }
}
