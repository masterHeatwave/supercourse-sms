import {
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeIcons } from 'primeng/api';
import { LABELS } from '../../../../Constants';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { WarningDialogComponent } from '@components/dialogs/warning-dialog/warning-dialog.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { QuestionControllerComponent } from '../question-controller/question-controller.component';

@Component({
  selector: 'word-order-question-block-card',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    WarningDialogComponent,
    DragDropModule,
    QuestionControllerComponent,
  ],
  templateUrl: './question-block-card.component.html',
  styleUrl: './question-block-card.component.scss',
})
export class QuestionBlockCardComponent {
  @Input() questionNumber: number = 1;
  @Input() hasData: boolean = false;
  @Input() answers = [
    {
      imageURL: '',
      answerText: '',
    },
  ];
  @Input() option = 'separateEachWord';

  @Output() answersChanged: EventEmitter<object> = new EventEmitter<object>();
  @Output() deleteClicked: EventEmitter<void> = new EventEmitter<void>();

  primeIcons = PrimeIcons;
  labels: Array<string> = LABELS;
  isWarningDialogVisible: boolean = false;
  warningMessage: string = '';

  handleQuestionDelete() {
    this.deleteClicked.emit();
  }

  handleImageURLChange(newValue: string) {
    this.answers[0].imageURL = newValue;
    this.answersChanged.emit(this.answers[0]);
  }

  handleAnswersChange(value: string) {
    this.answers[0].answerText = value;
    this.answersChanged.emit(this.answers[0]);
  }

  dialogClick() {
    this.isWarningDialogVisible = !this.isWarningDialogVisible;
  }
}
