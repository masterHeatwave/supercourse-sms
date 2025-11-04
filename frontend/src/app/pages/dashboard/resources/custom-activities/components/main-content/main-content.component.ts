import { Component, Input, SimpleChanges } from '@angular/core';
import { ActivityTypeComponent } from '../activity-type/activity-type.component';
import { PlayerModeComponent } from '../player-mode/player-mode.component';
import { NavigationService } from '../../services/navigation.service';
import { ContentComponent } from '../content/content.component';
import { TemplateComponent } from '../template/template.component';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-main-content',
  standalone: true,
  imports: [ActivityTypeComponent, PlayerModeComponent, ContentComponent, TemplateComponent, CommonModule],
  templateUrl: './main-content.component.html',
  styleUrl: './main-content.component.scss'
})
export class MainContentComponent {
  selectedNavigation: number = 1;

  @Input() activityData = {
    id: '',
    activityType: '',
    title: '',
    description: '',
    playerMode: '',
    template: '',
    cefr: '',
    tags: [],
    userId: '',
    settings: {},
    questions: []
  };

  @Input() hasData: boolean = false;
  userId: string = '';

  constructor(public navigationService: NavigationService, private dataService: DataService) {
    this.dataService.getUserId().subscribe({
      next: (value) => {
        //console.log('user id from data:', this.userId);
        this.userId = value;
        this.activityData.userId = this.userId;
        //console.log('constructor user id:', this.userId);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['userId']) {
      //console.log('came here eyah', this.userId);
      //this.activityData.userId = this.userId;
      //console.log('changed user id:', this.userId);
      //this.userId = 'asdf'
    }
  }
}
