import { Component, Input } from '@angular/core';
import { NavigationService } from '../../services/navigation.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { RadioButtonModule } from 'primeng/radiobutton';
import { FormsModule } from '@angular/forms';
import * as Constants from '../../Constants';
import { DataService } from '../../services/data.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-activity-type',
  standalone: true,
  imports: [
    CardModule,
    ButtonModule,
    RadioButtonModule,
    FormsModule,
    CommonModule,
  ],
  templateUrl: './activity-type.component.html',
  styleUrl: './activity-type.component.scss',
})
export class ActivityTypeComponent {
  @Input() id!: number;
  @Input() activityType: string = '';
  constants = Constants;

  constructor(
    public navigationService: NavigationService,
    private dataService: DataService
  ) {}

  radioButtonClick(event: any): void {
    this.dataService.setData('activityType', event.value);
  }
}
