import { Component, Input } from '@angular/core';
import { MatchingPairsCardComponent } from './matching-pairs-card/matching-pairs-card.component';
import { Answer, Question } from '../../../types';
import { CommonModule } from '@angular/common';
import { INITIAL_ANSWER, INITIAL_QUESTION } from '../../../Constants';
import { DataService } from '../../../services/data.service';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { WarningDialogComponent } from '@components/dialogs/warning-dialog/warning-dialog.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'matching-pairs-activity',
  standalone: true,
  imports: [MatchingPairsCardComponent, CommonModule, DragDropModule, WarningDialogComponent, TranslateModule],
  templateUrl: './matching-pairs.component.html',
  styleUrl: './matching-pairs.component.scss'
})
export class MatchingPairsComponent {
  @Input() questionNumber: number = 1;
  idsCounter: number = 1;
  isLoading: boolean = false;
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
          answerNumber: 1,
          imageURL: '',
          TTSText: '',
          answerText: ''
        }
      ]
    },
    {
      id: 2,
      questionNumber: 2,
      imageURL: '',
      TTSText: '',
      questionText: '',
      answers: [
        {
          answerNumber: 1,
          imageURL: '',
          TTSText: '',
          answerText: ''
        }
      ]
    }
  ];

  constructor(private dataService: DataService, private translate: TranslateService) {
    this.dataService.getQuestions().subscribe((questions: Question[]) => {
      if (!this.hasData) {
        this.questions = questions;
      }
    });
  }

  drop(event: CdkDragDrop<Question[]>) {
    moveItemInArray(this.questions, event.previousIndex, event.currentIndex);
    this.dataService.setData('questions', this.questions);
    //this.questions = [...this.questions];
  }

  handleQuestionDelete(index: number) {}

  handleAnswersChange(answers: Answer[], index: number) {
    if (this.questions[index].answers.length > 1) {
      this.questions[index].answers.splice(1, this.questions[index].answers.length);
    }
    this.questions[index].answers[0] = answers[0];
    this.dataService.setData('questions', this.questions);
  }

  removePair(index: number) {
    if (index > -1 && index < this.questions.length && this.questions.length > 1) {
      this.questions.splice(index, 1);
    } else {
      this.warningMessage = this.translate.instant('customActivities.you_cannot_have_less_than_one_pair'); //'You cannot have less than 1 pair.';
      this.isWarningDialogVisible = true;
    }
    this.questions = [...this.questions];
  }

  addPair() {
    const newQuestion = JSON.parse(
      JSON.stringify({
        id: this.idsCounter + 1,
        questionNumber: this.questions.length + 1,
        imageURL: '',
        TTSText: '',
        questionText: '',
        answers: [
          {
            answerNumber: 1,
            imageURL: '',
            TTSText: '',
            answerText: ''
          }
        ]
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
