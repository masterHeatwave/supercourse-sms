import {
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { QuestionComponent } from '../question/question.component';
import { AnswerComponent } from '../answer/answer.component';
import { CommonModule } from '@angular/common';
import { PrimeIcons } from 'primeng/api';
import { LABELS } from '../../../../Constants';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { WarningDialogComponent } from '../../../dialogs/warning-dialog/warning-dialog.component';
import { Answer } from '../../../../types';

@Component({
  selector: 'letter-hunt-question-card',
  standalone: true,
  imports: [
    QuestionComponent,
    AnswerComponent,
    CommonModule,
    DragDropModule,
    DialogModule,
    ButtonModule,
    WarningDialogComponent,
  ],
  templateUrl: './question-card.component.html',
  styleUrl: './question-card.component.scss',
})
export class QuestionCardComponent {
  @Input() questionNumber: number = 1;
  @Input() answers: Answer[] = [
    {
      answerNumber: 1,
      imageURL: '',
      TTSText: '',
      answerText: '',
    },
  ];

  @Output() answersChanged: EventEmitter<object> = new EventEmitter<object>();
  @Output() deleteClicked: EventEmitter<void> = new EventEmitter<void>();

  primeIcons = PrimeIcons;
  labels: Array<string> = LABELS;
  isWarningDialogVisible: boolean = false;
  warningMessage: string = '';

  handleQuestionDelete() {
    this.deleteClicked.emit();
  }

  handleInputChange(newValue: string) {
    this.answers[0].answerText = newValue;
    if (this.answers[0].TTSText !== '') {
      this.answers[0].TTSText = newValue;
    }
    this.answersChanged.emit(this.answers);
  }

  handleImageURLChange(newValue: string) {
    this.answers[0].imageURL = newValue;
    this.answersChanged.emit(this.answers);
  }

  handleTTSTextChange(newValue: string) {
    this.answers[0].TTSText = newValue;
    this.answersChanged.emit(this.answers);
  }

  dialogClick() {
    this.isWarningDialogVisible = !this.isWarningDialogVisible;
  }
}
