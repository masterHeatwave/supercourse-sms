import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatchingPairsAnswerComponent } from '../matching-pairs-answer/matching-pairs-answer.component';
import { Answer } from '../../../../types';
import { ButtonModule } from 'primeng/button';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';

@Component({
  selector: 'matching-pairs-card',
  standalone: true,
  imports: [MatchingPairsAnswerComponent, ButtonModule, DragDropModule],
  templateUrl: './matching-pairs-card.component.html',
  styleUrl: './matching-pairs-card.component.scss',
})
export class MatchingPairsCardComponent {
  @Input() questionNumber: number = 1;
  @Input() answers: Answer[] = [
    {
      answerNumber: 1,
      imageURL: '',
      TTSText: '',
      answerText: '',
    },
  ];

  @Output() onRemoveClick: EventEmitter<void> = new EventEmitter<void>();
  @Output() onAnswersChanged: EventEmitter<Answer[]> = new EventEmitter<
    Answer[]
  >();

  handleAnswerChanged(answerObj: Answer) {
    this.answers[0].item1 = answerObj.item1;
    this.answers[0].item2 = answerObj.item2;
    this.onAnswersChanged.emit(this.answers);
  }

  removePair() {
    this.onRemoveClick.emit();
  }
}
