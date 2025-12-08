import { Component, Input, SimpleChanges } from '@angular/core';
import {
  FILL_IN_THE_BLANKS_VALUE,
  CLOZE_VALUE,
  LETTER_HUNT_VALUE,
  MATCHING_PAIRS_VALUE,
  GROUP_SORT_VALUE,
  WORD_ORDER_VALUE,
  MULTIPLE_CHOICE_QUIZ_VALUE,
  MEMORY_MATCHING_PAIRS_VALUE
} from '../../Constants';
import { DataService } from '../../services/data.service';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CheckboxModule, FormsModule, CommonModule, TranslateModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  settings: string[] = [];
  @Input() selectedactivityType: string = '';
  @Input() options: Record<string, boolean> = {};
  @Input() hasData: boolean = false;
  optionsKeys: string[] = [];

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.dataService.getActivityType().subscribe((activityType) => {
      this.selectedactivityType = activityType;
      if (!this.hasData) {
        this.updateSettings();
        this.updateOptions();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['options']) {
      this.updateSettings();
      this.optionsKeys = Object.keys(this.options);
      this.dataService.setData('settings', { ...this.options });
    }
  }

  updateSettings() {
    switch (this.selectedactivityType) {
      case FILL_IN_THE_BLANKS_VALUE: {
        this.settings = [
          'Each sentence appears in a separate page',
          //'Answers are case-sensitive',
          'Match capital letters exactly', //'Answers are case-sensitive',
          'Require hyphens to match', //
          //'Allow extra points for quick responses',
          'Public'
        ];
        break;
      }
      case CLOZE_VALUE: {
        this.settings = [
          'Match capital letters exactly', //'Answers are case-sensitive',
          'Require hyphens to match', //
          'Number items',
          'Display answers',
          'Public'
        ];
        break;
      }
      case LETTER_HUNT_VALUE: {
        this.settings = [
          //'Answers are case-sensitive and allow hyphenation',
          'Match capital letters exactly', //'Answers are case-sensitive',
          'Require hyphens to match',
          'Show anagrams',
          //'Allow extra points for quick responses',
          'Public'
        ];
        break;
      }
      case MATCHING_PAIRS_VALUE: {
        this.settings = [
          //'Hide matched pairs',
          'Number the pairs',
          //'Allow extra points for quick responses',
          'Public'
        ];
        break;
      }
      case GROUP_SORT_VALUE: {
        this.settings = [
          //'Display all items from the start',
          'Randomize items',
          //'Allow extra points for quick responses',
          'Public'
        ];
        break;
      }
      case WORD_ORDER_VALUE: {
        this.settings = [
          //'Allow extra points for quick responses',
          'Public'
        ];
        break;
      }
      case MULTIPLE_CHOICE_QUIZ_VALUE: {
        this.settings = [
          'Randomize answers',
          //'Allow extra points for quick responses',
          'Public'
        ];
        break;
      }
      case MEMORY_MATCHING_PAIRS_VALUE: {
        this.settings = [
          'Hide matched cards',
          'Number the back of the cards',
          //'Allow extra points for quick responses',
          'Public'
        ];
        break;
      }
    }
  }

  updateOptions() {
    this.options = {};
    this.options = this.createObjectFromArray(this.settings);
    this.optionsKeys = Object.keys(this.options);
    this.dataService.setData('settings', this.createObjectFromArray(this.settings));
  }

  getOptionKeys(): string[] {
    return Object.keys(this.options);
  }

  onOptionChange(): void {
    this.dataService.setData('settings', { ...this.options });
  }

  createObjectFromArray(strings: string[]): { [key: string]: boolean } {
    const result: { [key: string]: boolean } = {};

    strings.forEach((str) => {
      const camelCaseKey = this.toCamelCase(str);
      result[camelCaseKey] = false;
    });

    return result;
  }

  toCamelCase(str: string): string {
    return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => (index === 0 ? match.toLowerCase() : match.toUpperCase())).replace(/\s+/g, '');
  }
}
