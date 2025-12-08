import { Component, EventEmitter, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
//import { ActivityDataService } from '../../services/activity-data.service';
import { CommonModule } from '@angular/common';
import * as Constants from '../../Constants';
import { CustomActivitiesService } from '@gen-api/custom-activities/custom-activities.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-preview-basic-view',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './preview-basic-view.component.html',
  styleUrl: './preview-basic-view.component.scss'
})
export class PreviewBasicViewComponent {
  id!: string;
  hasData: boolean = false;
  @Output() onActivityLoad: EventEmitter<{}> = new EventEmitter<{}>();
  activityData = {
    _id: '',
    activityType: '',
    playerMode: '',
    title: '',
    description: '',
    template: '',
    cefr: '',
    tags: [
      {
        label: '',
        value: ''
      }
    ],
    settings: {},
    questions: [
      {
        questionNumber: 1,
        questionText: '',
        document: '',
        option: '',
        answers: [
          {
            answerText: '',
            TTSText: '',
            imageURL: '',
            label: '',
            isCorrect: false,
            item1: {
              answerText: '',
              imageURL: '',
              TTSText: ''
            },
            item2: {
              answerText: '',
              imageURL: '',
              TTSText: ''
            }
          }
        ],
        distractors: [],
        imageURL: '',
        groupNumber: 1,
        groupName: '',
        items: [
          {
            group: 1,
            itemNumber: 1,
            answer: {
              imageURL: '',
              TTSText: '',
              answerText: ''
            }
          }
        ]
      }
    ]
  };

  message: string = this.translate.instant('customActivities.loading_activity');
  isLoading: boolean = true;
  hasError: boolean = false;

  constructor(private route: ActivatedRoute, private customActivityService: CustomActivitiesService, private translate: TranslateService) {
    this.message = this.translate.instant('customActivities.loading_activity');
    this.buildActivityTypeTextMap();
    this.buildActivitySettingsTextMap();
    this.translate.onLangChange.subscribe(() => {
      this.buildActivityTypeTextMap();
      this.buildActivitySettingsTextMap();
    });
  } //, private activityDataService: ActivityDataService) {}

  buildActivityTypeTextMap() {
    this.activityTypeTextMap = {
      [Constants.CLOZE_VALUE]: this.translate.instant(`customActivities.${Constants.CLOZE_VALUE}.label`), //Constants.CLOZE_TEXT,
      [Constants.FILL_IN_THE_BLANKS_VALUE]: this.translate.instant(`customActivities.${Constants.FILL_IN_THE_BLANKS_VALUE}.label`), //Constants.FILL_IN_THE_BLANKS_TEXT,
      [Constants.GROUP_SORT_VALUE]: this.translate.instant(`customActivities.${Constants.GROUP_SORT_VALUE}.label`), //Constants.GROUP_SORT_TEXT,
      [Constants.LETTER_HUNT_VALUE]: this.translate.instant(`customActivities.${Constants.LETTER_HUNT_VALUE}.label`), //Constants.LETTER_HUNT_TEXT,
      [Constants.MATCHING_PAIRS_VALUE]: this.translate.instant(`customActivities.${Constants.MATCHING_PAIRS_VALUE}.label`), //Constants.MATCHING_PAIRS_TEXT,
      [Constants.MEMORY_MATCHING_PAIRS_VALUE]: this.translate.instant(`customActivities.${Constants.MEMORY_MATCHING_PAIRS_VALUE}.label`), //Constants.MEMORY_MATCHING_PAIRS_TEXT,
      [Constants.MULTIPLE_CHOICE_QUIZ_VALUE]: this.translate.instant(`customActivities.${Constants.MULTIPLE_CHOICE_QUIZ_VALUE}.label`), //Constants.MULTIPLE_CHOICE_QUIZ_TEXT,
      [Constants.WORD_ORDER_VALUE]: this.translate.instant(`customActivities.${Constants.WORD_ORDER_VALUE}.label`) //Constants.WORD_ORDER_TEXT
    };
  }

