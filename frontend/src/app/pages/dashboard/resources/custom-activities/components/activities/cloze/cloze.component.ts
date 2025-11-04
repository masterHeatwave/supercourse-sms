import { Component, Input, inject } from '@angular/core';
import { BlockAnswerComponent } from './block-answer/block-answer.component';
import { DataService } from '../../../services/data.service';
import { Question } from '../../../types';

@Component({
  selector: 'cloze-activity',
  standalone: true,
  imports: [BlockAnswerComponent],
  templateUrl: './cloze.component.html',
  styleUrl: './cloze.component.scss',
})
export class ClozeComponent {
  questions: Question[] = [
    {
      id: 1,
      questionNumber: 1,
      questionText: '',
      TTSText: '',
      document: '',
      answers: [],
      imageURL: '',
    },
  ];
  @Input() document = '';
  @Input() answers = [];
  @Input() imageURL = '';
  
  dataService = inject(DataService);

  constructor() {
    this.dataService.getQuestions().subscribe((questions: Question[]) => {
      this.questions = questions;
    });
  }

  handleBlockChanged(obj: any) {
    this.questions[0].document = obj.document;
    this.questions[0].answers = obj.answers;
    this.dataService.setData('questions', this.questions);
  }

  handleImageURLChange(newValue: string) {
    this.questions[0].imageURL = newValue;
    this.dataService.setData('questions', this.questions);
  }
}
