import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UnityComponent } from '../../components/unity/unity.component';
import { CommonModule } from '@angular/common';
import { PreviewViewComponent } from '../preview-view/preview-view.component';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
//import { MatSliderModule } from '@angular/material/slider';

@Component({
  selector: 'app-launch-teacher-view',
  standalone: true,
  imports: [
    UnityComponent,
    CommonModule,
    PreviewViewComponent,
    ButtonModule,
    CheckboxModule,
    DropdownModule,
    FormsModule
    //MatSliderModule,
  ],
  templateUrl: './launch-teacher-view.component.html',
  styleUrl: './launch-teacher-view.component.scss'
})
export class LaunchTeacherViewComponent {
  id!: string;
  hasData: boolean = false;
  activityData = {
    _id: '',
    activityType: '',
    playerMode: '',
    title: '',
    description: '',
    template: '',
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

  extraSettings = {
    animations: false,
    timer: 30,
    questions: 0,
    players: 0
  };

  animationsChecked: boolean = false;
  options = [10, 20, 30];
  seconds: number = 30;
  questions: number = 2;
  maxQuestions: number = 10;
  players: number = 2;
  maxPlayers: number = 10;
  playersMessage: string = 'Questions will repeat.';

  message: string = 'Loading activity...';
  isLoading: boolean = true;
  isReady: boolean = false;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id')!;
    //console.log(this.id);
  }

  handleActivityLoad(data: any) {
    this.activityData = data;
    this.isLoading = false;
    this.hasData = true;
    this.isReady = false;
    this.maxQuestions = this.activityData.questions.length;
    this.questions = this.maxQuestions;
    this.extraSettings.questions = this.questions;
    if (this.activityData.playerMode === 'multiplayer') {
      this.extraSettings.players = this.players;
    }
  }

  onPlayersChange() {
    this.extraSettings.players = this.players;
  }

  onQuestionsChange() {
    this.extraSettings.questions = this.questions;
  }

  onTimerChange() {
    this.extraSettings.timer = this.seconds;
  }

  onAnimationsChange() {
    this.extraSettings.animations = this.animationsChecked;
  }

  startActivityClick() {
    this.isReady = true;
  }
}
