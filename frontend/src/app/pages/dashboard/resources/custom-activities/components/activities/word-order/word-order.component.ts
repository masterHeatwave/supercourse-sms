import { Component, input, Input, SimpleChanges } from '@angular/core';
import { SEPARATE_EACH_WORD, CUSTOM_SEPARATION } from '../../../Constants';
import { INITIAL_ANSWER, INITIAL_ANSWERS, INITIAL_QUESTION } from '../../../Constants';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Question } from '../../../types';
import { DataService } from '../../../services/data.service';
import { WarningDialogComponent } from '@components/dialogs/warning-dialog/warning-dialog.component';
import { RadioButton, RadioButtonModule } from 'primeng/radiobutton';
import { FormsModule } from '@angular/forms';
import { QuestionBlockCardComponent } from './question-block-card/question-block-card.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'word-order-activity',
  standalone: true,
  imports: [QuestionBlockCardComponent, WarningDialogComponent, CommonModule, DragDropModule, RadioButtonModule, FormsModule, TranslateModule],
  templateUrl: './word-order.component.html',
  styleUrl: './word-order.component.scss'
})
export class WordOrderComponent {
  SEPARATE_EACH_WORD: string = SEPARATE_EACH_WORD;
  CUSTOM_SEPARATION: string = CUSTOM_SEPARATION;
  @Input() option: string = SEPARATE_EACH_WORD;
  previousOption: string = '';
  @Input() questions = [JSON.parse(JSON.stringify(INITIAL_QUESTION))];
  @Input() hasData: boolean = false;
  isWarningDialogVisible: boolean = false;
  warningMessage: string = '';

  constructor(private dataService: DataService, private translate: TranslateService) {
    this.dataService.getQuestions().subscribe((questions: Question[]) => {
      this.questions = questions;
    });
  }

  ngOnInit() {
    if (!this.hasData) {
      this.resetState();

      let newOption = 'separateEachWord';
      if (newOption !== this.previousOption) {
        this.questions = [
          {
            id: Date.now(),
            questionNumber: 1,
            option: newOption,
            answers: [JSON.parse(JSON.stringify(INITIAL_ANSWER))]
          }
        ];
      } else {
        this.questions = this.questions.map((question) => ({
          ...question,
          option: newOption
        }));
      }
      this.previousOption = newOption;
    } else {
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['questions']) {
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

  updateOptionInQuestion() {
    let newOption = this.option;
    this.questions = this.questions.map((question) => ({
      ...question,
      option: newOption
    }));
  }

  handleAnswersChange(newValue: object, index: number) {
    const updatedQuestion = {
      ...this.questions[index],
      answers: Array.isArray(newValue) ? newValue : [newValue]
    };

    const updatedQuestions = [...this.questions.slice(0, index), updatedQuestion, ...this.questions.slice(index + 1)];

    this.questions = updatedQuestions;
    this.updateOptionInQuestion();
    this.dataService.setData('questions', updatedQuestions);
  }

  handleQuestionDelete(index: number) {
    if (this.questions.length > 1) {
      this.questions.splice(index, 1);
      this.questions = [...this.questions];
      this.dataService.setData('questions', this.questions);
    } else {
      this.warningMessage = this.translate.instant('customActivities.the_least_amount_of_questions_must_be_one');
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
    this.updateOptionInQuestion();
    this.dataService.setData('questions', this.questions);
  }

  onOptionCHange(event: MouseEvent) {
    let newOption = (event.target as HTMLInputElement).value;
    if (newOption !== this.previousOption) {
      this.questions = [
        {
          id: Date.now(),
          questionNumber: 1,
          questionText: '',
          imageURL: '',
          TTSText: '',
          option: newOption,
          answers: [JSON.parse(JSON.stringify(INITIAL_ANSWER))]
        }
      ];
    } else {
      this.questions = this.questions.map((question) => ({
        ...question,
        option: newOption
      }));
    }
    this.previousOption = newOption;
  }

  trackByIndex(index: number, item: any): number {
    return item.id;
  }
}
