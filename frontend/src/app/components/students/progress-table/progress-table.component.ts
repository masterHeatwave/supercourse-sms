import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimaryTableComponent } from '../../table/primary-table/primary-table.component';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-progress-table',
  standalone: true,
  imports: [
    CommonModule,
    PrimaryTableComponent,
    ProgressBarModule,
    ButtonModule
  ],
  templateUrl: './progress-table.component.html',
  styleUrl: './progress-table.component.scss'
})
export class ProgressTableComponent {
  @Input() progressData: any[] = [];
  
  // Configure columns for primary table
  columns = [
    { field: 'grades', header: 'Grades', type: 'custom' },
    { field: 'achievements', header: 'Achievements', type: 'custom' },
    { field: 'attendance', header: 'Attendance', type: 'custom' },
    { field: 'behaviour', header: 'Behaviour', type: 'custom' },
    { field: 'rewards', header: 'Rewards', type: 'custom' }
  ];
  
  // Get data in the format needed for primary table
  get tableData() {
    return this.progressData;
  }
} 