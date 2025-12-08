import { Component, EventEmitter, Input, Output } from '@angular/core';
import { QuestionComponent } from '../../question/question.component';
import { AnswerComponent } from '../../answer/answer.component';
import { Answer } from '../../../../../types';
import { CommonModule } from '@angular/common';
import { PrimeIcons } from 'primeng/api';
import { INITIAL_ANSWERS, LABELS } from '../../../../../Constants';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { WarningDialogComponent } from '@components/dialogs/warning-dialog/warning-dialog.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'multiple-choice-question-card',
  standalone: true,
  imports: [QuestionComponent, AnswerComponent, CommonModule, DragDropModule, DialogModule, ButtonModule, WarningDialogComponent, TranslateModule],
  templateUrl: './question-card.component.html',
  styleUrl: './question-card.component.scss'
})
export class QuestionCardComponent {
  @Input() questionNumber: number = 1;
  @Input() imageURL: string = '';
  @Input() TTSText: string = '';
  @Input() questionText: string = '';
  @Input() answers: Answer[] = JSON.parse(JSON.stringify(INITIAL_ANSWERS));

  @Output() answersChanged: EventEmitter<Array<Answer>> = new EventEmitter<Array<Answer>>();
  @Output() questionTextChanged: EventEmitter<string> = new EventEmitter<string>();
  @Output() questionTTSTextChanged: EventEmitter<string> = new EventEmitter<string>();
  @Output() questionImageURLChanged: EventEmitter<string> = new EventEmitter<string>();
  @Output() deleteClicked: EventEmitter<void> = new EventEmitter<void>();

  primeIcons = PrimeIcons;
  labels: Array<string> = LABELS;
  isWarningDialogVisible: boolean = false;
  warningMessage: string = '';

  constructor(private translate: TranslateService) {}

  rearrangeLabels() {
    for (let i = 0; i < this.answers.length; i++) {
      this.answers[i].label = this.labels[i] + '.';
      this.answers[i].answerNumber = i + 1;
    }
  }

  handleDelete(index: number) {
    if (this.answers.length > 2) {
      this.answers.splice(index, 1);
      this.rearrangeLabels();
      this.answersChanged.emit(this.answers);
    } else {
      this.warningMessage = this.translate.instant('customActivities.least_amount_of_answers_two'); //'The least amount of answers must be two.';
      this.isWarningDialogVisible = true;
    }
  }

  handleQuestionDelete() {
    this.deleteClicked.emit();
  }

  handleQuestionInputChange(newValue: string) {
    this.questionText = newValue;
    this.questionTextChanged.emit(newValue);
  }

  handleInputChange(newValue: string, index: number) {
    this.answers[index].answerText = newValue;
    this.answersChanged.emit(this.answers);
  }

  handleImageURLChange(newValue: string, index: number) {
    this.answers[index].imageURL = newValue;
    this.answersChanged.emit(this.answers);
  }

  handleTTSTextChange(newValue: string, index: number) {
    this.answers[index].TTSText = newValue;
    this.answersChanged.emit(this.answers);
  }

  handleCheckedChange(newValue: boolean, index: number) {
    this.answers[index].isCorrect = newValue;
    this.answersChanged.emit(this.answers);
  }

  handleQuestionTTSTextChange(newValue: string) {
    this.TTSText = newValue;
    this.questionTTSTextChanged.emit(newValue);
  }

  handleQuestionImageURLChange(newValue: string) {
    this.imageURL = newValue;
    this.questionImageURLChanged.emit(newValue);
  }

  addAnswer() {
    if (this.answers.length < 7) {
      let newAnswer = {
        answerNumber: this.answers.length + 1,
        label: this.labels[this.answers.length] + '.',
        isCorrect: false,
        imageURL: '',
        TTSText: '',
        answerText: ''
      };
      this.answers.push(newAnswer);
    }
    this.answersChanged.emit(this.answers);
  }

  drop(event: CdkDragDrop<Answer[]>) {
    moveItemInArray(this.answers, event.previousIndex, event.currentIndex);
    this.rearrangeLabels();
    this.answersChanged.emit(this.answers);
  }

  dialogClick() {
    this.isWarningDialogVisible = !this.isWarningDialogVisible;
  }
}
