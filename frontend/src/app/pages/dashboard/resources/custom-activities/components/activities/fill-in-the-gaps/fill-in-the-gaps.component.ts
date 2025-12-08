import { Component, Input } from '@angular/core';
import { BlockAnswerComponent } from './block-answer/block-answer.component';
import { DataService } from '../../../services/data.service';
import { Question } from '../../../types';
import { CommonModule } from '@angular/common';
import { INITIAL_QUESTION } from '../../../Constants';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { WarningDialogComponent } from '@components/dialogs/warning-dialog/warning-dialog.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'fill-in-the-gaps',
  standalone: true,
  imports: [BlockAnswerComponent, CommonModule, DragDropModule, WarningDialogComponent, TranslateModule],
  templateUrl: './fill-in-the-gaps.component.html',
  styleUrl: './fill-in-the-gaps.component.scss'
})
export class FillInTheGapsComponent {
  @Input() questions: Question[] = [];
  isWarningDialogVisible: boolean = false;
  warningMessage: string = '';

  constructor(private dataService: DataService, private translate: TranslateService) {
    this.warningMessage = this.translate.instant('customActivities.the_least_amount_of_questions_must_be_one');
    this.dataService.getQuestions().subscribe((questions: Question[]) => {
      this.questions = questions;
      //console.log('this.questions', this.questions);
    });
    this.translate.onLangChange.subscribe(() => {
      this.warningMessage = this.translate.instant('customActivities.the_least_amount_of_questions_must_be_one');
    });
  }

  handleBlockChanged(obj: any, index: number) {
    this.questions[index].document = JSON.stringify(obj.document); //obj.document;
    this.questions[index].answers = obj.answers;
    this.dataService.setData('questions', this.questions);
  }

  handleImageURLChange(newValue: string, index: number) {
    this.questions[index].imageURL = newValue;
    this.dataService.setData('questions', this.questions);
  }

  handleDeleteClick(index: number) {
    if (this.questions.length > 1) {
      this.questions.splice(index, 1);
      this.questions.forEach((question, i) => {
        question.id = i + 1;
        question.questionNumber = i + 1;
      });
      this.dataService.setData('questions', this.questions);
    } else {
      //this.warningMessage = 'The least amount of questions must be one.';
      this.isWarningDialogVisible = true;
    }
  }

  addSentence() {
    let newQuestion: Question = JSON.parse(JSON.stringify(INITIAL_QUESTION));
    const nextId = this.questions.length + 1;
    newQuestion.id = nextId;
    newQuestion.questionNumber = nextId;
    this.questions.push(newQuestion);
  }

  drop(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.questions, event.previousIndex, event.currentIndex);
  }
}
