import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { NavigationService } from '../../services/navigation.service';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import * as Constants from '../../Constants';
import { MultipleChoiceComponent } from '../activities/multiple-choice/multiple-choice.component';
import { SettingsComponent } from '../settings/settings.component';
import { LetterHuntComponent } from '../activities/letter-hunt/letter-hunt.component';
import { WordOrderComponent } from '../activities/word-order/word-order.component';
import { ClozeComponent } from '../activities/cloze/cloze.component';
import { FillInTheGapsComponent } from '../activities/fill-in-the-gaps/fill-in-the-gaps.component';
import { GroupSortComponent } from '../activities/group-sort/group-sort.component';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ActivityTypeCardComponent } from '../activity-type-card/activity-type-card.component';
import { MatchingPairsComponent } from '../activities/matching-pairs/matching-pairs.component';
import { MemoryMatchingPairsComponent } from '../activities/memory-matching-pairs/memory-matching-pairs.component';
import { Item } from '../../types';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectChangeEvent, MultiSelectModule } from 'primeng/multiselect';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-content',
  standalone: true,
  imports: [
    InputTextModule,
    FormsModule,
    FloatLabelModule,
    CommonModule,
    InputTextareaModule,
    MultipleChoiceComponent,
    LetterHuntComponent,
    SettingsComponent,
    WordOrderComponent,
    ClozeComponent,
    FillInTheGapsComponent,
    GroupSortComponent,
    ActivityTypeCardComponent,
    MatchingPairsComponent,
    MemoryMatchingPairsComponent,
    DropdownModule,
    MultiSelectModule,
    TranslateModule
  ],
  templateUrl: './content.component.html',
  styleUrl: './content.component.scss'
})
export class ContentComponent implements OnInit {
  @Input() id!: number;
  @Input() activityType: string = '';
  @Input() activityId: string = '';
  @Input() activityTitle: string = '';
  @Input() activityDescription: string = '';
  @Input() activityPlayerMode: string = '';
  @Input() activityTemplate: string = '';
  @Input() activitySettings = {};
  @Input() activityCEFR = '';
  @Input() activityTags = [];
  @Input() plays = 0;
  @Input() totalDuration = 0;
  @Input() userId = '';
  @Input() activityQuestions: Array<any> = [
    {
      document: '',
      answers: [],
      imageURL: '',
      id: 1,
      questionNumber: 1,
      TTSText: '',
      questionText: '',
      option: '',
      groupNumber: 1,
      groupName: '',
      items: []
    }
  ];

  cefr = [
    { item: 'pre-a1', value: 'Pre-A1' },
    { item: 'a1', value: 'A1' },
    { item: 'a1-a2', value: 'A1-A2' },
    { item: 'a2', value: 'A2' },
    { item: 'a2-b1', value: 'A2-B1' },
    { item: 'b1', value: 'B1' },
    { item: 'b1-b2', value: 'B1-B2' },
    { item: 'b2', value: 'B2' },
    { item: 'b2-c1', value: 'B2-C1' },
    { item: 'c1', value: 'C1' },
    { item: 'c1-c2', value: 'C1-C2' },
    { item: 'c2', value: 'C2' }
  ];
  selectedCEFR = { item: '', value: '' };
  hashTags = [
    { label: 'Pre-junior', value: 'Pre-junior' },
    { label: 'A Junior', value: 'A Junior' },
    { label: 'B Junior', value: 'B Junior' },
    { label: 'A+B Junior', value: 'A+B Junior' },
    { label: 'A Senior', value: 'A Senior' },
    { label: 'B Senior', value: 'B Senior' },
    { label: 'C Senior', value: 'C Senior' },
    { label: 'D Senior', value: 'D Senior' },
    { label: 'Pre-lower', value: 'Pre-lower' },
    { label: 'Lower', value: 'Lower' },
    { label: 'Advanced', value: 'Advanced' },
    { label: 'Proficiency', value: 'Proficiency' },
    { label: 'Advanced+Proficiency', value: 'Advanced+Proficiency' },
    { label: 'Adults', value: 'Adults' },
    { label: 'Panhellenic Examinations', value: 'Panhellenic Examinations' },
    { label: 'English for Specific Purposes', value: 'English for Specific Purposes' }
  ];

  selectedTags = [''];

  constants = Constants;
  constructor(public navigationService: NavigationService, private dataService: DataService) {}

  ngOnInit() {
    this.dataService.getActivityType().subscribe((actType) => {
      this.activityType = actType;
    });
    this.dataService.getQuestions().subscribe((questions) => {
      this.activityQuestions = questions;
    });
    this.dataService.getCEFR().subscribe((cefr) => {
      this.selectedCEFR.item = cefr;
      this.selectedCEFR.value = cefr
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('-');
    });
    this.dataService.getTags().subscribe((tags) => {
      this.selectedTags = tags;
      //console.log(this.selectedTags);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['activityId']) {
      this.dataService.setActivityID(this.activityId);
      //console.log('this.activityId123', this.activityId);
    }
    if (changes['activityTitle']) {
      this.dataService.setData('title', this.activityTitle);
    }
    if (changes['activityDescription']) {
      this.dataService.setData('description', this.activityDescription);
    }
    if (changes['activityTemplate']) {
      this.dataService.setData('template', this.activityTemplate);
    }
    if (changes['activitySettings']) {
      this.dataService.setData('settings', this.activitySettings);
    }
    if (changes['activityType']) {
      this.dataService.setData('activityType', this.activityType);
    }
    if (changes['activityPlayerMode']) {
      this.dataService.setData('playerMode', this.activityPlayerMode);
    }
    if (changes['activityQuestions']) {
      this.dataService.setData('questions', this.activityQuestions);
    }
    if (changes['activityCEFR']) {
      this.dataService.setData('cefr', this.activityCEFR);
    }
    if (changes['activityTags']) {
      this.dataService.setData('tags', this.activityTags);
    }
    if (changes['userId']) {
      //console.log('user id changed:', this.userId);
      this.dataService.setData('userId', this.userId);
    }
    if(changes['plays']){
      this.dataService.setData('plays', this.plays);
    }
    if(changes['totalDuration']){
      this.dataService.setData('totalDuration', this.totalDuration);
    }
  }

  onCEFRChange(event: any): void {
    this.selectedCEFR = event.value;
    this.dataService.setData('cefr', event.value.item);
  }

  onTagsChange(event: MultiSelectChangeEvent): void {
    this.selectedTags = [];
    this.selectedTags = event.value;
    this.dataService.setData('tags', this.selectedTags);
  }

  onTitleChange(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.activityTitle = inputElement.value;
    this.dataService.setData('title', this.activityTitle);
  }

  onDescriptionChange(event: Event) {
    const inputElement = event.target as HTMLTextAreaElement;
    this.activityDescription = inputElement.value;
    this.dataService.setData('description', this.activityDescription);
  }
}
