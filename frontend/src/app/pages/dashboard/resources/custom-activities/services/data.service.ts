import { ChangeDetectorRef, Injectable, Output, EventEmitter } from '@angular/core';
import { Question, SaveResponse, ValidationObject } from '../types';
import { BehaviorSubject, Observable, tap, throwError } from 'rxjs';
import { INITIAL_QUESTION } from '../Constants';
import * as constants from '../Constants';
//import { environment } from '../../environments/environment';
import { CustomActivitiesService } from '@gen-api/custom-activities/custom-activities.service';
import { CustomActivity } from '@gen-api/schemas';
import { TranslateService } from '@ngx-translate/core';

interface Data {
  activityType: string;
  typeString: string;
  playerMode: string;
  playerModeString: string;
  title: string;
  description: string;
  template: string;
  templateURL: string;
  userId: string;
  cefr: string;
  plays: number;
  totalDuration: number;
  tags: any[];
  questions: any[];
  settings: any;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private activityID: string = '';
  private data: Data = {
    activityType: '',
    typeString: '',
    playerMode: '',
    playerModeString: '',
    title: '',
    description: '',
    template: '',
    templateURL: '',
    userId: '',
    cefr: '',
    plays: 0,
    totalDuration: 0,
    tags: [],
    questions: [JSON.parse(JSON.stringify(INITIAL_QUESTION))],
    settings: {}
  };

  private titleSubject = new BehaviorSubject<string>(this.data.title);
  private descriptionSubject = new BehaviorSubject<string>(this.data.description);
  private templateSubject = new BehaviorSubject<string>(this.data.template);
  private templateURLSubject = new BehaviorSubject<string>(this.data.templateURL);
  private userIdSubject = new BehaviorSubject<string>(this.data.userId);
  private cefrSubject = new BehaviorSubject<string>(this.data.cefr);
  private playsSubject = new BehaviorSubject<number>(this.data.plays);
  private totalDurationSubject = new BehaviorSubject<number>(this.data.totalDuration);
  private tagsSubject = new BehaviorSubject<Array<string>>(this.data.tags);
  private settingsSubject = new BehaviorSubject<object>(this.data.settings);
  private questionsSubject = new BehaviorSubject<Question[]>(this.data.questions);
  private activityTypeSubject = new BehaviorSubject<string>(this.data.activityType);
  private typeStringSubject = new BehaviorSubject<string>(this.data.typeString);
  private playerModeSubject = new BehaviorSubject<string>(this.data.playerMode);
  private playerModeStringSubject = new BehaviorSubject<string>(this.data.playerModeString);

  //private apiUrl = environment.apiUrl + '/activitySave/';

  constructor(private customActivityService: CustomActivitiesService, private translate: TranslateService) {}

  @Output() onResponse: EventEmitter<void> = new EventEmitter<void>();

  validationCheck(): { error: boolean } {
    if (
      !this.data.title ||
      !this.data.description ||
      !this.data.cefr ||
      !this.data.activityType ||
      !this.data.playerMode ||
      !this.data.tags ||
      !this.data.template ||
      !this.data.questions
    ) {
      return { error: true };
    }
    return { error: false };
  }

