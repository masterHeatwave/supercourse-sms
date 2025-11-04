import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
//import { ActivityDataService } from '../../services/';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { MainContentComponent } from '../../components/main-content/main-content.component';
import { LoadingComponent } from '../../components/loading/loading.component';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ImageModule } from 'primeng/image';
import { FormsModule } from '@angular/forms';
import { CustomActivitiesService } from '@gen-api/custom-activities/custom-activities.service';

@Component({
  selector: 'app-edit-view',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    MainContentComponent,
    DialogModule,
    ButtonModule,
    ImageModule,
    FormsModule,
    CommonModule,
    LoadingComponent
  ],
  templateUrl: './edit-view.component.html',
  styleUrl: './edit-view.component.scss'
})
export class EditViewComponent {
  id!: string;
  hasData: boolean = false;
  activityData = {
    id: '',
    activityType: '',
    playerMode: '',
    title: '',
    description: '',
    template: '',
    cefr: '',
    tags: [],
    settings: {},
    userId: '',
    questions: []
  };

  message: string = 'Loading activity...';

  isLoading: boolean = false;
  
  customActivityService = inject(CustomActivitiesService);

  constructor(
    private route: ActivatedRoute,
    // private customActivityService: CustomActivitiesService //private activityDataService: ActivityDataService
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id')!;
    this.fetchActivityData();
  }

  fetchActivityData(): void {
    //console.log(this.id);
    this.customActivityService.getCustomActivitiesActivityId(this.id).subscribe({
      next: (response: any) => {
        //console.log('response.data', response.data);
        this.activityData = response.data;
        if (this.activityData.activityType === 'fillInTheGaps' || this.activityData.activityType === 'cloze') {
          this.activityData.questions.forEach((question: any) => {
            question.document = question?.document?.replace(/#@/g, '').replace(/^"+|"+$/g, '');
          });
        }
        this.hasData = true;
        //console.log(this.activityData);
      },
      error: (err) => {
        this.message = 'There was an error loading the activity. Please try again.';
      }
    });

    /*this.activityDataService.getActivityDataById(this.id).subscribe({
      next: (data) => {
        this.activityData = data.data;
        //const cl = JSON.parse(JSON.stringify(this.activityData));
        //console.log('Cloned document:', cl);
        //console.log('this.activityData', data.data)
        this.hasData = true;
      },
      error: (err) => {
        this.message =
          'There was an error loading the activity. Please try again.';
        console.error('Error fetching item:', err);
      },
    });*/
  }
}
