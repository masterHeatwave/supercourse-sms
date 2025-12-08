import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ImageSelectorComponent } from '../../../image-selector/image-selector.component';
import { LoadingComponent } from '../../../loading/loading.component';
import { WarningDialogComponent } from '@components/dialogs/warning-dialog/warning-dialog.component';

@Component({
  selector: 'letter-hunt-question',
  standalone: true,
  imports: [FormsModule, LoadingComponent, WarningDialogComponent],
  templateUrl: './question.component.html',
  styleUrl: './question.component.scss',
})
export class QuestionComponent {
  warningMessage: string = '';
  isWarningDialogVisible: boolean = false;
  isLoading: boolean = false;

  @Output() deleteClicked: EventEmitter<void> = new EventEmitter<void>();

  handleErrorMessage(msg: string) {
    this.warningMessage = msg;
    this.isWarningDialogVisible = true;
  }

  onDeleteClick() {
    this.deleteClicked.emit();
  }
}