  buildActivitySettingsTextMap() {
    this.activitySettingsTextMap = {
      [Constants.ALLOW_EXTRA_POINTS_FOR_QUICK_RESPONSES_OPTION_VALUE]: this.translate.instant(
        `customActivities.settings.${Constants.ALLOW_EXTRA_POINTS_FOR_QUICK_RESPONSES_OPTION_VALUE}`
      ), //Constants.ALLOW_EXTRA_POINTS_FOR_QUICK_RESPONSES_OPTION_TEXT,
      [Constants.ANSWERS_ARE_CASE_SENSITIVE_AND_ALLOW_HYPHENATION_OPTION_VALUE]: this.translate.instant(
        `customActivities.settings.${Constants.ANSWERS_ARE_CASE_SENSITIVE_AND_ALLOW_HYPHENATION_OPTION_VALUE}`
      ), //Constants.ANSWERS_ARE_CASE_SENSITIVE_AND_ALLOW_HYPHENATION_OPTION_TEXT,
      [Constants.REQUIRE_HYPHENS_TO_MATCH_VALUE]: this.translate.instant(`customActivities.settings.${Constants.REQUIRE_HYPHENS_TO_MATCH_VALUE}`), //Constants.REQUIRE_HYPHENS_TO_MATCH_TEXT,
      [Constants.MATCH_CAPITAL_LETTERS_EXACTLY_VALUE]: this.translate.instant(
        `customActivities.settings.${Constants.MATCH_CAPITAL_LETTERS_EXACTLY_VALUE}`
      ), //Constants.MATCH_CAPITAL_LETTERS_EXACTLY_TEXT,
      [Constants.ANSWERS_ARE_CASE_SENSITIVE_OPTION_VALUE]: this.translate.instant(
        `customActivities.settings.${Constants.ANSWERS_ARE_CASE_SENSITIVE_OPTION_VALUE}`
      ), //Constants.ANSWERS_ARE_CASE_SENSITIVE_OPTION_TEXT,
      [Constants.DISPLAY_ALL_ITEMS_FROM_THE_START_OPTION_VALUE]: this.translate.instant(
        `customActivities.settings.${Constants.DISPLAY_ALL_ITEMS_FROM_THE_START_OPTION_VALUE}`
      ), //Constants.DISPLAY_ALL_ITEMS_FROM_THE_START_OPTION_TEXT,
      [Constants.DISPLAY_ANSWERS_VALUE]: this.translate.instant(`customActivities.settings.${Constants.DISPLAY_ANSWERS_VALUE}`), //Constants.DISPLAY_ANSWERS_TEXT,
      [Constants.EACH_SENTENCE_APPEARS_IN_A_SEPARATE_PAGE_OPTION_VALUE]: this.translate.instant(
        `customActivities.settings.${Constants.EACH_SENTENCE_APPEARS_IN_A_SEPARATE_PAGE_OPTION_VALUE}`
      ), //Constants.EACH_SENTENCE_APPEARS_IN_A_SEPARATE_PAGE_OPTION_TEXT,
      [Constants.HIDE_MATCHED_CARDS_OPTION_VALUE]: this.translate.instant(`customActivities.settings.${Constants.HIDE_MATCHED_CARDS_OPTION_VALUE}`), //Constants.HIDE_MATCHED_CARDS_OPTION_TEXT,
      [Constants.HIDE_MATCHED_PAIRS_OPTION_VALUE]: this.translate.instant(`customActivities.settings.${Constants.HIDE_MATCHED_PAIRS_OPTION_VALUE}`), //Constants.HIDE_MATCHED_PAIRS_OPTION_TEXT,
      [Constants.NUMBER_ITEMS_OPTION_VALUE]: this.translate.instant(`customActivities.settings.${Constants.NUMBER_ITEMS_OPTION_VALUE}`), //Constants.NUMBER_ITEMS_OPTION_TEXT,
      [Constants.NUMBER_THE_BACK_OF_THE_CARDS_OPTION_VALUE]: this.translate.instant(
        `customActivities.settings.${Constants.NUMBER_THE_BACK_OF_THE_CARDS_OPTION_VALUE}`
      ), //Constants.NUMBER_THE_BACK_OF_THE_CARDS_OPTION_TEXT,
      [Constants.NUMBER_THE_PAIRS_OPTION_VALUE]: this.translate.instant(`customActivities.settings.${Constants.NUMBER_THE_PAIRS_OPTION_VALUE}`), //Constants.NUMBER_THE_PAIRS_OPTION_TEXT,
      [Constants.PUBLIC_OPTION_VALUE]: this.translate.instant(`customActivities.settings.${Constants.PUBLIC_OPTION_VALUE}`), //Constants.PUBLIC_OPTION_TEXT,
      [Constants.RANDOMIZE_ANSWERS_OPTION_VALUE]: this.translate.instant(`customActivities.settings.${Constants.RANDOMIZE_ANSWERS_OPTION_VALUE}`), //Constants.RANDOMIZE_ANSWERS_OPTION_TEXT,
      [Constants.RANDOMIZE_ITEMS_OPTION_VALUE]: this.translate.instant(`customActivities.settings.${Constants.RANDOMIZE_ITEMS_OPTION_VALUE}`), //Constants.RANDOMIZE_ITEMS_OPTION_TEXT,
      [Constants.SHOW_ANAGRAMS_OPTION_VALUE]: this.translate.instant(`customActivities.settings.${Constants.SHOW_ANAGRAMS_OPTION_VALUE}`) //Constants.SHOW_ANAGRAMS_OPTION_TEXT
    };
  }

