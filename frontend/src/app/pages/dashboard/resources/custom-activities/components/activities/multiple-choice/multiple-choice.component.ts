import { Component, Input } from '@angular/core';
import { QuestionCardComponent } from './question-card/question-card/question-card.component';
import { NgZone } from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Answer, Question } from '../../../types';
import { INITIAL_QUESTION } from '../../../Constants';
import { DataService } from '../../../services/data.service';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { WarningDialogComponent } from '../../dialogs/warning-dialog/warning-dialog.component';

@Component({
  selector: 'multiple-choice-activity',
  standalone: true,
  imports: [QuestionCardComponent, DragDropModule, CommonModule, DialogModule, ButtonModule, WarningDialogComponent],
  templateUrl: './multiple-choice.component.html',
  styleUrl: './multiple-choice.component.scss'
})
export class MultipleChoiceComponent {
  value: string = '';
  val: boolean = false;
  @Input() questions: Question[] = [JSON.parse(JSON.stringify(INITIAL_QUESTION))];
  @Input() hasData: boolean = false;
  isWarningDialogVisible: boolean = false;
  warningMessage: string = '';

  constructor(private dataService: DataService, private zone: NgZone) {
    this.dataService.getQuestions().subscribe((questions: Question[]) => {
      this.questions = questions;
    });
  }

  ngOnInit() {
    if (!this.hasData) {
      this.resetState();
    } else {
      this.dataService.setData('questions', this.questions);
    }
  }

  resetState() {
    this.questions = [JSON.parse(JSON.stringify(INITIAL_QUESTION))];
  }

  drop(event: CdkDragDrop<Question[]>) {
    moveItemInArray(this.questions, event.previousIndex, event.currentIndex);
    this.dataService.setData('questions', this.questions);
  }

  handleAnswersChange(newValue: Answer[], index: number) {
    const updatedQuestion = {
      ...this.questions[index],
      answers: [...newValue]
    };

    const updatedQuestions = [...this.questions.slice(0, index), updatedQuestion, ...this.questions.slice(index + 1)];
    this.questions = updatedQuestions;
    this.dataService.setData('questions', updatedQuestions);
  }

  handleQuestionDelete(index: number) {
    if (this.questions.length > 1) {
      this.questions.splice(index, 1);
      this.questions.forEach((question, i) => {
        question.id = i + 1; // optional, if you want id sequential too
        question.questionNumber = i + 1; // this is required
      });
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
    //newQuestion.id = Date.now();
    const nextNumber = this.questions.length + 1;
    newQuestion.id = nextNumber;
    newQuestion.questionNumber = nextNumber;
    this.questions = [...this.questions, newQuestion];
    this.dataService.setData('questions', this.questions);
  }

  trackByIndex(index: number, item: any): number {
    return item.id;
  }

  dialogClick() {
    this.isWarningDialogVisible = !this.isWarningDialogVisible;
  }
}
