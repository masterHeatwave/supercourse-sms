import { Component } from '@angular/core';
import { DataService } from '../../services/data.service';
import * as Constants from '../../Constants';

@Component({
  selector: 'activity-type-card',
  standalone: true,
  imports: [],
  templateUrl: './activity-type-card.component.html',
  styleUrl: './activity-type-card.component.scss',
})
export class ActivityTypeCardComponent {
  source: string = '';
  activityType: string = '';
  typeText: string = '';
  constants = Constants;
  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.dataService.getActivityType().subscribe((actType) => {
      this.activityType = actType;
      switch (this.activityType) {
        case this.constants.CLOZE_VALUE: {
          this.typeText = this.constants.CLOZE_TEXT;
          break;
        }
        case this.constants.FILL_IN_THE_BLANKS_VALUE: {
          this.typeText = this.constants.FILL_IN_THE_BLANKS_TEXT;
          break;
        }
        case this.constants.GROUP_SORT_VALUE: {
          this.typeText = this.constants.GROUP_SORT_TEXT;
          break;
        }
        case this.constants.LETTER_HUNT_VALUE: {
          this.typeText = this.constants.LETTER_HUNT_TEXT;
          break;
        }
        case this.constants.MATCHING_PAIRS_VALUE: {
          this.typeText = this.constants.MATCHING_PAIRS_TEXT;
          break;
        }
        case this.constants.MEMORY_MATCHING_PAIRS_VALUE: {
          this.typeText = this.constants.MEMORY_MATCHING_PAIRS_TEXT;
          break;
        }
        case this.constants.MULTIPLE_CHOICE_QUIZ_VALUE: {
          this.typeText = this.constants.MULTIPLE_CHOICE_QUIZ_TEXT;
          break;
        }
        case this.constants.WORD_ORDER_VALUE: {
          this.typeText = this.constants.WORD_ORDER_TEXT;
          break;
        }
      }
    });
  }
}
