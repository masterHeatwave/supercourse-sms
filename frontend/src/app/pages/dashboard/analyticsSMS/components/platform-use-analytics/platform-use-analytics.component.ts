import { AfterViewInit, Component, Input, OnDestroy, OnInit, QueryList, SimpleChange, SimpleChanges, ViewChildren } from '@angular/core';
import { Chart, ChartConfiguration, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { debounceTime, fromEvent, Subscription } from 'rxjs';
import { AnalyticsService } from '../../services/analytics-service';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { SocketService } from '../../services/socket.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

Chart.register(ChartDataLabels);

@Component({
  selector: 'app-platform-use-analytics',
  standalone: true,
  imports: [BaseChartDirective, TranslateModule],
  templateUrl: './platform-use-analytics.component.html',
  styleUrl: './platform-use-analytics.component.scss'
})
export class PlatformUseAnalyticsComponent implements AfterViewInit, OnDestroy, OnInit {
  @ViewChildren(BaseChartDirective) charts?: QueryList<BaseChartDirective>;
  @Input() user: any = {};

  private resizeSubscription?: Subscription;

  @Input() onlineCounts = {
    admin: 0,
    manager: 0,
    teacher: 0,
    student: 0,
    parent: 0
  };

  dailyLoginsLabels: string[] = [];
  dailyLoginsTeachers: number[] = [];
  dailyLoginsStudents: number[] = [];
  dailyLoginsManagers: number[] = [];

  dailyTimeSpentLabels: string[] = [];
  dailyTimeSpentValues: number[] = [];

  weeklyTimeSpentLabels: string[] = [];
  weeklyTimeSpentValues: number[] = [];

  weeklySectionLabels: string[] = [];
  weeklySectionDatasets: any[] = [];

  private sub!: Subscription;

  constructor(private analyticsService: AnalyticsService, private socketService: SocketService, private translate: TranslateService) {
    this.translate.onLangChange.subscribe(() => {
      //this.ngOnInit();
      this.changeChartLang();
    });
  }

  changeChartLang() {
    // 1. Daily logins
    this.dailyLoginsData = {
      labels: this.dailyLoginsLabels,
      datasets: [
        { data: this.dailyLoginsTeachers, label: this.translate.instant('analytics.teachers'), borderColor: '#ffa4a4', fill: false },
        { data: this.dailyLoginsStudents, label: this.translate.instant('analytics.students'), borderColor: '#ab9cff', fill: false },
        { data: this.dailyLoginsManagers, label: this.translate.instant('analytics.managers'), borderColor: '#abdac4', fill: false }
      ]
    };

    // 2. Daily time spent
    this.dailyTimeSpentData = {
      labels: [
        this.translate.instant('analytics.students'),
        this.translate.instant('analytics.teachers'),
        this.translate.instant('analytics.parents')
      ],
      datasets: [{ data: this.dailyTimeSpentValues, backgroundColor: ['#921916', '#d3221e', '#ef706f'] }]
    };

    // 3. Weekly time spent
    this.weeklyTimeSpentData = {
      labels: [
        this.translate.instant('analytics.parents'),
        this.translate.instant('analytics.students'),
        this.translate.instant('analytics.teachers')
      ],
      datasets: [{ data: this.weeklyTimeSpentValues, label: this.translate.instant('analytics.avg_duration_per_week'), backgroundColor: '#7a3cf1' }]
    };

    // 4. Weekly time spent per section
    this.weeklySectionData = {
      labels: [
        this.translate.instant('analytics.admins'),
        this.translate.instant('analytics.managers'),
        this.translate.instant('analytics.parents'),
        this.translate.instant('analytics.students'),
        this.translate.instant('analytics.teachers')
      ],
      datasets: [
        { label: this.translate.instant('analytics.classes'), data: this.weeklySectionDatasets[0], backgroundColor: '#812d07' },
        { label: this.translate.instant('analytics.sessions'), data: this.weeklySectionDatasets[1], backgroundColor: '#a73909' },
        { label: this.translate.instant('analytics.assignments'), data: this.weeklySectionDatasets[2], backgroundColor: '#cc460b' },
        { label: this.translate.instant('analytics.progress'), data: this.weeklySectionDatasets[3], backgroundColor: '#f1530d' },
        { label: this.translate.instant('analytics.timetable'), data: this.weeklySectionDatasets[0], backgroundColor: '#f46d31' },
        { label: this.translate.instant('analytics,board'), data: this.weeklySectionDatasets[1], backgroundColor: '#f68857' },
        { label: this.translate.instant('analytics.calendar'), data: this.weeklySectionDatasets[2], backgroundColor: '#f8a27c' }
      ]
    };

    // Force charts to update
    setTimeout(() => this.charts?.forEach((chart) => chart.chart?.update()), 0);
  }

  ngOnInit(): void {
    //this.socketService.setUser(this.user.user_type, this.user.id);
    this.socketService.onOnlineUsers().subscribe({
      next: (response) => {
        this.onlineCounts.admin = response.admin;
        this.onlineCounts.manager = response.manager;
        this.onlineCounts.teacher = response.teacher;
        this.onlineCounts.student = response.student;
        this.onlineCounts.parent = response.parent;
      }
    });
    this.analyticsService.getPlatformAnalytics().subscribe((data) => {
      //console.log(data);
      //this.onlineAdmins = data.obj.onlineAdmins;
      //this.onlineManagers = data.obj.onlineManagers;
      //this.onlineTeachers = data.obj.onlineTeachers;
      //this.onlineStudents = data.obj.onlineStudents;
      //this.onlineParents = data.obj.onlineParents;

      this.dailyLoginsLabels = data.obj.dailyLoginsLabels;
      this.dailyLoginsTeachers = data.obj.dailyLoginsTeachers;
      this.dailyLoginsStudents = data.obj.dailyLoginsStudents;
      this.dailyLoginsManagers = data.obj.dailyLoginsManagers;
      this.dailyTimeSpentValues = data.obj.dailyTimeSpentValues;
      this.weeklyTimeSpentValues = data.obj.weeklyTimeSpentValues;
      this.weeklySectionDatasets = data.obj.weeklySectionDatasets;
      this.changeChartLang();
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
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  // 1. Daily logins (Line Chart)
  public dailyLoginsData: ChartConfiguration<'line'>['data'] = {
    labels: ['13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'],
    datasets: [
      { data: this.dailyLoginsTeachers, label: 'Teachers', borderColor: '#ffa4a4', fill: false },
      { data: this.dailyLoginsStudents, label: 'Students', borderColor: '#ab9cff', fill: false },
      { data: this.dailyLoginsManagers, label: 'Managers', borderColor: '#abdac4', fill: false }
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
    labels: ['Students', 'Teachers', 'Parents'],
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
    labels: ['Parents', 'Students', 'Teachers'],
    datasets: [{ data: this.weeklyTimeSpentValues, label: 'Average duration per Week (minutes)', backgroundColor: '#7a3cf1' }]
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
    labels: ['Admins', 'Managers', 'Parents', 'Students', 'Teachers'],
    datasets: [
      { label: 'Classes', data: this.weeklySectionDatasets[0], backgroundColor: '#812d07' },
      { label: 'Sessions', data: this.weeklySectionDatasets[1], backgroundColor: '#a73909' },
      { label: 'Assignments', data: this.weeklySectionDatasets[2], backgroundColor: '#cc460b' },
      { label: 'Progress', data: this.weeklySectionDatasets[3], backgroundColor: '#f1530d' },
      { label: 'Timetable', data: this.weeklySectionDatasets[0], backgroundColor: '#f46d31' },
      { label: 'Board', data: this.weeklySectionDatasets[1], backgroundColor: '#f68857' },
      { label: 'Calendar', data: this.weeklySectionDatasets[2], backgroundColor: '#f8a27c' }
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
}