  activityTypeTextMap = {};

  activitySettingsTextMap: { [key: string]: string } = {};
  get activityTypeText(): string {
    return this.activityTypeTextMap[this.activityData.activityType as keyof typeof this.activityTypeTextMap];
  }

  formatCefr(value: string): string {
    if (!value) return value;
    return value
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('-');
  }

  getFormattedTagValues(): string {
    return this.activityData.tags.map((tag) => `'${tag}'`).join(', ');
  }

  getSettingText(settingValue: string): string {
    return this.activitySettingsTextMap[settingValue] || 'Unknown Setting';
  }

  shuffleArray(initialArray: any[]): any[] {
    // Fisher-Yates shuffle
    let array = initialArray;
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id')!;
    this.fetchActivityData();
  }

  renderActivity(): void {
    console.log('Rendeding activity');
    switch (this.activityData.activityType) {
      case Constants.CLOZE_VALUE:
        console.log('Rendeding cloze');
        this.renderCloze();
        break;
      case Constants.FILL_IN_THE_BLANKS_VALUE:
        this.renderFillInTheGaps();
        break;
      case Constants.GROUP_SORT_VALUE:
        this.renderGroupSort();
        break;
      case Constants.LETTER_HUNT_VALUE:
        this.renderLetterHunt();
        break;
      case Constants.MATCHING_PAIRS_VALUE:
        this.renderMatchingPairs();
        break;
      case Constants.MEMORY_MATCHING_PAIRS_VALUE:
        this.renderMemoryMatchingPairs();
        break;
      case Constants.MULTIPLE_CHOICE_QUIZ_VALUE:
        this.renderMultipleChoice();
        break;
      case Constants.WORD_ORDER_VALUE:
        this.renderWordOrder();
        break;
    }
  }

