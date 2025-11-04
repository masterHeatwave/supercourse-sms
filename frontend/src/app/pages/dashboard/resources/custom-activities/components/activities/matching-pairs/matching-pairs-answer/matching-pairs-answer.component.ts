import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatchingPairsItemComponent } from '../matching-pairs-item/matching-pairs-item.component';
import { Answer } from '../../../../types';

@Component({
  selector: 'matching-pairs-answer',
  standalone: true,
  imports: [MatchingPairsItemComponent],
  templateUrl: './matching-pairs-answer.component.html',
  styleUrl: './matching-pairs-answer.component.scss',
})
export class MatchingPairsAnswerComponent {
  @Input() answer: Answer = {
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
  };

  ngOnInit() {
    if (!this.answer.item1) {
      this.answer.item1 = { imageURL: '', TTSText: '', answerText: '' };
    }
    if (!this.answer.item2) {
      this.answer.item2 = { imageURL: '', TTSText: '', answerText: '' };
    }
  }

  @Output() answerChanged: EventEmitter<Answer> = new EventEmitter<Answer>();

  handleInputChanged(text: string, item: number) {
    if (item === 1) {
      this.answer.item1!.answerText = text;
    } else {
      if (item === 2) {
        this.answer.item2!.answerText = text;
      }
    }
    this.answerChanged.emit(this.answer);
  }

  handleImageURLChanged(url: string, item: number) {
    if (item === 1) {
      this.answer.item1!.imageURL = url;
    } else {
      if (item === 2) {
        this.answer.item2!.imageURL = url;
      }
    }
    this.answerChanged.emit(this.answer);
  }

  handleTTSTextChanged(text: string, item: number) {
    if (item === 1) {
      this.answer.item1!.TTSText = text;
    } else {
      if (item === 2) {
        this.answer.item2!.TTSText = text;
      }
    }
    this.answerChanged.emit(this.answer);
  }
}
