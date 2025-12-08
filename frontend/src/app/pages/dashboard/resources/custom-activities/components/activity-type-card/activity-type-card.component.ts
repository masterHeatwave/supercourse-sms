import { Component } from '@angular/core';
import { DataService } from '../../services/data.service';
import * as Constants from '../../Constants';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'activity-type-card',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './activity-type-card.component.html',
  styleUrl: './activity-type-card.component.scss'
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
          this.typeText = 'cloze'; //this.constants.CLOZE_VALUE;
          break;
        }
        case this.constants.FILL_IN_THE_BLANKS_VALUE: {
          this.typeText = 'fill_in_the_gaps'; //this.constants.FILL_IN_THE_BLANKS_VALUE;
          break;
        }
        case this.constants.GROUP_SORT_VALUE: {
          this.typeText = 'group_sort'; //this.constants.GROUP_SORT_VALUE;
          break;
        }
        case this.constants.LETTER_HUNT_VALUE: {
          this.typeText = 'letter_hunt'; //this.constants.LETTER_HUNT_VALUE;
          break;
        }
        case this.constants.MATCHING_PAIRS_VALUE: {
          this.typeText = 'matching_pairs'; //this.constants.MATCHING_PAIRS_VALUE;
          break;
        }
        case this.constants.MEMORY_MATCHING_PAIRS_VALUE: {
          this.typeText = 'memory_matching_pairs'; //this.constants.MEMORY_MATCHING_PAIRS_VALUE;
          break;
        }
        case this.constants.MULTIPLE_CHOICE_QUIZ_VALUE: {
          this.typeText = 'multiple_choice_quiz'; //this.constants.MULTIPLE_CHOICE_QUIZ_VALUE;
          break;
        }
        case this.constants.WORD_ORDER_VALUE: {
          this.typeText = 'word_order'; //this.constants.WORD_ORDER_VALUE;
          break;
        }
      }
    });
  }
}
