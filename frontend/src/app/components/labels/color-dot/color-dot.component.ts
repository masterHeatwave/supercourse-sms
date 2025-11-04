import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-color-dot',
  standalone: true,
  imports: [CommonModule, TooltipModule],
  template: `
    <span
      *ngIf="color"
      pTooltip="{{ tooltip }}"
      [ngStyle]="{
        display: 'inline-block',
        width: size,
        height: size,
        'border-radius': '9999px',
        'background-color': color
      }"
      [ngClass]="styleClass"
    ></span>
  `,
})
export class ColorDotComponent {
  @Input() color: string | null | undefined;
  @Input() size: string = '0.5rem';
  @Input() tooltip: string = '';
  @Input() styleClass: string = '';
}


