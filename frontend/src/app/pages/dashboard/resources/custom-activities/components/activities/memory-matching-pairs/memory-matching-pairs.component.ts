import { Component, Input, inject } from '@angular/core';
import { MemoryMatchingPairsCardComponent } from './memory-matching-pairs-card/memory-matching-pairs-card.component';
import { Answer, Question } from '../../../types';
import { CommonModule } from '@angular/common';
import { INITIAL_ANSWER, INITIAL_QUESTION } from '../../../Constants';
import { DataService } from '../../../services/data.service';
import * as Constants from '../../../Constants';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { WarningDialogComponent } from '../../dialogs/warning-dialog/warning-dialog.component';
import { RadioButtonModule } from 'primeng/radiobutton';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'memory-matching-pairs-activity',
  standalone: true,
  imports: [
    MemoryMatchingPairsCardComponent,
    CommonModule,
    DragDropModule,
    WarningDialogComponent,
    RadioButtonModule,
    FormsModule,
  ],
  templateUrl: './memory-matching-pairs.component.html',
  styleUrl: './memory-matching-pairs.component.scss',
})
export class MemoryMatchingPairsComponent {
  @Input() questionNumber: number = 1;
  idsCounter: number = 1;
  constants = Constants;
  @Input() option: string = this.constants.PAIRS_OF_SAME_ITEM_VALUE;
  warningMessage: string = '';
  isWarningDialogVisible: boolean = false;

  @Input() hasData: boolean = false;
  @Input() questions: Question[] = [
    {
      id: 1,
      questionNumber: 1,
      imageURL: '',
      TTSText: '',
      questionText: '',
      answers: [
        {
          item1: {
            imageURL: '',
            TTSText: '',
            answerText: '',
          },
          item2: {
            imageURL: '',
            TTSText: '',
            answerText: '',
          },
          answerText: '',
          imageURL: '',
        },
      ],
    },
    {
      id: 2,
      questionNumber: 2,
      imageURL: '',
      TTSText: '',
      questionText: '',
      answers: [
        {
          item1: {
            imageURL: '',
            TTSText: '',
            answerText: '',
          },
          item2: {
            imageURL: '',
            TTSText: '',
            answerText: '',
          },
          answerText: '',
          imageURL: '',
        },
      ],
    },
  ];
  
  dataService = inject(DataService);
  
  constructor() {
    this.dataService.getQuestions().subscribe((questions: Question[]) => {
      this.questions = questions;
    });
  }

  putSameItemsIfNeeded() {
    if (this.option === this.constants.PAIRS_OF_SAME_ITEM_VALUE) {
      for (let i = 0; i < this.questions.length; i++) {
        this.questions[i].option = this.option;
        this.questions[i].answers[0].item2 = JSON.parse(
          JSON.stringify(this.questions[i].answers[0].item1)
        );
      }
    }
  }

  resetSecondItem() {
    for (let i = 0; i < this.questions.length; i++) {
      this.questions[i].option = this.option;
      this.questions[i].answers[0].item2 = JSON.parse(
        JSON.stringify({
          imageURL: '',
          TTSText: '',
          answerText: '',
        })
      );
    }
  }

  radioButtonClick(event: MouseEvent): void {
    const selectedOption = (event.target as HTMLInputElement).value;
    if (this.option === this.constants.PAIRS_OF_SAME_ITEM_VALUE) {
      this.putSameItemsIfNeeded();
    } else {
      this.resetSecondItem();
    }
    this.dataService.setData('questions', this.questions);
  }

  drop(event: CdkDragDrop<Question[]>) {
    moveItemInArray(this.questions, event.previousIndex, event.currentIndex);
    this.dataService.setData('questions', this.questions);
  }

  handleQuestionDelete(index: number) {}

  handleAnswersChange(answers: Answer[], index: number) {
    if (this.questions[index].answers.length > 1) {
      this.questions[index].answers.splice(
        1,
        this.questions[index].answers.length
      );
    }
    this.questions[index].answers[0] = answers[0];
    this.putSameItemsIfNeeded();
    this.dataService.setData('questions', this.questions);
  }

  removePair(index: number) {
    if (
      index > -1 &&
      index < this.questions.length &&
      this.questions.length > 1
    ) {
      this.questions.splice(index, 1);
    } else {
      this.warningMessage = 'You cannot have less than 1 pair.';
      this.isWarningDialogVisible = true;
    }
    this.questions = [...this.questions];
    this.dataService.setData('questions', this.questions);
  }

  addPair() {
    const newQuestion = JSON.parse(
      JSON.stringify({
        id: this.idsCounter + 1,
        questionNumber: this.questions.length + 1,
        answers: [
          {
            answerNumber: 1,
            imageURL: '',
            TTSText: '',
            answerText: '',
            item1: {
              TTSText: '',
              answerText: '',
              imageURL: '',
            },
            item2: {
              TTSText: '',
              answerText: '',
              imageURL: '',
            },
          },
        ],
      })
    );
    this.idsCounter++;
    newQuestion.questionNumber = this.questions.length + 1;

    this.questions = [...this.questions, newQuestion];
    this.dataService.setData('questions', this.questions);
  }

  trackByIndex(index: number, item: any): number {
    return item.id;
  }
}
