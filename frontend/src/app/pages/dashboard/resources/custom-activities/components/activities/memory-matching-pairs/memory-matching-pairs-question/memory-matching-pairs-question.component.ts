import { Component } from '@angular/core';
import { MemoryMatchingPairsAnswerComponent } from "../memory-matching-pairs-answer/memory-matching-pairs-answer.component";

@Component({
  selector: 'memory-matching-pairs-question',
  standalone: true,
  imports: [MemoryMatchingPairsAnswerComponent],
  templateUrl: './memory-matching-pairs-question.component.html',
  styleUrl: './memory-matching-pairs-question.component.scss',
})
export class MatchingPairsQuestionComponent {}
