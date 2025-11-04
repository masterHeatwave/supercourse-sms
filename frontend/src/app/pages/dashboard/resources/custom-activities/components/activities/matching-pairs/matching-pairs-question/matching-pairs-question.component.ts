import { Component } from '@angular/core';
import { MatchingPairsAnswerComponent } from "../matching-pairs-answer/matching-pairs-answer.component";

@Component({
  selector: 'matching-pairs-question',
  standalone: true,
  imports: [MatchingPairsAnswerComponent],
  templateUrl: './matching-pairs-question.component.html',
  styleUrl: './matching-pairs-question.component.scss',
})
export class MatchingPairsQuestionComponent {}
