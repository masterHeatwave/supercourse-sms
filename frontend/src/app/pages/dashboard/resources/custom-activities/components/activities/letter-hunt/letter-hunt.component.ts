import { Component, inject, Input } from '@angular/core';
import { QuestionCardComponent } from './question-card/question-card.component';
import { NgZone } from '@angular/core';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Question } from '../../../types';
import { INITIAL_QUESTION } from '../../../Constants';
import { DataService } from '../../../services/data.service';
import { WarningDialogComponent } from '../../dialogs/warning-dialog/warning-dialog.component';

@Component({
  selector: 'letter-hunt-activity',
  standalone: true,
  imports: [
    QuestionCardComponent,
    WarningDialogComponent,
    CommonModule,
    DragDropModule,
  ],
  templateUrl: './letter-hunt.component.html',
  styleUrl: './letter-hunt.component.scss',
})
export class LetterHuntComponent {
  @Input() questions: Question[] = [
    JSON.parse(JSON.stringify(INITIAL_QUESTION)),
  ];
  @Input() hasData: boolean = false;
  isWarningDialogVisible: boolean = false;
  warningMessage: string = '';
  
  dataService = inject(DataService);
  
  constructor() {
    this.dataService.getQuestions().subscribe((questions: Question[]) => {
      this.questions = questions;
    });
  }

  ngOnInit() {
    if (!this.hasData) {
      this.resetState();
    }
  }

  resetState() {
    this.questions = [JSON.parse(JSON.stringify(INITIAL_QUESTION))];
  }

  drop(event: CdkDragDrop<Question[]>) {
    moveItemInArray(this.questions, event.previousIndex, event.currentIndex);
    this.dataService.setData('questions', this.questions);
  }

  handleAnswersChange(newValue: object, index: number) {
    const updatedQuestion = {
      ...this.questions[index],
      answers: Array.isArray(newValue) ? newValue : [newValue],
    };

    const updatedQuestions = [
      ...this.questions.slice(0, index),
      updatedQuestion,
      ...this.questions.slice(index + 1),
    ];

    this.questions = updatedQuestions;
    this.dataService.setData('questions', updatedQuestions);
  }

  handleQuestionDelete(index: number) {
    if (this.questions.length > 1) {
      this.questions.splice(index, 1);
      this.questions = [...this.questions];
      this.dataService.setData('questions', this.questions);
    } else {
      this.warningMessage = 'The least amount of questions must be one.';
      this.isWarningDialogVisible = true;
    }
  }

  onQuestionTextChange(newValue: string, index: number) {
    this.questions[index].questionText = newValue;
    this.questions = [...this.questions];
    this.dataService.setData('questions', this.questions);
  }

  onQuestionTTSTextChange(newValue: string, index: number) {
    this.questions[index].TTSText = newValue;
    this.dataService.setData('questions', this.questions);
  }

  onQuestionImageURLChange(newValue: string, index: number) {
    this.questions[index].imageURL = newValue;
    this.dataService.setData('questions', this.questions);
  }

  addQuestion() {
    const newQuestion = JSON.parse(JSON.stringify(INITIAL_QUESTION));
    newQuestion.questionNumber = this.questions.length + 1;

    this.questions = [...this.questions, newQuestion];
    this.dataService.setData('questions', this.questions);
  }

  trackByIndex(index: number, item: any): number {
    return item.id;
  }
}
