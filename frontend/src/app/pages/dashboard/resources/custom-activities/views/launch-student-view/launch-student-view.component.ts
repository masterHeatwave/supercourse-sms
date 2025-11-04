import { AfterViewInit, Component, inject, OnInit } from '@angular/core';
import { UnityComponent } from '../../components/unity/unity.component';
import { ActivatedRoute } from '@angular/router';
//import { ActivityDataService } from '../../services/activity-data.service';
import { CommonModule } from '@angular/common';
import { CustomActivitiesService } from '@gen-api/custom-activities/custom-activities.service';

@Component({
  selector: 'app-launch-student-view',
  standalone: true,
  imports: [UnityComponent, CommonModule],
  templateUrl: './launch-student-view.component.html',
  styleUrl: './launch-student-view.component.scss'
})
export class LaunchStudentViewComponent implements OnInit, AfterViewInit {
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

  message: string = 'Loading activity...';
  isLoading: boolean = true;
  
  customActivityService = inject(CustomActivitiesService);
  
  constructor(
    private route: ActivatedRoute,
    // private customActivitiesService: CustomActivitiesService //private activityDataService: ActivityDataService
  ) {}

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id')!;
    this.fetchActivityData();
  }

  ngAfterViewInit() {}

  fetchActivityData(): void {
    this.customActivityService.getCustomActivitiesActivityId(this.id).subscribe({
      next: (response: any) => {
        if (response.data) {
          this.activityData = response.data;
          this.hasData = true;
          this.isLoading = false;
        } else {
          this.message = 'There was an error loading the activity. Please try again.';
        }
      },
      error: (err) => {
        this.message = 'There was an error loading the activity. Please try again.';
        console.error('Error fetching item:', err);
      }
    });
    /*this.activityDataService.getActivityDataById(this.id).subscribe({
      next: (data) => {
        this.activityData = data.data;
        this.hasData = true;
        this.isLoading = false;
      },
      error: (err) => {
        this.message =
          'There was an error loading the activity. Please try again.';
        console.error('Error fetching item:', err);
      },
    });*/
  }
}
