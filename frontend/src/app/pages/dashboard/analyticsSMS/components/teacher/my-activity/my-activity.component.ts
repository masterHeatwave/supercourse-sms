import { Component } from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { AnalyticsService } from '../../../services/analytics-service';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-my-activity',
  standalone: true,
  imports: [BaseChartDirective, CheckboxModule, FormsModule, TranslateModule],
  templateUrl: './my-activity.component.html',
  styleUrl: './my-activity.component.scss'
})
export class MyActivityComponent {
  completedSessions: number = 0;
  assignedTasks: number = 0;

  assignedTasksPerClassData: any[] = [0, 0, 0];

  feedbackOffered: number = 0;
  stickersAwarded: number = 0;

  dailyTimeSpentOnPlatform: number = 0;
  weeklyTimeSpentOnPlatform: number = 0;
  thisWeekTimeSpentOnPlatform: number = 0;

  dailySessionTime: number = 0;
  weeklySessionTime: number = 0;
  thisWeekSessionTime: number = 0;

  totalDailyTimeSpent: number = 0;
  totalWeeklyTimeSpent: number = 0;
  totalThisWeekTimeSpent: number = 0;

  checked: boolean = false;

  constructor(private analyticsService: AnalyticsService, private translate: TranslateService) {}

  ngOnInit(): void {
    this.analyticsService.getMyActivityAnalytics().subscribe((data) => {
      //console.log(data);
      this.completedSessions = data.obj.completedSessions;
      this.assignedTasks = data.obj.assignedTasks;
      this.assignedTasksPerClassData = data.obj.assignedTasksPerClassData;
      this.feedbackOffered = data.obj.feedbackOffered;
      this.stickersAwarded = data.obj.stickersAwarded;

      this.dailyTimeSpentOnPlatform = data.obj.dailyTimeSpentOnPlatform;
      this.weeklyTimeSpentOnPlatform = data.obj.weeklyTimeSpentOnPlatform;
      this.thisWeekTimeSpentOnPlatform = data.obj.thisWeekTimeSpentOnPlatform;

      this.dailySessionTime = data.obj.dailySessionTime;
      this.weeklySessionTime = data.obj.weeklySessionTime;
      this.thisWeekSessionTime = data.obj.thisWeekSessionTime;

      if (!this.checked) {
        this.totalDailyTimeSpent = this.dailyTimeSpentOnPlatform + this.dailySessionTime;
        this.totalWeeklyTimeSpent = this.weeklyTimeSpentOnPlatform + this.weeklySessionTime;
        this.totalThisWeekTimeSpent = this.thisWeekTimeSpentOnPlatform + this.thisWeekSessionTime;
      } else {
        this.totalDailyTimeSpent = this.dailyTimeSpentOnPlatform;
        this.totalWeeklyTimeSpent = this.weeklyTimeSpentOnPlatform;
        this.totalThisWeekTimeSpent = this.thisWeekTimeSpentOnPlatform;
      }

      this.assignedTasksPerClass = {
        labels: ['A Senior', 'Pre-lower', 'A junior'],
        datasets: [{ data: this.assignedTasksPerClassData, label: '', backgroundColor: ['#2f5d8a', '#368da8', '#56b6c2'] }]
      };
    });
  }

  public assignedTasksPerClass: ChartConfiguration<'bar'>['data'] = {
    labels: ['A Senior', 'Pre-lower', 'A junior'],
    datasets: [{ data: this.assignedTasksPerClassData, label: '', backgroundColor: ['#2f5d8a', '#368da8', '#56b6c2'] }]
  };
  public assignedTasksPerClassOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        title: {
          display: true,
          text: '',
          font: { size: 14, weight: 'bold' },
          color: ''
        }
      },
      x: {
        title: {
          font: { weight: 'bold' }
        }
      }
    },
    plugins: {
      datalabels: {
        display: false
      },
      legend: {
        display: false // 👈 hides the blue box
      }
    }
  };

  onCheckboxClick() {
    if (!this.checked) {
      this.totalDailyTimeSpent = this.dailyTimeSpentOnPlatform + this.dailySessionTime;
      this.totalWeeklyTimeSpent = this.weeklyTimeSpentOnPlatform + this.weeklySessionTime;
      this.totalThisWeekTimeSpent = this.thisWeekTimeSpentOnPlatform + this.thisWeekSessionTime;
    } else {
      this.totalDailyTimeSpent = this.dailyTimeSpentOnPlatform;
      this.totalWeeklyTimeSpent = this.weeklyTimeSpentOnPlatform;
      this.totalThisWeekTimeSpent = this.thisWeekTimeSpentOnPlatform;
    }
  }

  formatSeconds(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    // Pad with leading zero if less than 10
    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');

    const hoursLabel = this.translate.instant('analytics.h');
    const minutesLabel = this.translate.instant('analytics.m');

    return `${formattedHours}${hoursLabel} ${formattedMinutes}${minutesLabel}`;
  }
}