  renderCloze(): void {
    let div = document.createElement('div');
    let label = document.createElement('label');
    label.innerHTML = `<p><u>${this.translate.instant('customActivities.text')}</u></p>`;
    /*this.translate.get('customActivities.text').subscribe((translated) => {
        label.innerHTML = `<p><u>${translated}</u></p>`;
      });*/
    this.activityData.questions.forEach((question) => {
      label.innerHTML += question.document.replace(/#@/g, '');
      label.innerHTML += '<p>';
      //label.innerHTML += '<u>Answers</u>: ';
      //let answers = this.shuffleArray([...question.answers]);
      /*answers.forEach((answer, index) => {
          label.innerHTML += answer;
          if (index < answers.length - 1) {
            label.innerHTML += ', ';
          }
        });*/
      label.innerHTML += '</p>';
      div.appendChild(label);
      if (question.imageURL) {
        let img = document.createElement('img');
        img.src = question.imageURL;
        //img.width = 200;
        img.style.maxWidth = '80%';
        img.style.maxHeight = '200px';
        img.style.display = 'block';
        div.appendChild(img);
      }
    });
    this.renderInDom(div);
  }

  renderFillInTheGaps() {
    let div = document.createElement('div');
    let label = document.createElement('label');
    label.innerHTML = `<p><u>${this.translate.instant('customActivities.sentences')}</u></p>`;
    div.appendChild(label);
    this.activityData.questions.forEach((question, index) => {
      label.innerHTML += index + 1 + '. ' + question.document.replace(/#@/g, '');
      label.innerHTML += '<p>';
      label.innerHTML += '&nbsp;&nbsp;&nbsp;&nbsp;';
      let answers = this.shuffleArray(question.answers);
      //let distractors = this.shuffleArray(question.distractors);
      //let shuffledArray = [...answers, ...distractors];
      //shuffledArray = this.shuffleArray(shuffledArray);
      //console.log(shuffledArray);
      //shuffledArray.forEach((value, index) => {
      //label.innerHTML += value;
      //if (index < shuffledArray.length - 1) {
      //label.innerHTML += ', ';
      //}
      //});
      label.innerHTML += '</p>';
      if (question.imageURL) {
        label.innerHTML += '<p>';
        let img = document.createElement('img');
        img.src = question.imageURL;
        //img.width = 200;
        img.style.maxWidth = '80%';
        img.style.maxHeight = '200px';
        img.style.display = 'block';
        label.appendChild(img);
      }
      label.innerHTML += '</p>';
    });
    this.renderInDom(div);
  }

  renderGroupSort() {
    let div = document.createElement('div');
    let label1 = document.createElement('label');
    let label2 = document.createElement('label');
    label1.innerHTML = `<p><u>${this.translate.instant('customActivities.groups')}</u></p>`;
    label1.innerHTML += '<p>';
    label2.innerHTML = `<p><u>${this.translate.instant('customActivities.items')}</u></p>`;
    label2.innerHTML += '<p>';
    div.appendChild(label1);
    div.appendChild(label2);
    let groupArr = [...this.activityData.questions];
    groupArr = this.shuffleArray(groupArr);
    groupArr.forEach((question) => {
      label1.innerHTML += question.groupName;
      label1.innerHTML += ' ';
      label1.innerHTML += '</p>';
      if (question.imageURL) {
        let img = document.createElement('img');
        img.src = question.imageURL;
        //img.width = 200;
        img.style.maxWidth = '80%';
        img.style.maxHeight = '200px';
        img.style.display = 'block';
        label1.appendChild(img);
      }
      label1.innerHTML += '</p>';
    });
    let grp2: any = [];
    this.activityData.questions.forEach((question) => {
      let grp = [...question.items];
      grp = this.shuffleArray(grp);

      grp.forEach((item) => {
        grp2.push(item.answer.answerText);
      });
      grp2 = this.shuffleArray(grp2);
    });
    grp2 = this.shuffleArray(grp2);
    for (let i = 0; i < grp2.length; i++) {
      label2.innerHTML += grp2[i];
      label2.innerHTML += '<br/>';
    }
    label2.innerHTML += '</p>';
    this.activityData.questions.forEach((question) => {
      question.items.forEach((item) => {
        if (item.answer.imageURL) {
          let img = document.createElement('img');
          img.src = item.answer.imageURL;
          //img.width = 150;
          img.style.maxWidth = '80%';
          img.style.maxHeight = '150px';
          img.style.display = 'block';
          label2.appendChild(img);
        }
      });
    });
    this.renderInDom(div);
  }

  renderLetterHunt() {
    let div = document.createElement('div');
    let label1 = document.createElement('label');
    let label2 = document.createElement('label');
    label1.innerHTML = `<p><u>${this.translate.instant('customActivities.words')}</u></p>`;
    div.appendChild(label1);
    div.appendChild(label2);
    let shuffledArray = [...this.activityData.questions];
    shuffledArray = this.shuffleArray(shuffledArray);
    shuffledArray.forEach((question) => {
      label1.innerHTML += '<p>';
      label1.innerHTML += question.answers[0].answerText;
    });
    label1.innerHTML += '</p>';

    this.activityData.questions.forEach((question) => {
      label2.innerHTML += '<p>';
      let answer = question.answers[0];
      if (answer.imageURL) {
        let img = document.createElement('img');
        img.src = answer.imageURL;
        //img.width = 200;
        img.style.maxWidth = '80%';
        img.style.maxHeight = '200px';
        img.style.display = 'block';
        div.appendChild(img);
      }
    });

    this.renderInDom(div);
  }

  renderMatchingPairs() {
    let div = document.createElement('div');
    let label = document.createElement('label');
    label.innerHTML = `<p><u>${this.translate.instant('customActivities.pairs')}</u></p>`;
    div.appendChild(label);
    let questions = [...this.activityData.questions];
    let answers = [];
    for (let i = 0; i < questions.length; i++) {
      answers.push(questions[i].answers[0].item1);
      answers.push(questions[i].answers[0].item2);
    }

    answers = this.shuffleArray(answers);
    answers.forEach((answer, index, answers) => {
      const randomNumber = Math.floor(Math.random() * 2) + 1;
      label.innerHTML += answer.answerText;
      label.innerHTML += '<br/>';
      /*if (index < answers.length - 1) {
          label.innerHTML += ', ';
        }*/
    });

    label.innerHTML += '</p>';

    answers.forEach((answer, index) => {
      if (answer.imageURL) {
        let img = document.createElement('img');
        img.src = answer.imageURL;
        //img.width = 200;
        img.style.maxWidth = '80%';
        img.style.maxHeight = '200px';
        img.style.display = 'block';
        div.appendChild(img);
      }
    });

    this.renderInDom(div);
  }

  renderMemoryMatchingPairs() {
    let div = document.createElement('div');
    let label = document.createElement('label');
    label.innerHTML = `<p><u>${this.translate.instant('customActivities.pairs')}</u></p>`;
    div.appendChild(label);
    let questions = [...this.activityData.questions];
    let answers = [];
    for (let i = 0; i < questions.length; i++) {
      answers.push(questions[i].answers[0].item1);
      answers.push(questions[i].answers[0].item2);
    }

    answers = this.shuffleArray(answers);
    answers.forEach((answer, index, answers) => {
      const randomNumber = Math.floor(Math.random() * 2) + 1;
      label.innerHTML += answer.answerText;
      if (index < answers.length - 1) {
        label.innerHTML += ', ';
      }
    });

    label.innerHTML += '</p>';

    answers.forEach((answer, index) => {
      if (answer.imageURL) {
        let img = document.createElement('img');
        img.src = answer.imageURL;
        //img.width = 200;
        img.style.maxWidth = '80%';
        img.style.maxHeight = '200px';
        img.style.display = 'block';
        div.appendChild(img);
      }
    });

    this.renderInDom(div);
  }

  renderMultipleChoice() {
    let div = document.createElement('div');
    let label1 = document.createElement('label');
    let label2 = document.createElement('label');
    label1.innerHTML = `<p><u>${this.translate.instant('customActivities.questions')}</u></p>`;
    div.appendChild(label1);
    div.appendChild(label2);
    this.activityData.questions.forEach((question, index) => {
      label1.innerHTML += '<p>' + (index + 1) + '. ' + question.questionText;
      if (question.imageURL) {
        let img = document.createElement('img');
        img.src = question.imageURL;
        //img.width = 200;
        img.style.maxWidth = '80%';
        img.style.maxHeight = '200px';
        img.style.display = 'block';
        label1.appendChild(img);
      }
      label1.innerHTML += '</p><p>';
      let shuffledArray = [...question.answers];
      if ((this.activityData.settings as any).randomizeAnswers) {
        shuffledArray = this.shuffleArray(shuffledArray);
      }
      //if(this.activityData.settings.RANDOMIZE_ANSWERS_OPTION_VALUE)
      shuffledArray.forEach((answer, index) => {
        label1.innerHTML += '&nbsp;&nbsp;&nbsp;&nbsp;';
        label1.innerHTML += String.fromCharCode(97 + index) + '. ' + answer.answerText; //answer.label + ' ' + answer.answerText;
        label1.innerHTML += '</p><p>';
      });

      shuffledArray.forEach((answer, index) => {
        if (answer.imageURL) {
          let img = document.createElement('img');
          img.src = answer.imageURL;
          //img.width = 200;
          img.style.maxWidth = '80%';
          img.style.maxHeight = '200px';
          img.style.display = 'block';
          label1.appendChild(img);
        }
      });
    });
    label1.innerHTML += '</p>';

    this.renderInDom(div);
  }

  renderInDom(element: HTMLElement): void {
    const container = document.getElementById('activity-container');
    if (container) {
      container.innerHTML = '';
      container.appendChild(element);
    }
  }

  renderWordOrder() {
    let div = document.createElement('div');
    let label = document.createElement('label');
    label.innerHTML = `<p><u>${this.translate.instant('customActivities.text')}</u></p><p>`;
    this.activityData.questions.forEach((question, index) => {
      question.answers.forEach((answer) => {
        let words = answer.answerText.split('#@'); //.join(' ').split(' ');
        let string = '';
        words = this.shuffleArray(words);
        string = words.join(', ');
        string = string.replace(/\./g, '');
        string = index + 1 + '. ' + string;
        label.innerHTML += string + '</p>';
        if (answer.imageURL) {
          let img = document.createElement('img');
          img.src = answer.imageURL;
          img.style.maxWidth = '80%';
          img.style.maxHeight = '200px';
          img.style.display = 'block';
          label.appendChild(img);
        }
        label.innerHTML += '</p>';
      });
      div.appendChild(label);
    });
    this.renderInDom(div);
  }

  fetchActivityData(): void {
    this.customActivityService.getCustomActivitiesActivityId(this.id).subscribe({
      next: (response: any) => {
        if (response.data) {
          this.activityData = response.data;
          this.hasData = true;
          this.isLoading = false;
          this.onActivityLoad.emit(response.data);

          setTimeout(() => this.renderActivity());
        } else {
          this.isLoading = false;
          this.hasError = true;
          this.message = this.translate.instant('customActivities.error_loading_activity'); //'There was an error loading the activity. Please try again.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.hasError = true;
        this.message = this.translate.instant('customActivities.error_loading_activity'); //'There was an error loading the activity. Please try again.';
        console.error('Error fetching item:', err);
      }
    });
    /*this.activityDataService.getActivityDataById(this.id).subscribe({
        next: (data: any) => {
          this.activityData = data.data;
          this.hasData = true;
          this.isLoading = false;
          this.onActivityLoad.emit(data.data);
        },
        error: (err: any) => {
          this.message = 'There was an error loading the activity. Please try again.';
          console.error('Error fetching item:', err);
        }
      });*/
  }
}
