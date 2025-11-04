import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AnswerComponent } from '../answer/answer.component';
import { CommonModule } from '@angular/common';
import { SEPARATE_EACH_WORD } from '../../../../Constants';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { BlocksAnswerComponent } from '../blocks-answer/blocks-answer.component';
import { DragDropModule } from '@angular/cdk/drag-drop';

@Component({
  selector: 'word-order-question-controller',
  standalone: true,
  imports: [
    AnswerComponent,
    BlocksAnswerComponent,
    DragDropModule,
    ButtonModule,
    DialogModule,
    CommonModule,
  ],
  templateUrl: './question-controller.component.html',
  styleUrl: './question-controller.component.scss',
})
export class QuestionControllerComponent {
  @Input() option: string = '';
  @Input() hasData: boolean = false;
  @Input() answers = [
    {
      imageURL: '',
      answerText: '',
    },
  ];
  @Output() answersChanged: EventEmitter<string> = new EventEmitter<string>();
  @Output() imageURLChanged: EventEmitter<string> = new EventEmitter<string>();
  @Output() deleteClicked: EventEmitter<void> = new EventEmitter<void>();

  handleAnswerChanged(value: string) {
    let finalValue = value;
    if (this.option === SEPARATE_EACH_WORD) {
      finalValue = value.split(' ').join('#@');
    }
    this.answersChanged.emit(finalValue);
  }

  handleAnswerImageURLChanged(value: string) {
    this.imageURLChanged.emit(value);
  }

  handleAnswersDelete() {
    this.deleteClicked.emit();
  }
}
