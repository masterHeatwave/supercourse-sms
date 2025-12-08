import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { Chart, ChartConfiguration, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { debounceTime, fromEvent, Subscription } from 'rxjs';
import { AnalyticsService } from '../../services/analytics-service';
import { DialogModule } from 'primeng/dialog';
import { HttpClient } from '@angular/common/http';
import { MoodsService } from '@gen-api/moods/moods.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CustomActivitiesService } from '@gen-api/custom-activities/custom-activities.service';

@Component({
  selector: 'app-learning-analytics',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, DialogModule, TranslateModule],
  templateUrl: './learning-analytics.component.html',
  styleUrl: './learning-analytics.component.scss'
})
export class LearningAnalyticsComponent implements AfterViewInit, OnDestroy, OnInit {
  @ViewChildren(BaseChartDirective) charts?: QueryList<BaseChartDirective>;

  customActivitiesService = inject(CustomActivitiesService);
  customActivities: any[] = [];

  assignmentsCompleted: number = 0;
  highestAttendance = {
    class: '',
    attendance: 0
  };
  lowestAttendance = {
    class: '',
    attendance: 0
  };
  studentProgressLabels: string[] = [];
  studentProgress: number[] = [];
  studentTimeSpentLabels: string[] = [];
  studentTimeSpent: number[] = [];

  displayedColumns1: string[] = ['rank', 'activity', 'gameplay', 'time', 'plays'];
  /*dataSource1 = [
    { rank: 1, activity: 'Ice hockey – present continuous', gameplay: 'Single-player', time: '6m15s', plays: 29 },
    { rank: 2, activity: 'Treasure Hunt – Wh Questions', gameplay: 'Single-player', time: '7m05s', plays: 23 },
    { rank: 3, activity: 'Word Puzzle – Food Vocabulary', gameplay: 'Multi-player', time: '2m23s', plays: 22 },
    { rank: 4, activity: 'Factory – Modal Verbs (can/must)', gameplay: 'Single-player', time: '10m15s', plays: 20 },
    { rank: 5, activity: 'Farm 3', gameplay: 'Single-player', time: '4m09s', plays: 18 }
  ];*/
  displayedColumns2: string[] = ['rank', 'video', 'views'];
  videos = [{ rank: 1, title: '', viewCount: 0 }];

  displayDialog: boolean = false;
  selectedVideo: any = null;
  videoUrl: string | null = null;

  private resizeSubscription?: Subscription;

  // ... your existing code for lineChartData, lineChartOptions, etc.

  constructor(private analyticsService: AnalyticsService, private moodsService: MoodsService, private translate: TranslateService) {
    this.translate.onLangChange.subscribe(() => {
      //this.ngOnInit();
      this.changeChartLang();
    });
  }