  saveData(): Observable<any> {
    if (this.validationCheck().error) {
      return throwError(() => new Error(this.translate.instant('customActivities.missing_fields')));
    }
    if (this.data.activityType === 'letterHunt') {
      for (let i = 0; i < this.data.questions.length; i++) {
        this.data.questions[i].answers.splice(1);
      }
    }
    if (this.data.activityType === 'fillInTheGaps' || this.data.activityType === 'cloze') {
      for (let i = 0; i < this.data.questions.length; i++) {
        this.data.questions[i].document = this.data.questions[i].document.replace(/#@/g, '').replace(/_{2,}/g, (match: any) => `#@${match}#@`);
      }
    }
    if (this.activityID !== '') {
      return this.customActivityService.putCustomActivitiesActivityId(this.data as CustomActivity, this.activityID);
    } else {
      return this.customActivityService.postCustomActivities(this.data as CustomActivity);
    }
  }

  getTitle() {
    return this.titleSubject.asObservable();
  }

  getActivityType() {
    return this.activityTypeSubject.asObservable();
  }

  getPlayerMode() {
    return this.playerModeSubject.asObservable();
  }

  getPlayerModeString() {
    return this.playerModeStringSubject.asObservable();
  }

  getDescription() {
    return this.descriptionSubject.asObservable();
  }

  getTemplate() {
    return this.templateSubject.asObservable();
  }

  getSettings() {
    return this.settingsSubject.asObservable();
  }

  getQuestions() {
    return this.questionsSubject.asObservable();
  }

  getCEFR() {
    return this.cefrSubject.asObservable();
  }

  getTags() {
    return this.tagsSubject.asObservable();
  }

  getUserId() {
    return this.userIdSubject.asObservable();
  }

  setActivityID(id: string) {
    this.activityID = id;
  }

  setTeacherId(teacherId: string) {
    //console.log('Teacher ID is:', this.data.teacherId);
  }

  setData<K extends keyof Data>(key: K, value: Data[K]): void {
    this.data[key] = value;
    switch (key) {
      case 'userId': {
        this.userIdSubject.next(value);
        break;
      }
      case 'cefr': {
        this.cefrSubject.next(value);
        break;
      }
      case 'tags': {
        this.tagsSubject.next(value);
        break;
      }
      case 'title': {
        this.titleSubject.next(value);
        break;
      }
      case 'description': {
        this.descriptionSubject.next(value);
        break;
      }
      case 'plays': {
        this.playsSubject.next(value);
        break;
      }
      case 'totalDuration': {
        this.totalDurationSubject.next(value);
        break;
      }
      case 'activityType': {
        this.resetActivity();
        this.data[key] = value;
        this.activityTypeSubject.next(value);
        this.questionsSubject.next([]);
        this.questionsSubject.next(this.data.questions);
        if (value === constants.FILL_IN_THE_BLANKS_VALUE) {
          this.typeStringSubject.next(constants.FILL_IN_THE_BLANKS_TEXT);
        }
        if (value === constants.CLOZE_VALUE) {
          this.typeStringSubject.next(constants.CLOZE_TEXT);
        }
        if (value === constants.LETTER_HUNT_VALUE) {
          this.typeStringSubject.next(constants.LETTER_HUNT_TEXT);
        }
        if (value === constants.MATCHING_PAIRS_VALUE) {
          this.typeStringSubject.next(constants.MATCHING_PAIRS_TEXT);
        }
        if (value === constants.GROUP_SORT_VALUE) {
          this.typeStringSubject.next(constants.GROUP_SORT_TEXT);
        }
        if (value === constants.WORD_ORDER_VALUE) {
          this.typeStringSubject.next(constants.WORD_ORDER_TEXT);
        }
        if (value === constants.MULTIPLE_CHOICE_QUIZ_VALUE) {
          this.typeStringSubject.next(constants.MULTIPLE_CHOICE_QUIZ_TEXT);
        }
        if (value === constants.MEMORY_MATCHING_PAIRS_VALUE) {
          this.typeStringSubject.next(constants.MEMORY_MATCHING_PAIRS_TEXT);
        }
        this.data.typeString = this.typeStringSubject.value;
        break;
      }
      case 'playerMode': {
        this.playerModeSubject.next(value);
        if (value === constants.SINGLE_PLAYER_MODE_VALUE) {
          this.playerModeStringSubject.next(constants.SINGLE_PLAYER_MODE_TEXT);
        }
        if (value === constants.MULTI_PLAYER_MODE_VALUE) {
          this.playerModeStringSubject.next(constants.MULTI_PLAYER_MODE_TEXT);
        }
        this.data.playerModeString = this.playerModeStringSubject.value;
        break;
      }
      case 'settings': {
        this.settingsSubject.next(value);
        break;
      }
      case 'template': {
        this.templateSubject.next(value);
        this.templateURLSubject.next(value);
        this.data.templateURL = this.templateURLSubject.value;
        break;
      }
      case 'questions': {
        this.questionsSubject.next(value);
        break;
      }
    }
  }

  private resetActivity(): void {
    this.data.questions = [];
    this.data.questions = [JSON.parse(JSON.stringify(INITIAL_QUESTION))];
    this.data.activityType = '';
    this.data.settings = {};
  }

  private resetData(): void {
    this.data = {
      typeString: '',
      userId: '',
      cefr: '',
      tags: [],
      activityType: '',
      playerMode: '',
      playerModeString: '',
      title: '',
      description: '',
      template: '',
      templateURL: '',
      plays: 0,
      totalDuration: 0,
      questions: [JSON.parse(JSON.stringify(INITIAL_QUESTION))],
      settings: {}
    };
  }

  isDataValid(currentNavigationId: number, target: number, hasData: boolean): ValidationObject {
    let returnValue: ValidationObject = { isValid: true, reason: '' };

    if (currentNavigationId > 2) {
      return returnValue;
    }

    if (target === 1) {
      return returnValue;
    } else {
      if (target > 1 && hasData) {
        return returnValue;
      } else {
        if (target === 2) {
          if (currentNavigationId === 2) {
            return { isValid: true, reason: '' };
          } else {
            if (currentNavigationId === 1 && this.data.activityType !== '') {
              return { isValid: true, reason: '' };
            } else {
              return {
                isValid: false,
                reason: this.translate.instant('customActivities.choose_activity_type')
              };
            }
          }
        } else {
          if (currentNavigationId === 1) {
            if (this.data.activityType !== '') {
              if (this.data.playerMode !== '') {
                return { isValid: true, reason: '' };
              } else {
                return {
                  isValid: false,
                  reason: this.translate.instant('customActivities.choose_player_mode')
                };
              }
            } else {
              return {
                isValid: false,
                reason: this.translate.instant('customActivities.choose_activity_type')
              };
            }
          } else {
            if (currentNavigationId === 2) {
              if (this.data.playerMode !== '') {
                return { isValid: true, reason: '' };
              } else {
                return {
                  isValid: false,
                  reason: this.translate.instant('customActivities.choose_player_mode')
                };
              }
            }
          }
        }
      }
    }
    return { isValid: false, reason: this.translate.instant('customActivities.uknown_navigation_error') };
  }
}
