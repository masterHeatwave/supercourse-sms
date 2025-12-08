import { Component, inject, QueryList, ViewChildren } from '@angular/core';
import { Chart, ChartConfiguration, ChartOptions, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { debounceTime, fromEvent, Subscription } from 'rxjs';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '../../../services/analytics-service';
import { SessionsService } from '@gen-api/sessions/sessions.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CustomActivitiesService } from '@gen-api/custom-activities/custom-activities.service';

Chart.register(...registerables, ChartDataLabels);

@Component({
  selector: 'app-engagement',
  standalone: true,
  imports: [BaseChartDirective, CommonModule, TranslateModule],
  templateUrl: './engagement.component.html',
  styleUrl: './engagement.component.scss'
})
export class EngagementComponent {
  @ViewChildren(BaseChartDirective) charts?: QueryList<BaseChartDirective>;

  showInfo: boolean = false;
  customActivitiesService = inject(CustomActivitiesService);
  customActivities: any[] = [];

  toggleInfo() {
    this.showInfo = !this.showInfo;
  }

  private resizeSubscription?: Subscription;

  attendance: number = 0;
  highestAttendanceRecord: string = '';
  lowestAttendanceRecord: string = '';
  assignmentCompleted: number = 0;
  mostEngagedClass = '';
  leastEngagedClass = '';

  onlineStudents = 0;
  onlineParents = 0;

  dailyLoginsLabels: string[] = [];
  dailyLoginsAJunior: number[] = [];
  dailyLoginsASenior: number[] = [];
  dailyLoginsPreLower: number[] = [];

  dailyTimeSpentLabels: string[] = [];
  dailyTimeSpentValues: number[] = [];

  weeklyTimeSpentLabels: string[] = [];
  weeklyTimeSpentValues: number[] = [];

  weeklySectionLabels: string[] = [];
  weeklySectionDatasets: any[] = [];

  studentTimeSpentLabels: string[] = [];
  studentTimeSpentDatasets: any[] = [];

  displayedColumns1: string[] = ['rank', 'activity', 'time', 'plays'];
  dataSource1 = [
    { rank: 1, activity: 'Ice hockey – present continuous', time: '6m15s', plays: 29 },
    { rank: 2, activity: 'Treasure Hunt – Wh Questions', time: '7m05s', plays: 23 },
    { rank: 3, activity: 'Word Puzzle – Food Vocabulary', time: '2m23s', plays: 22 },
    { rank: 4, activity: 'Factory – Modal Verbs (can/must)', time: '10m15s', plays: 20 },
    { rank: 5, activity: 'Farm 3', time: '4m09s', plays: 18 }
  ];

  constructor(private analyticsService: AnalyticsService, private sessionsService: SessionsService, private translate: TranslateService) {
    this.translate.onLangChange.subscribe(() => {
      //this.ngOnInit();
      this.changeChartLang();
    });
  }

  changeChartLang() {
    // 1. Daily logins (Line Chart)
    this.dailyLoginsData = {
      labels: this.dailyLoginsLabels,
      datasets: [
        { data: this.dailyLoginsAJunior, label: 'A junior', borderColor: '#ffa4a4', fill: false },
        { data: this.dailyLoginsASenior, label: 'A senior', borderColor: '#ab9cff', fill: false },
        { data: this.dailyLoginsPreLower, label: 'Pre-lower', borderColor: '#abdac4', fill: false }
      ]
    };

    // 2. Daily time spent (Doughnut Chart)
    this.dailyTimeSpentData = {
      labels: [
        this.translate.instant('analytics.students'),
        this.translate.instant('analytics.teachers'),
        this.translate.instant('analytics.parents')
      ],
      datasets: [{ data: this.dailyTimeSpentValues, backgroundColor: ['#921916', '#d3221e', '#ef706f'] }]
    };

    // 3. Weekly time spent (Horizontal Bar Chart)
    this.weeklyTimeSpentData = {
      labels: [
        this.translate.instant('analytics.parents'),
        this.translate.instant('analytics.students'),
        this.translate.instant('analytics.teachers')
      ],
      datasets: [{ data: this.weeklyTimeSpentValues, label: this.translate.instant('analytics.avg_duration_per_week'), backgroundColor: '#7a3cf1' }]
    };

    // 4. Weekly time spent per section (Grouped Bar Chart)
    this.weeklySectionData = {
      /*labels: [
        this.translate.instant('analytics.admins'),
        this.translate.instant('analytics.managers'),
        this.translate.instant('analytics.parents'),
        this.translate.instant('analytics.students'),
        this.translate.instant('analytics.teachers')
      ],*/
      labels: ['A Senior', 'Pre-lower', 'A Junior'],
      datasets: [
        { label: this.translate.instant('analytics.classes'), data: this.weeklySectionDatasets[0], backgroundColor: '#812d07' },
        { label: this.translate.instant('analytics.sessions'), data: this.weeklySectionDatasets[1], backgroundColor: '#a73909' },
        { label: this.translate.instant('analytics.assignments'), data: this.weeklySectionDatasets[2], backgroundColor: '#cc460b' },
        { label: this.translate.instant('analytics.progress'), data: this.weeklySectionDatasets[3], backgroundColor: '#f1530d' },
        { label: this.translate.instant('analytics.timetable'), data: this.weeklySectionDatasets[4], backgroundColor: '#f46d31' },
        { label: this.translate.instant('analytics.board'), data: this.weeklySectionDatasets[5], backgroundColor: '#f68857' },
        { label: this.translate.instant('analytics.calendar'), data: this.weeklySectionDatasets[6], backgroundColor: '#f8a27c' }
      ]
    };
    console.log(this.weeklySectionDatasets);

    //5. Student time spent per activity
    this.barChartData = {
      labels: ['A senior', 'A junior', 'Pre-lower'],
      datasets: [
        {
          data: this.studentTimeSpentDatasets,
          label: this.translate.instant('analytics.avg_time_per_activity'),
          backgroundColor: '#4a8351'
        }
      ]
    };
    this.barChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 0,
          max: Math.ceil(Math.max(...this.studentTimeSpentDatasets)),
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
        datalabels: {
          display: false
        },
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
  }

  ngOnInit(): void {
    this.analyticsService.getEngagementAnalytics().subscribe((data) => {
      console.log(data);

      this.sessionsService.getSessions({ limit: '1000' }).subscribe({
        next: (response) => {
          const date = Date.now();
          const completedSessions = response.data.results.filter((session) => {
            return new Date(session.end_date).getTime() < date;
          });
          console.log('completedSessions', completedSessions);
        }
      });

      this.onlineStudents = data.obj.onlineStudents;
      this.onlineParents = data.obj.onlineParents;
      this.attendance = data.obj.attendance;
      this.highestAttendanceRecord = data.obj.highestAttendanceRecord;
      this.lowestAttendanceRecord = data.obj.lowestAttendanceRecord;
      this.assignmentCompleted = data.obj.assignmentCompleted;
      this.mostEngagedClass = data.obj.mostEngagedClass;
      this.leastEngagedClass = data.obj.leastEngagedClass;

      this.dailyLoginsLabels = data.obj.dailyLoginsLabels;
      this.dailyLoginsAJunior = data.obj.dailyLoginsAJunior;
      this.dailyLoginsASenior = data.obj.dailyLoginsASenior;
      this.dailyLoginsPreLower = data.obj.dailyLoginsPreLower;

      this.dailyTimeSpentValues = data.obj.dailyTimeSpentValues;
      this.weeklyTimeSpentValues = data.obj.weeklyTimeSpentValues;
      this.weeklySectionDatasets = data.obj.weeklySectionDatasets;

      this.studentTimeSpentDatasets = data.obj.studentTimeSpentDatasets;
      this.changeChartLang();
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
  }

  ngAfterViewInit(): void {
    // Listen for window resize events
    this.resizeSubscription = fromEvent(window, 'resize')
      .pipe(debounceTime(100))
      .subscribe(() => {
        this.charts?.forEach((chart) => chart.chart?.update());
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
  ////////////////////////////////////////////

  // 1. Daily logins (Line Chart)
  public dailyLoginsData: ChartConfiguration<'line'>['data'] = {
    labels: this.dailyLoginsLabels,
    datasets: [
      { data: this.dailyLoginsAJunior, label: 'A junior', borderColor: '#ffa4a4', fill: false },
      { data: this.dailyLoginsASenior, label: 'A senior', borderColor: '#ab9cff', fill: false },
      { data: this.dailyLoginsPreLower, label: 'Pre-lower', borderColor: '#abdac4', fill: false }
    ]
  };
  public dailyLoginsOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        display: false
      }
    }
  };

  // 2. Daily time spent (Doughnut Chart)
  public dailyTimeSpentData: ChartConfiguration<'doughnut'>['data'] = {
    labels: [this.translate.instant('analytics.students'), this.translate.instant('analytics.teachers'), this.translate.instant('analytics.parents')],
    datasets: [{ data: this.dailyTimeSpentValues, backgroundColor: ['#921916', '#d3221e', '#ef706f'] }]
  };
  public dailyTimeSpentOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      datalabels: {
        formatter: (value) => `${value}min.`,
        color: 'white', // 👈 change this to any CSS color
        font: {
          size: 14
        },
        anchor: 'center',
        align: 'center'
      }
    }
  };

  // 3. Weekly time spent (Horizontal Bar Chart)
  public weeklyTimeSpentData: ChartConfiguration<'bar'>['data'] = {
    labels: [this.translate.instant('analytics.parents'), this.translate.instant('analytics.students'), this.translate.instant('analytics.teachers')],
    datasets: [{ data: this.weeklyTimeSpentValues, label: this.translate.instant('analytics.avg_duration_per_week'), backgroundColor: '#7a3cf1' }]
  };
  public weeklyTimeSpentOptions: ChartOptions<'bar'> = {
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
      }
    }
  };

  // 4. Weekly time spent per section (Grouped Bar Chart)
  public weeklySectionData: ChartConfiguration<'bar'>['data'] = {
    /*labels: [
      this.translate.instant('analytics.admins'),
      this.translate.instant('analytics.managers'),
      this.translate.instant('analytics.parents'),
      this.translate.instant('analytics.students'),
      this.translate.instant('analytics.teachers')
    ],*/
    labels: ['A Senior', 'Pre-lower', 'A Junior'],
    datasets: [
      { label: this.translate.instant('analytics.classes'), data: this.weeklySectionDatasets[0], backgroundColor: '#812d07' },
      { label: this.translate.instant('analytics.sessions'), data: this.weeklySectionDatasets[1], backgroundColor: '#a73909' },
      { label: this.translate.instant('analytics.assignments'), data: this.weeklySectionDatasets[2], backgroundColor: '#cc460b' },
      { label: this.translate.instant('analytics.progress'), data: this.weeklySectionDatasets[3], backgroundColor: '#f1530d' },
      { label: this.translate.instant('analytics.timetable'), data: this.weeklySectionDatasets[0], backgroundColor: '#f46d31' },
      { label: this.translate.instant('analytics.board'), data: this.weeklySectionDatasets[1], backgroundColor: '#f68857' },
      { label: this.translate.instant('analytics.calendar'), data: this.weeklySectionDatasets[2], backgroundColor: '#f8a27c' }
    ]
  };
  public weeklySectionOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      /*datalabels: {
        color: '#eee',
        font: {
          
          size: 10
        },
        formatter: (value) => value,
      }
    }*/
      datalabels: {
        display: false
      }
    }
  };

  //5. Student time spent per activity
  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['A senior', 'A junior', 'Pre-lower'],
    datasets: [
      {
        data: this.studentTimeSpentDatasets,
        label: this.translate.instant('analytics.avg_time_per_activity'),
        backgroundColor: '#4a8351'
      }
    ]
  };

  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
        max: Math.max(...this.studentTimeSpentDatasets),
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
        text: this.translate.instant('analytics.avg_time_per_activity'),
        color: 'green'
      }
    }
  };

  onGameRowClick(row: any) {
    console.log('Top site clicked:', row);
    // Add your logic here, e.g., navigate or open modal
  }
}
