import { Component, Input } from '@angular/core';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { AnswerComponent } from '../answer/answer.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'group-sort-question',
  standalone: true,
  imports: [DragDropModule, AnswerComponent, CommonModule],
  templateUrl: './question.component.html',
  styleUrls: ['./question.component.scss'],
})
export class QuestionComponent {
  @Input() question: any;

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(
      this.question.answers,
      event.previousIndex,
      event.currentIndex
    );
  }

  addAnswer() {
    this.question.answers.push(
      `New Answer ${this.question.answers.length + 1}`
    );
  }
}
