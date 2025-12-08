import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-warning-dialog',
  standalone: true,
  imports: [DialogModule, DividerModule, ButtonModule],
  templateUrl: './warning-dialog.component.html',
  styleUrl: './warning-dialog.component.scss',
})
export class WarningDialogComponent {
  @Input() warningMessage: string = 'This is a warning message.';
  @Input() isDialogVisible: boolean = false;
  @Output() onClose: EventEmitter<void> = new EventEmitter<void>();
}
