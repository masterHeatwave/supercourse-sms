import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-info-dialog',
  standalone: true,
  imports: [DialogModule, DividerModule, ButtonModule],
  templateUrl: './info-dialog.component.html',
  styleUrl: './info-dialog.component.scss',
})
export class InfoDialogComponent {
  @Input() infoMessage: string = 'This is an info message.';
  @Input() isDialogVisible: boolean = false;
  @Output() onClose: EventEmitter<void> = new EventEmitter<void>();
}