  changeChartLang() {
    this.lineChartData = {
      labels: this.studentProgressLabels,
      datasets: [
        {
          data: this.studentProgress,
          label: this.translate.instant('analytics.achievement'),
          borderColor: '#4CAF50',
          backgroundColor: 'white',
          pointBackgroundColor: '#4CAF50'
        }
      ]
    };
    this.lineChartOptions = {
      responsive: true,
      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: {
            color: '#4CAF50',
            callback: function (value) {
              return value + '%';
            }
          }
        },
        x: {
          title: {
            display: true,
            text: this.translate.instant('analytics.lessons'),
            color: '#afc8b2'
          },
          ticks: {
            color: '#4CAF50'
          }
        }
      },
      plugins: {
        datalabels: {
          display: false
        }
      }
    };

    this.barChartData = {
      labels: this.studentTimeSpentLabels,
      datasets: [
        {
          data: this.studentTimeSpent,
          label: this.translate.instant('analytics.avg_time_per_activity'),
          backgroundColor: '#4a8351'
        }
      ]
    };
    this.barChartOptions = {
      responsive: true,
      scales: {
        y: {
          min: 0,
          max: 10,
          title: {
            display: false
          },
          ticks: {
            stepSize: 2,
            color: 'green'
          },
          grid: {
            color: 'rgba(0,0,0,0.1)'
          }
        },
        x: {
          title: {
            display: true,
            text: this.translate.instant('analytics.classes'),
            color: 'green'
          },
          ticks: {
            color: 'green'
          },
          grid: {
            display: false
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: this.translate.instant('analytics.avg_time_per_activity'),
          color: 'green'
        }
      }
    };
    this.charts?.forEach((chart) => chart.update());
  }

  ngOnInit(): void {
    this.analyticsService.getLearningAnalytics().subscribe((data) => {
      //console.log(data);
      this.assignmentsCompleted = data.obj.assignmentsCompleted;
      this.highestAttendance = data.obj.highestAttendance;
      this.lowestAttendance = data.obj.lowestAttendance;
      this.studentProgressLabels = data.obj.studentProgressLabels;
      this.studentProgress = data.obj.studentProgress;
      this.studentTimeSpentLabels = data.obj.studentTimeSpentLabels;
      this.studentTimeSpent = data.obj.studentTimeSpent;
    });

    this.customActivitiesService.getCustomActivities().subscribe({
      next: (response: any) => {
        this.customActivities = response.data
          .sort((a: any, b: any) => b.plays - a.plays)  // sort DESC by plays
          .slice(0, 5);
      },
      error: (err) => {

      }
    });
    
    this.moodsService.getMoodsGetBestVideos().subscribe({
      next: (response: any) => {
        console.log(response.data);
        this.videos = response.data;
      },
      error: (err: any) => {
        console.error(err);
      }
    });
    //this.videos = data.obj.videos;
    this.changeChartLang();
  }

  ngAfterViewInit(): void {
    // Listen for window resize events
    this.resizeSubscription = fromEvent(window, 'resize')
      .pipe(debounceTime(100))
      .subscribe(() => {
        this.charts?.forEach((chart) => chart.chart?.resize());
      });
  }

  ngOnDestroy(): void {
    // Unsubscribe from the resize event to prevent memory leaks
    if (this.resizeSubscription) {
      this.resizeSubscription.unsubscribe();
    }
  }

  formatAvg(row: any) {
    const avgSeconds = row.totalDuration / row.plays;
    const h = Math.floor(avgSeconds / 3600);
    const m = Math.floor((avgSeconds % 3600) / 60);
    const s = Math.floor(avgSeconds % 60);

    return `${h}h${m.toString().padStart(2,'0')}m${s.toString().padStart(2,'0')}s`;
    //return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  }

  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: this.studentProgressLabels, //['Intro', '', '3', '', '5', '', '7', '', '9', '', ''],
    datasets: [
      {
        data: this.studentProgress, //[20, 30, 28, 50, 45, 60, 75, 90, 60, 65, 55],
        label: 'Achievement (%)',
        //fill: true,
        //tension: 0.4,
        borderColor: '#4CAF50',
        backgroundColor: 'white',
        pointBackgroundColor: '#4CAF50'
      }
    ]
  };
  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          color: '#4CAF50',
          callback: function (value) {
            return value + '%';
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Lessons',
          color: '#afc8b2'
        },
        ticks: {
          color: '#4CAF50'
        }
      }
    },
    plugins: {
      datalabels: {
        display: false
      }
    }
  };
  // Student Time Spent Bar Chart
  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: this.studentTimeSpentLabels, //['Tech 1 Activity Book', 'Tech 1 Coursebook', 'Tech 2 Activity Book', 'Tech 2 Coursebook'],
    datasets: [
      {
        data: this.studentTimeSpent, //[6.8, 8, 8.5, 9],
        label: 'Average Time per Activity (minutes)',
        backgroundColor: '#4a8351'
      }
    ]
  };
  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    scales: {
      y: {
        min: 0,
        max: 10,
        title: {
          display: false
        },
        ticks: {
          stepSize: 2,
          color: 'green'
        },
        grid: {
          color: 'rgba(0,0,0,0.1)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Classes',
          color: 'green'
        },
        ticks: {
          color: 'green'
        },
        grid: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Average Time per Activity (minutes)',
        color: 'green'
      }
    }
  };

  onGameRowClick(row: any) {
    console.log('Top site clicked:', row);
    // Add your logic here, e.g., navigate or open modal
  }

  onVideoRowClick(row: any) {
    console.log('Video clicked:', row.id);
    this.selectedVideo = row;
    this.displayDialog = true;

    // Call backend to get video URL
    this.moodsService.getMoodsGetVideoByIdVideoId(row.id).subscribe({
      //this.http.get<{ url: string }>(`http://localhost:5000/getVideoById/${row._id}`).subscribe({
      next: (response: any) => {
        console.log('response', response);
        this.videoUrl = response.data.moodVideo.source;
      },
      error: (err) => {
        console.error('Error fetching video URL:', err);
      }
    });
  }

  closeDialog() {
    this.displayDialog = false;
    this.videoUrl = null;
  }
}
