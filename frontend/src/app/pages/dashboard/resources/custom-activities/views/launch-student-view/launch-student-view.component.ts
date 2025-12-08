import { AfterViewInit, Component, inject, Input, OnInit, SimpleChanges } from '@angular/core';
import { UnityComponent } from '../../components/unity/unity.component';
import { ActivatedRoute } from '@angular/router';
//import { ActivityDataService } from '../../services/activity-data.service';
import { CommonModule } from '@angular/common';
import { CustomActivitiesService } from '@gen-api/custom-activities/custom-activities.service';
import { TranslateService } from '@ngx-translate/core';
import { selectAuthState } from '@store/auth/auth.selectors';
import { Store } from '@ngrx/store';

@Component({
  selector: 'app-launch-student-view',
  standalone: true,
  imports: [UnityComponent, CommonModule],
  templateUrl: './launch-student-view.component.html',
  styleUrl: './launch-student-view.component.scss'
})
export class LaunchStudentViewComponent implements OnInit {
  @Input() activityId!: string;
  @Input() assignmentId!: string;
  @Input() active: boolean = true;
  hasData: boolean = false;
  activityData = {
    _id: '',
    assignmentId: '',
    studentId: '',
    completed: false,
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

  message: string = '';
  isLoading: boolean = true;
  //hashTagAt: boolean = false;
  currentUserID: string = '';
  store = inject(Store);

  constructor(
    private route: ActivatedRoute,
    private customActivitiesService: CustomActivitiesService,
    private translate: TranslateService //private activityDataService: ActivityDataService
  ) {
    this.translate.get('customActivities.loading_activity').subscribe((value) => {
      this.message = value;
    });
    this.store.select(selectAuthState).subscribe((authState: any) => {
      this.currentUserID = authState.user?.id || '';
    });
  }

  ngOnInit() {
    //this.activityId = this.route.snapshot.paramMap.get('id')!;
    this.translate.get('customActivities.loading_activity').subscribe((value) => (this.message = value));
    this.fetchActivityData();
  }

  fetchActivityData(): void {
    this.customActivitiesService.getCustomActivitiesStudentActivityUserUserIdActivityActivityId(this.currentUserID, this.activityId).subscribe({
      next: (response: any) => {
        if (response.data) {
          //this.activityData = response.data;
          const activity = response.data;
          console.log('activity:', activity);

          const student = activity.students.find((s: any) => s.studentId === this.currentUserID);
          console.log('student', student);

          if (student) {
            this.activityData = {
              ...activity,
              studentId: student.studentId,
              completed: student.completed,
              assignmentId: this.assignmentId,
              students: undefined
            };
          } else {
            this.activityData = activity;
          }
          this.hasData = true;
          this.isLoading = false;
        } else {
          this.message = this.translate.instant('customActivities.error_loading_activity'); //'There was an error loading the activity. Please try again.';
        }
      },
      error: (err) => {
        this.message = this.translate.instant('customActivities.error_loading_activity');
        console.error('Error fetching item:', err);
      }
    });
  }
}
