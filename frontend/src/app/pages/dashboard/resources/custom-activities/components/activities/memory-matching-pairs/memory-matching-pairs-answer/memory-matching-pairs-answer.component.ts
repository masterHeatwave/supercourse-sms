import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MemoryMatchingPairsItemComponent } from '../memory-matching-pairs-item/memory-matching-pairs-item.component';
import { Answer } from '../../../../types';
import * as Constants from '../../../../Constants';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'memory-matching-pairs-answer',
  standalone: true,
  imports: [MemoryMatchingPairsItemComponent, CommonModule],
  templateUrl: './memory-matching-pairs-answer.component.html',
  styleUrl: './memory-matching-pairs-answer.component.scss',
})
export class MemoryMatchingPairsAnswerComponent {
  constants = Constants;
  @Input() option: string = '';
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

  @Output() answerChanged: EventEmitter<Answer> = new EventEmitter<Answer>();

  ngOnInit() {
    if (!this.answer.item1) {
      this.answer.item1 = { imageURL: '', TTSText: '', answerText: '' };
    }
    if (!this.answer.item2) {
      this.answer.item2 = { imageURL: '', TTSText: '', answerText: '' };
    }
  }

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
